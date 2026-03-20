package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"

	"myapp/internal/dto"
	"myapp/internal/middleware"
	"myapp/internal/services"
)

// ============================================================================
// WORKER HANDLER
// ============================================================================

type WorkerHandler struct {
	service *services.WorkerService
}

func NewWorkerHandler(service *services.WorkerService) *WorkerHandler {
	return &WorkerHandler{service: service}
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
// @Failure 401 {object} dto.APIResponse "Unauthorized - user not found in context"
// @Failure 403 {object} dto.APIResponse "Forbidden - Worker role required"
// @Failure 500 {object} dto.APIResponse "Failed to create worker profile"
// @Router /worker/profile [post]
// @Security BearerAuth
func (h *WorkerHandler) CreateProfile(c *gin.Context) {
	var req dto.CreateWorkerProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request Body", gin.H{"error": err.Error()})
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
// @Failure 401 {object} dto.APIResponse "Unauthorized - user not found in context"
// @Failure 403 {object} dto.APIResponse "Forbidden - Worker role required"
// @Failure 404 {object} dto.APIResponse "Worker profile not found"
// @Router /worker/profile [get]
// @Security BearerAuth
func (h *WorkerHandler) GetProfile(c *gin.Context) {
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
// @Description Update an existing worker profile for the authenticated user (Worker Only)
// @Tags Worker
// @Accept json
// @Produce json
// @Param request body dto.UpdateWorkerProfileRequest true "Updated worker profile details"
// @Success 200 {object} dto.APIResponse "Worker profile updated successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized - user not found in context"
// @Failure 403 {object} dto.APIResponse "Forbidden - Worker role required"
// @Failure 500 {object} dto.APIResponse "Failed to update worker profile"
// @Router /worker/profile [put]
// @Security BearerAuth
func (h *WorkerHandler) UpdateProfile(c *gin.Context) {
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
// @Failure 403 {object} dto.APIResponse "Forbidden - Worker role required"
// @Failure 404 {object} dto.APIResponse "Verification status not found"
// @Router /worker/profile/verification/{worker_id} [get]
// @Security BearerAuth
func (h *WorkerHandler) GetVerificationStatus(c *gin.Context) {
	workerID := c.Param("worker_id")

	verification, err := h.service.GetVerificationStatus(c.Request.Context(), workerID)
	if err != nil {
		dto.NotFoundResponse(c, "Verification status not found")
		return
	}

	verificationData := gin.H{
		"phone_verified":    verification.PhoneVerified,
		"email_verified":    verification.EmailVerified,
		"identity_verified": verification.IdentityVerified,
		"status":            verification.VerificationStatus,
	}
	dto.OKResponse(c, "Verification status retrieved successfully", verificationData)
}

// ============================================================================
// JOB HANDLER
// ============================================================================

type JobHandler struct {
	service *services.JobService
}

func NewJobHandler(service *services.JobService) *JobHandler {
	return &JobHandler{service: service}
}

// CreateJob godoc
// @Summary Create Job Posting
// @Description Create a new job posting (Admin/Hirer only)
// @Tags Job
// @Accept json
// @Produce json
// @Param request body dto.CreateJobRequest true "Job details"
// @Success 201 {object} dto.APIResponse "Job created successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized - user not found in context"
// @Failure 500 {object} dto.APIResponse "Failed to create job"
// @Router /hirer/jobs [post]
// @Security BearerAuth
func (h *JobHandler) CreateJob(c *gin.Context) {
	var req dto.CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	adminID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	job, err := h.service.CreateJob(c.Request.Context(), &req, adminID)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to create job", gin.H{"error": err.Error()})
		return
	}

	dto.CreatedResponse(c, "Job created successfully", job)
}

// GetJobsFeed godoc
// @Summary Get Jobs Feed
// @Description Retrieve a paginated feed of available jobs with optional filters and sorting. Rate limited to 100 requests per minute per authenticated user.
// @Tags Job
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort field (e.g., created_at, salary_min_amount)" default(created_at)
// @Param order query string false "Sort order (asc or desc)" default(desc) Enums(asc,desc)
// @Param city query string false "Filter by city"
// @Param job_role query string false "Filter by job role"
// @Param work_type query string false "Filter by work type"
// @Param salary_min query int false "Minimum salary"
// @Param salary_max query int false "Maximum salary"
// @Success 200 {object} dto.APIResponse "Jobs feed retrieved successfully with pagination metadata"
// @Failure 429 {object} dto.APIResponse "Rate limit exceeded"
// @Failure 500 {object} dto.APIResponse "Failed to fetch jobs feed"
// @Router /jobs/feed [get]
// @Security BearerAuth
func (h *JobHandler) GetJobsFeed(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

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
func (h *JobHandler) GetJobByID(c *gin.Context) {
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
// @Description Update an existing job posting (Admin/Hirer only)
// @Tags Job
// @Accept json
// @Produce json
// @Param job_id path string true "Job ID"
// @Param request body dto.UpdateJobRequest true "Updated job details"
// @Success 200 {object} dto.APIResponse "Job updated successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized - user not found in context"
// @Failure 500 {object} dto.APIResponse "Failed to update job"
// @Router /hirer/jobs/{job_id} [put]
// @Security BearerAuth
func (h *JobHandler) UpdateJob(c *gin.Context) {
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
// APPLICATION HANDLER
// ============================================================================

type ApplicationHandler struct {
	service *services.ApplicationService
}

func NewApplicationHandler(service *services.ApplicationService) *ApplicationHandler {
	return &ApplicationHandler{service: service}
}

// ApplyToJob godoc
// @Summary Apply to Job
// @Description Submit an application for a specific job (Worker Only). Rate limited to 100 requests per minute per authenticated user.
// @Tags Application
// @Accept json
// @Produce json
// @Param request body dto.CreateApplicationRequest true "Application details"
// @Success 201 {object} dto.APIResponse "Application submitted successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized - user not found in context"
// @Failure 403 {object} dto.APIResponse "Forbidden - Worker role required"
// @Failure 409 {object} dto.APIResponse "You have already applied to this job"
// @Failure 429 {object} dto.APIResponse "Rate limit exceeded"
// @Failure 500 {object} dto.APIResponse "Failed to apply for job"
// @Router /applications [post]
// @Security BearerAuth
func (h *ApplicationHandler) ApplyToJob(c *gin.Context) {
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
// @Description Update the status of a job application (Admin Only)
// @Tags Application
// @Accept json
// @Produce json
// @Param application_id path string true "Application ID"
// @Param request body dto.UpdateApplicationStatusRequest true "New status"
// @Success 200 {object} dto.APIResponse "Application status updated successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized - user not found in context"
// @Failure 403 {object} dto.APIResponse "Forbidden - Admin role required"
// @Failure 500 {object} dto.APIResponse "Failed to update application status"
// @Router /admin/applications/{application_id}/status [put]
// @Security BearerAuth
func (h *ApplicationHandler) UpdateApplicationStatus(c *gin.Context) {
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
// @Param sort query string false "Sort field (e.g., applied_at, status)" default(applied_at)
// @Param order query string false "Sort order (asc or desc)" default(desc) Enums(asc,desc)
// @Success 200 {object} dto.APIResponse "Applications retrieved successfully with pagination metadata"
// @Failure 401 {object} dto.APIResponse "Unauthorized - user not found in context"
// @Failure 403 {object} dto.APIResponse "Forbidden - Worker role required"
// @Failure 500 {object} dto.APIResponse "Failed to fetch applications"
// @Router /applications/my-applications [get]
// @Security BearerAuth
func (h *ApplicationHandler) GetApplicationsByWorker(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	applications, total, err := h.service.GetApplicationsByWorker(c.Request.Context(), userID, page, limit)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to fetch applications", gin.H{"error": err.Error()})
		return
	}

	dto.PaginatedSuccessResponse(c, "Applications retrieved successfully", applications, total, page, limit)
}

// ============================================================================
// CHAT HANDLER
// ============================================================================

type ChatHandler struct {
	service *services.ChatService
}

func NewChatHandler(service *services.ChatService) *ChatHandler {
	return &ChatHandler{service: service}
}

// GetOrCreateThread godoc
// @Summary Get or Create Chat Thread
// @Description Get an existing chat thread or create a new one between worker and hirer
// @Tags Chat
// @Accept json
// @Produce json
// @Param request body dto.CreateChatThreadRequest true "Chat thread details"
// @Success 200 {object} dto.APIResponse "Chat thread retrieved or created successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 500 {object} dto.APIResponse "Failed to create chat thread"
// @Router /chat/threads [post]
// @Security BearerAuth
func (h *ChatHandler) GetOrCreateThread(c *gin.Context) {
	var req dto.CreateChatThreadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	thread, err := h.service.GetOrCreateChatThread(c.Request.Context(), req.WorkerID, req.HirerID, req.JobID)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to create chat thread", gin.H{"error": err.Error()})
		return
	}

	dto.OKResponse(c, "Chat thread retrieved or created successfully", thread)
}

// MarkThreadRead godoc
// @Summary Mark Thread Messages as Read
// @Description Mark all unread messages in a thread as read for the authenticated user
// @Tags Chat
// @Produce json
// @Param thread_id path string true "Chat thread ID"
// @Success 200 {object} dto.APIResponse "Messages marked as read"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Failed to mark messages as read"
// @Router /chat/threads/{thread_id}/read [patch]
// @Security BearerAuth
func (h *ChatHandler) MarkThreadRead(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	threadID := c.Param("thread_id")
	if err := h.service.MarkThreadAsRead(c.Request.Context(), threadID, userID); err != nil {
		dto.InternalServerErrorResponse(c, "Failed to mark messages as read", gin.H{"error": err.Error()})
		return
	}

	dto.OKResponse(c, "Messages marked as read", nil)
}

// GetMyThreads godoc
// @Summary Get My Chat Threads
// @Description Retrieve paginated list of chat threads for the authenticated user
// @Tags Chat
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param archived query bool false "Include archived threads" default(false)
// @Success 200 {object} dto.APIResponse "Chat threads retrieved successfully"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Failed to fetch chat threads"
// @Router /chat/threads [get]
// @Security BearerAuth
func (h *ChatHandler) GetMyThreads(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	archived := c.DefaultQuery("archived", "false") == "true"

	threads, total, err := h.service.GetMyThreads(c.Request.Context(), userID, archived, page, limit)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to fetch chat threads", gin.H{"error": err.Error()})
		return
	}

	dto.PaginatedSuccessResponse(c, "Chat threads retrieved successfully", threads, total, page, limit)
}

// SendMessage godoc
// @Summary Send Chat Message
// @Description Send a message in a chat thread
// @Tags Chat
// @Accept json
// @Produce json
// @Param thread_id path string true "Chat thread ID"
// @Param request body dto.SendChatMessageRequest true "Message details"
// @Success 201 {object} dto.APIResponse "Message sent successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized - user not found in context"
// @Failure 500 {object} dto.APIResponse "Failed to send message"
// @Router /chat/threads/{thread_id}/messages [post]
// @Security BearerAuth
func (h *ChatHandler) SendMessage(c *gin.Context) {
	var req dto.SendChatMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	threadID := c.Param("thread_id")
	senderID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	message, err := h.service.SendMessage(c.Request.Context(), threadID, senderID, &req)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to send message", gin.H{"error": err.Error()})
		return
	}

	dto.CreatedResponse(c, "Message sent successfully", message)
}

// GetMessages godoc
// @Summary Get Chat Messages
// @Description Retrieve paginated messages from a chat thread
// @Tags Chat
// @Accept json
// @Produce json
// @Param thread_id path string true "Chat thread ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} dto.APIResponse "Messages retrieved successfully"
// @Failure 500 {object} dto.APIResponse "Failed to fetch messages"
// @Router /chat/threads/{thread_id}/messages [get]
// @Security BearerAuth
func (h *ChatHandler) GetMessages(c *gin.Context) {
	threadID := c.Param("thread_id")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	messages, total, err := h.service.GetChatMessages(c.Request.Context(), threadID, page, limit)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to fetch messages", gin.H{"error": err.Error()})
		return
	}

	dto.PaginatedSuccessResponse(c, "Messages retrieved successfully", messages, total, page, limit)
}

// ============================================================================
// SUBSCRIPTION HANDLER
// ============================================================================

type SubscriptionHandler struct {
	service *services.SubscriptionService
}

func NewSubscriptionHandler(service *services.SubscriptionService) *SubscriptionHandler {
	return &SubscriptionHandler{service: service}
}

// CreateSubscription godoc
// @Summary Create Subscription
// @Description Create a new subscription plan for the authenticated user
// @Tags Subscription
// @Accept json
// @Produce json
// @Param request body dto.CreateSubscriptionRequest true "Subscription details"
// @Success 201 {object} dto.APIResponse "Subscription created successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized - user not found in context"
// @Failure 500 {object} dto.APIResponse "Failed to create subscription"
// @Router /subscriptions [post]
// @Security BearerAuth
func (h *SubscriptionHandler) CreateSubscription(c *gin.Context) {
	var req dto.CreateSubscriptionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}

	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	subscription, err := h.service.CreateSubscription(c.Request.Context(), userID, req.PlanName, req.Amount)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to create subscription", gin.H{"error": err.Error()})
		return
	}

	dto.CreatedResponse(c, "Subscription created successfully", subscription)
}

// GetActiveSubscription godoc
// @Summary Get Active Subscription
// @Description Retrieve the active subscription for the authenticated user
// @Tags Subscription
// @Accept json
// @Produce json
// @Success 200 {object} dto.APIResponse "Active subscription retrieved successfully"
// @Failure 401 {object} dto.APIResponse "Unauthorized - user not found in context"
// @Failure 402 {object} dto.APIResponse "No active subscription found"
// @Router /subscriptions/active [get]
// @Security BearerAuth
func (h *SubscriptionHandler) GetActiveSubscription(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	subscription, err := h.service.GetActiveSubscription(c.Request.Context(), userID)
	if err != nil {
		dto.PaymentRequiredResponse(c, "No active subscription found")
		return
	}

	subscriptionData := gin.H{
		"id":             subscription.ID,
		"plan_name":      subscription.PlanName,
		"status":         subscription.Status,
		"amount":         subscription.Amount,
		"start_date":     subscription.StartDate,
		"end_date":       subscription.EndDate,
		"remaining_days": int(subscription.EndDate.Sub(subscription.StartDate).Hours() / 24),
	}
	dto.OKResponse(c, "Active subscription retrieved successfully", subscriptionData)
}

// CheckContactLimit godoc
// @Summary Check Contact Limit
// @Description Check if the user has available contacts for their subscription plan
// @Tags Subscription
// @Accept json
// @Produce json
// @Success 200 {object} dto.APIResponse "Contact limit retrieved successfully"
// @Failure 401 {object} dto.APIResponse "Unauthorized - user not found in context"
// @Failure 402 {object} dto.APIResponse "Active subscription required to check contact limits"
// @Failure 500 {object} dto.APIResponse "Failed to check contact limit"
// @Router /subscriptions/contact-limit [get]
// @Security BearerAuth
func (h *SubscriptionHandler) CheckContactLimit(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	// Get subscription to determine plan limit
	subscription, err := h.service.GetActiveSubscription(c.Request.Context(), userID)
	if err != nil {
		dto.PaymentRequiredResponse(c, "Active subscription required to check contact limits")
		return
	}

	// Determine contact limit based on plan
	planLimit := 5 // Default free
	switch subscription.PlanName {
	case "Premium":
		planLimit = 20
	case "Enterprise":
		planLimit = 100
	}

	hasAvailable, remaining, err := h.service.CheckContactLimit(c.Request.Context(), userID, planLimit)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to check contact limit", gin.H{"error": err.Error()})
		return
	}

	contactData := gin.H{
		"has_available": hasAvailable,
		"remaining":     remaining,
		"limit":         planLimit,
	}
	dto.OKResponse(c, "Contact limit retrieved successfully", contactData)
}

