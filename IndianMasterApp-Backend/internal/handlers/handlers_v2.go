package handlers

import (
	"database/sql"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	apperrors "myapp/internal/errors"
	"myapp/internal/dto"
	"myapp/internal/middleware"
	"myapp/internal/models"
	"myapp/internal/repositories"
	"myapp/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ============================================================================
// WORKER HANDLER V2 — uses WorkerServiceV2 (cache-aware)
// ============================================================================

// WorkerHandlerV2 handles worker profile endpoints using WorkerServiceV2
type WorkerHandlerV2 struct {
	service    *services.WorkerServiceV2
	resumeRepo repositories.WorkerResumeRepository
}

// NewWorkerHandlerV2 creates a new WorkerHandlerV2
func NewWorkerHandlerV2(service *services.WorkerServiceV2, resumeRepo repositories.WorkerResumeRepository) *WorkerHandlerV2 {
	return &WorkerHandlerV2{service: service, resumeRepo: resumeRepo}
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
		internalError(c, "Failed to create worker profile", err)
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
		internalError(c, "Failed to update worker profile", err)
		return
	}

	dto.OKResponse(c, "Worker profile updated successfully", worker)
}

// UploadPhoto godoc
// @Summary Upload Worker Profile Photo
// @Description Upload a profile photo (JPEG/PNG/WebP, max 5 MB). Saves the file under uploads/workers/{userID}/ and updates workers.profile_photo_url.
// @Tags Worker
// @Accept multipart/form-data
// @Produce json
// @Param photo formData file true "Profile photo file"
// @Success 200 {object} dto.APIResponse "Photo uploaded successfully"
// @Failure 400 {object} dto.APIResponse "Invalid or missing file"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Failed to save photo"
// @Router /worker/profile/photo [post]
// @Security BearerAuth
func (h *WorkerHandlerV2) UploadPhoto(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized")
		return
	}

	file, header, err := c.Request.FormFile("photo")
	if err != nil {
		dto.BadRequestResponse(c, "Missing 'photo' field in request", gin.H{"error": err.Error()})
		return
	}
	defer file.Close()

	// Validate file size — max 5 MB
	const maxSize = 5 << 20
	if header.Size > maxSize {
		dto.BadRequestResponse(c, "File too large; maximum allowed size is 5 MB", nil)
		return
	}

	// Detect MIME type from the first 512 bytes
	buf := make([]byte, 512)
	n, err := file.Read(buf)
	if err != nil && err != io.EOF {
		dto.InternalServerErrorResponse(c, "Failed to read uploaded file", nil)
		return
	}
	contentType := http.DetectContentType(buf[:n])

	var ext string
	switch contentType {
	case "image/jpeg":
		ext = ".jpg"
	case "image/png":
		ext = ".png"
	case "image/webp":
		ext = ".webp"
	default:
		dto.BadRequestResponse(c, "Unsupported file type; use JPEG, PNG, or WebP", gin.H{"detected": contentType})
		return
	}

	// Seek back to start before writing
	if seeker, ok := file.(io.Seeker); ok {
		if _, err := seeker.Seek(0, io.SeekStart); err != nil {
			dto.InternalServerErrorResponse(c, "Failed to process uploaded file", nil)
			return
		}
	}

	// Create the upload directory
	dir := filepath.Join("uploads", "workers", userID)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		dto.InternalServerErrorResponse(c, "Failed to create upload directory", nil)
		return
	}

	// Write the file (overwrite any previous photo for this worker)
	destPath := filepath.Join(dir, "photo"+ext)
	dest, err := os.Create(destPath)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to create destination file", nil)
		return
	}
	defer dest.Close()

	if _, err := io.Copy(dest, file); err != nil {
		dto.InternalServerErrorResponse(c, "Failed to write uploaded file", nil)
		return
	}

	// Build the publicly accessible URL
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	photoURL := fmt.Sprintf("%s://%s/uploads/workers/%s/photo%s", scheme, c.Request.Host, userID, ext)

	// Persist the URL into workers.profile_photo_url
	updateReq := &dto.UpdateWorkerProfileRequest{ProfilePhotoURL: photoURL}
	if _, err := h.service.UpdateWorkerProfile(c.Request.Context(), userID, updateReq); err != nil {
		// File is saved on disk; log the DB failure but still return the URL
		log.Printf("[UploadPhoto] warning: file saved but DB update failed for userID=%s: %v", userID, err)
	}

	dto.OKResponse(c, "Profile photo uploaded successfully", gin.H{"url": photoURL})
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

