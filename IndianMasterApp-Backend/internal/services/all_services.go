package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	apperrors "myapp/internal/errors"
	"myapp/internal/dto"
	"myapp/internal/models"
	"myapp/internal/repositories"

	"github.com/google/uuid"
)

// ============================================================================
// WORKER SERVICE
// ============================================================================

type WorkerService struct {
	workerRepo       repositories.WorkerRepository
	userRepo         repositories.UserRepository
	verificationRepo repositories.VerificationRepository
	notificationRepo repositories.NotificationRepository
}

func NewWorkerService(
	workerRepo repositories.WorkerRepository,
	userRepo repositories.UserRepository,
	verificationRepo repositories.VerificationRepository,
	notificationRepo repositories.NotificationRepository,
) *WorkerService {
	return &WorkerService{
		workerRepo:       workerRepo,
		userRepo:         userRepo,
		verificationRepo: verificationRepo,
		notificationRepo: notificationRepo,
	}
}

func (s *WorkerService) CreateWorker(ctx context.Context, req *dto.CreateWorkerProfileRequest, userID string) (*models.Worker, error) {
	worker := &models.Worker{
		ID:                 uuid.New().String(),
		UserID:             userID,
		ProfilePhotoURL:    req.ProfilePhotoURL,
		ExperienceYears:    req.ExperienceYears,
		SelectedRoles:      req.SelectedRoles,
		BusinessTypes:      req.BusinessTypes,
		JobCategories:      req.JobCategories,
		JobRoles:           req.JobRoles,
		LanguagesKnown:     req.LanguagesKnown,
		VenuePreferences:   req.VenuePreferences,
		WorkTypes:          req.WorkTypes,
		Availability:       req.Availability,
		AvailabilityStatus: req.AvailabilityStatus,
		ExpectedSalaryMin:  req.ExpectedSalaryMin,
		ExpectedSalaryMax:  req.ExpectedSalaryMax,
		Language:           req.Language,
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

	return worker, nil
}

func (s *WorkerService) GetWorkerProfile(ctx context.Context, userID string) (*models.Worker, error) {
	return s.workerRepo.GetByUserID(ctx, userID)
}

func (s *WorkerService) UpdateWorkerProfile(ctx context.Context, userID string, req *dto.UpdateWorkerProfileRequest) (*models.Worker, error) {
	worker, err := s.workerRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	worker.ProfilePhotoURL = req.ProfilePhotoURL
	worker.ExperienceYears = req.ExperienceYears
	worker.SelectedRoles = req.SelectedRoles
	worker.BusinessTypes = req.BusinessTypes
	worker.JobCategories = req.JobCategories
	worker.JobRoles = req.JobRoles
	worker.LanguagesKnown = req.LanguagesKnown
	worker.VenuePreferences = req.VenuePreferences
	worker.WorkTypes = req.WorkTypes
	worker.Availability = req.Availability
	worker.AvailabilityStatus = req.AvailabilityStatus
	worker.ExpectedSalaryMin = req.ExpectedSalaryMin
	worker.ExpectedSalaryMax = req.ExpectedSalaryMax
	worker.Language = req.Language
	worker.Age = req.Age
	worker.Gender = req.Gender
	worker.Address = req.Address
	worker.City = req.City
	worker.State = req.State
	if req.IsEducated != nil {
		worker.IsEducated = *req.IsEducated
	}
	worker.EducationLevel = req.EducationLevel
	worker.Degree = req.Degree
	worker.College = req.College
	worker.AadhaarNumber = req.AadhaarNumber

	if err := s.workerRepo.Update(ctx, worker); err != nil {
		return nil, err
	}

	return worker, nil
}

func (s *WorkerService) GetVerificationStatus(ctx context.Context, userID string) (*dto.VerificationStatusResponse, error) {
	return &dto.VerificationStatusResponse{
		PhoneVerified:    true,
		EmailVerified:    true,
		IdentityVerified: false,
		OverallStatus:    "pending",
	}, nil
}

// GetRecommendedJobs retrieves job recommendations for a worker based on matching criteria
func (s *WorkerService) GetRecommendedJobs(ctx context.Context, workerID string, pagination *dto.Pagination) (*dto.RecommendedJobsResponse, error) {
	// For now, return mock data with matching scores
	// In production, this would query the database with complex matching logic

	jobs := []dto.RecommendedJob{
		{
			JobID:      "job-1",
			JobRole:    "Chef",
			MatchScore: 92, // Role match (40) + Location match (20) + Salary match (15) + Language match (15) + Experience match (2)
		},
		{
			JobID:      "job-2",
			JobRole:    "Waiter",
			MatchScore: 75, // Role match (40) + Location match (20) + Salary match (15)
		},
		{
			JobID:      "job-3",
			JobRole:    "Manager",
			MatchScore: 55, // Role match (40) + Location match (20) - Salary mismatch (-5)
		},
	}

	// Mock total count
	total := int64(50)

	return &dto.RecommendedJobsResponse{
		WorkerID: workerID,
		Jobs:     jobs,
		Total:    total,
	}, nil
}

func (s *WorkerService) SearchWorkers(ctx context.Context, filters map[string]interface{}, page, limit int) ([]*models.Worker, int64, error) {
	// Search workers based on filters (role, experience, city, etc.)
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
// JOB SERVICE
// ============================================================================

type JobService struct {
	jobRepo      repositories.JobRepository
	businessRepo repositories.BusinessRepository
	auditRepo    repositories.AuditRepository
}

func NewJobService(
	jobRepo repositories.JobRepository,
	businessRepo repositories.BusinessRepository,
	auditRepo repositories.AuditRepository,
) *JobService {
	return &JobService{
		jobRepo:      jobRepo,
		businessRepo: businessRepo,
		auditRepo:    auditRepo,
	}
}

func (s *JobService) CreateJob(ctx context.Context, req *dto.CreateJobRequest, hirerID string) (*dto.JobResponse, error) {
	job := &dto.JobResponse{
		ID:              uuid.New().String(),
		BusinessID:      req.BusinessID,
		JobRole:         req.JobRole,
		Position:        req.Position,
		SalaryMinAmount: req.SalaryMinAmount,
		SalaryMaxAmount: req.SalaryMaxAmount,
		ExperienceMin:   req.ExperienceMin,
		ExperienceMax:   req.ExperienceMax,
		Vacancies:       req.Vacancies,
		WorkingHours:    req.WorkingHours,
		WeeklyLeaves:    req.WeeklyLeaves,
		Benefits:        req.Benefits,
		WorkType:        req.WorkType,
		City:            req.City,
		State:           req.State,
	}
	return job, nil
}

func (s *JobService) GetJobsFeed(ctx context.Context, filters map[string]interface{}, page, limit int) ([]dto.JobResponse, int64, error) {
	totalJobs := int64(100)
	jobs := []dto.JobResponse{
		{
			ID:              uuid.New().String(),
			JobRole:         "Chef",
			Position:        "Senior Chef",
			SalaryMinAmount: 30000,
			SalaryMaxAmount: 50000,
			Vacancies:       5,
			City:            "Mumbai",
		},
	}
	return jobs, totalJobs, nil
}

func (s *JobService) GetJobByID(ctx context.Context, jobID string) (*dto.JobResponse, error) {
	job := &dto.JobResponse{
		ID:              jobID,
		JobRole:         "Chef",
		Position:        "Senior Chef",
		SalaryMinAmount: 30000,
		SalaryMaxAmount: 50000,
		Vacancies:       5,
		City:            "Mumbai",
	}
	return job, nil
}

func (s *JobService) UpdateJob(ctx context.Context, jobID string, req *dto.UpdateJobRequest, adminID string) (*dto.JobResponse, error) {
	job := &dto.JobResponse{
		ID:       jobID,
		Position: req.Position,
		Status:   req.Status,
	}
	return job, nil
}

// ============================================================================
// APPLICATION SERVICE
// ============================================================================

type ApplicationService struct {
	applicationRepo  repositories.ApplicationRepository
	jobRepo          repositories.JobRepository
	verificationRepo repositories.VerificationRepository
	notificationRepo repositories.NotificationRepository
	auditRepo        repositories.AuditRepository
}

func NewApplicationService(
	applicationRepo repositories.ApplicationRepository,
	jobRepo repositories.JobRepository,
	verificationRepo repositories.VerificationRepository,
	notificationRepo repositories.NotificationRepository,
	auditRepo repositories.AuditRepository,
) *ApplicationService {
	return &ApplicationService{
		applicationRepo:  applicationRepo,
		jobRepo:          jobRepo,
		verificationRepo: verificationRepo,
		notificationRepo: notificationRepo,
		auditRepo:        auditRepo,
	}
}

func (s *ApplicationService) ApplyToJob(ctx context.Context, jobID, workerID string) (*dto.ApplicationResponse, error) {
	app := &dto.ApplicationResponse{
		ID:       uuid.New().String(),
		JobID:    jobID,
		WorkerID: workerID,
		Status:   "applied",
	}
	return app, nil
}

func (s *ApplicationService) GetApplicationsByWorker(ctx context.Context, workerID string, page, limit int) ([]dto.ApplicationResponse, int64, error) {
	applications := []dto.ApplicationResponse{
		{
			ID:       uuid.New().String(),
			JobID:    uuid.New().String(),
			WorkerID: workerID,
			Status:   "applied",
		},
	}
	return applications, 10, nil
}

func (s *ApplicationService) UpdateApplicationStatus(ctx context.Context, applicationID, status, adminID string) error {
	return nil
}

// ============================================================================
// CHAT SERVICE
// ============================================================================

type ChatService struct {
	chatRepo        repositories.ChatRepository
	notificationSvc *NotificationServiceV2
	userRepo        repositories.UserRepository
	businessRepo    repositories.BusinessRepository
}

func NewChatService(chatRepo repositories.ChatRepository, notificationSvc *NotificationServiceV2, userRepo repositories.UserRepository, businessRepo repositories.BusinessRepository) *ChatService {
	return &ChatService{chatRepo: chatRepo, notificationSvc: notificationSvc, userRepo: userRepo, businessRepo: businessRepo}
}

func buildChatThreadDTO(t *models.ChatThread) *dto.ChatThreadResponse {
	return &dto.ChatThreadResponse{
		ID:                 t.ID,
		WorkerID:           t.WorkerID,
		HirerID:            t.HirerID,
		JobID:              t.JobID,
		LastMessageAt:      t.LastMessageAt,
		IsArchived:         t.IsArchived,
		UnreadCount:        t.UnreadCount,
		HirerName:          t.HirerName,
		WorkerName:         t.WorkerName,
		LastMessagePreview: t.LastMessagePreview,
		CreatedAt:          t.CreatedAt,
	}
}

// GetThreadByID returns a chat thread by its ID for participant validation.
func (s *ChatService) GetThreadByID(ctx context.Context, threadID string) (*models.ChatThread, error) {
	return s.chatRepo.GetChatThreadByID(ctx, threadID)
}

func (s *ChatService) GetOrCreateChatThread(ctx context.Context, workerID, hirerID, jobID string) (*dto.ChatThreadResponse, error) {
	existing, err := s.chatRepo.GetChatThreadByComposite(ctx, workerID, hirerID, jobID)
	if err == nil {
		return buildChatThreadDTO(existing), nil
	}

	thread := &models.ChatThread{
		ID:       uuid.New().String(),
		WorkerID: workerID,
		HirerID:  hirerID,
		JobID:    jobID,
	}
	if createErr := s.chatRepo.CreateChatThread(ctx, thread); createErr != nil {
		// Race condition: another request created it first
		existing, getErr := s.chatRepo.GetChatThreadByComposite(ctx, workerID, hirerID, jobID)
		if getErr != nil {
			return nil, createErr
		}
		return buildChatThreadDTO(existing), nil
	}
	return buildChatThreadDTO(thread), nil
}

func (s *ChatService) SendMessage(ctx context.Context, threadID, senderID string, req *dto.SendChatMessageRequest) (*dto.ChatMessageResponse, error) {
	// Validate reply_to: if provided, the target must belong to the same thread.
	var replyToID *string
	var replyToText *string
	var replyToSenderID *string
	if req.ReplyToMessageID != "" {
		original, err := s.chatRepo.GetChatMessageByID(ctx, req.ReplyToMessageID)
		if err != nil || original.ThreadID != threadID {
			return nil, fmt.Errorf("reply_to_message_id not found in this thread")
		}
		replyToID = &req.ReplyToMessageID
		replyToText = &original.MessageText
		replyToSenderID = &original.SenderID
	}

	msg := &models.ChatMessage{
		ID:               uuid.New().String(),
		ThreadID:         threadID,
		SenderID:         senderID,
		MessageText:      req.MessageText,
		AttachmentURLs:   req.AttachmentURLs,
		ReplyToMessageID: replyToID,
	}
	if err := s.chatRepo.CreateChatMessage(ctx, msg); err != nil {
		return nil, err
	}
	// Update thread's last_message_at so the conversation list sorts correctly.
	// Non-fatal — message is already persisted.
	_ = s.chatRepo.UpdateChatThreadLastMessage(ctx, threadID)
	// Update caller's last_seen for presence tracking. Fire-and-forget.
	_ = s.chatRepo.UpdateUserLastSeen(ctx, senderID)
	// Notify the other participant. Fire-and-forget — never blocks or fails the send.
	if s.notificationSvc != nil {
		go func() {
			thread, err := s.chatRepo.GetChatThreadByID(context.Background(), threadID)
			if err != nil {
				return
			}
			receiverID := thread.HirerID
			if senderID == thread.HirerID {
				receiverID = thread.WorkerID
			}
			// Resolve the sender's display name for the notification title.
			// For hirers, prefer the business name (same as what workers see in chat
			// thread list). Fall back to user full_name, then "Someone".
			senderName := "Someone"
			if s.userRepo != nil {
				if sender, err := s.userRepo.GetByID(context.Background(), senderID); err == nil {
					senderName = sender.FullName // may be placeholder "User XXXX"
					if sender.Role == "HIRER" && s.businessRepo != nil {
						if biz, berr := s.businessRepo.GetFirstByOwnerID(context.Background(), senderID); berr == nil {
							if biz.BusinessName != "" {
								senderName = biz.BusinessName
							}
						}
					}
				}
			}
			preview := msg.MessageText
			if len(preview) > 80 {
				preview = preview[:80] + "…"
			}
			// UpsertChatNotification groups all messages in the same thread under
			// a single notification entry, incrementing unread_count rather than
			// inserting a new row every time. This mirrors WhatsApp-style grouping.
			_ = s.notificationSvc.UpsertChatNotification(
				context.Background(),
				receiverID,
				threadID,
				senderName,
				preview,
			)
		}()
	}

	attachments := []string(msg.AttachmentURLs)
	if attachments == nil {
		attachments = []string{}
	}
	return &dto.ChatMessageResponse{
		ID:               msg.ID,
		ThreadID:         msg.ThreadID,
		SenderID:         msg.SenderID,
		MessageText:      msg.MessageText,
		AttachmentURLs:   attachments,
		IsRead:           false,
		ReplyToMessageID: replyToID,
		ReplyToText:      replyToText,
		ReplyToSenderID:  replyToSenderID,
		CreatedAt:        msg.CreatedAt,
	}, nil
}

// GetChatMessages fetches paginated messages and marks them as delivered for the requester.
// requesterID is used to fire-and-forget delivery marking (single→double tick transition).
func (s *ChatService) GetChatMessages(ctx context.Context, threadID, requesterID string, page, limit int) ([]dto.ChatMessageResponse, int64, error) {
	msgs, total, err := s.chatRepo.GetChatMessages(ctx, threadID, page, limit)
	if err != nil {
		return nil, 0, err
	}

	// Mark incoming messages as delivered asynchronously.
	// This is what promotes single tick → double tick for the sender.
	if requesterID != "" {
		go func() {
			_ = s.chatRepo.MarkThreadMessagesAsDelivered(context.Background(), threadID, requesterID)
		}()
	}

	result := make([]dto.ChatMessageResponse, 0, len(msgs))
	for _, m := range msgs {
		attachments := []string(m.AttachmentURLs)
		if attachments == nil {
			attachments = []string{}
		}
		result = append(result, dto.ChatMessageResponse{
			ID:               m.ID,
			ThreadID:         m.ThreadID,
			SenderID:         m.SenderID,
			MessageText:      m.MessageText,
			AttachmentURLs:   attachments,
			IsRead:           m.IsRead,
			ReadAt:           m.ReadAt,
			DeliveredAt:      m.DeliveredAt,
			ReplyToMessageID: m.ReplyToMessageID,
			ReplyToText:      m.ReplyToText,
			ReplyToSenderID:  m.ReplyToSenderID,
			CreatedAt:        m.CreatedAt,
		})
	}
	return result, total, nil
}

func (s *ChatService) MarkThreadAsRead(ctx context.Context, threadID, userID string) error {
	// Update caller's last_seen — they're active. Fire-and-forget.
	_ = s.chatRepo.UpdateUserLastSeen(ctx, userID)
	return s.chatRepo.MarkThreadMessagesAsRead(ctx, threadID, userID)
}

// GetThreadPresence returns whether the OTHER participant is online.
// A user is considered online if their last_seen is within 5 minutes.
func (s *ChatService) GetThreadPresence(ctx context.Context, threadID, callerID string) (*dto.PresenceResponse, error) {
	lastSeen, err := s.chatRepo.GetOtherUserPresence(ctx, threadID, callerID)
	if err != nil {
		return nil, err
	}
	isOnline := false
	if lastSeen != nil {
		isOnline = time.Since(*lastSeen) < 5*time.Minute
	}
	return &dto.PresenceResponse{IsOnline: isOnline, LastSeen: lastSeen}, nil
}

func (s *ChatService) GetMyThreads(ctx context.Context, userID string, archived bool, page, limit int) ([]dto.ChatThreadResponse, int64, error) {
	threads, total, err := s.chatRepo.GetChatThreadsByUserID(ctx, userID, archived, page, limit)
	if err != nil {
		return nil, 0, err
	}
	result := make([]dto.ChatThreadResponse, 0, len(threads))
	for _, t := range threads {
		result = append(result, *buildChatThreadDTO(t))
	}
	return result, total, nil
}

// ============================================================================
// SUBSCRIPTION SERVICE
// ============================================================================

type SubscriptionService struct {
	subscriptionRepo repositories.SubscriptionRepository
}

func NewSubscriptionService(subscriptionRepo repositories.SubscriptionRepository) *SubscriptionService {
	return &SubscriptionService{subscriptionRepo: subscriptionRepo}
}

func (s *SubscriptionService) CreateSubscription(ctx context.Context, userID, planName string, amount float64) (*dto.SubscriptionResponse, error) {
	sub := &dto.SubscriptionResponse{
		ID:       uuid.New().String(),
		PlanName: planName,
		Status:   "active",
		Amount:   amount,
	}
	return sub, nil
}

func (s *SubscriptionService) GetActiveSubscription(ctx context.Context, userID string) (*dto.SubscriptionResponse, error) {
	sub := &dto.SubscriptionResponse{
		ID:       uuid.New().String(),
		PlanName: "Premium",
		Status:   "active",
		Amount:   999.99,
	}
	return sub, nil
}

func (s *SubscriptionService) CheckContactLimit(ctx context.Context, userID string, planLimit int) (bool, int, error) {
	// Returns: hasAvailable (bool), remaining (int), error
	if planLimit > 0 {
		return true, planLimit, nil
	}
	return false, 0, nil
}

func (s *SubscriptionService) IncrementContactUsage(ctx context.Context, userID string) error {
	// Track contact usage increment
	// Implementation would update the subscription usage counter
	return nil
}

// ============================================================================
// ADMIN SERVICE
// ============================================================================

type AdminService struct {
	verificationRepo repositories.VerificationRepository
	auditRepo        repositories.AuditRepository
}

func NewAdminService(verificationRepo repositories.VerificationRepository, auditRepo repositories.AuditRepository) *AdminService {
	return &AdminService{
		verificationRepo: verificationRepo,
		auditRepo:        auditRepo,
	}
}

func (s *AdminService) ApproveVerification(ctx context.Context, entityType, entityID, adminID string) error {
	return nil
}

func (s *AdminService) RejectVerification(ctx context.Context, entityType, entityID, reason, adminID string) error {
	return nil
}

// ============================================================================
// USER SERVICE
// ============================================================================

type UserService struct {
	userRepo repositories.UserRepository
}

func NewUserService(userRepo repositories.UserRepository) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) GetProfile(ctx context.Context, userID string) (*dto.UserResponse, error) {
	return &dto.UserResponse{
		ID:       userID,
		Phone:    "+919876543210",
		Email:    "user@example.com",
		FullName: "Test User",
		Role:     "WORKER",
		IsActive: true,
	}, nil
}

func (s *UserService) UpdateProfile(ctx context.Context, userID string, req *dto.UpdateProfileRequest) (*dto.UserResponse, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if req.FullName != "" {
		user.FullName = req.FullName
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Language != "" {
		user.Language = req.Language
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	return &dto.UserResponse{
		ID:        user.ID,
		Phone:     user.Phone,
		Email:     user.Email,
		FullName:  user.FullName,
		Role:      user.Role,
		Language:  user.Language,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt,
	}, nil
}

func (s *UserService) CreateUser(ctx context.Context, user *models.User) error {
	if user == nil {
		return nil
	}
	return nil
}

func (s *UserService) GetUser(ctx context.Context, userID string) (*models.User, error) {
	return &models.User{
		ID:       userID,
		Phone:    "+919876543210",
		Email:    "user@example.com",
		FullName: "Test User",
		Role:     "WORKER",
		IsActive: true,
	}, nil
}

func (s *UserService) UpdateUser(ctx context.Context, user *models.User) error {
	if user == nil {
		return nil
	}
	return nil
}

func (s *UserService) DeleteUser(ctx context.Context, userID string) error {
	return nil
}

func (s *UserService) ListUsersByRole(ctx context.Context, role string) ([]models.User, error) {
	return []models.User{
		{
			ID:       uuid.New().String(),
			Phone:    "+919876543210",
			Email:    "user@example.com",
			FullName: "Test User",
			Role:     role,
			IsActive: true,
		},
	}, nil
}

func (s *UserService) ListActiveUsers(ctx context.Context) ([]models.User, error) {
	return []models.User{
		{
			ID:       uuid.New().String(),
			Phone:    "+919876543210",
			Email:    "user@example.com",
			FullName: "Test User",
			Role:     "WORKER",
			IsActive: true,
		},
	}, nil
}

// ListUsersByRoleWithPagination retrieves users by role with pagination support
func (s *UserService) ListUsersByRoleWithPagination(ctx context.Context, role string, pagination *dto.Pagination) ([]models.User, int64, error) {
	// For now, return mock data with pagination
	users := []models.User{
		{
			ID:       uuid.New().String(),
			Phone:    "+919876543210",
			Email:    "user@example.com",
			FullName: "Test User",
			Role:     role,
			IsActive: true,
		},
	}

	// Mock total count
	total := int64(100)

	return users, total, nil
}

// ListActiveUsersWithPagination retrieves active users with pagination support
func (s *UserService) ListActiveUsersWithPagination(ctx context.Context, pagination *dto.Pagination) ([]models.User, int64, error) {
	// For now, return mock data with pagination
	users := []models.User{
		{
			ID:       uuid.New().String(),
			Phone:    "+919876543210",
			Email:    "user@example.com",
			FullName: "Test User",
			Role:     "WORKER",
			IsActive: true,
		},
	}

	// Mock total count
	total := int64(50)

	return users, total, nil
}

// ============================================================================
// BUSINESS SERVICE
// ============================================================================

type BusinessService struct {
	businessRepo repositories.BusinessRepository
	userRepo     repositories.UserRepository
}

func NewBusinessService(businessRepo repositories.BusinessRepository, userRepo repositories.UserRepository) *BusinessService {
	return &BusinessService{
		businessRepo: businessRepo,
		userRepo:     userRepo,
	}
}

func (s *BusinessService) CreateBusiness(ctx context.Context, business *models.Business) error {
	if business == nil {
		return nil
	}
	return nil
}

func (s *BusinessService) GetBusiness(ctx context.Context, businessID string) (*dto.BusinessResponse, error) {
	business := &dto.BusinessResponse{
		ID:           businessID,
		BusinessName: "Sample Business",
		BusinessType: "Restaurant",
		City:         "Mumbai",
		State:        "Maharashtra",
		IsActive:     true,
		IsVerified:   true,
	}
	return business, nil
}

func (s *BusinessService) GetBusinessesByOwner(ctx context.Context, ownerID string) ([]models.Business, error) {
	return []models.Business{
		{
			ID:           uuid.New().String(),
			BusinessName: "Sample Business",
			BusinessType: "Restaurant",
			City:         "Mumbai",
		},
	}, nil
}

func (s *BusinessService) UpdateBusiness(ctx context.Context, business *models.Business) error {
	if business == nil {
		return nil
	}
	return nil
}

func (s *BusinessService) DeleteBusiness(ctx context.Context, businessID string) error {
	return nil
}

func (s *BusinessService) ListBusinessesByCity(ctx context.Context, city string) ([]models.Business, error) {
	return []models.Business{
		{
			ID:           uuid.New().String(),
			BusinessName: "Sample Business",
			BusinessType: "Restaurant",
			City:         city,
		},
	}, nil
}

func (s *BusinessService) ListBusinessesByType(ctx context.Context, businessType string) ([]models.Business, error) {
	return []models.Business{
		{
			ID:           uuid.New().String(),
			BusinessName: "Sample Business",
			BusinessType: businessType,
			City:         "Mumbai",
		},
	}, nil
}

func (s *BusinessService) ListActiveBusinesses(ctx context.Context) ([]models.Business, error) {
	return []models.Business{
		{
			ID:           uuid.New().String(),
			BusinessName: "Sample Business",
			BusinessType: "Restaurant",
			City:         "Mumbai",
			IsActive:     true,
		},
	}, nil
}

func (s *BusinessService) ListBusinesses(ctx context.Context, hirerID string) ([]dto.BusinessResponse, error) {
	return []dto.BusinessResponse{
		{
			ID:           uuid.New().String(),
			BusinessName: "Sample Business",
			BusinessType: "Restaurant",
			City:         "Mumbai",
		},
	}, nil
}

// ListBusinessesByCityWithPagination retrieves businesses by city with pagination support
func (s *BusinessService) ListBusinessesByCityWithPagination(ctx context.Context, city string, pagination *dto.Pagination) ([]models.Business, int64, error) {
	// For now, return mock data with pagination
	businesses := []models.Business{
		{
			ID:           uuid.New().String(),
			BusinessName: "Sample Business",
			BusinessType: "Restaurant",
			City:         city,
		},
	}

	// Mock total count
	total := int64(200)

	return businesses, total, nil
}

// GetMyBusiness returns the hirer's business profile by their user ID.
// Returns a not-found error (404) if no profile exists yet.
func (s *BusinessService) GetMyBusiness(ctx context.Context, ownerID string) (*dto.HirerProfileResponse, error) {
	business, err := s.businessRepo.GetFirstByOwnerID(ctx, ownerID)
	if err != nil {
		return nil, err
	}
	return buildHirerProfileResponse(business), nil
}

// UpsertMyBusiness creates or updates the hirer's business profile.
// ownerID is always taken from the JWT — never from the request body.
func (s *BusinessService) UpsertMyBusiness(ctx context.Context, ownerID string, req *dto.HirerProfileRequest) (*dto.HirerProfileResponse, error) {
	businessType := strings.Join(req.BusinessTypes, ",")

	existing, err := s.businessRepo.GetFirstByOwnerID(ctx, ownerID)

	if err != nil {
		// Only treat as "create new" when the record genuinely doesn't exist
		appErr, ok := err.(*apperrors.AppError)
		if !ok || appErr.Code != apperrors.ErrNotFound {
			return nil, err
		}
		// Create new business profile
		business := &models.Business{
			ID:            uuid.New().String(),
			OwnerID:       ownerID,
			BusinessName:  req.BusinessName,
			OwnerName:     req.OwnerName,
			ContactRole:   req.ContactRole,
			BusinessType:  businessType,
			Email:         req.Email,
			MobileNumber:  req.MobileNumber,
			FSAILicense:   req.FSSAILicense,
			GSTNumber:     req.GSTNumber,
			EmployeeCount: req.EmployeeCount,
			City:          req.City,
			State:         req.State,
			Latitude:      req.Latitude,
			Longitude:     req.Longitude,
			IsActive:      true,
			Language:      "en",
		}
		if err := s.businessRepo.Create(ctx, business); err != nil {
			return nil, err
		}
		return buildHirerProfileResponse(business), nil
	}

	// Update existing profile
	existing.BusinessName = req.BusinessName
	existing.OwnerName = req.OwnerName
	existing.ContactRole = req.ContactRole
	existing.BusinessType = businessType
	existing.Email = req.Email
	existing.MobileNumber = req.MobileNumber
	existing.FSAILicense = req.FSSAILicense
	existing.GSTNumber = req.GSTNumber
	existing.EmployeeCount = req.EmployeeCount
	if req.City != "" {
		existing.City = req.City
	}
	if req.State != "" {
		existing.State = req.State
	}
	if req.Latitude != 0 {
		existing.Latitude = req.Latitude
	}
	if req.Longitude != 0 {
		existing.Longitude = req.Longitude
	}
	if err := s.businessRepo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return buildHirerProfileResponse(existing), nil
}

// UpdateMyBusinessLogo sets logo_url on the hirer's business profile.
func (s *BusinessService) UpdateMyBusinessLogo(ctx context.Context, ownerID string, logoURL string) error {
	existing, err := s.businessRepo.GetFirstByOwnerID(ctx, ownerID)
	if err != nil {
		return err
	}
	existing.LogoURL = logoURL
	return s.businessRepo.Update(ctx, existing)
}

func buildHirerProfileResponse(b *models.Business) *dto.HirerProfileResponse {
	var types []string
	if b.BusinessType != "" {
		types = strings.Split(b.BusinessType, ",")
	}
	return &dto.HirerProfileResponse{
		ID:            b.ID,
		OwnerID:       b.OwnerID,
		BusinessName:  b.BusinessName,
		OwnerName:     b.OwnerName,
		ContactRole:   b.ContactRole,
		BusinessTypes: types,
		Email:         b.Email,
		MobileNumber:  b.MobileNumber,
		FSSAILicense:  b.FSAILicense,
		GSTNumber:     b.GSTNumber,
		EmployeeCount: b.EmployeeCount,
		LogoURL:       b.LogoURL,
		City:          b.City,
		State:         b.State,
		Latitude:      b.Latitude,
		Longitude:     b.Longitude,
		CreatedAt:     b.CreatedAt,
		UpdatedAt:     b.UpdatedAt,
	}
}

// ============================================================================
// SEARCH SERVICE
// ============================================================================

type SearchService struct {
	workerService *WorkerService
	jobService    *JobService
}

func NewSearchService(workerService *WorkerService, jobService *JobService) *SearchService {
	return &SearchService{
		workerService: workerService,
		jobService:    jobService,
	}
}

// SearchWorkers performs advanced search on workers with dynamic SQL
func (s *SearchService) SearchWorkers(ctx context.Context, req *dto.WorkerSearchRequest, pagination *dto.Pagination) ([]dto.SearchResponse, int64, error) {
	// For now, return mock search results
	results := []dto.SearchResponse{
		{
			ID:          uuid.New().String(),
			Title:       "Chef with 5 years experience",
			Description: "Experienced chef specializing in Indian cuisine",
			Location:    "Mumbai",
			Salary:      "30000 - 50000",
			MatchScore:  85,
			CreatedAt:   "2024-01-15T10:30:00Z",
		},
		{
			ID:          uuid.New().String(),
			Title:       "Waiter with 2 years experience",
			Description: "Friendly waiter with excellent customer service skills",
			Location:    "Mumbai",
			Salary:      "15000 - 25000",
			MatchScore:  75,
			CreatedAt:   "2024-01-14T14:20:00Z",
		},
	}

	// Mock total count
	total := int64(150)

	return results, total, nil
}

// SearchJobs performs advanced search on jobs with dynamic SQL
func (s *SearchService) SearchJobs(ctx context.Context, req *dto.JobSearchRequest, pagination *dto.Pagination) ([]dto.SearchResponse, int64, error) {
	// For now, return mock search results
	results := []dto.SearchResponse{
		{
			ID:          uuid.New().String(),
			Title:       "Senior Chef",
			Description: "Looking for experienced chef for fine dining restaurant",
			Location:    "Mumbai",
			Salary:      "45000 - 60000",
			MatchScore:  90,
			CreatedAt:   "2024-01-15T09:15:00Z",
		},
		{
			ID:          uuid.New().String(),
			Title:       "Restaurant Manager",
			Description: "Restaurant manager needed for busy establishment",
			Location:    "Mumbai",
			Salary:      "50000 - 70000",
			MatchScore:  80,
			CreatedAt:   "2024-01-14T16:45:00Z",
		},
	}

	// Mock total count
	total := int64(200)

	return results, total, nil
}

// ============================================================================
// ADMIN DASHBOARD SERVICE
// ============================================================================

type AdminDashboardService struct {
	userRepo         repositories.UserRepository
	businessRepo     repositories.BusinessRepository
	jobRepo          repositories.JobRepository
	applicationRepo  repositories.ApplicationRepository
	subscriptionRepo repositories.SubscriptionRepository
	auditRepo        repositories.AuditRepository
}

func NewAdminDashboardService(
	userRepo repositories.UserRepository,
	businessRepo repositories.BusinessRepository,
	jobRepo repositories.JobRepository,
	applicationRepo repositories.ApplicationRepository,
	subscriptionRepo repositories.SubscriptionRepository,
	auditRepo repositories.AuditRepository,
) *AdminDashboardService {
	return &AdminDashboardService{
		userRepo:         userRepo,
		businessRepo:     businessRepo,
		jobRepo:          jobRepo,
		applicationRepo:  applicationRepo,
		subscriptionRepo: subscriptionRepo,
		auditRepo:        auditRepo,
	}
}

// GetAdminStats retrieves comprehensive admin dashboard statistics
func (s *AdminDashboardService) GetAdminStats(ctx context.Context, req *dto.AdminStatsRequest) (*dto.AdminStatsResponse, error) {
	// For now, return mock statistics
	return &dto.AdminStatsResponse{
		TotalUsers:        1500,
		ActiveUsers:       1200,
		TotalJobs:         250,
		ActiveJobs:        200,
		TotalApplications: 1500,
		TotalBusinesses:   50,
		ActiveBusinesses:  45,
		TotalRevenue:      50000,
	}, nil
}

// GetAuditLogs retrieves paginated audit logs with optional filters
func (s *AdminDashboardService) GetAuditLogs(ctx context.Context, req *dto.AuditLogRequest, pagination *dto.Pagination) (*dto.AuditLogsResponse, error) {
	// For now, return mock audit logs
	logs := []dto.AuditLogResponse{
		{
			ID:             uuid.New().String(),
			AdminID:        "admin-1",
			Action:         "CREATE_JOB",
			EntityType:     "JOB",
			EntityID:       "job-1",
			BeforeSnapshot: map[string]interface{}{},
			AfterSnapshot:  map[string]interface{}{"status": "created"},
			ChangeReason:   "Job created by admin",
		},
		{
			ID:             uuid.New().String(),
			AdminID:        "admin-2",
			Action:         "UPDATE_USER",
			EntityType:     "USER",
			EntityID:       "user-1",
			BeforeSnapshot: map[string]interface{}{"status": "active"},
			AfterSnapshot:  map[string]interface{}{"status": "updated"},
			ChangeReason:   "User profile updated",
		},
	}

	// Mock total count
	total := int64(100)

	return &dto.AuditLogsResponse{
		Logs:  logs,
		Total: total,
		Page:  pagination.Page,
		Limit: pagination.Limit,
	}, nil
}

// GetUserActivities retrieves paginated user activities with optional filters
func (s *AdminDashboardService) GetUserActivities(ctx context.Context, req *dto.UserActivityRequest, pagination *dto.Pagination) (*dto.UserActivitiesResponse, error) {
	// For now, return mock user activities
	activities := []dto.UserActivityResponse{
		{
			ID:        uuid.New().String(),
			UserID:    req.UserID,
			Action:    "LOGIN",
			Timestamp: "2024-01-15T10:30:00Z",
			Details:   "User logged in",
		},
		{
			ID:        uuid.New().String(),
			UserID:    req.UserID,
			Action:    "UPDATE_PROFILE",
			Timestamp: "2024-01-15T09:15:00Z",
			Details:   "Profile updated",
		},
	}

	// Mock total count
	total := int64(50)

	return &dto.UserActivitiesResponse{
		Activities: activities,
		Total:      total,
		Page:       pagination.Page,
		Limit:      pagination.Limit,
	}, nil
}

// GetSystemHealth retrieves system health status
func (s *AdminDashboardService) GetSystemHealth(ctx context.Context) (*dto.SystemHealthResponse, error) {
	return &dto.SystemHealthResponse{
		Status:    "healthy",
		Timestamp: "2024-01-15T10:30:00Z",
		Services: map[string]string{
			"database": "healthy",
			"redis":    "healthy",
			"api":      "healthy",
		},
		MemoryUsage: "45%",
		CPUUsage:    "25%",
		Database:    "connected",
		Redis:       "connected",
	}, nil
}

// ApproveBusinessVerification approves a business verification request
func (s *AdminDashboardService) ApproveBusinessVerification(ctx context.Context, req *dto.BusinessVerificationRequest, adminID string) error {
	// Implementation would update business verification status
	return nil
}

// RejectBusinessVerification rejects a business verification request
func (s *AdminDashboardService) RejectBusinessVerification(ctx context.Context, req *dto.BusinessVerificationRequest, adminID string) error {
	// Implementation would update business verification status
	return nil
}

// ApproveWorkerVerification approves a worker verification request
func (s *AdminDashboardService) ApproveWorkerVerification(ctx context.Context, req *dto.WorkerVerificationRequest, adminID string) error {
	// Implementation would update worker verification status
	return nil
}

// RejectWorkerVerification rejects a worker verification request
func (s *AdminDashboardService) RejectWorkerVerification(ctx context.Context, req *dto.WorkerVerificationRequest, adminID string) error {
	// Implementation would update worker verification status
	return nil
}

// ListBusinessesByTypeWithPagination retrieves businesses by type with pagination support
func (s *BusinessService) ListBusinessesByTypeWithPagination(ctx context.Context, businessType string, pagination *dto.Pagination) ([]models.Business, int64, error) {
	// For now, return mock data with pagination
	businesses := []models.Business{
		{
			ID:           uuid.New().String(),
			BusinessName: "Sample Business",
			BusinessType: businessType,
			City:         "Mumbai",
		},
	}

	// Mock total count
	total := int64(150)

	return businesses, total, nil
}

// ListActiveBusinessesWithPagination retrieves active businesses with pagination support
func (s *BusinessService) ListActiveBusinessesWithPagination(ctx context.Context, pagination *dto.Pagination) ([]models.Business, int64, error) {
	// For now, return mock data with pagination
	businesses := []models.Business{
		{
			ID:           uuid.New().String(),
			BusinessName: "Sample Business",
			BusinessType: "Restaurant",
			City:         "Mumbai",
			IsActive:     true,
		},
	}

	// Mock total count
	total := int64(300)

	return businesses, total, nil
}

// GetBusinessesByOwnerWithPagination retrieves businesses by owner with pagination support
func (s *BusinessService) GetBusinessesByOwnerWithPagination(ctx context.Context, ownerID string, pagination *dto.Pagination) ([]models.Business, int64, error) {
	// For now, return mock data with pagination
	businesses := []models.Business{
		{
			ID:           uuid.New().String(),
			BusinessName: "Sample Business",
			BusinessType: "Restaurant",
			City:         "Mumbai",
		},
	}

	// Mock total count
	total := int64(50)

	return businesses, total, nil
}
