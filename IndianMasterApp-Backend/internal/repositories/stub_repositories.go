package repositories

import (
	"context"
	"database/sql"
	"time"

	"myapp/internal/errors"
	"myapp/internal/models"

	"github.com/lib/pq"
)

// ============= VERIFICATION REPOSITORY =============

type verificationRepository struct {
	executor executor
}

func NewVerificationRepository(db *sql.DB) VerificationRepository {
	return &verificationRepository{executor: db}
}

func NewVerificationRepositoryWithTx(tx *sql.Tx) VerificationRepository {
	return &verificationRepository{executor: tx}
}

func (r *verificationRepository) CreateWorkerVerification(ctx context.Context, ver *models.WorkerVerification) error {
	return nil
}

func (r *verificationRepository) GetWorkerVerificationByWorkerID(ctx context.Context, workerID string) (*models.WorkerVerification, error) {
	return &models.WorkerVerification{}, nil
}

func (r *verificationRepository) UpdateWorkerVerification(ctx context.Context, ver *models.WorkerVerification) error {
	return nil
}

func (r *verificationRepository) CreateBusinessVerification(ctx context.Context, ver *models.BusinessVerification) error {
	return nil
}

func (r *verificationRepository) GetBusinessVerificationByBusinessID(ctx context.Context, businessID string) (*models.BusinessVerification, error) {
	return &models.BusinessVerification{}, nil
}

func (r *verificationRepository) UpdateBusinessVerification(ctx context.Context, ver *models.BusinessVerification) error {
	return nil
}

func (r *verificationRepository) GetPendingVerifications(ctx context.Context, entityType string, page, limit int) ([]interface{}, int64, error) {
	return []interface{}{}, 0, nil
}

func (r *verificationRepository) ApproveVerification(ctx context.Context, entityType, entityID string) error {
	return nil
}

func (r *verificationRepository) RejectVerification(ctx context.Context, entityType, entityID, reason string) error {
	return nil
}

// ============= NOTIFICATION REPOSITORY =============

type notificationRepository struct {
	executor executor
}

func NewNotificationRepository(db *sql.DB) NotificationRepository {
	return &notificationRepository{executor: db}
}

func NewNotificationRepositoryWithTx(tx *sql.Tx) NotificationRepository {
	return &notificationRepository{executor: tx}
}

func (r *notificationRepository) CreateNotification(ctx context.Context, notif *models.Notification) error {
	return nil
}

func (r *notificationRepository) UpsertChatNotification(ctx context.Context, notif *models.Notification) error {
	return nil
}

func (r *notificationRepository) GetNotificationsByUserID(ctx context.Context, userID string, unreadOnly bool, page, limit int) ([]*models.Notification, int64, error) {
	return []*models.Notification{}, 0, nil
}

func (r *notificationRepository) MarkNotificationAsRead(ctx context.Context, notifID string) error {
	return nil
}

func (r *notificationRepository) GetUnreadCount(ctx context.Context, userID string) (int, error) {
	return 0, nil
}

func (r *notificationRepository) DeleteNotification(ctx context.Context, notifID string) error {
	return nil
}

// ============= AUDIT REPOSITORY =============

type auditRepository struct {
	executor executor
}

func NewAuditRepository(db *sql.DB) AuditRepository {
	return &auditRepository{executor: db}
}

func NewAuditRepositoryWithTx(tx *sql.Tx) AuditRepository {
	return &auditRepository{executor: tx}
}

func (r *auditRepository) LogAuditEvent(ctx context.Context, event *models.AuditEvent) error {
	return nil
}

func (r *auditRepository) GetAuditEventsByEntity(ctx context.Context, entityType, entityID string, page, limit int) ([]*models.AuditEvent, int64, error) {
	return []*models.AuditEvent{}, 0, nil
}