// UploadResume godoc
// @Summary Upload Worker Resume
// @Description Upload a resume file (PDF/DOC/DOCX, max 10 MB).
//
//	Saves the file under uploads/workers/{userID}/ and inserts a row into
//	worker_resumes with worker_id FK → workers.id. Any previous active resume
//	for this worker is automatically deactivated (one active resume per worker).
//
// @Tags Worker
// @Accept multipart/form-data
// @Produce json
// @Param resume formData file true "Resume file (PDF, DOC, or DOCX)"
// @Success 200 {object} dto.APIResponse "Resume uploaded successfully"
// @Failure 400 {object} dto.APIResponse "Invalid or missing file"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 404 {object} dto.APIResponse "Worker profile not found"
// @Failure 500 {object} dto.APIResponse "Failed to save resume"
// @Router /worker/profile/resume [post]
// @Security BearerAuth
func (h *WorkerHandlerV2) UploadResume(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized")
		return
	}

	// Resolve workers.id from the authenticated user — this becomes the FK value.
	workerProfile, err := h.service.GetWorkerProfile(c.Request.Context(), userID)
	if err != nil {
		dto.NotFoundResponse(c, "Worker profile not found; complete profile setup first")
		return
	}
	workerID := workerProfile.ID

	file, header, err := c.Request.FormFile("resume")
	if err != nil {
		dto.BadRequestResponse(c, "Missing 'resume' field in request", gin.H{"error": err.Error()})
		return
	}
	defer file.Close()

	// Validate file size — max 10 MB
	const maxSize = 10 << 20
	if header.Size > maxSize {
		dto.BadRequestResponse(c, "File too large; maximum allowed size is 10 MB", nil)
		return
	}

	// Determine extension and MIME from the original filename.
	// http.DetectContentType cannot reliably detect DOCX (it looks like a ZIP),
	// so we validate by extension + the Content-Type the client declares.
	origName := header.Filename
	ext := strings.ToLower(filepath.Ext(origName))

	allowedExts := map[string]string{
		".pdf":  "application/pdf",
		".doc":  "application/msword",
		".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	}
	mimeType, ok := allowedExts[ext]
	if !ok {
		dto.BadRequestResponse(c, "Unsupported file type; allowed types are PDF, DOC, DOCX", gin.H{"extension": ext})
		return
	}

	// Create the upload directory: uploads/workers/{userID}/
	dir := filepath.Join("uploads", "workers", userID)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		dto.InternalServerErrorResponse(c, "Failed to create upload directory", nil)
		return
	}

	// Store as resume.{ext} — overwrites any previously uploaded file on disk.
	storedName := "resume" + ext
	destPath := filepath.Join(dir, storedName)
	dest, err := os.Create(destPath)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to create destination file", nil)
		return
	}
	defer dest.Close()

	if _, err := io.Copy(dest, file); err != nil {
		dto.InternalServerErrorResponse(c, "Failed to write uploaded file", nil)
		return
	}

	// Build the publicly accessible URL.
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	fileURL := fmt.Sprintf("%s://%s/uploads/workers/%s/%s", scheme, c.Request.Host, userID, storedName)

	// Persist metadata to worker_resumes, linking via worker_id (workers.id).
	resume := &models.WorkerResume{
		ID:           uuid.New().String(),
		WorkerID:     workerID,
		FileURL:      fileURL,
		OriginalName: origName,
		StoredName:   storedName,
		MimeType:     mimeType,
		FileSize:     header.Size,
	}
	if err := h.resumeRepo.Upsert(c.Request.Context(), resume); err != nil {
		// File is saved on disk; log the DB failure but return an error — the row
		// must exist in DB for ownership tracking to be valid.
		log.Printf("[UploadResume] DB upsert failed for workerID=%s userID=%s: %v", workerID, userID, err)
		dto.InternalServerErrorResponse(c, "Failed to save resume metadata", nil)
		return
	}

	dto.OKResponse(c, "Resume uploaded successfully", gin.H{
		"id":           resume.ID,
		"workerId":     workerID,
		"fileUrl":      fileURL,
		"originalName": origName,
		"mimeType":     mimeType,
		"fileSize":     header.Size,
	})
}

