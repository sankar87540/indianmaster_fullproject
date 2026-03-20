package repositories

import (
	"context"
	"database/sql"

	"myapp/internal/models"
)

// instantJobApplicationRepo implements InstantJobApplicationRepository using Postgres
type instantJobApplicationRepo struct {
	db *sql.DB
}

// NewInstantJobApplicationRepository creates a new InstantJobApplicationRepository
func NewInstantJobApplicationRepository(db *sql.DB) InstantJobApplicationRepository {
	return &instantJobApplicationRepo{db: db}
}

// Create inserts a new instant job application row
func (r *instantJobApplicationRepo) Create(ctx context.Context, app *models.InstantJobApplication) error {
	query := `
		INSERT INTO instant_job_applications
			(id, user_id, name, phone, role, experience, location, company_name)
		VALUES
			($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING created_at`

	return r.db.QueryRowContext(ctx, query,
		app.ID,
		app.UserID,
		app.Name,
		app.Phone,
		app.Role,
		app.Experience,
		app.Location,
		app.CompanyName,
	).Scan(&app.CreatedAt)
}
