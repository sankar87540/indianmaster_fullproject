package handlers

import (
	"strconv"

	"myapp/internal/dto"
	"myapp/internal/middleware"
	"myapp/internal/services"

	"github.com/gin-gonic/gin"
)

// ============================================================================
// WORKER HANDLER V2 — uses WorkerServiceV2 (cache-aware)
// ============================================================================

// WorkerHandlerV2 handles worker profile endpoints using WorkerServiceV2
type WorkerHandlerV2 struct {
	service *services.WorkerServiceV2
}

// NewWorkerHandlerV2 creates a new WorkerHandlerV2
func NewWorkerHandlerV2(service *services.WorkerServiceV2) *WorkerHandlerV2 {
	return &WorkerHandlerV2{service: service}
}

// CreateProfile godoc
// @Summary Create Worker Profile
// @Description Create a new worker profile for the authenticated user (Worker Only)
// @Tags Worker
// @Accept json
// @Produce json
// @Param request body dto.CreateWorkerProfileRequest true "Worker profile details"
// @Success 201 {object} dto.APIResponse "Worker profile created successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Failed to create worker profile"
// @Router /worker/profile [post]
// @Security BearerAuth
func (h *WorkerHandlerV2) CreateProfile(c *gin.Context) {
	var req dto.CreateWorkerProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	worker, err := h.service.CreateWorker(c.Request.Context(), &req, userID)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to create worker profile", gin.H{"error": err.Error()})
		return
	}

	dto.CreatedResponse(c, "Worker profile created successfully", worker)
}

// GetProfile godoc
// @Summary Get Worker Profile
// @Description Retrieve the worker profile for the authenticated user (Worker Only)
// @Tags Worker
// @Accept json
// @Produce json
// @Success 200 {object} dto.APIResponse "Worker profile retrieved successfully"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 404 {object} dto.APIResponse "Worker profile not found"
// @Router /worker/profile [get]
// @Security BearerAuth
func (h *WorkerHandlerV2) GetProfile(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	worker, err := h.service.GetWorkerProfile(c.Request.Context(), userID)
	if err != nil {
		dto.NotFoundResponse(c, "Worker profile not found")
		return
	}

	dto.OKResponse(c, "Worker profile retrieved successfully", worker)
}

// UpdateProfile godoc
// @Summary Update Worker Profile
// @Description Update an existing worker profile. Invalidates Redis cache for recommendations and search.
// @Tags Worker
// @Accept json
// @Produce json
// @Param request body dto.UpdateWorkerProfileRequest true "Updated worker profile details"
// @Success 200 {object} dto.APIResponse "Worker profile updated successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Failed to update worker profile"
// @Router /worker/profile [put]
// @Security BearerAuth
func (h *WorkerHandlerV2) UpdateProfile(c *gin.Context) {
	var req dto.UpdateWorkerProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	worker, err := h.service.UpdateWorkerProfile(c.Request.Context(), userID, &req)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to update worker profile", gin.H{"error": err.Error()})
		return
	}

	dto.OKResponse(c, "Worker profile updated successfully", worker)
}

// GetVerificationStatus godoc
// @Summary Get Verification Status
// @Description Retrieve the verification status for a worker (Worker Only)
// @Tags Worker
// @Accept json
// @Produce json
// @Param worker_id path string true "Worker ID"
// @Success 200 {object} dto.APIResponse "Verification status retrieved successfully"
// @Failure 404 {object} dto.APIResponse "Verification status not found"
// @Router /worker/profile/verification [get]
// @Security BearerAuth
func (h *WorkerHandlerV2) GetVerificationStatus(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	verification, err := h.service.GetVerificationStatus(c.Request.Context(), userID)
	if err != nil {
		dto.NotFoundResponse(c, "Verification status not found")
		return
	}

	dto.OKResponse(c, "Verification status retrieved successfully", gin.H{
		"phoneVerified":    verification.PhoneVerified,
		"emailVerified":    verification.EmailVerified,
		"identityVerified": verification.IdentityVerified,
		"status":           verification.OverallStatus,
	})
}

// ============================================================================
// JOB HANDLER V2 — uses JobServiceV2 (cache-aware + notification triggers)
// ============================================================================

// JobHandlerV2 handles job endpoints using JobServiceV2
type JobHandlerV2 struct {
	service *services.JobServiceV2
}

// NewJobHandlerV2 creates a new JobHandlerV2
func NewJobHandlerV2(service *services.JobServiceV2) *JobHandlerV2 {
	return &JobHandlerV2{service: service}
}

