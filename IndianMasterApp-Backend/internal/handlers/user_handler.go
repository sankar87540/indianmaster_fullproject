package handlers

import (
	"context"

	"myapp/internal/dto"
	"myapp/internal/models"
	"myapp/internal/services"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userService   *services.UserService
	workerService recommendedJobsService
}

type recommendedJobsService interface {
	GetRecommendedJobs(ctx context.Context, workerID string, pagination *dto.Pagination) (*dto.RecommendedJobsResponse, error)
}

func NewUserHandler(userService *services.UserService, workerService recommendedJobsService) *UserHandler {
	return &UserHandler{
		userService:   userService,
		workerService: workerService,
	}
}

// CreateUser POST /api/v1/users
// Validates input at handler level to prevent invalid data from reaching database
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req models.CreateUserRequest

	// ShouldBindJSON validates against binding tags
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	// Set default language if not provided
	if req.Language == "" {
		req.Language = "en"
	}

	user := &models.User{
		Phone:    req.Phone,
		FullName: req.FullName,
		Role:     req.Role,
		Language: req.Language,
		Email:    req.Email,
		IsActive: true,
	}

	if err := h.userService.CreateUser(c.Request.Context(), user); err != nil {
		handleError(c, err)
		return
	}

	dto.CreatedResponse(c, "User created successfully", user)
}

// GetUser GET /users/:id
func (h *UserHandler) GetUser(c *gin.Context) {
	id := c.Param("id")

	user, err := h.userService.GetUser(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}

	dto.OKResponse(c, "User retrieved successfully", user)
}

// UpdateUser PUT /api/v1/users/:id
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id := c.Param("id")

	var req models.UpdateUserRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	// Get existing user
	user, err := h.userService.GetUser(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}

	// Update fields
	if req.FullName != "" {
		user.FullName = req.FullName
	}
	if req.Language != "" {
		user.Language = req.Language
	}
	if req.Email != "" {
		user.Email = req.Email
	}

	if err := h.userService.UpdateUser(c.Request.Context(), user); err != nil {
		handleError(c, err)
		return
	}

	dto.OKResponse(c, "User updated successfully", user)
}

// DeleteUser DELETE /users/:id
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id := c.Param("id")

	if err := h.userService.DeleteUser(c.Request.Context(), id); err != nil {
		handleError(c, err)
		return
	}

	dto.OKResponse(c, "User deleted successfully", nil)
}

// ListUsersByRole GET /users?role=HIRER
// @Summary List Users by Role
// @Description Retrieve paginated list of users filtered by role
// @Tags User
// @Accept json
// @Produce json
// @Param role query string true "User role to filter by"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort field (e.g., created_at, full_name)" default(created_at)
// @Param order query string false "Sort order (asc or desc)" default(desc) Enums(asc,desc)
// @Success 200 {object} dto.APIResponse "Users retrieved successfully with pagination metadata"
// @Failure 400 {object} dto.APIResponse "Invalid request parameters"
// @Failure 500 {object} dto.APIResponse "Failed to fetch users"
// @Router /users [get]
func (h *UserHandler) ListUsersByRole(c *gin.Context) {
	role := c.Query("role")
	if role == "" {
		dto.BadRequestResponse(c, "Role query parameter is required", nil)
		return
	}

	// Parse pagination parameters
	pagination := dto.ParsePagination(c)

	// Get users with pagination
	users, total, err := h.userService.ListUsersByRoleWithPagination(c.Request.Context(), role, pagination)
	if err != nil {
		handleError(c, err)
		return
	}

	dto.PaginatedSuccessResponse(c, "Users retrieved successfully", users, total, pagination.Page, pagination.Limit)
}

// ListActiveUsers GET /users
// @Summary List Active Users
// @Description Retrieve paginated list of all active users
// @Tags User
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort field (e.g., created_at, full_name)" default(created_at)
// @Param order query string false "Sort order (asc or desc)" default(desc) Enums(asc,desc)
// @Success 200 {object} dto.APIResponse "Active users retrieved successfully with pagination metadata"
// @Failure 500 {object} dto.APIResponse "Failed to fetch active users"
// @Router /users/active [get]
func (h *UserHandler) ListActiveUsers(c *gin.Context) {
	// Parse pagination parameters
	pagination := dto.ParsePagination(c)

	// Get active users with pagination
	users, total, err := h.userService.ListActiveUsersWithPagination(c.Request.Context(), pagination)
	if err != nil {
		handleError(c, err)
		return
	}

	dto.PaginatedSuccessResponse(c, "Active users retrieved successfully", users, total, pagination.Page, pagination.Limit)
}

// GetRecommendedJobs GET /workers/{workerId}/recommended-jobs
// @Summary Get Job Recommendations
// @Description Retrieve job recommendations for a worker based on matching criteria
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
// @Router /workers/{worker_id}/recommended-jobs [get]
func (h *UserHandler) GetRecommendedJobs(c *gin.Context) {
	workerID := c.Param("worker_id")

	// Parse pagination parameters
	pagination := dto.ParsePagination(c)

	// Get recommended jobs
	recommendedJobs, err := h.workerService.GetRecommendedJobs(c.Request.Context(), workerID, pagination)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to get recommended jobs", err.Error())
		return
	}

	// Return paginated response
	dto.PaginatedSuccessResponse(c, "Job recommendations retrieved successfully", recommendedJobs.Jobs, recommendedJobs.Total, pagination.Page, pagination.Limit)
}
