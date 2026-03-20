package errors

import (
	"fmt"
	"net/http"
)

// ErrorCode represents specific error types
type ErrorCode string

const (
	ErrValidation     ErrorCode = "VALIDATION_ERROR"
	ErrNotFound       ErrorCode = "NOT_FOUND"
	ErrConflict       ErrorCode = "CONFLICT"
	ErrDatabase       ErrorCode = "DATABASE_ERROR"
	ErrTransaction    ErrorCode = "TRANSACTION_ERROR"
	ErrForeignKey     ErrorCode = "FOREIGN_KEY_VIOLATION"
	ErrUnauthorized   ErrorCode = "UNAUTHORIZED"
	ErrForbidden      ErrorCode = "FORBIDDEN"
	ErrInternal       ErrorCode = "INTERNAL_ERROR"
	ErrBadRequest     ErrorCode = "BAD_REQUEST"
	ErrServiceUnavail ErrorCode = "SERVICE_UNAVAILABLE"
	ErrTimeout        ErrorCode = "TIMEOUT"
	ErrRateLimit      ErrorCode = "RATE_LIMITED"
)

// AppError represents application errors with context
type AppError struct {
	Code       ErrorCode              `json:"code"`
	Message    string                 `json:"message"`
	Details    map[string]interface{} `json:"details,omitempty"`
	statusCode int
	wrappedErr error
}

// Error implements the error interface
func (e *AppError) Error() string {
	if e.wrappedErr != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.wrappedErr)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// StatusCode returns the HTTP status code for this error
func (e *AppError) StatusCode() int {
	return e.statusCode
}

// NewAppError creates a new AppError with custom status code
func NewAppError(code ErrorCode, message string, statusCode int, details map[string]interface{}) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		Details:    details,
		statusCode: statusCode,
	}
}

// NewValidationError creates a validation error
func NewValidationError(message string, details map[string]interface{}) *AppError {
	return &AppError{
		Code:       ErrValidation,
		Message:    message,
		Details:    details,
		statusCode: http.StatusBadRequest,
	}
}

// NewResourceNotFoundError creates a not found error
func NewResourceNotFoundError(resourceType, id string) *AppError {
	return &AppError{
		Code:       ErrNotFound,
		Message:    fmt.Sprintf("%s with id %s not found", resourceType, id),
		statusCode: http.StatusNotFound,
	}
}

// NewConflictError creates a conflict error
func NewConflictError(message string) *AppError {
	return &AppError{
		Code:       ErrConflict,
		Message:    message,
		statusCode: http.StatusConflict,
	}
}

// NewDatabaseError creates a database error
func NewDatabaseError(message string, err error) *AppError {
	details := map[string]interface{}{}
	if err != nil {
		details["error"] = err.Error()
	}
	return &AppError{
		Code:       ErrDatabase,
		Message:    message,
		Details:    details,
		statusCode: http.StatusInternalServerError,
		wrappedErr: err,
	}
}

// NewTransactionError creates a transaction error
func NewTransactionError(message string, err error) *AppError {
	return &AppError{
		Code:       ErrTransaction,
		Message:    message,
		statusCode: http.StatusInternalServerError,
		wrappedErr: err,
	}
}

// NewForeignKeyError creates a foreign key constraint error
func NewForeignKeyError(fieldName, tableName string) *AppError {
	return &AppError{
		Code:       ErrForeignKey,
		Message:    fmt.Sprintf("Invalid %s: referenced %s does not exist", fieldName, tableName),
		statusCode: http.StatusBadRequest,
	}
}

// NewUnauthorizedError creates an unauthorized error
func NewUnauthorizedError(message string) *AppError {
	return &AppError{
		Code:       ErrUnauthorized,
		Message:    message,
		statusCode: http.StatusUnauthorized,
	}
}

// NewForbiddenError creates a forbidden error
func NewForbiddenError(message string) *AppError {
	return &AppError{
		Code:       ErrForbidden,
		Message:    message,
		statusCode: http.StatusForbidden,
	}
}

// NewInternalError creates an internal server error
func NewInternalError(message string, err error) *AppError {
	return &AppError{
		Code:       ErrInternal,
		Message:    message,
		statusCode: http.StatusInternalServerError,
		wrappedErr: err,
	}
}

