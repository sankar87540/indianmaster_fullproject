package repositories

import (
	"context"
	"database/sql"

	"myapp/internal/models"
)

// UserRepository handles user data operations
type UserRepository interface {
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id string) (*models.User, error)
	GetByPhone(ctx context.Context, phone string) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id string) error
	ListByRole(ctx context.Context, role string) ([]*models.User, error)
	ListActive(ctx context.Context) ([]*models.User, error)
}

// BusinessRepository handles business data operations
type BusinessRepository interface {
	Create(ctx context.Context, business *models.Business) error
	GetByID(ctx context.Context, id string) (*models.Business, error)
	GetByOwnerID(ctx context.Context, ownerID string) ([]*models.Business, error)
	Update(ctx context.Context, business *models.Business) error
	Delete(ctx context.Context, id string) error
	ListByCity(ctx context.Context, city string) ([]*models.Business, error)
	ListByType(ctx context.Context, businessType string) ([]*models.Business, error)
	ListActive(ctx context.Context) ([]*models.Business, error)
	ExistsByID(ctx context.Context, id string) (bool, error)
}

// WorkerRepository handles worker profile data operations
type WorkerRepository interface {
	Create(ctx context.Context, worker *models.Worker) error
	GetByID(ctx context.Context, id string) (*models.Worker, error)
	GetByUserID(ctx context.Context, userID string) (*models.Worker, error)
	Update(ctx context.Context, worker *models.Worker) error
	Delete(ctx context.Context, id string) error
	ListActive(ctx context.Context) ([]*models.Worker, error)
	ListByCity(ctx context.Context, city string) ([]*models.Worker, error)
	UpdateLocation(ctx context.Context, workerID string, latitude, longitude float64) error
	ExistsByUserID(ctx context.Context, userID string) (bool, error)
}

// JobRepository handles job posting data operations
type JobRepository interface {
	Create(ctx context.Context, job *models.Job) error
	GetByID(ctx context.Context, id string) (*models.Job, error)
	GetByBusinessID(ctx context.Context, businessID string) ([]*models.Job, error)
	Update(ctx context.Context, job *models.Job) error
	Delete(ctx context.Context, id string) error
	ListByStatus(ctx context.Context, status string) ([]*models.Job, error)
	ListByCity(ctx context.Context, city string) ([]*models.Job, error)
	ListOpenJobs(ctx context.Context) ([]*models.Job, error)
	UpdateStatus(ctx context.Context, jobID, status string) error
	ExistsByID(ctx context.Context, id string) (bool, error)
}

// ApplicationRepository handles job application data operations
type ApplicationRepository interface {
	Create(ctx context.Context, application *models.Application) error
	GetByID(ctx context.Context, id string) (*models.Application, error)
	GetByJobID(ctx context.Context, jobID string) ([]*models.Application, error)
	GetByWorkerID(ctx context.Context, workerID string) ([]*models.Application, error)
	Update(ctx context.Context, application *models.Application) error
	Delete(ctx context.Context, id string) error
	UpdateStatus(ctx context.Context, applicationID, status string) error
	ListByStatus(ctx context.Context, status string) ([]*models.Application, error)
	ExistsByJobAndWorker(ctx context.Context, jobID, workerID string) (bool, error)
}

// SubscriptionRepository handles subscription data operations
type SubscriptionRepository interface {
	Create(ctx context.Context, subscription *models.Subscription) error
	GetByID(ctx context.Context, id string) (*models.Subscription, error)
	GetByUserID(ctx context.Context, userID string) (*models.Subscription, error)
	Update(ctx context.Context, subscription *models.Subscription) error
	Delete(ctx context.Context, id string) error
	ListByStatus(ctx context.Context, status string) ([]*models.Subscription, error)
	ListExpiring(ctx context.Context, days int) ([]*models.Subscription, error)
	UpdateStatus(ctx context.Context, subscriptionID, status string) error
}

// WorkerLiveTrackingRepository handles worker location tracking data operations
type WorkerLiveTrackingRepository interface {
	Create(ctx context.Context, tracking *models.WorkerLiveTracking) error
	GetLatest(ctx context.Context, workerID string) (*models.WorkerLiveTracking, error)
	ListRecent(ctx context.Context, workerID string, limit int) ([]*models.WorkerLiveTracking, error)
	Delete(ctx context.Context, id string) error
	DeleteOlderThanDays(ctx context.Context, days int) error
	ListActiveWorkers(ctx context.Context, minMinutesAgo int) ([]*models.WorkerLiveTracking, error)
}

// InstantJobApplicationRepository handles instant apply form submissions
type InstantJobApplicationRepository interface {
	Create(ctx context.Context, app *models.InstantJobApplication) error
}

// Transaction represents a database transaction context
type Transaction interface {
	Commit() error
	Rollback() error
	Repositories() Repositories
}

// Repositories provides access to all repository interfaces within a transaction or at root level
type Repositories interface {
	Users() UserRepository
	Businesses() BusinessRepository
	Workers() WorkerRepository
	Jobs() JobRepository
	Applications() ApplicationRepository
	Subscriptions() SubscriptionRepository
	LiveTracking() WorkerLiveTrackingRepository
	BeginTx(ctx context.Context) (Transaction, error)
}

