package services

import (
	"context"
	"time"

	"myapp/internal/dto"
	"myapp/internal/models"
	"myapp/internal/repositories"

	"github.com/google/uuid"
)

// ============================================================================
// NOTIFICATION SERVICE — REAL IMPLEMENTATION
// ============================================================================

// NotificationServiceV2 is the full notification service with DB-backed operations
// and a CreateNotification helper used by other services.
type NotificationServiceV2 struct {
	notificationRepo repositories.NotificationRepository
}

// NewNotificationServiceV2 creates a new NotificationServiceV2
func NewNotificationServiceV2(notificationRepo repositories.NotificationRepository) *NotificationServiceV2 {
	return &NotificationServiceV2{notificationRepo: notificationRepo}
}

// ============================================================================
// HELPER — CreateNotification
// ============================================================================

// CreateNotification is the central helper used by all service-layer events.
// It persists a notification record for the given user.
//
// Parameters:
//   - userID   : recipient user ID
//   - title    : short notification title
//   - message  : full notification body
//   - notifType: one of the NotificationType* constants in models/enums.go
//   - entityID : optional related entity ID (job ID, application ID, etc.)
func (s *NotificationServiceV2) CreateNotification(
	ctx context.Context,
	userID, title, message, notifType, entityID string,
) error {
	notif := &models.Notification{
		ID:        uuid.New().String(),
		UserID:    userID,
		Title:     title,
		Message:   message,
		Type:      notifType,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	if entityID != "" {
		notif.RelatedEntityID = &entityID
	}

	return s.notificationRepo.CreateNotification(ctx, notif)
}

// ============================================================================
// GET NOTIFICATIONS (all, paginated)
// ============================================================================

// GetNotifications returns all notifications for a user with pagination.
func (s *NotificationServiceV2) GetNotifications(
	ctx context.Context,
	userID string,
	page, limit int,
) ([]dto.NotificationResponse, int64, error) {
	notifs, total, err := s.notificationRepo.GetNotificationsByUserID(ctx, userID, false, page, limit)
	if err != nil {
		return nil, 0, err
	}
	return toNotificationResponses(notifs), total, nil
}

// ============================================================================
// GET UNREAD NOTIFICATIONS (paginated)
// ============================================================================

// GetUnreadNotifications returns only unread notifications for a user.
func (s *NotificationServiceV2) GetUnreadNotifications(
	ctx context.Context,
	userID string,
	page, limit int,
) ([]dto.NotificationResponse, int64, error) {
	notifs, total, err := s.notificationRepo.GetNotificationsByUserID(ctx, userID, true, page, limit)
	if err != nil {
		return nil, 0, err
	}
	return toNotificationResponses(notifs), total, nil
}

// ============================================================================
// MARK NOTIFICATION AS READ
// ============================================================================

// MarkAsRead marks a single notification as read.
func (s *NotificationServiceV2) MarkAsRead(ctx context.Context, notifID string) error {
	return s.notificationRepo.MarkNotificationAsRead(ctx, notifID)
}

// GetUnreadCount returns the count of unread notifications for a user.
func (s *NotificationServiceV2) GetUnreadCount(ctx context.Context, userID string) (int, error) {
	return s.notificationRepo.GetUnreadCount(ctx, userID)
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

// toNotificationResponses converts model slice to DTO slice
func toNotificationResponses(notifs []*models.Notification) []dto.NotificationResponse {
	result := make([]dto.NotificationResponse, 0, len(notifs))
	for _, n := range notifs {
		result = append(result, toNotificationResponse(n))
	}
	return result
}

// toNotificationResponse converts a single model to DTO
func toNotificationResponse(n *models.Notification) dto.NotificationResponse {
	return dto.NotificationResponse{
		ID:                n.ID,
		Title:             n.Title,
		Message:           n.Message,
		Type:              n.Type,
		RelatedEntityType: n.RelatedEntityType,
		RelatedEntityID:   n.RelatedEntityID,
		IsRead:            n.IsRead,
		CreatedAt:         n.CreatedAt,
	}
}