func (r *auditRepository) GetAuditEventsByAdmin(ctx context.Context, adminID string, page, limit int) ([]*models.AuditEvent, int64, error) {
	return []*models.AuditEvent{}, 0, nil
}

func (r *auditRepository) GetAllAuditEvents(ctx context.Context, page, limit int) ([]*models.AuditEvent, int64, error) {
	return []*models.AuditEvent{}, 0, nil
}

func (r *auditRepository) LogAdminAction(ctx context.Context, log *models.AdminLog) error {
	return nil
}

func (r *auditRepository) GetAdminLogs(ctx context.Context, adminID string, page, limit int) ([]*models.AdminLog, int64, error) {
	return []*models.AdminLog{}, 0, nil
}

// ============= CHAT REPOSITORY =============

type chatRepository struct {
	executor executor
}

func NewChatRepository(db *sql.DB) ChatRepository {
	return &chatRepository{executor: db}
}

func NewChatRepositoryWithTx(tx *sql.Tx) ChatRepository {
	return &chatRepository{executor: tx}
}

func (r *chatRepository) CreateChatThread(ctx context.Context, thread *models.ChatThread) error {
	query := `
		INSERT INTO chat_threads (id, worker_id, hirer_id, job_id, is_archived)
		VALUES ($1, $2, $3, $4, false)
		RETURNING created_at, updated_at
	`
	var jobID sql.NullString
	if thread.JobID != "" {
		jobID = sql.NullString{String: thread.JobID, Valid: true}
	}
	err := r.executor.QueryRowContext(ctx, query,
		thread.ID, thread.WorkerID, thread.HirerID, jobID,
	).Scan(&thread.CreatedAt, &thread.UpdatedAt)
	if err != nil {
		return errors.NewDatabaseError("failed to create chat thread", err)
	}
	return nil
}

func (r *chatRepository) GetChatThreadByID(ctx context.Context, threadID string) (*models.ChatThread, error) {
	t := &models.ChatThread{}
	query := `
		SELECT id, worker_id, hirer_id, job_id, last_message_at, is_archived, created_at, updated_at
		FROM chat_threads WHERE id = $1
	`
	var jobID sql.NullString
	err := r.executor.QueryRowContext(ctx, query, threadID).Scan(
		&t.ID, &t.WorkerID, &t.HirerID, &jobID,
		&t.LastMessageAt, &t.IsArchived, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, handleScanError(err, "chat thread")
	}
	if jobID.Valid {
		t.JobID = jobID.String
	}
	return t, nil
}