// IsAppError checks if an error is an AppError
func IsAppError(err error) bool {
	_, ok := err.(*AppError)
	return ok
}

// GetStatusCode returns the HTTP status code for an error
func GetStatusCode(err error) int {
	if appErr, ok := err.(*AppError); ok {
		return appErr.statusCode
	}
	return http.StatusInternalServerError
}

// ================ DOMAIN-SPECIFIC ERRORS ================

// DuplicateApplication - Worker already applied to this job
func DuplicateApplication() *AppError {
	return &AppError{
		Code:       ErrConflict,
		Message:    "You have already applied to this job",
		statusCode: http.StatusConflict,
	}
}

// DuplicateSavedJob - Worker already saved this job
func DuplicateSavedJob() *AppError {
	return &AppError{
		Code:       ErrConflict,
		Message:    "You have already saved this job",
		statusCode: http.StatusConflict,
	}
}

// DuplicateSavedWorker - Hirer already saved this worker
func DuplicateSavedWorker() *AppError {
	return &AppError{
		Code:       ErrConflict,
		Message:    "You have already saved this worker",
		statusCode: http.StatusConflict,
	}
}

// SubscriptionRequired - Feature requires active subscription
func SubscriptionRequired() *AppError {
	return &AppError{
		Code:       "SUBSCRIPTION_REQUIRED",
		Message:    "This feature requires an active subscription plan",
		statusCode: http.StatusPaymentRequired,
	}
}

// ContactLimitExceeded - Daily contact limit exceeded
func ContactLimitExceeded(used, limit int) *AppError {
	return &AppError{
		Code:       "CONTACT_LIMIT_EXCEEDED",
		Message:    fmt.Sprintf("Daily contact limit exceeded (%d/%d)", used, limit),
		statusCode: http.StatusTooManyRequests,
		Details: map[string]interface{}{
			"used":  used,
			"limit": limit,
		},
	}
}

// KYCPending - User's KYC is pending
func KYCPending() *AppError {
	return &AppError{
		Code:       "KYC_PENDING",
		Message:    "Your KYC verification is pending. Please wait for approval",
		statusCode: http.StatusForbidden,
	}
}

// KYCRejected - User's KYC was rejected
func KYCRejected(reason string) *AppError {
	return &AppError{
		Code:       "KYC_REJECTED",
		Message:    "Your KYC verification was rejected. Reason: " + reason,
		statusCode: http.StatusForbidden,
		Details: map[string]interface{}{
			"rejection_reason": reason,
		},
	}
}

// WorkerProfileNotFound - No worker profile for this user
func WorkerProfileNotFound() *AppError {
	return &AppError{
		Code:       ErrNotFound,
		Message:    "Worker profile not found. Please complete your profile first",
		statusCode: http.StatusNotFound,
	}
}

// BusinessNotFound - Business not found
func BusinessNotFound() *AppError {
	return &AppError{
		Code:       ErrNotFound,
		Message:    "Business not found",
		statusCode: http.StatusNotFound,
	}
}

// ChatThreadNotFound - Chat thread not found
func ChatThreadNotFound() *AppError {
	return &AppError{
		Code:       ErrNotFound,
		Message:    "Chat thread not found",
		statusCode: http.StatusNotFound,
	}
}

// InvalidPhoneFormat - Phone number format is invalid
func InvalidPhoneFormat() *AppError {
	return &AppError{
		Code:       "INVALID_PHONE_FORMAT",
		Message:    "Phone number format is invalid. Use international format (7-20 chars)",
		statusCode: http.StatusBadRequest,
	}
}

// UserAlreadyExists - User with this phone already exists
func UserAlreadyExists() *AppError {
	return &AppError{
		Code:       ErrConflict,
		Message:    "User with this phone number already exists",
		statusCode: http.StatusConflict,
	}
}

// InvalidOTP - OTP is invalid or expired
func InvalidOTP() *AppError {
	return &AppError{
		Code:       "INVALID_OTP",
		Message:    "OTP is invalid or expired",
		statusCode: http.StatusUnauthorized,
	}
}
