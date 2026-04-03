package repositories

import (
	"context"
	"database/sql"

	"myapp/internal/models"
)

type workerResumeRepository struct {
	db *sql.DB
}

// NewWorkerResumeRepository creates a new WorkerResumeRepository backed by Postgres.
func NewWorkerResumeRepository(db *sql.DB) WorkerResumeRepository {
	return &workerResumeRepository{db: db}
}

// Upsert deactivates all existing active resumes for the worker, then inserts
// the new resume record as the single active one. Both steps run in one transaction
// so the worker always has exactly one active resume after this call.
func (r *workerResumeRepository) Upsert(ctx context.Context, resume *models.WorkerResume) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback() //nolint:errcheck

	// Step 1: mark all current active resumes for this worker as inactive.
	_, err = tx.ExecContext(ctx, `
		UPDATE worker_resumes
		SET    is_active  = FALSE,
		       updated_at = NOW()
		WHERE  worker_id  = $1
		  AND  is_active  = TRUE
		  AND  deleted_at IS NULL
	`, resume.WorkerID)
	if err != nil {
		return err
	}

	// Step 2: insert the new resume as active.
	_, err = tx.ExecContext(ctx, `
		INSERT INTO worker_resumes
			(id, worker_id, file_url, original_name, stored_name, mime_type, file_size,
			 is_active, uploaded_at, created_at, updated_at)
		VALUES
			($1, $2, $3, $4, $5, $6, $7,
			 TRUE, NOW(), NOW(), NOW())
	`, resume.ID, resume.WorkerID, resume.FileURL,
		resume.OriginalName, resume.StoredName, resume.MimeType, resume.FileSize)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// GetActiveByWorkerID returns the most-recently uploaded active resume for the
// given worker, or sql.ErrNoRows if none exists.
func (r *workerResumeRepository) GetActiveByWorkerID(ctx context.Context, workerID string) (*models.WorkerResume, error) {
	row := r.db.QueryRowContext(ctx, `
		SELECT id, worker_id, file_url, original_name, stored_name, mime_type, file_size,
		       is_active, uploaded_at, created_at, updated_at, deleted_at
		FROM   worker_resumes
		WHERE  worker_id = $1
		  AND  is_active = TRUE
		  AND  deleted_at IS NULL
		ORDER  BY uploaded_at DESC
		LIMIT  1
	`, workerID)

	var resume models.WorkerResume
	err := row.Scan(
		&resume.ID, &resume.WorkerID, &resume.FileURL,
		&resume.OriginalName, &resume.StoredName, &resume.MimeType, &resume.FileSize,
		&resume.IsActive, &resume.UploadedAt, &resume.CreatedAt, &resume.UpdatedAt, &resume.DeletedAt,
	)
	if err != nil {
		return nil, err // caller checks sql.ErrNoRows
	}
	return &resume, nil
}
