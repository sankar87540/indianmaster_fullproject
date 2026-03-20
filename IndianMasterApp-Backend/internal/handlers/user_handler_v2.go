package handlers

import (
	"myapp/internal/dto"
	"myapp/internal/middleware"
	"myapp/internal/services"

	"github.com/gin-gonic/gin"
)

// ============================================================================
// USER HANDLER V2 — uses WorkerServiceV2 (with Redis caching)
// ============================================================================

// UserHandlerV2 wraps UserService + WorkerServiceV2
type UserHandlerV2 struct {
	userService   *services.UserService
	workerService *services.WorkerServiceV2
}

// NewUserHandlerV2 creates a new UserHandlerV2
func NewUserHandlerV2(userService *services.UserService, workerService *services.WorkerServiceV2) *UserHandlerV2 {
	return &UserHandlerV2{
		userService:   userService,
		workerService: workerService,
	}
}

// UpdateMyProfile godoc
// @Summary Update authenticated user's profile
// @Description Update fullName, email, or language for the currently authenticated user
// @Tags User
// @Accept json
// @Produce json
// @Param request body dto.UpdateProfileRequest true "Fields to update"
// @Success 200 {object} dto.APIResponse "Profile updated successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Failed to update profile"
// @Router /user/profile [put]
// @Security BearerAuth
func (h *UserHandlerV2) UpdateMyProfile(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized")
		return
	}

	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	user, err := h.userService.UpdateProfile(c.Request.Context(), userID, &req)
	if err != nil {
		handleError(c, err)
		return
	}

	dto.OKResponse(c, "Profile updated successfully", user)
}

// GetRecommendedJobs godoc
// @Summary Get Job Recommendations (Cached)
// @Description Retrieve job recommendations for a worker based on matching criteria. Results are cached in Redis for 5 minutes.
// @Tags Worker
// @Accept json
// @Produce json
// @Param worker_id path string true "Worker ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort field (e.g., match_score, job_role)" default(match_score)
// @Param order query string false "Sort order (asc or desc)" default(desc) Enums(asc,desc)
// @Success 200 {object} dto.APIResponse "Job recommendations retrieved successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request parameters"
// @Failure 500 {object} dto.APIResponse "Failed to get recommended jobs"
// @Router /worker/{worker_id}/recommended-jobs [get]
// @Security BearerAuth
func (h *UserHandlerV2) GetRecommendedJobs(c *gin.Context) {
	workerID := c.Param("worker_id")

	pagination := dto.ParsePagination(c)

	recommendedJobs, err := h.workerService.GetRecommendedJobs(c.Request.Context(), workerID, pagination)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to get recommended jobs", err.Error())
		return
	}

	dto.PaginatedSuccessResponse(c, "Job recommendations retrieved successfully", recommendedJobs.Jobs, recommendedJobs.Total, pagination.Page, pagination.Limit)
}
