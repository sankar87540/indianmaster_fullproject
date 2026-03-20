package middleware

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"myapp/internal/dto"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const (
	AuthorizationHeader     = "Authorization"
	BearerScheme            = "Bearer"
	UserIDContextKey        = "user_id"
	RoleContextKey          = "role"
	CorrelationIDContextKey = "correlation_id"
)

// CustomClaims defines the structure of JWT claims
type CustomClaims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// AuthMiddleware verifies JWT token and sets user context
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader(AuthorizationHeader)
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    "UNAUTHORIZED",
				"message": "missing authorization header",
			})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != BearerScheme {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    "UNAUTHORIZED",
				"message": "invalid authorization header format",
			})
			return
		}

		token := parts[1]

		// Validate token and extract claims
		userID, role, err := ValidateToken(token)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    "UNAUTHORIZED",
				"message": fmt.Sprintf("invalid or expired token: %v", err),
			})
			return
		}

		c.Set(UserIDContextKey, userID)
		c.Set(RoleContextKey, role)
		c.Next()
	}
}

// ValidateToken validates JWT token signature, expiry, and extracts claims
func ValidateToken(tokenString string) (string, string, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return "", "", fmt.Errorf("JWT_SECRET environment variable not set")
	}

	claims := &CustomClaims{}

	// Parse token with custom claims
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method is HS256
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return "", "", fmt.Errorf("failed to parse token: %w", err)
	}

	// Check if token is valid
	if !token.Valid {
		return "", "", fmt.Errorf("invalid token")
	}

	// Validate claims
	if claims.UserID == "" {
		return "", "", fmt.Errorf("user_id claim is missing")
	}

	if claims.Role == "" {
		return "", "", fmt.Errorf("role claim is missing")
	}

	// Check token expiry (RegisteredClaims handles this, but we can explicitly check if needed)
	if claims.ExpiresAt != nil && claims.ExpiresAt.Before(time.Now()) {
		return "", "", fmt.Errorf("token has expired")
	}

	return claims.UserID, claims.Role, nil
}

// ParseJWTClaims parses a JWT token string and returns the CustomClaims
func ParseJWTClaims(tokenString string) (*CustomClaims, error) {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET environment variable not set")
	}

	claims := &CustomClaims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method is HS256
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	// Validate required claims
	if claims.UserID == "" {
		return nil, fmt.Errorf("user_id claim is missing")
	}

	if claims.Role == "" {
		return nil, fmt.Errorf("role claim is missing")
	}

	// Check token expiry
	if claims.ExpiresAt != nil && claims.ExpiresAt.Before(time.Now()) {
		return nil, fmt.Errorf("token has expired")
	}

	return claims, nil
}

// RoleValidator ensures user has required role
func RoleValidator(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get(RoleContextKey)
		if !exists {
			dto.UnauthorizedResponse(c, "user role not found in context")
			c.Abort()
			return
		}

		userRole, ok := role.(string)
		if !ok || userRole != requiredRole {
			dto.ForbiddenResponse(c, "You do not have permission to access this resource")
			c.Abort()
			return
		}

		c.Next()
	}
}

// GetUserIDFromContext retrieves user ID from context
func GetUserIDFromContext(c *gin.Context) (string, error) {
	userID, exists := c.Get(UserIDContextKey)
	if !exists {
		return "", ErrUserNotInContext
	}

	id, ok := userID.(string)
	if !ok {
		return "", ErrInvalidUserIDFormat
	}

	return id, nil
}

// GetRoleFromContext retrieves user role from context
func GetRoleFromContext(c *gin.Context) (string, error) {
	role, exists := c.Get(RoleContextKey)
	if !exists {
		return "", ErrRoleNotInContext
	}

	r, ok := role.(string)
	if !ok {
		return "", ErrInvalidRoleFormat
	}

	return r, nil
}

// ErrorHandler middleware converts errors to standardized JSON responses
func ErrorHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Check if there were any errors
		if len(c.Errors) > 0 {
			err := c.Errors.Last()
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "An internal server error occurred",
				"error": gin.H{
					"code":    "INTERNAL_SERVER_ERROR",
					"message": err.Error(),
				},
			})
		}
	}
}

// PaginationValidator ensures valid pagination parameters
func PaginationValidator() gin.HandlerFunc {
	return func(c *gin.Context) {
		page := c.DefaultQuery("page", "1")
		limit := c.DefaultQuery("limit", "20")

		// TODO: Parse and validate page and limit
		// Set defaults if invalid
		c.Set("page", page)
		c.Set("limit", limit)

		c.Next()
	}
}

// CorrelationIDMiddleware adds correlation ID to requests
func CorrelationIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		correlationID := c.GetHeader("X-Correlation-ID")
		if correlationID == "" {
			// TODO: Generate UUID
			correlationID = ""
		}

		c.Set(CorrelationIDContextKey, correlationID)
		c.Header("X-Correlation-ID", correlationID)

		c.Next()
	}
}

// SoftDeleteFilter automatically excludes soft-deleted records
// This middleware sets a context flag that repositories respect
func SoftDeleteFilter() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Exclude soft-deleted records by default
		ctx := context.WithValue(c.Request.Context(), "exclude_deleted", true)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}