func (r *chatRepository) GetChatThreadsByUserID(ctx context.Context, userID string, archived bool, page, limit int) ([]*models.ChatThread, int64, error) {
	offset := (page - 1) * limit
	// DisplayName is context-aware:
	//   - When the requesting user is the hirer, show the worker's name.
	//   - When the requesting user is the worker, show the hirer's business name (or full name).
	query := `
		SELECT
			t.id, t.worker_id, t.hirer_id, t.job_id,
			t.last_message_at, t.is_archived, t.created_at, t.updated_at,
			CASE
				WHEN t.hirer_id = $1
					THEN COALESCE(wu.full_name, 'Worker')
				ELSE COALESCE(b.business_name, hu.full_name, 'Hirer')
			END AS hirer_name,
			CASE
				WHEN t.worker_id = $1
					THEN COALESCE(wu.full_name, 'Worker')
				ELSE ''
			END AS worker_name,
			COALESCE(
				(SELECT cm.message_text FROM chat_messages cm
				 WHERE cm.thread_id = t.id AND cm.deleted_at IS NULL
				 ORDER BY cm.created_at DESC LIMIT 1),
				''
			) AS last_message_preview,
			(SELECT COUNT(*) FROM chat_messages cm
			 WHERE cm.thread_id = t.id
			   AND cm.is_read = FALSE
			   AND cm.sender_id != $1
			   AND cm.deleted_at IS NULL) AS unread_count
		FROM chat_threads t
		JOIN users wu ON wu.id = t.worker_id
		JOIN users hu ON hu.id = t.hirer_id
		LEFT JOIN jobs j ON j.id = t.job_id
		LEFT JOIN businesses b ON b.owner_id = t.hirer_id
		WHERE (t.worker_id = $1 OR t.hirer_id = $1) AND t.is_archived = $2
		ORDER BY COALESCE(t.last_message_at, t.created_at) DESC
		LIMIT $3 OFFSET $4
	`
	rows, err := r.executor.QueryContext(ctx, query, userID, archived, limit, offset)
	if err != nil {
		return nil, 0, errors.NewDatabaseError("failed to query chat threads", err)
	}
	defer rows.Close()

	var threads []*models.ChatThread
	for rows.Next() {
		t := &models.ChatThread{}
		var jobID sql.NullString
		if err := rows.Scan(
			&t.ID, &t.WorkerID, &t.HirerID, &jobID,
			&t.LastMessageAt, &t.IsArchived, &t.CreatedAt, &t.UpdatedAt,
			&t.HirerName, &t.WorkerName, &t.LastMessagePreview, &t.UnreadCount,
		); err != nil {
			return nil, 0, errors.NewDatabaseError("failed to scan chat thread", err)
		}
		if jobID.Valid {
			t.JobID = jobID.String
		}
		threads = append(threads, t)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, errors.NewDatabaseError("failed to iterate chat threads", err)
	}

	var total int64
	countQ := `SELECT COUNT(*) FROM chat_threads WHERE (worker_id = $1 OR hirer_id = $1) AND is_archived = $2`
	if err := r.executor.QueryRowContext(ctx, countQ, userID, archived).Scan(&total); err != nil {
		return nil, 0, errors.NewDatabaseError("failed to count chat threads", err)
	}

	return threads, total, nil
}

func (r *chatRepository) GetChatThreadByComposite(ctx context.Context, workerID, hirerID, jobID string) (*models.ChatThread, error) {
	t := &models.ChatThread{}
	// Unique per (worker_id, hirer_id) — job_id is optional context, not part of uniqueness.
	query := `
		SELECT id, worker_id, hirer_id, job_id, last_message_at, is_archived, created_at, updated_at
		FROM chat_threads
		WHERE worker_id = $1 AND hirer_id = $2
	`
	var scannedJobID sql.NullString
	err := r.executor.QueryRowContext(ctx, query, workerID, hirerID).Scan(
		&t.ID, &t.WorkerID, &t.HirerID, &scannedJobID,
		&t.LastMessageAt, &t.IsArchived, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, handleScanError(err, "chat thread")
	}
	if scannedJobID.Valid {
		t.JobID = scannedJobID.String
	}
	return t, nil
}

func (r *chatRepository) CreateChatMessage(ctx context.Context, msg *models.ChatMessage) error {
	query := `
		INSERT INTO chat_messages (id, thread_id, sender_id, message_text, attachment_urls, reply_to_message_id)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING created_at, updated_at
	`
	attachmentURLs := msg.AttachmentURLs
	if attachmentURLs == nil {
		attachmentURLs = pq.StringArray{}
	}
	var replyToID sql.NullString
	if msg.ReplyToMessageID != nil && *msg.ReplyToMessageID != "" {
		replyToID = sql.NullString{String: *msg.ReplyToMessageID, Valid: true}
	}
	err := r.executor.QueryRowContext(ctx, query,
		msg.ID, msg.ThreadID, msg.SenderID, msg.MessageText, pq.Array(attachmentURLs), replyToID,
	).Scan(&msg.CreatedAt, &msg.UpdatedAt)
	if err != nil {
		return errors.NewDatabaseError("failed to create chat message", err)
	}
	return nil
}

