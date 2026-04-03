package repositories

import (
	"context"
	"database/sql"

	"myapp/internal/errors"
	"myapp/internal/models"

	"github.com/google/uuid"
)

// ============= HIRER WORKER UNLOCK REPOSITORY =============

type hirerWorkerUnlockRepository struct {
	executor executor
}

func NewHirerWorkerUnlockRepository(db *sql.DB) HirerWorkerUnlockRepository {
	return &hirerWorkerUnlockRepository{executor: db}
}

func NewHirerWorkerUnlockRepositoryWithTx(tx *sql.Tx) HirerWorkerUnlockRepository {
	return &hirerWorkerUnlockRepository{executor: tx}
}

// Create records a new unlock for (hirer, worker). Safe to call multiple times — ON CONFLICT DO NOTHING.
func (r *hirerWorkerUnlockRepository) Create(ctx context.Context, unlock *models.HirerWorkerUnlock) error {
	if unlock.ID == "" {
		unlock.ID = uuid.New().String()
	}
	query := `
		INSERT INTO hirer_worker_unlocks (id, hirer_user_id, worker_id, unlocked_at, created_at)
		VALUES ($1, $2, $3, NOW(), NOW())
		ON CONFLICT (hirer_user_id, worker_id) DO NOTHING
	`
	_, err := r.executor.ExecContext(ctx, query, unlock.ID, unlock.HirerUserID, unlock.WorkerID)
	if err != nil {
		return errors.NewDatabaseError("failed to create hirer worker unlock", err)
	}
	return nil
}

// IsUnlocked returns true if the hirer has previously unlocked this worker's contact.
func (r *hirerWorkerUnlockRepository) IsUnlocked(ctx context.Context, hirerUserID, workerID string) (bool, error) {
	var count int
	query := `SELECT COUNT(1) FROM hirer_worker_unlocks WHERE hirer_user_id = $1 AND worker_id = $2`
	err := r.executor.QueryRowContext(ctx, query, hirerUserID, workerID).Scan(&count)
	if err != nil {
		return false, errors.NewDatabaseError("failed to check worker unlock status", err)
	}
	return count > 0, nil
}