// ============================================================================
// NOTIFICATION HANDLER
// ============================================================================

type NotificationHandler struct {
	service *services.NotificationServiceV2
}

func NewNotificationHandler(service *services.NotificationServiceV2) *NotificationHandler {
	return &NotificationHandler{service: service}
}

// GetNotifications godoc
// @Summary Get Notifications
// @Description Retrieve paginated notifications for the authenticated user with optional sorting
// @Tags Notification
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Param sort query string false "Sort field (e.g., created_at)" default(created_at)
// @Param order query string false "Sort order (asc or desc)" default(desc) Enums(asc,desc)
// @Success 200 {object} dto.APIResponse "Notifications retrieved successfully with pagination metadata"
// @Failure 401 {object} dto.APIResponse "Unauthorized - user not found in context"
// @Failure 500 {object} dto.APIResponse "Failed to fetch notifications"
// @Router /notifications [get]
// @Security BearerAuth
func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	notifications, total, err := h.service.GetNotifications(c.Request.Context(), userID, page, limit)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to fetch notifications", gin.H{"error": err.Error()})
		return
	}

	dto.PaginatedSuccessResponse(c, "Notifications retrieved successfully", notifications, total, page, limit)
}

// ============================================================================
// ADMIN HANDLER
// ============================================================================