func (r *chatRepository) GetChatMessages(ctx context.Context, threadID string, page, limit int) ([]*models.ChatMessage, int64, error) {
	offset := (page - 1) * limit
	// LEFT JOIN on reply_to_message_id to include quoted-reply preview in one query.
	// rm.deleted_at check is in the JOIN condition so soft-deleted originals return
	// NULL preview (handled in service layer as "Message deleted").
	query := `
		SELECT
			m.id, m.thread_id, m.sender_id, m.message_text, m.attachment_urls,
			m.is_read, m.read_at, m.delivered_at,
			m.reply_to_message_id,
			rm.message_text  AS reply_to_text,
			rm.sender_id     AS reply_to_sender_id,
			m.created_at, m.updated_at
		FROM chat_messages m
		LEFT JOIN chat_messages rm
			ON rm.id = m.reply_to_message_id AND rm.deleted_at IS NULL
		WHERE m.thread_id = $1 AND m.deleted_at IS NULL
		ORDER BY m.created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := r.executor.QueryContext(ctx, query, threadID, limit, offset)
	if err != nil {
		return nil, 0, errors.NewDatabaseError("failed to query chat messages", err)
	}
	defer rows.Close()

	var messages []*models.ChatMessage
	for rows.Next() {
		m := &models.ChatMessage{}
		var replyToID sql.NullString
		if err := rows.Scan(
			&m.ID, &m.ThreadID, &m.SenderID, &m.MessageText,
			pq.Array(&m.AttachmentURLs), &m.IsRead, &m.ReadAt, &m.DeliveredAt,
			&replyToID, &m.ReplyToText, &m.ReplyToSenderID,
			&m.CreatedAt, &m.UpdatedAt,
		); err != nil {
			return nil, 0, errors.NewDatabaseError("failed to scan chat message", err)
		}
		if replyToID.Valid {
			m.ReplyToMessageID = &replyToID.String
		}
		messages = append(messages, m)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, errors.NewDatabaseError("failed to iterate chat messages", err)
	}

	var total int64
	countQ := `SELECT COUNT(*) FROM chat_messages WHERE thread_id = $1 AND deleted_at IS NULL`
	if err := r.executor.QueryRowContext(ctx, countQ, threadID).Scan(&total); err != nil {
		return nil, 0, errors.NewDatabaseError("failed to count chat messages", err)
	}

	return messages, total, nil
}

func (r *chatRepository) MarkChatMessageAsRead(ctx context.Context, messageID string) error {
	query := `UPDATE chat_messages SET is_read = true, read_at = NOW() WHERE id = $1 AND is_read = false`
	_, err := r.executor.ExecContext(ctx, query, messageID)
	if err != nil {
		return errors.NewDatabaseError("failed to mark message as read", err)
	}
	return nil
}

func (r *chatRepository) MarkThreadMessagesAsRead(ctx context.Context, threadID, readerID string) error {
	query := `
		UPDATE chat_messages
		SET is_read = true, read_at = NOW()
		WHERE thread_id = $1
		  AND sender_id != $2
		  AND is_read = false
		  AND deleted_at IS NULL
	`
	_, err := r.executor.ExecContext(ctx, query, threadID, readerID)
	if err != nil {
		return errors.NewDatabaseError("failed to mark thread messages as read", err)
	}
	return nil
}

func (r *chatRepository) SoftDeleteChatMessage(ctx context.Context, messageID, deletedBy string) error {
	return nil
}

func (r *chatRepository) UpdateChatThreadLastMessage(ctx context.Context, threadID string) error {
	query := `UPDATE chat_threads SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1`
	_, err := r.executor.ExecContext(ctx, query, threadID)
	if err != nil {
		return errors.NewDatabaseError("failed to update chat thread last_message_at", err)
	}
	return nil
}

func (r *chatRepository) ArchiveChatThread(ctx context.Context, threadID string) error {
	return nil
}

func (r *chatRepository) GetUnreadChatCount(ctx context.Context, userID string) (int, error) {
	return 0, nil
}

func (r *chatRepository) UpdateUserLastSeen(ctx context.Context, userID string) error {
	query := `UPDATE users SET last_seen = NOW() WHERE id = $1`
	_, err := r.executor.ExecContext(ctx, query, userID)
	if err != nil {
		return errors.NewDatabaseError("failed to update last_seen", err)
	}
	return nil
}

func (r *chatRepository) GetOtherUserPresence(ctx context.Context, threadID, callerID string) (*time.Time, error) {
	// Returns the last_seen of the OTHER participant (not the caller).
	// Uses a CASE to pick the participant whose ID is not callerID.
	query := `
		SELECT u.last_seen
		FROM chat_threads t
		JOIN users u ON u.id = CASE
			WHEN t.worker_id = $2 THEN t.hirer_id
			ELSE t.worker_id
		END
		WHERE t.id = $1
	`
	var lastSeen *time.Time
	err := r.executor.QueryRowContext(ctx, query, threadID, callerID).Scan(&lastSeen)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to get presence", err)
	}
	return lastSeen, nil
}

func (r *chatRepository) MarkThreadMessagesAsDelivered(ctx context.Context, threadID, recipientID string) error {
	// Set delivered_at only for messages the recipient did NOT send (incoming messages)
	// and only when delivered_at is still NULL (idempotent).
	query := `
		UPDATE chat_messages
		SET delivered_at = NOW()
		WHERE thread_id = $1
		  AND sender_id != $2
		  AND delivered_at IS NULL
		  AND deleted_at IS NULL
	`
	_, err := r.executor.ExecContext(ctx, query, threadID, recipientID)
	if err != nil {
		return errors.NewDatabaseError("failed to mark messages as delivered", err)
	}
	return nil
}

func (r *chatRepository) GetChatMessageByID(ctx context.Context, messageID string) (*models.ChatMessage, error) {
	m := &models.ChatMessage{}
	query := `
		SELECT id, thread_id, sender_id, message_text, attachment_urls,
		       is_read, read_at, delivered_at, reply_to_message_id,
		       created_at, updated_at
		FROM chat_messages
		WHERE id = $1 AND deleted_at IS NULL
	`
	var replyToID sql.NullString
	err := r.executor.QueryRowContext(ctx, query, messageID).Scan(
		&m.ID, &m.ThreadID, &m.SenderID, &m.MessageText,
		pq.Array(&m.AttachmentURLs), &m.IsRead, &m.ReadAt, &m.DeliveredAt,
		&replyToID,
		&m.CreatedAt, &m.UpdatedAt,
	)
	if err != nil {
		return nil, handleScanError(err, "chat message")
	}
	if replyToID.Valid {
		m.ReplyToMessageID = &replyToID.String
	}
	return m, nil
}

// ============= CONTACT LIMIT REPOSITORY =============

type contactLimitRepository struct {
	executor executor
}

func NewContactLimitRepository(db *sql.DB) ContactLimitRepository {
	return &contactLimitRepository{executor: db}
}

func NewContactLimitRepositoryWithTx(tx *sql.Tx) ContactLimitRepository {
	return &contactLimitRepository{executor: tx}
}

func (r *contactLimitRepository) GetOrInitializeDailyLimit(ctx context.Context, hirerID string, planLimit int) (*models.WorkerContactLimitLog, error) {
	return &models.WorkerContactLimitLog{}, nil
}

func (r *contactLimitRepository) IncrementContactUsage(ctx context.Context, logID string) error {
	return nil
}

func (r *contactLimitRepository) HasAvailableContacts(ctx context.Context, hirerID string) (bool, int, error) {
	return true, 100, nil
}

func (r *contactLimitRepository) GetDailyUsage(ctx context.Context, hirerID string) (*models.WorkerContactLimitLog, error) {
	return &models.WorkerContactLimitLog{}, nil
}
