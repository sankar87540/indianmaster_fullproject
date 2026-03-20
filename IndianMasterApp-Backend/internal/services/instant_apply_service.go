package services

import (
	"context"

	"myapp/internal/dto"
	"myapp/internal/models"
	"myapp/internal/repositories"

	"github.com/google/uuid"
)

// InstantApplyService handles instant job application submissions
type InstantApplyService struct {
	repo repositories.InstantJobApplicationRepository
}

// NewInstantApplyService creates a new InstantApplyService
func NewInstantApplyService(repo repositories.InstantJobApplicationRepository) *InstantApplyService {
	return &InstantApplyService{repo: repo}
}

// Submit persists an instant job application and returns the created record
func (s *InstantApplyService) Submit(ctx context.Context, req *dto.InstantJobApplicationRequest, userID string) (*dto.InstantJobApplicationResponse, error) {
	app := &models.InstantJobApplication{
		ID:          uuid.New().String(),
		UserID:      &userID,
		Name:        req.Name,
		Phone:       req.Phone,
		Role:        req.Role,
		Experience:  req.Experience,
		Location:    req.Location,
		CompanyName: req.CompanyName,
	}

	if err := s.repo.Create(ctx, app); err != nil {
		return nil, err
	}

	return &dto.InstantJobApplicationResponse{
		ID:          app.ID,
		Name:        app.Name,
		Phone:       app.Phone,
		Role:        app.Role,
		Experience:  app.Experience,
		Location:    app.Location,
		CompanyName: app.CompanyName,
		CreatedAt:   app.CreatedAt,
	}, nil
}