// GetResume godoc
// @Summary Get Active Worker Resume
// @Description Retrieve the metadata of the currently active resume for the authenticated worker.
// @Tags Worker
// @Produce json
// @Success 200 {object} dto.APIResponse "Active resume metadata"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 404 {object} dto.APIResponse "No active resume found"
// @Router /worker/profile/resume [get]
// @Security BearerAuth
func (h *WorkerHandlerV2) GetResume(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized")
		return
	}

	workerProfile, err := h.service.GetWorkerProfile(c.Request.Context(), userID)
	if err != nil {
		dto.NotFoundResponse(c, "Worker profile not found")
		return
	}

	resume, err := h.resumeRepo.GetActiveByWorkerID(c.Request.Context(), workerProfile.ID)
	if err == sql.ErrNoRows {
		dto.NotFoundResponse(c, "No active resume found")
		return
	}
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to retrieve resume", nil)
		return
	}

	dto.OKResponse(c, "Resume retrieved successfully", resume)
}

// ListWorkersForHirer returns all active workers for the hirer's Explore screen.
// GET /api/v1/hirer/workers
func (h *WorkerHandlerV2) ListWorkersForHirer(c *gin.Context) {
	workers, err := h.service.ListActiveForHirer(c.Request.Context())
	if err != nil {
		internalError(c, "Failed to list workers", err)
		return
	}
	dto.OKResponse(c, "Workers retrieved successfully", workers)
}

// GetWorkerProfileForHirer returns a worker's public profile (no contact details).
// GET /api/v1/hirer/workers/:worker_id/profile
func (h *WorkerHandlerV2) GetWorkerProfileForHirer(c *gin.Context) {
	workerID := c.Param("worker_id")
	if _, err := uuid.Parse(workerID); err != nil {
		dto.BadRequestResponse(c, "Invalid worker_id", nil)
		return
	}

	profile, err := h.service.GetWorkerPublicProfile(c.Request.Context(), workerID)
	if err != nil {
		dto.NotFoundResponse(c, "Worker not found")
		return
	}

	dto.OKResponse(c, "Worker profile retrieved", profile)
}

// CheckWorkerUnlockStatus returns whether the authenticated hirer has unlocked a worker.
// GET /api/v1/hirer/workers/:worker_id/unlock-status
func (h *WorkerHandlerV2) CheckWorkerUnlockStatus(c *gin.Context) {
	hirerUserID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized")
		return
	}

	workerID := c.Param("worker_id")
	if _, err := uuid.Parse(workerID); err != nil {
		dto.BadRequestResponse(c, "Invalid worker_id", nil)
		return
	}

	isUnlocked, err := h.service.CheckWorkerUnlockStatus(c.Request.Context(), hirerUserID, workerID)
	if err != nil {
		dto.InternalServerErrorResponse(c, "Failed to check unlock status", nil)
		return
	}

	dto.OKResponse(c, "Unlock status retrieved", dto.WorkerUnlockStatusResponse{
		WorkerID:   workerID,
		IsUnlocked: isUnlocked,
	})
}

// UnlockWorkerContact verifies the hirer's subscription, records the unlock, and returns
// the worker's phone number + WhatsApp deep-link.
// POST /api/v1/hirer/workers/:worker_id/unlock
func (h *WorkerHandlerV2) UnlockWorkerContact(c *gin.Context) {
	hirerUserID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized")
		return
	}

	workerID := c.Param("worker_id")
	if _, err := uuid.Parse(workerID); err != nil {
		dto.BadRequestResponse(c, "Invalid worker_id", nil)
		return
	}

	contact, err := h.service.UnlockWorkerContact(c.Request.Context(), hirerUserID, workerID)
	if err != nil {
		if err == services.ErrNoActiveSubscription {
			dto.PaymentRequiredResponse(c, "Active subscription required to contact workers")
			return
		}
		dto.InternalServerErrorResponse(c, "Failed to unlock worker contact", nil)
		return
	}

	dto.OKResponse(c, "Worker contact unlocked", contact)
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
		statusCode := apperrors.GetStatusCode(err)
		if statusCode == 400 {
			dto.BadRequestResponse(c, err.Error(), nil)
		} else {
			internalError(c, "Failed to create job", err)
		}
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
		internalError(c, "Failed to fetch jobs feed", err)
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
	if _, err := uuid.Parse(jobID); err != nil {
		dto.BadRequestResponse(c, "Invalid job_id", nil)
		return
	}

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
	if _, err := uuid.Parse(jobID); err != nil {
		dto.BadRequestResponse(c, "Invalid job_id", nil)
		return
	}

	adminID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	job, err := h.service.UpdateJob(c.Request.Context(), jobID, &req, adminID)
	if err != nil {
		if err.Error() == "ForbiddenJobAccess" {
			dto.ForbiddenResponse(c, "You do not own this job")
			return
		}
		internalError(c, "Failed to update job", err)
		return
	}

	dto.OKResponse(c, "Job updated successfully", job)
}

