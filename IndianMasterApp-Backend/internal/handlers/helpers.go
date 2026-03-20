package handlers

import (
	"myapp/internal/dto"
	"myapp/internal/errors"

	"github.com/gin-gonic/gin"
)

// handleError maps AppError to standardized HTTP response
func handleError(c *gin.Context, err error) {
	appErr, ok := err.(*errors.AppError)
	if !ok {
		dto.InternalServerErrorResponse(c, "An internal server error occurred", gin.H{"error": err.Error()})
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