type AdminHandler struct {
	service *services.AdminService
}

func NewAdminHandler(service *services.AdminService) *AdminHandler {
	return &AdminHandler{service: service}
}

// ApproveVerification godoc
// @Summary Approve Verification
// @Description Approve a pending verification request (Admin Only)
// @Tags Admin
// @Accept json
// @Produce json
// @Param request body dto.ApproveVerificationRequest true "Verification approval details"
// @Success 200 {object} dto.APIResponse "Verification approved successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized - user not found in context"
// @Failure 403 {object} dto.APIResponse "Forbidden - Admin role required"
// @Failure 500 {object} dto.APIResponse "Failed to approve verification"
// @Router /admin/verification/approve [post]
// @Security BearerAuth
func (h *AdminHandler) ApproveVerification(c *gin.Context) {
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
// @Description Reject a pending verification request (Admin Only)
// @Tags Admin
// @Accept json
// @Produce json
// @Param request body dto.RejectVerificationRequest true "Verification rejection details"
// @Success 200 {object} dto.APIResponse "Verification rejected successfully"
// @Failure 400 {object} dto.APIResponse "Invalid request body"
// @Failure 401 {object} dto.APIResponse "Unauthorized - user not found in context"
// @Failure 403 {object} dto.APIResponse "Forbidden - Admin role required"
// @Failure 500 {object} dto.APIResponse "Failed to reject verification"
// @Router /admin/verification/reject [post]
// @Security BearerAuth
func (h *AdminHandler) RejectVerification(c *gin.Context) {
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
