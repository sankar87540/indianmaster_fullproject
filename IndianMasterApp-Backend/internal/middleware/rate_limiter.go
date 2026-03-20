package middleware

import (
	"context"
	"fmt"
	"net"
	"strings"
	"time"

	"myapp/internal/dto"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

// RateLimiter holds the Redis client for rate limiting
type RateLimiter struct {
	client *redis.Client
}

// NewRateLimiter creates a new RateLimiter instance
func NewRateLimiter(redisClient *redis.Client) *RateLimiter {
	return &RateLimiter{
		client: redisClient,
	}
}

// RateLimitGeneral middleware limits API requests: 100 per minute per user/IP
// Usage: router.Use(rateLimiter.RateLimitGeneral())
func (rl *RateLimiter) RateLimitGeneral() gin.HandlerFunc {
	return rl.createLimiter(100, 1*time.Minute)
}

// RateLimitLogin middleware limits login attempts: 20 per minute per IP
// Usage: router.POST("/login", rateLimiter.RateLimitLogin(), handler.Login)
func (rl *RateLimiter) RateLimitLogin() gin.HandlerFunc {
	return rl.createLimiterByIP(20, 1*time.Minute)
}

// createLimiter creates a rate limiter that uses user_id (if authenticated) or IP address
// - maxRequests: maximum number of requests allowed
// - window: time window for the rate limit (e.g., 1 minute)
func (rl *RateLimiter) createLimiter(maxRequests int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.Background()

		// Get user ID from context (set by AuthMiddleware) or use IP
		identifier := rl.getIdentifier(c, true)

		// Create rate limit key
		key := fmt.Sprintf("rate_limit:%s", identifier)

		// Check current count
		cmd := rl.client.Get(ctx, key)
		val, err := cmd.Int64()

		if err == redis.Nil {
			// Key doesn't exist, set it with expiry
			if err := rl.client.Set(ctx, key, 1, window).Err(); err != nil {
				// Log error but don't block request
				fmt.Printf("❌ Redis error: %v\n", err)
			}
			c.Next()
			return
		} else if err != nil {
			// Redis connection error - fail open (allow request)
			fmt.Printf("❌ Redis error: %v\n", err)
			c.Next()
			return
		}

		// Check if limit exceeded
		if val >= int64(maxRequests) {
			dto.TooManyRequestsResponse(c, "Too many requests")
			c.Abort()
			return
		}

		// Increment counter
		if err := rl.client.Incr(ctx, key).Err(); err != nil {
			fmt.Printf("❌ Redis error: %v\n", err)
		}

		c.Next()
	}
}

// createLimiterByIP creates a rate limiter that only uses IP address (for login, etc.)
// - maxRequests: maximum number of requests allowed
// - window: time window for the rate limit
func (rl *RateLimiter) createLimiterByIP(maxRequests int, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.Background()

		// Get IP address only (ignore user context)
		ip := rl.getClientIP(c)
		key := fmt.Sprintf("rate_limit:ip:%s", ip)

		// Check current count
		cmd := rl.client.Get(ctx, key)
		val, err := cmd.Int64()

		if err == redis.Nil {
			// Key doesn't exist, set it with expiry
			if err := rl.client.Set(ctx, key, 1, window).Err(); err != nil {
				// Log error but don't block request
				fmt.Printf("❌ Redis error: %v\n", err)
			}
			c.Next()
			return
		} else if err != nil {
			// Redis connection error - fail open
			fmt.Printf("❌ Redis error: %v\n", err)
			c.Next()
			return
		}

		// Check if limit exceeded
		if val >= int64(maxRequests) {
			dto.TooManyRequestsResponse(c, "Too many login attempts")
			c.Abort()
			return
		}

		// Increment counter
		if err := rl.client.Incr(ctx, key).Err(); err != nil {
			fmt.Printf("❌ Redis error: %v\n", err)
		}

		c.Next()
	}
}

// getIdentifier returns user_id from context or falls back to client IP
func (rl *RateLimiter) getIdentifier(c *gin.Context, allowUserID bool) string {
	// Try to get user ID from context if authenticated
	if allowUserID {
		if userID, exists := c.Get(UserIDContextKey); exists {
			if id, ok := userID.(string); ok && id != "" {
				return fmt.Sprintf("user:%s", id)
			}
		}
	}

	// Fall back to IP address
	return fmt.Sprintf("ip:%s", rl.getClientIP(c))
}

// getClientIP returns the client's IP address
// Checks X-Forwarded-For and X-Real-IP headers for use behind proxies
func (rl *RateLimiter) getClientIP(c *gin.Context) string {
	// Check X-Forwarded-For header (for proxies)
	if forwardedFor := c.GetHeader("X-Forwarded-For"); forwardedFor != "" {
		// Take the first IP in the list
		ips := strings.Split(forwardedFor, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// Check X-Real-IP header
	if realIP := c.GetHeader("X-Real-IP"); realIP != "" {
		return realIP
	}

	// Fall back to RemoteAddr
	ip, _, err := net.SplitHostPort(c.Request.RemoteAddr)
	if err != nil {
		return c.Request.RemoteAddr
	}

	return ip
}

// GetRemainingRequests returns the number of remaining requests for a given identifier
// Useful for adding rate limit headers to responses
func (rl *RateLimiter) GetRemainingRequests(c *gin.Context, maxRequests int) int {
	ctx := context.Background()
	identifier := rl.getIdentifier(c, true)
	key := fmt.Sprintf("rate_limit:%s", identifier)

	val, err := rl.client.Get(ctx, key).Int64()
	if err == redis.Nil {
		return maxRequests
	}
	if err != nil {
		return 0 // Return 0 if error
	}

	remaining := maxRequests - int(val)
	if remaining < 0 {
		return 0
	}
	return remaining
}