// GetMyJobs godoc
// @Summary Get Hirer's Posted Jobs
// @Description Returns all jobs posted by the authenticated hirer.
// @Tags Hirer
// @Produce json
// @Success 200 {object} dto.APIResponse "Jobs retrieved successfully"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Failed to retrieve jobs"
// @Router /hirer/jobs [get]
// @Security BearerAuth
func (h *JobHandlerV2) GetMyJobs(c *gin.Context) {
	hirerID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	jobs, err := h.service.GetMyJobs(c.Request.Context(), hirerID)
	if err != nil {
		statusCode := apperrors.GetStatusCode(err)
		if statusCode == 400 || statusCode == 404 {
			dto.BadRequestResponse(c, err.Error(), nil)
		} else {
			internalError(c, "Failed to retrieve jobs", err)
		}
		return
	}

	dto.OKResponse(c, "Jobs retrieved successfully", gin.H{
		"data":  jobs,
		"total": len(jobs),
	})
}

// DeleteJob DELETE /hirer/jobs/:job_id
// Soft-deletes a job owned by the authenticated hirer.
func (h *JobHandlerV2) DeleteJob(c *gin.Context) {
	jobID := c.Param("job_id")
	if _, err := uuid.Parse(jobID); err != nil {
		dto.BadRequestResponse(c, "Invalid job_id", nil)
		return
	}

	hirerID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}
	if err := h.service.DeleteJob(c.Request.Context(), jobID, hirerID); err != nil {
		if err.Error() == "ForbiddenJobAccess" {
			dto.ForbiddenResponse(c, "You do not own this job")
			return
		}
		internalError(c, "Failed to delete job", err)
		return
	}
	dto.OKResponse(c, "Job deleted successfully", nil)
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
		internalError(c, "Failed to apply for job", err)
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
	if _, err := uuid.Parse(applicationID); err != nil {
		dto.BadRequestResponse(c, "Invalid application_id", nil)
		return
	}

	adminID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	if err := h.service.UpdateApplicationStatus(c.Request.Context(), applicationID, req.Status, adminID); err != nil {
		internalError(c, "Failed to update application status", err)
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
		internalError(c, "Failed to fetch applications", err)
		return
	}

	dto.PaginatedSuccessResponse(c, "Applications retrieved successfully", applications, total, page, limit)
}

// GetApplicantsByJobID GET /hirer/jobs/:job_id/applicants
// Returns enriched applicants list for a job owned by the authenticated hirer.
func (h *ApplicationHandlerV2) GetApplicantsByJobID(c *gin.Context) {
	hirerID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	jobID := c.Param("job_id")
	if _, err := uuid.Parse(jobID); err != nil {
		dto.BadRequestResponse(c, "Invalid job_id", nil)
		return
	}

	applicants, err := h.service.GetApplicantsByJobID(c.Request.Context(), jobID, hirerID)
	if err != nil {
		if err.Error() == "ForbiddenJobAccess" {
			dto.ForbiddenResponse(c, "You do not have access to this job's applicants")
			return
		}
		internalError(c, "Failed to fetch applicants", err)
		return
	}

	dto.OKResponse(c, "Applicants retrieved successfully", gin.H{
		"data":  applicants,
		"total": len(applicants),
	})
}

// UpdateApplicationStatusByHirer PUT /hirer/jobs/:job_id/applicants/:application_id/status
// Updates application status after verifying the hirer owns the job.
func (h *ApplicationHandlerV2) UpdateApplicationStatusByHirer(c *gin.Context) {
	var req dto.UpdateApplicationStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "Invalid request body", gin.H{"error": err.Error()})
		return
	}
	jobID := c.Param("job_id")
	if _, err := uuid.Parse(jobID); err != nil {
		dto.BadRequestResponse(c, "Invalid job_id", nil)
		return
	}

	applicationID := c.Param("application_id")
	if _, err := uuid.Parse(applicationID); err != nil {
		dto.BadRequestResponse(c, "Invalid application_id", nil)
		return
	}

	hirerID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}
	if err := h.service.UpdateApplicationStatusByHirer(c.Request.Context(), jobID, applicationID, req.Status, hirerID); err != nil {
		if err.Error() == "ForbiddenJobAccess" {
			dto.ForbiddenResponse(c, "You do not have access to this job")
			return
		}
		internalError(c, "Failed to update application status", err)
		return
	}
	dto.OKResponse(c, "Application status updated successfully", nil)
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
		internalError(c, "Failed to approve verification", err)
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
		internalError(c, "Failed to reject verification", err)
		return
	}

	dto.OKResponse(c, "Verification rejected successfully", nil)
}
