package services

import (
	"context"
	"fmt"

	apperrors "myapp/internal/errors"
	"myapp/internal/dto"
	"myapp/internal/models"
	"myapp/internal/repositories"
	"myapp/internal/utils"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// ============================================================================
// JOB SERVICE V2 — with Redis caching + notification triggers
// ============================================================================

// JobServiceV2 extends JobService with caching and notification support
type JobServiceV2 struct {
	jobRepo         repositories.JobRepository
	businessRepo    repositories.BusinessRepository
	workerRepo      repositories.WorkerRepository
	auditRepo       repositories.AuditRepository
	notificationSvc *NotificationServiceV2
	cache           *utils.CacheService
}

// NewJobServiceV2 creates a new JobServiceV2
func NewJobServiceV2(
	jobRepo repositories.JobRepository,
	businessRepo repositories.BusinessRepository,
	workerRepo repositories.WorkerRepository,
	auditRepo repositories.AuditRepository,
	notificationSvc *NotificationServiceV2,
	cache *utils.CacheService,
) *JobServiceV2 {
	return &JobServiceV2{
		jobRepo:         jobRepo,
		businessRepo:    businessRepo,
		workerRepo:      workerRepo,
		auditRepo:       auditRepo,
		notificationSvc: notificationSvc,
		cache:           cache,
	}
}

// CreateJob creates a new job posting and:
//  1. Persists the job to the database
//  2. Invalidates the jobs feed cache
//  3. Notifies matching workers (NEW_JOB notification)
func (s *JobServiceV2) CreateJob(ctx context.Context, req *dto.CreateJobRequest, hirerID string) (*dto.JobResponse, error) {
	// Resolve BusinessID from the hirer's profile when not supplied by the client
	businessID := req.BusinessID
	if businessID == "" {
		biz, err := s.businessRepo.GetFirstByOwnerID(ctx, hirerID)
		if err != nil {
			return nil, apperrors.NewAppError(
				apperrors.ErrBadRequest,
				"Business profile not found. Please complete your business setup before posting a job.",
				400,
				nil,
			)
		}
		businessID = biz.ID
	}

	// Derive JobRole from the first element of Roles when not supplied directly
	jobRole := req.JobRole
	if jobRole == "" && len(req.Roles) > 0 {
		jobRole = req.Roles[0]
	}
	if jobRole == "" && len(req.Categories) > 0 {
		jobRole = req.Categories[0]
	}
	if jobRole == "" {
		jobRole = "General"
	}

	job := &models.Job{
		ID:                 uuid.New().String(),
		BusinessID:         businessID,
		JobRole:            jobRole,
		Position:           req.Position,
		Categories:         pq.StringArray(req.Categories),
		Roles:              pq.StringArray(req.Roles),
		PreferredLanguages: pq.StringArray(req.PreferredLanguages),
		SalaryMinAmount:    req.SalaryMinAmount,
		SalaryMaxAmount:    req.SalaryMaxAmount,
		ExperienceMin:      req.ExperienceMin,
		ExperienceMax:      req.ExperienceMax,
		Vacancies:          req.Vacancies,
		GenderPreference:   req.GenderPreference,
		MaleVacancies:      req.MaleVacancies,
		FemaleVacancies:    req.FemaleVacancies,
		OthersVacancies:    req.OthersVacancies,
		WorkingHours:       req.WorkingHours,
		WeeklyLeaves:       req.WeeklyLeaves,
		Benefits:           pq.StringArray(req.Benefits),
		WorkType:           req.WorkType,
		AddressText:        req.AddressText,
		Locality:           req.Locality,
		City:               req.City,
		State:              req.State,
		Description:        req.Description,
		Availability:       pq.StringArray(req.Availability),
		Status:             models.JobStatusOpen,
		Language:           "en",
		IsActive:           true,
	}

	if err := s.jobRepo.Create(ctx, job); err != nil {
		return nil, err
	}

	// Invalidate jobs feed cache so next request fetches fresh data
	_ = s.cache.InvalidateJobsCache(ctx)
	// Also invalidate job search cache since new jobs affect job search results
	_ = s.cache.InvalidateSearchJobsCache(ctx)

	resp := mapJobModelToDTO(job)
	// Notify matching workers about the new job (best-effort, non-blocking)
	go s.notifyMatchingWorkers(context.Background(), resp)

	return resp, nil
}

// GetJobsFeed returns paginated jobs feed with Redis caching
func (s *JobServiceV2) GetJobsFeed(ctx context.Context, filters map[string]interface{}, page, limit int) ([]dto.JobResponse, int64, error) {
	// Build cache key — include page; filters are not cached per-filter for simplicity
	cacheKey := utils.JobsFeedCacheKey(page)

	// 1. Check Redis cache
	type cachedResult struct {
		Jobs  []dto.JobResponse `json:"jobs"`
		Total int64             `json:"total"`
	}
	var cached cachedResult
	found, err := s.cache.Get(ctx, cacheKey, &cached)
	if err == nil && found {
		return cached.Jobs, cached.Total, nil
	}

	// 2. Fetch from repository
	jobList, err := s.jobRepo.ListOpenJobs(ctx)
	if err != nil {
		return nil, 0, err
	}

	total := int64(len(jobList))

	// Apply page/limit slicing
	start := (page - 1) * limit
	if start < 0 {
		start = 0
	}
	if start >= len(jobList) {
		return []dto.JobResponse{}, total, nil
	}
	end := start + limit
	if end > len(jobList) {
		end = len(jobList)
	}
	paged := jobList[start:end]

	// Map models to DTOs
	jobs := make([]dto.JobResponse, len(paged))
	for i, j := range paged {
		jobs[i] = *mapJobModelToDTO(j)
	}

	// 3. Store in Redis
	_ = s.cache.Set(ctx, cacheKey, cachedResult{Jobs: jobs, Total: total})

	return jobs, total, nil
}

// GetJobByID returns a single job by ID, enriched with business name and logo
func (s *JobServiceV2) GetJobByID(ctx context.Context, jobID string) (*dto.JobResponse, error) {
	j, err := s.jobRepo.GetByID(ctx, jobID)
	if err != nil {
		return nil, err
	}
	if biz, bizErr := s.businessRepo.GetByID(ctx, j.BusinessID); bizErr == nil {
		j.BusinessName = biz.BusinessName
		j.LogoURL = biz.LogoURL
	}
	return mapJobModelToDTO(j), nil
}

// UpdateJob updates a job in the database and invalidates relevant caches.
// adminID is the authenticated hirer's user ID; ownership is verified before any update.
func (s *JobServiceV2) UpdateJob(ctx context.Context, jobID string, req *dto.UpdateJobRequest, adminID string) (*dto.JobResponse, error) {
	// Verify the caller owns the job before applying any changes.
	biz, err := s.businessRepo.GetFirstByOwnerID(ctx, adminID)
	if err != nil {
		return nil, fmt.Errorf("hirer has no business profile")
	}
	job, err := s.jobRepo.GetByID(ctx, jobID)
	if err != nil {
		return nil, err
	}
	if job.BusinessID != biz.ID {
		return nil, fmt.Errorf("ForbiddenJobAccess")
	}

	// Apply only provided (non-zero) fields
	if req.Position != "" {
		job.Position = req.Position
	}
	if req.SalaryMinAmount != 0 {
		job.SalaryMinAmount = req.SalaryMinAmount
	}
	if req.SalaryMaxAmount != 0 {
		job.SalaryMaxAmount = req.SalaryMaxAmount
	}
	if req.ExperienceMin != 0 {
		job.ExperienceMin = req.ExperienceMin
	}
	if req.ExperienceMax != nil {
		job.ExperienceMax = req.ExperienceMax
	}
	if req.Vacancies != 0 {
		job.Vacancies = req.Vacancies
	}
	if req.GenderPreference != "" {
		job.GenderPreference = req.GenderPreference
	}
	if req.MaleVacancies != 0 {
		job.MaleVacancies = req.MaleVacancies
	}
	if req.FemaleVacancies != 0 {
		job.FemaleVacancies = req.FemaleVacancies
	}
	if req.OthersVacancies != 0 {
		job.OthersVacancies = req.OthersVacancies
	}
	if req.WorkingHours != nil {
		job.WorkingHours = req.WorkingHours
	}
	if req.WeeklyLeaves != 0 {
		job.WeeklyLeaves = req.WeeklyLeaves
	}
	if len(req.Categories) > 0 {
		job.Categories = pq.StringArray(req.Categories)
	}
	if len(req.Roles) > 0 {
		job.Roles = pq.StringArray(req.Roles)
	}
	if len(req.PreferredLanguages) > 0 {
		job.PreferredLanguages = pq.StringArray(req.PreferredLanguages)
	}
	if len(req.Benefits) > 0 {
		job.Benefits = pq.StringArray(req.Benefits)
	}
	if req.WorkType != "" {
		job.WorkType = req.WorkType
	}
	if req.AddressText != "" {
		job.AddressText = req.AddressText
	}
	if req.Locality != "" {
		job.Locality = req.Locality
	}
	if req.City != "" {
		job.City = req.City
	}
	if req.State != "" {
		job.State = req.State
	}
	if req.Description != "" {
		job.Description = req.Description
	}
	if len(req.Availability) > 0 {
		job.Availability = pq.StringArray(req.Availability)
	}

	if err := s.jobRepo.Update(ctx, job); err != nil {
		return nil, err
	}

	// Status is managed separately via UpdateStatus
	if req.Status != "" {
		if err := s.jobRepo.UpdateStatus(ctx, jobID, req.Status); err != nil {
			return nil, err
		}
		job.Status = req.Status
	}

	_ = s.cache.InvalidateJobsCache(ctx)
	_ = s.cache.InvalidateSearchJobsCache(ctx)

	return mapJobModelToDTO(job), nil
}

// mapJobModelToDTO converts a models.Job to dto.JobResponse.
func mapJobModelToDTO(j *models.Job) *dto.JobResponse {
	cats := []string(j.Categories)
	if cats == nil {
		cats = []string{}
	}
	roles := []string(j.Roles)
	if roles == nil {
		roles = []string{}
	}
	langs := []string(j.PreferredLanguages)
	if langs == nil {
		langs = []string{}
	}
	benefits := []string(j.Benefits)
	if benefits == nil {
		benefits = []string{}
	}
	avail := []string(j.Availability)
	if avail == nil {
		avail = []string{}
	}
	return &dto.JobResponse{
		ID:                 j.ID,
		BusinessID:         j.BusinessID,
		BusinessName:       j.BusinessName,
		LogoURL:            j.LogoURL,
		JobRole:            j.JobRole,
		Position:           j.Position,
		Categories:         cats,
		Roles:              roles,
		PreferredLanguages: langs,
		SalaryMinAmount:    j.SalaryMinAmount,
		SalaryMaxAmount:    j.SalaryMaxAmount,
		ExperienceMin:      j.ExperienceMin,
		ExperienceMax:      j.ExperienceMax,
		Vacancies:          j.Vacancies,
		GenderPreference:   j.GenderPreference,
		MaleVacancies:      j.MaleVacancies,
		FemaleVacancies:    j.FemaleVacancies,
		OthersVacancies:    j.OthersVacancies,
		WorkingHours:       j.WorkingHours,
		WeeklyLeaves:       j.WeeklyLeaves,
		Benefits:           benefits,
		WorkType:           j.WorkType,
		City:               j.City,
		State:              j.State,
		Locality:           j.Locality,
		AddressText:        j.AddressText,
		Latitude:           j.Latitude,
		Longitude:          j.Longitude,
		Description:        j.Description,
		Availability:       avail,
		Status:             j.Status,
		CreatedAt:          j.CreatedAt,
	}
}

// GetMyJobs returns all jobs posted by the hirer identified by hirerID.
func (s *JobServiceV2) GetMyJobs(ctx context.Context, hirerID string) ([]dto.JobResponse, error) {
	biz, err := s.businessRepo.GetFirstByOwnerID(ctx, hirerID)
	if err != nil {
		return nil, apperrors.NewAppError(
			apperrors.ErrBadRequest,
			"Business profile not found. Please complete your business setup.",
			400,
			nil,
		)
	}

	jobList, err := s.jobRepo.GetByBusinessID(ctx, biz.ID)
	if err != nil {
		return nil, err
	}

	jobs := make([]dto.JobResponse, len(jobList))
	for i, j := range jobList {
		jobs[i] = *mapJobModelToDTO(j)
	}
	return jobs, nil
}

// DeleteJob soft-deletes a job owned by the given hirer (sets is_active=FALSE).
// Returns ForbiddenJobAccess error if the job does not belong to the hirer's business.
func (s *JobServiceV2) DeleteJob(ctx context.Context, jobID, hirerUserID string) error {
	biz, err := s.businessRepo.GetFirstByOwnerID(ctx, hirerUserID)
	if err != nil {
		return fmt.Errorf("hirer has no business profile")
	}
	job, err := s.jobRepo.GetByID(ctx, jobID)
	if err != nil {
		return err
	}
	if job.BusinessID != biz.ID {
		return fmt.Errorf("ForbiddenJobAccess")
	}
	if err := s.jobRepo.Delete(ctx, jobID); err != nil {
		return err
	}
	_ = s.cache.InvalidateJobsCache(ctx)
	_ = s.cache.InvalidateSearchJobsCache(ctx)
	return nil
}

// notifyMatchingWorkers sends NEW_JOB notifications to workers whose profile matches the job.
// This runs in a goroutine (fire-and-forget) so it doesn't block the API response.
func (s *JobServiceV2) notifyMatchingWorkers(ctx context.Context, job *dto.JobResponse) {
	// In production this would query workers matching job.JobRole / job.City
	// For now we log the intent — the notification infrastructure is wired up.
	workers, err := s.workerRepo.ListActive(ctx)
	if err != nil {
		return
	}

	title := "New Job Available"
	message := fmt.Sprintf("A new %s position is available in %s. Check it out!", job.JobRole, job.City)

	for _, w := range workers {
		_ = s.notificationSvc.CreateNotification(
			ctx,
			w.UserID,
			title,
			message,
			models.NotificationTypeJobMatch,
			job.ID,
		)
	}
}