// executor interface abstracts both database/sql.DB and database/sql.Tx
type executor interface {
	QueryRowContext(ctx context.Context, query string, args ...interface{}) *sql.Row
	QueryContext(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error)
	ExecContext(ctx context.Context, query string, args ...interface{}) (sql.Result, error)
}

// ================ MISSING REPOSITORIES (NEW) ================

// ChatRepository handles chat thread and message operations
type ChatRepository interface {
	CreateChatThread(ctx context.Context, thread *models.ChatThread) error
	GetChatThreadByID(ctx context.Context, threadID string) (*models.ChatThread, error)
	GetChatThreadsByUserID(ctx context.Context, userID string, archived bool, page, limit int) ([]*models.ChatThread, int64, error)
	GetChatThreadByComposite(ctx context.Context, workerID, hirerID, jobID string) (*models.ChatThread, error)
	CreateChatMessage(ctx context.Context, msg *models.ChatMessage) error
	GetChatMessages(ctx context.Context, threadID string, page, limit int) ([]*models.ChatMessage, int64, error)
	MarkChatMessageAsRead(ctx context.Context, messageID string) error
	MarkThreadMessagesAsRead(ctx context.Context, threadID, readerID string) error
	SoftDeleteChatMessage(ctx context.Context, messageID, deletedBy string) error
	UpdateChatThreadLastMessage(ctx context.Context, threadID string) error
	ArchiveChatThread(ctx context.Context, threadID string) error
	GetUnreadChatCount(ctx context.Context, userID string) (int, error)
}

// SavedItemsRepository handles saved jobs and workers
type SavedItemsRepository interface {
	SaveJob(ctx context.Context, workerID, jobID string) error
	UnsaveJob(ctx context.Context, workerID, jobID string) error
	IsSavedJob(ctx context.Context, workerID, jobID string) (bool, error)
	GetSavedJobs(ctx context.Context, workerID string, page, limit int) ([]*models.SavedJob, int64, error)
	SaveWorker(ctx context.Context, hirerID, workerID string) error
	UnsaveWorker(ctx context.Context, hirerID, workerID string) error
	IsSavedWorker(ctx context.Context, hirerID, workerID string) (bool, error)
	GetSavedWorkers(ctx context.Context, hirerID string, page, limit int) ([]*models.SavedWorker, int64, error)
}

// VerificationRepository handles KYC/verification operations
type VerificationRepository interface {
	CreateWorkerVerification(ctx context.Context, ver *models.WorkerVerification) error
	GetWorkerVerificationByWorkerID(ctx context.Context, workerID string) (*models.WorkerVerification, error)
	UpdateWorkerVerification(ctx context.Context, ver *models.WorkerVerification) error
	CreateBusinessVerification(ctx context.Context, ver *models.BusinessVerification) error
	GetBusinessVerificationByBusinessID(ctx context.Context, businessID string) (*models.BusinessVerification, error)
	UpdateBusinessVerification(ctx context.Context, ver *models.BusinessVerification) error
	GetPendingVerifications(ctx context.Context, entityType string, page, limit int) ([]interface{}, int64, error)
	ApproveVerification(ctx context.Context, entityType, entityID string) error
	RejectVerification(ctx context.Context, entityType, entityID, reason string) error
}

// NotificationRepository handles notifications
type NotificationRepository interface {
	CreateNotification(ctx context.Context, notif *models.Notification) error
	GetNotificationsByUserID(ctx context.Context, userID string, unreadOnly bool, page, limit int) ([]*models.Notification, int64, error)
	MarkNotificationAsRead(ctx context.Context, notifID string) error
	GetUnreadCount(ctx context.Context, userID string) (int, error)
	DeleteNotification(ctx context.Context, notifID string) error
}

// AuditRepository handles audit logging
type AuditRepository interface {
	LogAuditEvent(ctx context.Context, event *models.AuditEvent) error
	GetAuditEventsByEntity(ctx context.Context, entityType, entityID string, page, limit int) ([]*models.AuditEvent, int64, error)
	GetAuditEventsByAdmin(ctx context.Context, adminID string, page, limit int) ([]*models.AuditEvent, int64, error)
	GetAllAuditEvents(ctx context.Context, page, limit int) ([]*models.AuditEvent, int64, error)
	LogAdminAction(ctx context.Context, log *models.AdminLog) error
	GetAdminLogs(ctx context.Context, adminID string, page, limit int) ([]*models.AdminLog, int64, error)
}

// ContactLimitRepository handles daily contact usage limits
type ContactLimitRepository interface {
	GetOrInitializeDailyLimit(ctx context.Context, hirerID string, planLimit int) (*models.WorkerContactLimitLog, error)
	IncrementContactUsage(ctx context.Context, logID string) error
	HasAvailableContacts(ctx context.Context, hirerID string) (bool, int, error)
	GetDailyUsage(ctx context.Context, hirerID string) (*models.WorkerContactLimitLog, error)
}
