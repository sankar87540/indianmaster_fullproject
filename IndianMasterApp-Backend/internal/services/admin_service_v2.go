package services

import (
	"context"
	"fmt"

	"myapp/internal/models"
	"myapp/internal/repositories"
	"myapp/internal/utils"
)

// ============================================================================
// ADMIN SERVICE V2 — with notification triggers on verification events
// ============================================================================

// AdminServiceV2 handles admin operations with notification support
type AdminServiceV2 struct {
	verificationRepo repositories.VerificationRepository
	auditRepo        repositories.AuditRepository
	notificationSvc  *NotificationServiceV2
	cache            *utils.CacheService
}

// NewAdminServiceV2 creates a new AdminServiceV2
func NewAdminServiceV2(
	verificationRepo repositories.VerificationRepository,
	auditRepo repositories.AuditRepository,
	notificationSvc *NotificationServiceV2,
	cache *utils.CacheService,
) *AdminServiceV2 {
	return &AdminServiceV2{
		verificationRepo: verificationRepo,
		auditRepo:        auditRepo,
		notificationSvc:  notificationSvc,
		cache:            cache,
	}
}

// ApproveVerification approves a pending verification and notifies the entity owner.
//
// Triggers:
//   - Admin verifies a worker   → notify worker (KYC_APPROVED)
//   - Admin verifies a business → notify business owner (KYC_APPROVED)
func (s *AdminServiceV2) ApproveVerification(ctx context.Context, entityType, entityID, adminID string) error {
	if err := s.verificationRepo.ApproveVerification(ctx, entityType, entityID); err != nil {
		return err
	}

	// Notify the entity owner about approval
	go s.notifyVerificationApproved(context.Background(), entityType, entityID)

	// Invalidate search/recommendation caches since verified status affects results
	_ = s.cache.InvalidateSearchCache(ctx)
	_ = s.cache.InvalidateAllWorkerRecommendations(ctx)

	return nil
}

// RejectVerification rejects a pending verification and notifies the entity owner.
//
// Triggers:
//   - Admin rejects a worker   → notify worker (KYC_REJECTED)
//   - Admin rejects a business → notify business owner (KYC_REJECTED)
func (s *AdminServiceV2) RejectVerification(ctx context.Context, entityType, entityID, reason, adminID string) error {
	if err := s.verificationRepo.RejectVerification(ctx, entityType, entityID, reason); err != nil {
		return err
	}

	// Notify the entity owner about rejection
	go s.notifyVerificationRejected(context.Background(), entityType, entityID, reason)

	return nil
}

// ============================================================================
// INTERNAL NOTIFICATION HELPERS
// ============================================================================

// notifyVerificationApproved sends a KYC_APPROVED notification to the entity owner.
func (s *AdminServiceV2) notifyVerificationApproved(ctx context.Context, entityType, entityID string) {
	// In production: look up entity → get owner user_id
	// For now we use entityID as a stand-in for the user_id to demonstrate wiring
	userID := entityID

	var title, message string
	var notifType string

	switch entityType {
	case "WORKER":
		title = "Identity Verified ✅"
		message = "Your worker profile has been verified by our admin team. You can now apply to jobs with a verified badge!"
		notifType = models.NotificationTypeKYCApproved
	case "BUSINESS":
		title = "Business Verified ✅"
		message = "Your business has been verified by our admin team. Your listings will now show a verified badge!"
		notifType = models.NotificationTypeKYCApproved
	default:
		title = "Verification Approved"
		message = fmt.Sprintf("Your %s verification has been approved.", entityType)
		notifType = models.NotificationTypeKYCApproved
	}

	_ = s.notificationSvc.CreateNotification(
		ctx,
		userID,
		title,
		message,
		notifType,
		entityID,
	)
}

// notifyVerificationRejected sends a KYC_REJECTED notification to the entity owner.
func (s *AdminServiceV2) notifyVerificationRejected(ctx context.Context, entityType, entityID, reason string) {
	// In production: look up entity → get owner user_id
	userID := entityID

	var title, message string

	switch entityType {
	case "WORKER":
		title = "Verification Update"
		message = fmt.Sprintf("Your worker verification was not approved. Reason: %s. Please re-submit with correct documents.", reason)
	case "BUSINESS":
		title = "Business Verification Update"
		message = fmt.Sprintf("Your business verification was not approved. Reason: %s. Please re-submit with correct documents.", reason)
	default:
		title = "Verification Rejected"
		message = fmt.Sprintf("Your %s verification was rejected. Reason: %s", entityType, reason)
	}

	_ = s.notificationSvc.CreateNotification(
		ctx,
		userID,
		title,
		message,
		models.NotificationTypeKYCRejected,
		entityID,
	)
}
