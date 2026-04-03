package handlers

import (
	"myapp/internal/dto"
	"myapp/internal/middleware"
	"myapp/internal/services"

	"github.com/gin-gonic/gin"
)

// InstantApplyHandler handles POST /worker/instant-apply
type InstantApplyHandler struct {
	service *services.InstantApplyService
}

// NewInstantApplyHandler creates a new InstantApplyHandler
func NewInstantApplyHandler(service *services.InstantApplyService) *InstantApplyHandler {
	return &InstantApplyHandler{service: service}
}

// Submit godoc
// @Summary Submit Instant Job Application
// @Description Worker submits an instant job application form directly to a company (no job posting required)
// @Tags Worker
// @Accept json
// @Produce json
// @Param request body dto.InstantJobApplicationRequest true "Instant job application details"
// @Success 201 {object} dto.APIResponse "Application submitted successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Failed to submit application"
// @Router /worker/instant-apply [post]
// @Security BearerAuth
func (h *InstantApplyHandler) Submit(c *gin.Context) {
	var req dto.InstantJobApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	result, err := h.service.Submit(c.Request.Context(), &req, userID)
	if err != nil {
		internalError(c, "Failed to submit application", err)
		return
	}

	dto.CreatedResponse(c, "Application submitted successfully", result)
}
