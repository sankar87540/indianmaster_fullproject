package middleware

import (
	"net"
	"strings"
	"time"

	"myapp/internal/logger"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// LoggingMiddleware logs HTTP requests with detailed information
// Includes method, path, status, duration, user ID, correlation ID, and client IP
func LoggingMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Record start time
		startTime := time.Now()

		// Get client IP
		clientIP := getClientIP(c)

		// Get correlation ID from context (set by CorrelationIDMiddleware)
		correlationID := ""
		if cid, exists := c.Get(CorrelationIDContextKey); exists {
			if cidStr, ok := cid.(string); ok {
				correlationID = cidStr
			}
		}

		// Get user ID from context if authenticated
		userID := ""
		if uid, exists := c.Get(UserIDContextKey); exists {
			if uidStr, ok := uid.(string); ok {
				userID = uidStr
			}
		}

		// Process request
		c.Next()

		// Calculate request duration
		duration := time.Since(startTime)
		durationMs := int64(duration.Milliseconds())

		// Log the request with structured fields
		fields := []zap.Field{
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.RequestURI),
			zap.Int("status", c.Writer.Status()),
			zap.Int64("duration_ms", durationMs),
			zap.String("client_ip", clientIP),
			zap.String("user_agent", c.Request.UserAgent()),
		}

		// Only include user_id and correlation_id if they're not empty
		if userID != "" {
			fields = append(fields, zap.String("user_id", userID))
		}
		if correlationID != "" {
			fields = append(fields, zap.String("correlation_id", correlationID))
		}

		logger.Info("HTTP Request", fields...)
	}
}

// getClientIP returns the client's IP address considering proxies
func getClientIP(c *gin.Context) string {
	// Check X-Forwarded-For header (for proxies)
	if forwardedFor := c.GetHeader("X-Forwarded-For"); forwardedFor != "" {
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