// CreateJob godoc
// @Summary Create Job Posting
// @Description Create a new job posting. Invalidates jobs feed cache and notifies matching workers.
// @Tags Job
// @Accept json
// @Produce json
// @Param request body dto.CreateJobRequest true "Job details"
// @Success 201 {object} dto.APIResponse "Job created successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Failed to create job"
// @Router /hirer/jobs [post]
// @Security BearerAuth
func (h *JobHandlerV2) CreateJob(c *gin.Context) {
	var req dto.CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	hirerID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	job, err := h.service.CreateJob(c.Request.Context(), &req, hirerID)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to create job", gin.H{"error": err.Error()})
		return
	}

	dto.CreatedResponse(c, "Job created successfully", job)
}

// GetJobsFeed godoc
// @Summary Get Jobs Feed (Cached)
// @Description Retrieve a paginated feed of available jobs. Results are cached in Redis for 5 minutes.
// @Tags Job
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Param city query string false "Filter by city"
// @Param job_role query string false "Filter by job role"
// @Param work_type query string false "Filter by work type"
// @Param salary_min query int false "Minimum salary"
// @Param salary_max query int false "Maximum salary"
// @Success 200 {object} dto.APIResponse "Jobs feed retrieved successfully"
// @Failure 500 {object} dto.APIResponse "Failed to fetch jobs feed"
// @Router /jobs/feed [get]
// @Security BearerAuth
func (h *JobHandlerV2) GetJobsFeed(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	filters := map[string]interface{}{
		"city":      c.Query("city"),
		"job_role":  c.Query("job_role"),
		"work_type": c.Query("work_type"),
	}

	if salaryMin, err := strconv.Atoi(c.Query("salary_min")); err == nil && salaryMin > 0 {
		filters["salary_min"] = salaryMin
	}
	if salaryMax, err := strconv.Atoi(c.Query("salary_max")); err == nil && salaryMax > 0 {
		filters["salary_max"] = salaryMax
	}

	jobs, total, err := h.service.GetJobsFeed(c.Request.Context(), filters, page, limit)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to fetch jobs feed", gin.H{"error": err.Error()})
		return
	}

	dto.PaginatedSuccessResponse(c, "Jobs feed retrieved successfully", jobs, total, page, limit)
}

// GetJobByID godoc
// @Summary Get Job Details
// @Description Retrieve detailed information about a specific job
// @Tags Job
// @Accept json
// @Produce json
// @Param job_id path string true "Job ID"
// @Success 200 {object} dto.APIResponse "Job retrieved successfully"
// @Failure 404 {object} dto.APIResponse "Job not found"
// @Router /jobs/{job_id} [get]
// @Security BearerAuth
func (h *JobHandlerV2) GetJobByID(c *gin.Context) {
	jobID := c.Param("job_id")

	job, err := h.service.GetJobByID(c.Request.Context(), jobID)
	if err != nil {
		dto.NotFoundResponse(c, "Job not found")
		return
	}

	dto.OKResponse(c, "Job retrieved successfully", job)
}

// UpdateJob godoc
// @Summary Update Job Posting
// @Description Update an existing job posting. Invalidates jobs feed, search, and recommendation caches.
// @Tags Job
// @Accept json
// @Produce json
// @Param job_id path string true "Job ID"
// @Param request body dto.UpdateJobRequest true "Updated job details"
// @Success 200 {object} dto.APIResponse "Job updated successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Failed to update job"
// @Router /hirer/jobs/{job_id} [put]
// @Security BearerAuth
func (h *JobHandlerV2) UpdateJob(c *gin.Context) {
	var req dto.UpdateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	jobID := c.Param("job_id")
	adminID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	job, err := h.service.UpdateJob(c.Request.Context(), jobID, &req, adminID)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to update job", gin.H{"error": err.Error()})
		return
	}

	dto.OKResponse(c, "Job updated successfully", job)
}

// ============================================================================
// APPLICATION HANDLER V2 — uses ApplicationServiceV2 (notification triggers)
// ============================================================================

// ApplicationHandlerV2 handles application endpoints using ApplicationServiceV2
type ApplicationHandlerV2 struct {
	service *services.ApplicationServiceV2
}

// NewApplicationHandlerV2 creates a new ApplicationHandlerV2
func NewApplicationHandlerV2(service *services.ApplicationServiceV2) *ApplicationHandlerV2 {
	return &ApplicationHandlerV2{service: service}
}

