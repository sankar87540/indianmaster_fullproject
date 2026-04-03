package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"myapp/internal/errors"
)

// PostgresRepository implements all repository interfaces
type PostgresRepository struct {
	db *sql.DB

	// Cached repository instances
	users         UserRepository
	businesses    BusinessRepository
	workers       WorkerRepository
	jobs          JobRepository
	applications  ApplicationRepository
	subscriptions SubscriptionRepository
	liveTracking  WorkerLiveTrackingRepository
	verification  VerificationRepository
	notification  NotificationRepository
	audit         AuditRepository
	chat                ChatRepository
	contactLimit        ContactLimitRepository
	hirerWorkerUnlocks  HirerWorkerUnlockRepository
}

// NewPostgresRepository creates a new PostgreSQL repository
func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	repo := &PostgresRepository{db: db}

	// Initialize repository instances
	repo.users = NewUserRepository(db)
	repo.businesses = NewBusinessRepository(db)
	repo.workers = NewWorkerRepository(db)
	repo.jobs = NewJobRepository(db)
	repo.applications = NewApplicationRepository(db)
	repo.subscriptions = NewSubscriptionRepository(db)
	repo.liveTracking = NewLiveTrackingRepository(db)
	repo.verification = NewVerificationRepository(db)
	repo.notification = NewNotificationPostgresRepository(db)
	repo.audit = NewAuditRepository(db)
	repo.chat = NewChatRepository(db)
	repo.contactLimit = NewContactLimitRepository(db)
	repo.hirerWorkerUnlocks = NewHirerWorkerUnlockRepository(db)

	return repo
}

// Users returns the user repository
func (r *PostgresRepository) Users() UserRepository {
	return r.users
}

// Businesses returns the business repository
func (r *PostgresRepository) Businesses() BusinessRepository {
	return r.businesses
}

// Workers returns the worker repository
func (r *PostgresRepository) Workers() WorkerRepository {
	return r.workers
}

// Jobs returns the job repository
func (r *PostgresRepository) Jobs() JobRepository {
	return r.jobs
}

// Applications returns the application repository
func (r *PostgresRepository) Applications() ApplicationRepository {
	return r.applications
}

// Subscriptions returns the subscription repository
func (r *PostgresRepository) Subscriptions() SubscriptionRepository {
	return r.subscriptions
}

// LiveTracking returns the live tracking repository
func (r *PostgresRepository) LiveTracking() WorkerLiveTrackingRepository {
	return r.liveTracking
}

// Verification returns the verification repository
func (r *PostgresRepository) Verification() VerificationRepository {
	return r.verification
}

// Notification returns the notification repository
func (r *PostgresRepository) Notification() NotificationRepository {
	return r.notification
}

// Audit returns the audit repository
func (r *PostgresRepository) Audit() AuditRepository {
	return r.audit
}

// Chat returns the chat repository
func (r *PostgresRepository) Chat() ChatRepository {
	return r.chat
}

// ContactLimit returns the contact limit repository
func (r *PostgresRepository) ContactLimit() ContactLimitRepository {
	return r.contactLimit
}

// HirerWorkerUnlocks returns the hirer-worker unlock repository
func (r *PostgresRepository) HirerWorkerUnlocks() HirerWorkerUnlockRepository {
	return r.hirerWorkerUnlocks
}

// BeginTx starts a new database transaction
func (r *PostgresRepository) BeginTx(ctx context.Context) (Transaction, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, errors.NewTransactionError("failed to begin transaction", err)
	}

	return NewTransactionContext(tx), nil
}

// ============= TRANSACTION CONTEXT =============

// transactionContext wraps a database transaction
type transactionContext struct {
	tx *sql.Tx

	// Repository instances for this transaction
	users         UserRepository
	businesses    BusinessRepository
	workers       WorkerRepository
	jobs          JobRepository
	applications  ApplicationRepository
	subscriptions SubscriptionRepository
	liveTracking  WorkerLiveTrackingRepository
	verification  VerificationRepository
	notification  NotificationRepository
	audit         AuditRepository
	chat               ChatRepository
	contactLimit       ContactLimitRepository
	hirerWorkerUnlocks HirerWorkerUnlockRepository
}

