package handlers

import (
	"strconv"

	"myapp/internal/dto"
	"myapp/internal/middleware"
	"myapp/internal/repositories"
	"myapp/internal/services"

	"github.com/gin-gonic/gin"
)

// ============================================================================
// PUSH TOKEN HANDLER
// ============================================================================

// PushTokenHandler handles saving/updating the device push token for a user.
type PushTokenHandler struct {
	userRepo repositories.UserRepository
}

// NewPushTokenHandler creates a new PushTokenHandler.
func NewPushTokenHandler(userRepo repositories.UserRepository) *PushTokenHandler {
	return &PushTokenHandler{userRepo: userRepo}
}

type savePushTokenRequest struct {
	Token string `json:"token" binding:"required"`
}

// SavePushToken stores/updates the Expo push token for the authenticated user.
// PUT /api/v1/user/push-token
func (h *PushTokenHandler) SavePushToken(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized")
		return
	}

	var req savePushTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		dto.BadRequestResponse(c, "token is required", nil)
		return
	}

	if err := h.userRepo.UpdatePushToken(c.Request.Context(), userID, req.Token); err != nil {
		dto.InternalServerErrorResponse(c, "Failed to save push token", nil)
		return
	}

	dto.OKResponse(c, "Push token saved", nil)
}

// ============================================================================
// NOTIFICATION HANDLER V2
// ============================================================================

// NotificationHandlerV2 handles all notification-related HTTP endpoints
type NotificationHandlerV2 struct {
	service *services.NotificationServiceV2
}

// NewNotificationHandlerV2 creates a new NotificationHandlerV2
func NewNotificationHandlerV2(service *services.NotificationServiceV2) *NotificationHandlerV2 {
	return &NotificationHandlerV2{service: service}
}

// GetNotifications godoc
// @Summary Get All Notifications
// @Description Retrieve paginated notifications for the authenticated user (all, read + unread)
// @Tags Notification
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Success 200 {object} dto.APIResponse "Notifications retrieved successfully"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Failed to fetch notifications"
// @Router /notifications [get]
// @Security BearerAuth
func (h *NotificationHandlerV2) GetNotifications(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	notifications, total, err := h.service.GetNotifications(c.Request.Context(), userID, page, limit)
	if err != nil {
		internalError(c, "Failed to fetch notifications", err)
		return
	}

	dto.PaginatedSuccessResponse(c, "Notifications retrieved successfully", notifications, total, page, limit)
}

// GetUnreadNotifications godoc
// @Summary Get Unread Notifications
// @Description Retrieve paginated unread notifications for the authenticated user
// @Tags Notification
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page (max 100)" default(20)
// @Success 200 {object} dto.APIResponse "Unread notifications retrieved successfully"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Failed to fetch unread notifications"
// @Router /notifications/unread [get]
// @Security BearerAuth
func (h *NotificationHandlerV2) GetUnreadNotifications(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}

	notifications, total, err := h.service.GetUnreadNotifications(c.Request.Context(), userID, page, limit)
	if err != nil {
		internalError(c, "Failed to fetch unread notifications", err)
		return
	}

	dto.PaginatedSuccessResponse(c, "Unread notifications retrieved successfully", notifications, total, page, limit)
}

// MarkNotificationRead godoc
// @Summary Mark Notification as Read
// @Description Mark a specific notification as read for the authenticated user
// @Tags Notification
// @Accept json
// @Produce json
// @Param id path string true "Notification ID"
// @Success 200 {object} dto.APIResponse "Notification marked as read"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 404 {object} dto.APIResponse "Notification not found"
// @Failure 500 {object} dto.APIResponse "Failed to mark notification as read"
// @Router /notifications/{id}/read [patch]
// @Security BearerAuth
func (h *NotificationHandlerV2) MarkNotificationRead(c *gin.Context) {
	_, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	notifID := c.Param("id")
	if notifID == "" {
		dto.BadRequestResponse(c, "Notification ID is required", nil)
		return
	}

	if err := h.service.MarkAsRead(c.Request.Context(), notifID); err != nil {
		if err.Error() == "notification not found: "+notifID {
			dto.NotFoundResponse(c, "Notification not found")
			return
		}
		internalError(c, "Failed to mark notification as read", err)
		return
	}

	dto.OKResponse(c, "Notification marked as read", nil)
}

// GetUnreadCount godoc
// @Summary Get Unread Notification Count
// @Description Get the count of unread notifications for the authenticated user
// @Tags Notification
// @Accept json
// @Produce json
// @Success 200 {object} dto.APIResponse "Unread count retrieved successfully"
// @Failure 401 {object} dto.APIResponse "Unauthorized"
// @Failure 500 {object} dto.APIResponse "Failed to get unread count"
// @Router /notifications/unread/count [get]
// @Security BearerAuth
func (h *NotificationHandlerV2) GetUnreadCount(c *gin.Context) {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		dto.UnauthorizedResponse(c, "Unauthorized: user not found in context")
		return
	}

	count, err := h.service.GetUnreadCount(c.Request.Context(), userID)
	if err != nil {
		internalError(c, "Failed to get unread count", err)
		return
	}

	dto.OKResponse(c, "Unread count retrieved successfully", gin.H{"unreadCount": count})
}
