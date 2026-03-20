package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"myapp/internal/models"
)

// ============================================================================
// NOTIFICATION REPOSITORY — REAL POSTGRES IMPLEMENTATION
// ============================================================================

// notificationPostgresRepository is the real DB-backed notification repository.
// It replaces the stub in stub_repositories.go for production use.
type notificationPostgresRepository struct {
	executor executor
}

// NewNotificationPostgresRepository creates a production notification repository
func NewNotificationPostgresRepository(db *sql.DB) NotificationRepository {
	return &notificationPostgresRepository{executor: db}
}

// NewNotificationPostgresRepositoryWithTx creates a transactional notification repository
func NewNotificationPostgresRepositoryWithTx(tx *sql.Tx) NotificationRepository {
	return &notificationPostgresRepository{executor: tx}
}

// CreateNotification inserts a new notification record
func (r *notificationPostgresRepository) CreateNotification(ctx context.Context, notif *models.Notification) error {
	query := `
		INSERT INTO notifications (
			id, user_id, title, message, type,
			related_entity_type, related_entity_id,
			is_read, created_at
		) VALUES (
			$1, $2, $3, $4, $5,
			$6, $7,
			$8, $9
		)`

	_, err := r.executor.ExecContext(ctx, query,
		notif.ID,
		notif.UserID,
		notif.Title,
		notif.Message,
		notif.Type,
		notif.RelatedEntityType,
		notif.RelatedEntityID,
		notif.IsRead,
		notif.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create notification: %w", err)
	}
	return nil
}

// GetNotificationsByUserID retrieves paginated notifications for a user.
// If unreadOnly is true, only unread notifications are returned.
func (r *notificationPostgresRepository) GetNotificationsByUserID(
	ctx context.Context,
	userID string,
	unreadOnly bool,
	page, limit int,
) ([]*models.Notification, int64, error) {
	offset := (page - 1) * limit

	// Build WHERE clause
	whereClause := "WHERE user_id = $1"
	args := []interface{}{userID}
	argIdx := 2

	if unreadOnly {
		whereClause += fmt.Sprintf(" AND is_read = $%d", argIdx)
		args = append(args, false)
		argIdx++
	}

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM notifications %s", whereClause)
	var total int64
	if err := r.executor.QueryRowContext(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count notifications: %w", err)
	}

	// Fetch rows
	dataQuery := fmt.Sprintf(`
		SELECT id, user_id, title, message, type,
		       related_entity_type, related_entity_id,
		       is_read, read_at, created_at
		FROM notifications
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d`,
		whereClause, argIdx, argIdx+1,
	)
	args = append(args, limit, offset)

	rows, err := r.executor.QueryContext(ctx, dataQuery, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query notifications: %w", err)
	}
	defer rows.Close()

	var notifs []*models.Notification
	for rows.Next() {
		n := &models.Notification{}
		if err := rows.Scan(
			&n.ID,
			&n.UserID,
			&n.Title,
			&n.Message,
			&n.Type,
			&n.RelatedEntityType,
			&n.RelatedEntityID,
			&n.IsRead,
			&n.ReadAt,
			&n.CreatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("failed to scan notification: %w", err)
		}
		notifs = append(notifs, n)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("notification rows error: %w", err)
	}

	return notifs, total, nil
}

// MarkNotificationAsRead marks a notification as read and sets read_at timestamp
func (r *notificationPostgresRepository) MarkNotificationAsRead(ctx context.Context, notifID string) error {
	query := `
		UPDATE notifications
		SET is_read = true, read_at = $1
		WHERE id = $2`

	result, err := r.executor.ExecContext(ctx, query, time.Now(), notifID)
	if err != nil {
		return fmt.Errorf("failed to mark notification as read: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("notification not found: %s", notifID)
	}

	return nil
}

// GetUnreadCount returns the count of unread notifications for a user
func (r *notificationPostgresRepository) GetUnreadCount(ctx context.Context, userID string) (int, error) {
	query := `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`

	var count int
	if err := r.executor.QueryRowContext(ctx, query, userID).Scan(&count); err != nil {
		return 0, fmt.Errorf("failed to get unread count: %w", err)
	}

	return count, nil
}

// DeleteNotification removes a notification by ID
func (r *notificationPostgresRepository) DeleteNotification(ctx context.Context, notifID string) error {
	query := `DELETE FROM notifications WHERE id = $1`

	_, err := r.executor.ExecContext(ctx, query, notifID)
	if err != nil {
		return fmt.Errorf("failed to delete notification: %w", err)
	}

	return nil
}
