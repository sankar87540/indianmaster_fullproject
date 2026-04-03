package handlers

import (
	"myapp/internal/dto"
	"myapp/internal/errors"
	"myapp/internal/logger"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// internalError logs err server-side and returns a generic 500 to the client.
// Always use this instead of passing err.Error() directly to InternalServerErrorResponse.
func internalError(c *gin.Context, msg string, err error) {
	logger.Error(msg, zap.Error(err))
	dto.InternalServerErrorResponse(c, msg, nil)
}

// handleError maps AppError to standardized HTTP response
func handleError(c *gin.Context, err error) {
	appErr, ok := err.(*errors.AppError)
	if !ok {
		logger.Error("unhandled internal error", zap.Error(err))
		dto.InternalServerErrorResponse(c, "An internal server error occurred", nil)
		return
	}

	statusCode := appErr.StatusCode()

	switch statusCode {
	case 400:
		dto.BadRequestResponse(c, appErr.Message, appErr.Details)
	case 401:
		dto.UnauthorizedResponse(c, appErr.Message)
	case 403:
		dto.ForbiddenResponse(c, appErr.Message)
	case 404:
		dto.NotFoundResponse(c, appErr.Message)
	case 409:
		dto.ConflictResponse(c, appErr.Message)
	case 429:
		dto.TooManyRequestsResponse(c, appErr.Message)
	default:
		dto.InternalServerErrorResponse(c, appErr.Message, appErr.Details)
	}
}
