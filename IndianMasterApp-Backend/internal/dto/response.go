package dto

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ============================================================================
// STANDARD API RESPONSE
// ============================================================================

// APIResponse is the standardized response structure for all API endpoints
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   interface{} `json:"error,omitempty"`
	Meta    interface{} `json:"meta,omitempty"` // Pagination metadata or other metadata
}

// ErrorResponse represents an error in the response
type ErrorResponse struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// PaginatedData wraps paginated data in API response
type PaginatedData struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int64       `json:"totalPages"`
}

// ============================================================================
// RESPONSE HELPER FUNCTIONS
// ============================================================================

// SuccessResponse returns a successful API response
func SuccessResponse(c *gin.Context, statusCode int, message string, data interface{}) {
	c.JSON(statusCode, APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// CreatedResponse returns a 201 Created response
func CreatedResponse(c *gin.Context, message string, data interface{}) {
	SuccessResponse(c, http.StatusCreated, message, data)
}

// OKResponse returns a 200 OK response
func OKResponse(c *gin.Context, message string, data interface{}) {
	SuccessResponse(c, http.StatusOK, message, data)
}

// PaginatedSuccessResponse returns a successful paginated response
func PaginatedSuccessResponse(c *gin.Context, message string, data interface{}, total int64, page, limit int) {
	totalPages := (total + int64(limit) - 1) / int64(limit)
	paginatedData := PaginatedData{
		Data:       data,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Message: message,
		Data:    paginatedData,
	})
}

// ErrorResponseWithCode returns an error response with custom code
func ErrorResponseWithCode(c *gin.Context, statusCode int, code, message string, details interface{}) {
	errorData := ErrorResponse{
		Code:    code,
		Message: message,
		Details: details,
	}

	c.JSON(statusCode, APIResponse{
		Success: false,
		Message: message,
		Error:   errorData,
	})
}

// BadRequestResponse returns a 400 Bad Request response
func BadRequestResponse(c *gin.Context, message string, details interface{}) {
	ErrorResponseWithCode(c, http.StatusBadRequest, "BAD_REQUEST", message, details)
}

// UnauthorizedResponse returns a 401 Unauthorized response
func UnauthorizedResponse(c *gin.Context, message string) {
	ErrorResponseWithCode(c, http.StatusUnauthorized, "UNAUTHORIZED", message, nil)
}

// ForbiddenResponse returns a 403 Forbidden response
func ForbiddenResponse(c *gin.Context, message string) {
	ErrorResponseWithCode(c, http.StatusForbidden, "FORBIDDEN", message, nil)
}

// NotFoundResponse returns a 404 Not Found response
func NotFoundResponse(c *gin.Context, message string) {
	ErrorResponseWithCode(c, http.StatusNotFound, "NOT_FOUND", message, nil)
}

// ConflictResponse returns a 409 Conflict response
func ConflictResponse(c *gin.Context, message string) {
	ErrorResponseWithCode(c, http.StatusConflict, "CONFLICT", message, nil)
}

// PaymentRequiredResponse returns a 402 Payment Required response
func PaymentRequiredResponse(c *gin.Context, message string) {
	ErrorResponseWithCode(c, http.StatusPaymentRequired, "PAYMENT_REQUIRED", message, nil)
}

// TooManyRequestsResponse returns a 429 Too Many Requests response
func TooManyRequestsResponse(c *gin.Context, message string) {
	ErrorResponseWithCode(c, http.StatusTooManyRequests, "RATE_LIMITED", message, nil)
}

// InternalServerErrorResponse returns a 500 Internal Server Error response
func InternalServerErrorResponse(c *gin.Context, message string, details interface{}) {
	ErrorResponseWithCode(c, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", message, details)
}

// ValidationErrorResponse returns a 400 response with validation errors
func ValidationErrorResponse(c *gin.Context, message string, errors interface{}) {
	BadRequestResponse(c, message, errors)
}

// ============================================================================
// PAGINATION HELPER FUNCTIONS
// ============================================================================

// ParsePagination parses pagination parameters from query string
// Returns Pagination struct with defaults applied and validated
// - Default page: 1
// - Default limit: 20
// - Max limit: 100
func ParsePagination(c *gin.Context) *Pagination {
	pagination := &Pagination{
		Page:  1,      // Default page
		Limit: 20,     // Default limit
		Order: "desc", // Default order
	}

	// Parse page parameter
	if pageStr := c.Query("page"); pageStr != "" {
		if page := parsePositiveInt(pageStr, 1); page > 0 {
			pagination.Page = page
		}
	}

	// Parse limit parameter
	if limitStr := c.Query("limit"); limitStr != "" {
		if limit := parsePositiveInt(limitStr, 20); limit > 0 {
			pagination.Limit = limit
		}
	}

	// Validate and cap limit to max 100
	if pagination.Limit > 100 {
		pagination.Limit = 100
	}

	// Parse sort parameter
	if sort := c.Query("sort"); sort != "" {
		pagination.Sort = sort
	}

	// Parse order parameter (validate: must be asc or desc)
	if order := c.Query("order"); order != "" {
		if order == "asc" || order == "desc" {
			pagination.Order = order
		}
	}

	return pagination
}

// parsePositiveInt safely parses a string to positive integer with default fallback
func parsePositiveInt(str string, defaultVal int) int {
	var num int
	_, err := fmt.Sscanf(str, "%d", &num)
	if err != nil || num < 1 {
		return defaultVal
	}
	return num
}

// PaginationResponse returns a paginated API response with metadata
func PaginationResponse(c *gin.Context, statusCode int, message string, data interface{}, total int64, pagination *Pagination) {
	totalPages := (total + int64(pagination.Limit) - 1) / int64(pagination.Limit)

	response := gin.H{
		"success": true,
		"message": message,
		"data":    data,
		"meta": gin.H{
			"page":        pagination.Page,
			"limit":       pagination.Limit,
			"total":       total,
			"total_pages": totalPages,
		},
	}

	c.JSON(statusCode, response)
}

// PaginatedResponseWithMeta returns a 200 OK response with pagination metadata
// This version uses the Pagination struct with sorting support
func PaginatedResponseWithMeta(c *gin.Context, message string, data interface{}, total int64, pagination *Pagination) {
	PaginationResponse(c, http.StatusOK, message, data, total, pagination)
}
