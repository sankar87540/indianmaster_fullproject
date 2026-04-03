package services

import (
	"context"
	"log"
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
	userRepo         repositories.UserRepository
	pushSvc          *ExpoPushService
}

// NewNotificationServiceV2 creates a new NotificationServiceV2
func NewNotificationServiceV2(
	notificationRepo repositories.NotificationRepository,
	userRepo repositories.UserRepository,
	pushSvc *ExpoPushService,
) *NotificationServiceV2 {
	return &NotificationServiceV2{
		notificationRepo: notificationRepo,
		userRepo:         userRepo,
		pushSvc:          pushSvc,
	}
}

// sendPushAsync looks up the user's push token and fires a push notification
// in a goroutine so it never blocks the main request path.
func (s *NotificationServiceV2) sendPushAsync(userID, title, message string) {
	if s.pushSvc == nil || s.userRepo == nil {
		return
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
		defer cancel()
		token, err := s.userRepo.GetPushToken(ctx, userID)
		if err != nil || token == "" {
			return
		}
		if err := s.pushSvc.Send(ctx, token, title, message); err != nil {
			log.Printf("[push] failed to send to user %s: %v", userID, err)
		}
	}()
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
	now := time.Now()
	notif := &models.Notification{
		ID:          uuid.New().String(),
		UserID:      userID,
		Title:       title,
		Message:     message,
		Type:        notifType,
		IsRead:      false,
		UnreadCount: 1,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if entityID != "" {
		notif.RelatedEntityID = &entityID
	}

	if err := s.notificationRepo.CreateNotification(ctx, notif); err != nil {
		return err
	}
	s.sendPushAsync(userID, title, message)
	return nil
}

// UpsertChatNotification creates or updates a CHAT_MESSAGE notification for a
// specific chat thread. If a notification already exists for this
// (receiverID, threadID) pair it is updated in place — the title reflects the
// latest sender name, the message shows the latest preview, and unread_count is
// incremented. This gives WhatsApp-style grouping: one notification per thread,
// not one per message.
func (s *NotificationServiceV2) UpsertChatNotification(
	ctx context.Context,
	receiverID, threadID, senderName, messagePreview string,
) error {
	threadIDCopy := threadID
	notif := &models.Notification{
		ID:              uuid.New().String(),
		UserID:          receiverID,
		Title:           "New message from " + senderName,
		Message:         messagePreview,
		Type:            models.NotificationTypeChatMessage,
		RelatedEntityID: &threadIDCopy,
		IsRead:          false,
		UnreadCount:     1,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}
	if err := s.notificationRepo.UpsertChatNotification(ctx, notif); err != nil {
		return err
	}
	s.sendPushAsync(receiverID, notif.Title, messagePreview)
	return nil
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
		UnreadCount:       n.UnreadCount,
		UpdatedAt:         n.UpdatedAt,
		CreatedAt:         n.CreatedAt,
	}
}