// NewTransactionContext creates a new transaction context
func NewTransactionContext(tx *sql.Tx) *transactionContext {
	return &transactionContext{
		tx:                 tx,
		users:              NewUserRepositoryWithTx(tx),
		businesses:         NewBusinessRepositoryWithTx(tx),
		workers:            NewWorkerRepositoryWithTx(tx),
		jobs:               NewJobRepositoryWithTx(tx),
		applications:       NewApplicationRepositoryWithTx(tx),
		subscriptions:      NewSubscriptionRepositoryWithTx(tx),
		liveTracking:       NewLiveTrackingRepositoryWithTx(tx),
		verification:       NewVerificationRepositoryWithTx(tx),
		notification:       NewNotificationRepositoryWithTx(tx),
		audit:              NewAuditRepositoryWithTx(tx),
		chat:               NewChatRepositoryWithTx(tx),
		contactLimit:       NewContactLimitRepositoryWithTx(tx),
		hirerWorkerUnlocks: NewHirerWorkerUnlockRepositoryWithTx(tx),
	}
}

// Commit commits the transaction
func (t *transactionContext) Commit() error {
	if err := t.tx.Commit(); err != nil {
		return errors.NewTransactionError("failed to commit transaction", err)
	}
	return nil
}

// Rollback rolls back the transaction
func (t *transactionContext) Rollback() error {
	if err := t.tx.Rollback(); err != nil {
		return errors.NewTransactionError("failed to rollback transaction", err)
	}
	return nil
}

// Repositories returns all repository instances for this transaction
func (t *transactionContext) Repositories() Repositories {
	return t
}

// Users returns the user repository
func (t *transactionContext) Users() UserRepository {
	return t.users
}

// Businesses returns the business repository
func (t *transactionContext) Businesses() BusinessRepository {
	return t.businesses
}

// Workers returns the worker repository
func (t *transactionContext) Workers() WorkerRepository {
	return t.workers
}

// Jobs returns the job repository
func (t *transactionContext) Jobs() JobRepository {
	return t.jobs
}

// Applications returns the application repository
func (t *transactionContext) Applications() ApplicationRepository {
	return t.applications
}

// Subscriptions returns the subscription repository
func (t *transactionContext) Subscriptions() SubscriptionRepository {
	return t.subscriptions
}

// LiveTracking returns the live tracking repository
func (t *transactionContext) LiveTracking() WorkerLiveTrackingRepository {
	return t.liveTracking
}

// Verification returns the verification repository
func (t *transactionContext) Verification() VerificationRepository {
	return t.verification
}

// Notification returns the notification repository
func (t *transactionContext) Notification() NotificationRepository {
	return t.notification
}

// Audit returns the audit repository
func (t *transactionContext) Audit() AuditRepository {
	return t.audit
}

// Chat returns the chat repository
func (t *transactionContext) Chat() ChatRepository {
	return t.chat
}

// ContactLimit returns the contact limit repository
func (t *transactionContext) ContactLimit() ContactLimitRepository {
	return t.contactLimit
}

// HirerWorkerUnlocks returns the hirer-worker unlock repository
func (t *transactionContext) HirerWorkerUnlocks() HirerWorkerUnlockRepository {
	return t.hirerWorkerUnlocks
}

// BeginTx is not supported on a transaction
func (t *transactionContext) BeginTx(ctx context.Context) (Transaction, error) {
	return nil, errors.NewAppError(
		errors.ErrInternal,
		"nested transactions are not supported",
		500,
		nil,
	)
}

// ============= HELPER FUNCTIONS =============

// handleScanError converts SQL scan errors to app errors
func handleScanError(err error, resource string) error {
	if err == sql.ErrNoRows {
		return errors.NewResourceNotFoundError(resource, "")
	}
	return errors.NewDatabaseError(fmt.Sprintf("failed to scan %s", resource), err)
}
