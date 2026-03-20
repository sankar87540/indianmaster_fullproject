package handlers

import (
	"myapp/internal/dto"
	"myapp/internal/services"

	"github.com/gin-gonic/gin"
)

type AdminDashboardHandler struct {
	adminDashboardService *services.AdminDashboardService
}

func NewAdminDashboardHandler(adminDashboardService *services.AdminDashboardService) *AdminDashboardHandler {
	return &AdminDashboardHandler{adminDashboardService: adminDashboardService}
}

// GetAdminStats retrieves comprehensive admin dashboard statistics
// @Summary Get Admin Statistics
// @Description Retrieve comprehensive admin dashboard statistics
// @Tags Admin
// @Accept json
// @Produce json
// @Param request body dto.AdminStatsRequest false "Date range filters"
// @Success 200 {object} dto.APIResponse "Admin statistics retrieved successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request parameters"
// @Failure 500 {object} dto.APIResponse "Failed to retrieve admin statistics"
// @Router /admin/stats [post]
func (h *AdminDashboardHandler) GetAdminStats(c *gin.Context) {
	var req dto.AdminStatsRequest

	// Bind JSON request
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	// Get admin stats
	stats, err := h.adminDashboardService.GetAdminStats(c.Request.Context(), &req)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to retrieve admin statistics", err.Error())
		return
	}

	// Return success response
	dto.OKResponse(c, "Admin statistics retrieved successfully", stats)
}

// GetAuditLogs retrieves paginated audit logs with optional filters
// @Summary Get Audit Logs
// @Description Retrieve paginated audit logs with optional filters
// @Tags Admin
// @Accept json
// @Produce json
// @Param request body dto.AuditLogRequest false "Audit log filters"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Success 200 {object} dto.APIResponse "Audit logs retrieved successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request parameters"
// @Failure 500 {object} dto.APIResponse "Failed to retrieve audit logs"
// @Router /admin/audit-logs [get]
func (h *AdminDashboardHandler) GetAuditLogs(c *gin.Context) {
	var req dto.AuditLogRequest

	// Bind query parameters
	if err := c.ShouldBindQuery(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request parameters", gin.H{"error": err.Error()})
		return
	}

	// Parse pagination parameters
	pagination := dto.ParsePagination(c)

	// Get audit logs
	auditLogs, err := h.adminDashboardService.GetAuditLogs(c.Request.Context(), &req, pagination)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to retrieve audit logs", err.Error())
		return
	}

	// Return paginated response
	dto.PaginatedSuccessResponse(c, "Audit logs retrieved successfully", auditLogs.Logs, auditLogs.Total, pagination.Page, pagination.Limit)
}

// GetUserActivities retrieves paginated user activities with optional filters
// @Summary Get User Activities
// @Description Retrieve paginated user activities with optional filters
// @Tags Admin
// @Accept json
// @Produce json
// @Param request body dto.UserActivityRequest false "User activity filters"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Success 200 {object} dto.APIResponse "User activities retrieved successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request parameters"
// @Failure 500 {object} dto.APIResponse "Failed to retrieve user activities"
// @Router /admin/user-activities [get]
func (h *AdminDashboardHandler) GetUserActivities(c *gin.Context) {
	var req dto.UserActivityRequest

	// Bind query parameters
	if err := c.ShouldBindQuery(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request parameters", gin.H{"error": err.Error()})
		return
	}

	// Parse pagination parameters
	pagination := dto.ParsePagination(c)

	// Get user activities
	userActivities, err := h.adminDashboardService.GetUserActivities(c.Request.Context(), &req, pagination)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to retrieve user activities", err.Error())
		return
	}

	// Return paginated response
	dto.PaginatedSuccessResponse(c, "User activities retrieved successfully", userActivities.Activities, userActivities.Total, pagination.Page, pagination.Limit)
}

// GetSystemHealth retrieves system health status
// @Summary Get System Health
// @Description Retrieve system health status
// @Tags Admin
// @Accept json
// @Produce json
// @Success 200 {object} dto.APIResponse "System health retrieved successfully"
// @Failure 500 {object} dto.APIResponse "Failed to retrieve system health"
// @Router /admin/system-health [get]
func (h *AdminDashboardHandler) GetSystemHealth(c *gin.Context) {
	// Get system health
	health, err := h.adminDashboardService.GetSystemHealth(c.Request.Context())
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to retrieve system health", err.Error())
		return
	}

	// Return success response
	dto.OKResponse(c, "System health retrieved successfully", health)
}

