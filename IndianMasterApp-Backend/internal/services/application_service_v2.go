package services

import (
	"context"
	"fmt"

	"myapp/internal/dto"
	"myapp/internal/models"
	"myapp/internal/repositories"
	"myapp/internal/utils"

	"github.com/google/uuid"
)

// ============================================================================
// APPLICATION SERVICE V2 — with notification triggers + cache invalidation
// ============================================================================

// ApplicationServiceV2 handles job applications with notification support
type ApplicationServiceV2 struct {
	applicationRepo  repositories.ApplicationRepository
	jobRepo          repositories.JobRepository
	businessRepo     repositories.BusinessRepository
	workerRepo       repositories.WorkerRepository
	userRepo         repositories.UserRepository
	verificationRepo repositories.VerificationRepository
	notificationSvc  *NotificationServiceV2
	auditRepo        repositories.AuditRepository
	cache            *utils.CacheService
}

// NewApplicationServiceV2 creates a new ApplicationServiceV2
func NewApplicationServiceV2(
	applicationRepo repositories.ApplicationRepository,
	jobRepo repositories.JobRepository,
	businessRepo repositories.BusinessRepository,
	workerRepo repositories.WorkerRepository,
	userRepo repositories.UserRepository,
	verificationRepo repositories.VerificationRepository,
	notificationSvc *NotificationServiceV2,
	auditRepo repositories.AuditRepository,
	cache *utils.CacheService,
) *ApplicationServiceV2 {
	return &ApplicationServiceV2{
		applicationRepo:  applicationRepo,
		jobRepo:          jobRepo,
		businessRepo:     businessRepo,
		workerRepo:       workerRepo,
		userRepo:         userRepo,
		verificationRepo: verificationRepo,
		notificationSvc:  notificationSvc,
		auditRepo:        auditRepo,
		cache:            cache,
	}
}

// ApplyToJob creates a job application and notifies the hirer.
//
// Trigger: Worker applies for a job → notify hirer
func (s *ApplicationServiceV2) ApplyToJob(ctx context.Context, jobID, workerUserID string) (*dto.ApplicationResponse, error) {
	// Duplicate check — worker_id in applications table is the user ID
	exists, err := s.applicationRepo.ExistsByJobAndWorker(ctx, jobID, workerUserID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, fmt.Errorf("DuplicateApplication")
	}

	application := &models.Application{
		ID:       uuid.New().String(),
		JobID:    jobID,
		WorkerID: workerUserID,
		Status:   models.ApplicationStatusPending,
	}

	if err := s.applicationRepo.Create(ctx, application); err != nil {
		return nil, err
	}

	app := &dto.ApplicationResponse{
		ID:        application.ID,
		JobID:     application.JobID,
		WorkerID:  application.WorkerID,
		Status:    application.Status,
		AppliedAt: application.AppliedAt,
		UpdatedAt: application.UpdatedAt,
	}

	// Invalidate worker recommendations cache (application changes relevance)
	_ = s.cache.InvalidateAllWorkerRecommendations(ctx)

	// Notify hirer: "A worker applied to your job"
	go s.notifyHirerOnApplication(context.Background(), jobID, workerUserID, app.ID)

	return app, nil
}

// GetApplicationsByWorker returns paginated applications for a worker
func (s *ApplicationServiceV2) GetApplicationsByWorker(ctx context.Context, workerID string, page, limit int) ([]dto.ApplicationResponse, int64, error) {
	all, err := s.applicationRepo.GetByWorkerID(ctx, workerID)
	if err != nil {
		return nil, 0, err
	}

	total := int64(len(all))

	start := (page - 1) * limit
	if start < 0 {
		start = 0
	}
	if start >= len(all) {
		return []dto.ApplicationResponse{}, total, nil
	}
	end := start + limit
	if end > len(all) {
		end = len(all)
	}
	paged := all[start:end]

	result := make([]dto.ApplicationResponse, len(paged))
	for i, a := range paged {
		result[i] = dto.ApplicationResponse{
			ID:        a.ID,
			JobID:     a.JobID,
			WorkerID:  a.WorkerID,
			Status:    a.Status,
			AppliedAt: a.AppliedAt,
			UpdatedAt: a.UpdatedAt,
		}
	}
	return result, total, nil
}

// UpdateApplicationStatus updates the status of an application and notifies the worker.
//
// Triggers:
//   - Hirer accepts worker  → notify worker (APP_STATUS_CHANGE: accepted)
//   - Hirer rejects worker  → notify worker (APP_STATUS_CHANGE: rejected)
//   - Any status change     → notify worker
func (s *ApplicationServiceV2) UpdateApplicationStatus(ctx context.Context, applicationID, status, adminID string) error {
	if err := s.applicationRepo.UpdateStatus(ctx, applicationID, status); err != nil {
		return err
	}
	// Notify worker about the status change (fire-and-forget)
	go s.notifyWorkerOnStatusChange(context.Background(), applicationID, status)
	return nil
}

// ============================================================================
// INTERNAL NOTIFICATION HELPERS
// ============================================================================

// notifyHirerOnApplication notifies the hirer when a worker applies to their job.
// Lookup path: jobID → jobs.business_id → businesses.owner_id (= hirer's users.id)
func (s *ApplicationServiceV2) notifyHirerOnApplication(ctx context.Context, jobID, _ /* workerUserID */, applicationID string) {
	job, err := s.jobRepo.GetByID(ctx, jobID)
	if err != nil {
		return
	}

	business, err := s.businessRepo.GetByID(ctx, job.BusinessID)
	if err != nil {
		return
	}

	hirerUserID := business.OwnerID

	title := "New Job Application"
	message := fmt.Sprintf(
		"A worker has applied to your job posting. Application ID: %s",
		applicationID,
	)

	_ = s.notificationSvc.CreateNotification(
		ctx,
		hirerUserID,
		title,
		message,
		models.NotificationTypeNewApplication,
		applicationID,
	)
}

// notifyWorkerOnStatusChange notifies the worker when their application status changes.
// Lookup path: applicationID → applications.worker_id (= worker's users.id)
func (s *ApplicationServiceV2) notifyWorkerOnStatusChange(ctx context.Context, applicationID, status string) {
	application, err := s.applicationRepo.GetByID(ctx, applicationID)
	if err != nil {
		return
	}

	workerUserID := application.WorkerID

	var title, message, notifType string

	switch status {
	case models.ApplicationStatusAccepted:
		title = "Application Accepted!"
		message = fmt.Sprintf("Congratulations! Your job application has been accepted. Application ID: %s", applicationID)
		notifType = models.NotificationTypeAppStatusChange
	case models.ApplicationStatusRejected:
		title = "Application Update"
		message = fmt.Sprintf("Your job application status has been updated to: %s. Application ID: %s", status, applicationID)
		notifType = models.NotificationTypeAppStatusChange
	default:
		title = "Application Status Updated"
		message = fmt.Sprintf("Your application status changed to: %s", status)
		notifType = models.NotificationTypeAppStatusChange
	}

	_ = s.notificationSvc.CreateNotification(
		ctx,
		workerUserID,
		title,
		message,
		notifType,
		applicationID,
	)
}