// ApplyToJob godoc
// @Summary Apply to Job
// @Description Submit a job application. Notifies the hirer and invalidates recommendation cache.
// @Tags Application
// @Accept json
// @Produce json
// @Param request body dto.CreateApplicationRequest true "Application details"
// @Success 201 {object} dto.APIResponse "Application submitted successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 409 {object} dto.APIResponse "Already applied to this job"
// @Failure 500 {object} dto.APIResponse "Failed to apply for job"
// @Router /applications [post]
// @Security BearerAuth
func (h *ApplicationHandlerV2) ApplyToJob(c *gin.Context) {
	var req dto.CreateApplicationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	application, err := h.service.ApplyToJob(c.Request.Context(), req.JobID, userID)
	if err != nil {
		if err.Error() == "DuplicateApplication" {
			dto.ConflictResponse(c, "You have already applied to this job")
			return
		}
		dto.InternalServerErrorResponse(c, "Failed to apply for job", gin.H{"error": err.Error()})
		return
	}

	dto.CreatedResponse(c, "Application submitted successfully", application)
}

// UpdateApplicationStatus godoc
// @Summary Update Application Status
// @Description Update the status of a job application. Notifies the worker of the status change.
// @Tags Application
// @Accept json
// @Produce json
// @Param application_id path string true "Application ID"
// @Param request body dto.UpdateApplicationStatusRequest true "New status"
// @Success 200 {object} dto.APIResponse "Application status updated successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Failed to update application status"
// @Router /admin/applications/{application_id}/status [put]
// @Security BearerAuth
func (h *ApplicationHandlerV2) UpdateApplicationStatus(c *gin.Context) {
	var req dto.UpdateApplicationStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	applicationID := c.Param("application_id")
	adminID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	if err := h.service.UpdateApplicationStatus(c.Request.Context(), applicationID, req.Status, adminID); err != nil {
		dto.InternalServerErrorResponse(c, "Failed to update application status", gin.H{"error": err.Error()})
		return
	}

	dto.OKResponse(c, "Application status updated successfully", nil)
}

// GetApplicationsByWorker godoc
// @Summary Get My Applications
// @Description Retrieve all applications submitted by the authenticated worker with pagination
// @Tags Application
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Success 200 {object} dto.APIResponse "Applications retrieved successfully"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Failed to fetch applications"
// @Router /applications/my-applications [get]
// @Security BearerAuth
func (h *ApplicationHandlerV2) GetApplicationsByWorker(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	applications, total, err := h.service.GetApplicationsByWorker(c.Request.Context(), userID, page, limit)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to fetch applications", gin.H{"error": err.Error()})
		return
	}

	dto.PaginatedSuccessResponse(c, "Applications retrieved successfully", applications, total, page, limit)
}

// ============================================================================
// ADMIN HANDLER V2 — uses AdminServiceV2 (notification triggers)
// ============================================================================

// AdminHandlerV2 handles admin verification endpoints using AdminServiceV2
type AdminHandlerV2 struct {
	service *services.AdminServiceV2
}

// NewAdminHandlerV2 creates a new AdminHandlerV2
func NewAdminHandlerV2(service *services.AdminServiceV2) *AdminHandlerV2 {
	return &AdminHandlerV2{service: service}
}

// ApproveVerification godoc
// @Summary Approve Verification
// @Description Approve a pending verification request. Notifies the worker/business owner.
// @Tags Admin
// @Accept json
// @Produce json
// @Param request body dto.ApproveVerificationRequest true "Verification approval details"
// @Success 200 {object} dto.APIResponse "Verification approved successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 403 {object} dto.APIResponse "Forbidden - Admin role required"
// @Failure 500 {object} dto.APIResponse "Failed to approve verification"
// @Router /admin/verification/approve [post]
// @Security BearerAuth
func (h *AdminHandlerV2) ApproveVerification(c *gin.Context) {
	var req dto.ApproveVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	adminID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	if err := h.service.ApproveVerification(c.Request.Context(), req.EntityType, req.EntityID, adminID); err != nil {
		dto.InternalServerErrorResponse(c, "Failed to approve verification", gin.H{"error": err.Error()})
		return
	}

	dto.OKResponse(c, "Verification approved successfully", nil)
}

// RejectVerification godoc
// @Summary Reject Verification
// @Description Reject a pending verification request. Notifies the worker/business owner with the reason.
// @Tags Admin
// @Accept json
// @Produce json
// @Param request body dto.RejectVerificationRequest true "Verification rejection details"
// @Success 200 {object} dto.APIResponse "Verification rejected successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 403 {object} dto.APIResponse "Forbidden - Admin role required"
// @Failure 500 {object} dto.APIResponse "Failed to reject verification"
// @Router /admin/verification/reject [post]
// @Security BearerAuth
func (h *AdminHandlerV2) RejectVerification(c *gin.Context) {
	var req dto.RejectVerificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	adminID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	if err := h.service.RejectVerification(c.Request.Context(), req.EntityType, req.EntityID, req.Reason, adminID); err != nil {
		dto.InternalServerErrorResponse(c, "Failed to reject verification", gin.H{"error": err.Error()})
		return
	}

	dto.OKResponse(c, "Verification rejected successfully", nil)
}