// ApproveBusinessVerification approves a business verification request
// @Summary Approve Business Verification
// @Description Approve a business verification request
// @Tags Admin
// @Accept json
// @Produce json
// @Param request body dto.BusinessVerificationRequest true "Business verification approval details"
// @Success 200 {object} dto.APIResponse "Business verification approved successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 500 {object} dto.APIResponse "Failed to approve business verification"
// @Router /admin/business-verification/approve [post]
func (h *AdminDashboardHandler) ApproveBusinessVerification(c *gin.Context) {
	var req dto.BusinessVerificationRequest

	// Bind JSON request
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	// Get admin ID from context
	adminID, exists := c.Get("userID")
	if !exists {
		dto.UnauthorizedResponse(c, "Admin not found in context")
		return
	}

	// Approve business verification
	err := h.adminDashboardService.ApproveBusinessVerification(c.Request.Context(), &req, adminID.(string))
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to approve business verification", err.Error())
		return
	}

	// Return success response
	dto.OKResponse(c, "Business verification approved successfully", nil)
}

// RejectBusinessVerification rejects a business verification request
// @Summary Reject Business Verification
// @Description Reject a business verification request
// @Tags Admin
// @Accept json
// @Produce json
// @Param request body dto.BusinessVerificationRequest true "Business verification rejection details"
// @Success 200 {object} dto.APIResponse "Business verification rejected successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 500 {object} dto.APIResponse "Failed to reject business verification"
// @Router /admin/business-verification/reject [post]
func (h *AdminDashboardHandler) RejectBusinessVerification(c *gin.Context) {
	var req dto.BusinessVerificationRequest

	// Bind JSON request
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	// Get admin ID from context
	adminID, exists := c.Get("userID")
	if !exists {
		dto.UnauthorizedResponse(c, "Admin not found in context")
		return
	}

	// Reject business verification
	err := h.adminDashboardService.RejectBusinessVerification(c.Request.Context(), &req, adminID.(string))
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to reject business verification", err.Error())
		return
	}

	// Return success response
	dto.OKResponse(c, "Business verification rejected successfully", nil)
}

// ApproveWorkerVerification approves a worker verification request
// @Summary Approve Worker Verification
// @Description Approve a worker verification request
// @Tags Admin
// @Accept json
// @Produce json
// @Param request body dto.WorkerVerificationRequest true "Worker verification approval details"
// @Success 200 {object} dto.APIResponse "Worker verification approved successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 500 {object} dto.APIResponse "Failed to approve worker verification"
// @Router /admin/worker-verification/approve [post]
func (h *AdminDashboardHandler) ApproveWorkerVerification(c *gin.Context) {
	var req dto.WorkerVerificationRequest

	// Bind JSON request
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	// Get admin ID from context
	adminID, exists := c.Get("userID")
	if !exists {
		dto.UnauthorizedResponse(c, "Admin not found in context")
		return
	}

	// Approve worker verification
	err := h.adminDashboardService.ApproveWorkerVerification(c.Request.Context(), &req, adminID.(string))
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to approve worker verification", err.Error())
		return
	}

	// Return success response
	dto.OKResponse(c, "Worker verification approved successfully", nil)
}

// RejectWorkerVerification rejects a worker verification request
// @Summary Reject Worker Verification
// @Description Reject a worker verification request
// @Tags Admin
// @Accept json
// @Produce json
// @Param request body dto.WorkerVerificationRequest true "Worker verification rejection details"
// @Success 200 {object} dto.APIResponse "Worker verification rejected successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 500 {object} dto.APIResponse "Failed to reject worker verification"
// @Router /admin/worker-verification/reject [post]
func (h *AdminDashboardHandler) RejectWorkerVerification(c *gin.Context) {
	var req dto.WorkerVerificationRequest

	// Bind JSON request
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	// Get admin ID from context
	adminID, exists := c.Get("userID")
	if !exists {
		dto.UnauthorizedResponse(c, "Admin not found in context")
		return
	}

	// Reject worker verification
	err := h.adminDashboardService.RejectWorkerVerification(c.Request.Context(), &req, adminID.(string))
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to reject worker verification", err.Error())
		return
	}

	// Return success response
	dto.OKResponse(c, "Worker verification rejected successfully", nil)
}
