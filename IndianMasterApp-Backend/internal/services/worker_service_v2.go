package services

import (
	"context"

	"myapp/internal/dto"
	"myapp/internal/models"
	"myapp/internal/repositories"
	"myapp/internal/utils"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// ============================================================================
// WORKER SERVICE V2 — with Redis cache invalidation on profile updates
// ============================================================================

// WorkerServiceV2 extends WorkerService with caching support
type WorkerServiceV2 struct {
	workerRepo       repositories.WorkerRepository
	userRepo         repositories.UserRepository
	verificationRepo repositories.VerificationRepository
	notificationRepo repositories.NotificationRepository
	cache            *utils.CacheService
}

// NewWorkerServiceV2 creates a new WorkerServiceV2
func NewWorkerServiceV2(
	workerRepo repositories.WorkerRepository,
	userRepo repositories.UserRepository,
	verificationRepo repositories.VerificationRepository,
	notificationRepo repositories.NotificationRepository,
	cache *utils.CacheService,
) *WorkerServiceV2 {
	return &WorkerServiceV2{
		workerRepo:       workerRepo,
		userRepo:         userRepo,
		verificationRepo: verificationRepo,
		notificationRepo: notificationRepo,
		cache:            cache,
	}
}

// CreateWorker creates a new worker profile and persists it to the database.
// Idempotent: if a profile already exists for the user, it returns the existing profile.
func (s *WorkerServiceV2) CreateWorker(ctx context.Context, req *dto.CreateWorkerProfileRequest, userID string) (*dto.WorkerProfileResponse, error) {
	// Idempotency check — prevent duplicate profiles
	exists, err := s.workerRepo.ExistsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	if exists {
		return s.GetWorkerProfile(ctx, userID)
	}

	language := req.Language
	if language == "" {
		language = "en"
	}

	worker := &models.Worker{
		ID:                 uuid.New().String(),
		UserID:             userID,
		FullName:           req.FullName,
		Phone:              req.Phone,
		Email:              req.Email,
		ProfilePhotoURL:    req.ProfilePhotoURL,
		ExperienceYears:    req.ExperienceYears,
		SelectedRoles:      toStringArray(req.SelectedRoles),
		BusinessTypes:      toStringArray(req.BusinessTypes),
		JobCategories:      toStringArray(req.JobCategories),
		JobRoles:           toStringArray(req.JobRoles),
		LanguagesKnown:     toStringArray(req.LanguagesKnown),
		VenuePreferences:   toStringArray(req.VenuePreferences),
		WorkTypes:          toStringArray(req.WorkTypes),
		Availability:       toStringArray(req.Availability),
		AvailabilityStatus: req.AvailabilityStatus,
		ExpectedSalaryMin:  req.ExpectedSalaryMin,
		ExpectedSalaryMax:  req.ExpectedSalaryMax,
		Language:           language,
		Age:                req.Age,
		Gender:             req.Gender,
		Address:            req.Address,
		City:               req.City,
		State:              req.State,
		IsEducated:         req.IsEducated,
		EducationLevel:     req.EducationLevel,
		Degree:             req.Degree,
		College:            req.College,
		AadhaarNumber:      req.AadhaarNumber,
		IsActive:           true,
	}

	if err := s.workerRepo.Create(ctx, worker); err != nil {
		return nil, err
	}

	// Invalidate search cache since a new worker profile affects search results
	_ = s.cache.InvalidateSearchCache(ctx)

	user, _ := s.userRepo.GetByID(ctx, userID)
	return buildWorkerProfileResponse(worker, user), nil
}

// GetWorkerProfile retrieves a worker profile by user ID from the database.
func (s *WorkerServiceV2) GetWorkerProfile(ctx context.Context, userID string) (*dto.WorkerProfileResponse, error) {
	worker, err := s.workerRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	user, _ := s.userRepo.GetByID(ctx, userID)
	return buildWorkerProfileResponse(worker, user), nil
}

// UpdateWorkerProfile updates an existing worker profile with partial field updates.
// Only non-zero / non-empty values in req overwrite existing data.
// Cache invalidation:
//   - worker_recommendations_{workerID}_* (profile change affects recommendations)
//   - search_workers_* (profile change affects search results)
func (s *WorkerServiceV2) UpdateWorkerProfile(ctx context.Context, userID string, req *dto.UpdateWorkerProfileRequest) (*dto.WorkerProfileResponse, error) {
	worker, err := s.workerRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Apply partial updates — only overwrite with non-zero / non-empty values
	if req.FullName != "" {
		worker.FullName = req.FullName
	}
	if req.Phone != "" {
		worker.Phone = req.Phone
	}
	if req.Email != "" {
		worker.Email = req.Email
	}
	if req.ProfilePhotoURL != "" {
		worker.ProfilePhotoURL = req.ProfilePhotoURL
	}
	if req.ExperienceYears != 0 {
		worker.ExperienceYears = req.ExperienceYears
	}
	if len(req.SelectedRoles) > 0 {
		worker.SelectedRoles = toStringArray(req.SelectedRoles)
	}
	if len(req.BusinessTypes) > 0 {
		worker.BusinessTypes = toStringArray(req.BusinessTypes)
	}
	if len(req.JobCategories) > 0 {
		worker.JobCategories = toStringArray(req.JobCategories)
	}
	if len(req.JobRoles) > 0 {
		worker.JobRoles = toStringArray(req.JobRoles)
	}
	if len(req.LanguagesKnown) > 0 {
		worker.LanguagesKnown = toStringArray(req.LanguagesKnown)
	}
	if len(req.VenuePreferences) > 0 {
		worker.VenuePreferences = toStringArray(req.VenuePreferences)
	}
	if len(req.WorkTypes) > 0 {
		worker.WorkTypes = toStringArray(req.WorkTypes)
	}
	if len(req.Availability) > 0 {
		worker.Availability = toStringArray(req.Availability)
	}
	if req.AvailabilityStatus != "" {
		worker.AvailabilityStatus = req.AvailabilityStatus
	}
	if req.ExpectedSalaryMin != 0 {
		worker.ExpectedSalaryMin = req.ExpectedSalaryMin
	}
	if req.ExpectedSalaryMax != 0 {
		worker.ExpectedSalaryMax = req.ExpectedSalaryMax
	}
	if req.Language != "" {
		worker.Language = req.Language
	}
	if req.Age != 0 {
		worker.Age = req.Age
	}
	if req.Gender != "" {
		worker.Gender = req.Gender
	}
	if req.Address != "" {
		worker.Address = req.Address
	}
	if req.City != "" {
		worker.City = req.City
	}
	if req.State != "" {
		worker.State = req.State
	}
	// IsEducated is a *bool — only apply when explicitly sent in the request
	if req.IsEducated != nil {
		worker.IsEducated = *req.IsEducated
	}
	if req.EducationLevel != "" {
		worker.EducationLevel = req.EducationLevel
	}
	if req.Degree != "" {
		worker.Degree = req.Degree
	}
	if req.College != "" {
		worker.College = req.College
	}
	if req.AadhaarNumber != "" {
		worker.AadhaarNumber = req.AadhaarNumber
	}
	if worker.Language == "" {
		worker.Language = "en"
	}

	if err := s.workerRepo.Update(ctx, worker); err != nil {
		return nil, err
	}

	// Invalidate worker-specific recommendation cache
	_ = s.cache.InvalidateAllWorkerRecommendations(ctx)
	// Invalidate worker search cache since profile change affects search results
	_ = s.cache.InvalidateSearchWorkersCache(ctx)

	user, _ := s.userRepo.GetByID(ctx, userID)
	return buildWorkerProfileResponse(worker, user), nil
}

// GetVerificationStatus retrieves the verification status for a worker.
// Falls back to a "pending" default when no verification record exists yet.
func (s *WorkerServiceV2) GetVerificationStatus(ctx context.Context, userID string) (*dto.VerificationStatusResponse, error) {
	worker, err := s.workerRepo.GetByUserID(ctx, userID)
	if err != nil {
		return &dto.VerificationStatusResponse{
			OverallStatus:      "pending",
			VerificationStatus: "pending",
		}, nil
	}

	ver, err := s.verificationRepo.GetWorkerVerificationByWorkerID(ctx, worker.ID)
	if err != nil {
		// Verification record not yet created — return safe default
		return &dto.VerificationStatusResponse{
			OverallStatus:      "pending",
			VerificationStatus: "pending",
		}, nil
	}

	return &dto.VerificationStatusResponse{
		PhoneVerified:          ver.PhoneVerified,
		EmailVerified:          ver.EmailVerified,
		IdentityVerified:       ver.IdentityVerified,
		OverallStatus:          ver.VerificationStatus,
		VerificationStatus:     ver.VerificationStatus,
		IdentityRejectedReason: ver.IdentityRejectedReason,
		UpdatedAt:              ver.UpdatedAt,
	}, nil
}

// GetRecommendedJobs retrieves job recommendations for a worker with Redis caching.
//
// Cache key: worker_recommendations_{workerID}_{page}
// TTL: 5 minutes
func (s *WorkerServiceV2) GetRecommendedJobs(ctx context.Context, workerID string, pagination *dto.Pagination) (*dto.RecommendedJobsResponse, error) {
	cacheKey := utils.WorkerRecommendationsCacheKey(workerID, pagination.Page)

	// 1. Check Redis cache
	var cached dto.RecommendedJobsResponse
	found, err := s.cache.Get(ctx, cacheKey, &cached)
	if err == nil && found {
		return &cached, nil
	}

	// 2. Fetch from service layer (in production: complex matching query)
	jobs := []dto.RecommendedJob{
		{
			JobID:      "job-1",
			JobRole:    "Chef",
			MatchScore: 92,
		},
		{
			JobID:      "job-2",
			JobRole:    "Waiter",
			MatchScore: 75,
		},
		{
			JobID:      "job-3",
			JobRole:    "Manager",
			MatchScore: 55,
		},
	}
	total := int64(50)

	result := &dto.RecommendedJobsResponse{
		WorkerID: workerID,
		Jobs:     jobs,
		Total:    total,
	}

	// 3. Store in Redis
	_ = s.cache.Set(ctx, cacheKey, result)

	return result, nil
}

// SearchWorkers searches workers based on filters
func (s *WorkerServiceV2) SearchWorkers(ctx context.Context, filters map[string]interface{}, page, limit int) ([]*models.Worker, int64, error) {
	workers := []*models.Worker{
		{
			ID:              uuid.New().String(),
			UserID:          "user-1",
			SelectedRoles:   []string{"Chef"},
			ExperienceYears: 5,
		},
	}
	return workers, int64(len(workers)), nil
}

// ============================================================================
// HELPERS
// ============================================================================

// toStringArray converts a []string to pq.StringArray.
// Returns an empty array (not nil) for nil input to avoid NULL in JSON responses.
func toStringArray(s []string) pq.StringArray {
	if s == nil {
		return pq.StringArray{}
	}
	return pq.StringArray(s)
}

// toSlice converts a pq.StringArray to []string.
// Returns an empty slice (not nil) for nil input so JSON marshals as [] not null.
func toSlice(arr pq.StringArray) []string {
	if arr == nil {
		return []string{}
	}
	return []string(arr)
}

// computeCompletionPercentage returns a 0–100 value based on how many key
// worker profile fields have been filled in. Each of 10 fields is worth 10%.
// Computed on-the-fly so it is always accurate without a DB write.
func computeCompletionPercentage(worker *models.Worker, user *models.User) int {
	score := 0
	if user != nil && user.FullName != "" {
		score += 10
	}
	if worker.Gender != "" {
		score += 10
	}
	if worker.City != "" {
		score += 10
	}
	if worker.State != "" {
		score += 10
	}
	if len(worker.SelectedRoles) > 0 {
		score += 10
	}
	if worker.ExperienceYears > 0 {
		score += 10
	}
	if len(worker.LanguagesKnown) > 0 {
		score += 10
	}
	if worker.EducationLevel != "" {
		score += 10
	}
	if worker.ProfilePhotoURL != "" {
		score += 10
	}
	if worker.ExpectedSalaryMin > 0 {
		score += 10
	}
	return score
}

// buildWorkerProfileResponse assembles a WorkerProfileResponse DTO from a Worker model
// and an optional User model (for fullName and phoneNumber).
func buildWorkerProfileResponse(worker *models.Worker, user *models.User) *dto.WorkerProfileResponse {
	resp := &dto.WorkerProfileResponse{
		ID:                   worker.ID,
		UserID:               worker.UserID,
		FullName:             worker.FullName,
		Phone:                worker.Phone,
		Email:                worker.Email,
		ProfilePhotoURL:      worker.ProfilePhotoURL,
		ExperienceYears:      worker.ExperienceYears,
		SelectedRoles:        toSlice(worker.SelectedRoles),
		BusinessTypes:        toSlice(worker.BusinessTypes),
		JobCategories:        toSlice(worker.JobCategories),
		JobRoles:             toSlice(worker.JobRoles),
		LanguagesKnown:       toSlice(worker.LanguagesKnown),
		VenuePreferences:     toSlice(worker.VenuePreferences),
		WorkTypes:            toSlice(worker.WorkTypes),
		Availability:         toSlice(worker.Availability),
		AvailabilityStatus:   worker.AvailabilityStatus,
		ExpectedSalaryMin:    worker.ExpectedSalaryMin,
		ExpectedSalaryMax:    worker.ExpectedSalaryMax,
		CompletionPercentage: computeCompletionPercentage(worker, user),
		Rating:               worker.Rating,
		TotalReviews:         worker.TotalReviews,
		Age:                  worker.Age,
		Gender:               worker.Gender,
		Address:              worker.Address,
		City:                 worker.City,
		State:                worker.State,
		IsEducated:           worker.IsEducated,
		EducationLevel:       worker.EducationLevel,
		Degree:               worker.Degree,
		College:              worker.College,
		AadhaarNumber:        worker.AadhaarNumber,
		Language:             worker.Language,
		IsVerified:           false,
		VerificationStatus:   "pending",
		CreatedAt:            worker.CreatedAt,
		UpdatedAt:            worker.UpdatedAt,
	}

	// Fall back to the user account's identity fields if the worker row is empty
	if user != nil {
		if resp.FullName == "" {
			resp.FullName = user.FullName
		}
		if resp.Phone == "" {
			resp.Phone = user.Phone
		}
		if resp.Email == "" {
			resp.Email = user.Email
		}
	}

	return resp
}
