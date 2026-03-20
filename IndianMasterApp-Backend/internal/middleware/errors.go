package middleware

import (
	"errors"
	"fmt"
)

// Custom middleware errors
var (
	ErrUserNotInContext       = errors.New("user id not found in context")
	ErrInvalidUserIDFormat    = errors.New("user id has invalid format")
	ErrRoleNotInContext       = errors.New("role not found in context")
	ErrInvalidRoleFormat      = errors.New("role has invalid format")
	ErrInvalidPhone           = errors.New("phone number format is invalid")
	ErrInvalidEmail           = errors.New("email format is invalid")
	ErrInvalidUUID            = errors.New("uuid format is invalid")
	ErrInvalidPaginationPage  = errors.New("page must be >= 1")
	ErrInvalidPaginationLimit = errors.New("limit must be >= 1 and <= 100")
)

// LogError logs error details for monitoring
func LogError(correlationID, errorCode string, err error, details map[string]interface{}) {
	// TODO: Implement structured logging
	fmt.Printf("[%s] [%s] Error: %v | Details: %v\n", correlationID, errorCode, err, details)
}

// LogRequest logs incoming request details
func LogRequest(correlationID, method, path string, statusCode int) {
	// TODO: Implement structured logging
	fmt.Printf("[%s] %s %s -> %d\n", correlationID, method, path, statusCode)
}
