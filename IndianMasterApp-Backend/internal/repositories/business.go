package repositories

import (
	"context"
	"database/sql"
	"myapp/internal/errors"
	"myapp/internal/models"

	"github.com/lib/pq"
)

type businessRepository struct {
	executor executor
}

func NewBusinessRepository(db *sql.DB) BusinessRepository {
	return &businessRepository{executor: db}
}

func NewBusinessRepositoryWithTx(tx *sql.Tx) BusinessRepository {
	return &businessRepository{executor: tx}
}

// isColumnUndefined returns true when PostgreSQL reports that a column does not
// exist (error code 42703). Used to gracefully handle queries that reference
// employee_count before migration 000020 has been applied.
func isColumnUndefined(err error) bool {
	if pqErr, ok := err.(*pq.Error); ok {
		return pqErr.Code == "42703"
	}
	return false
}

// trySetEmployeeCount issues a separate UPDATE for the employee_count column.
// If the column does not exist yet (migration pending) the error is silently
// ignored so the main create/update path still succeeds.
func (r *businessRepository) trySetEmployeeCount(ctx context.Context, businessID string, count int) {
	_, err := r.executor.ExecContext(ctx,
		`UPDATE businesses SET employee_count = $1 WHERE id = $2`,
		count, businessID,
	)
	if err != nil && !isColumnUndefined(err) {
		// Non-column errors are unexpected but non-fatal for this optional field
		_ = err
	}
}

// tryFetchEmployeeCount attempts to read employee_count for a single business.
// Leaves dest unchanged if the column does not exist yet.
func (r *businessRepository) tryFetchEmployeeCount(ctx context.Context, businessID string, dest *int) {
	_ = r.executor.QueryRowContext(ctx,
		`SELECT COALESCE(employee_count, 0) FROM businesses WHERE id = $1`,
		businessID,
	).Scan(dest)
}

// baseColumns is the column list used in every SELECT — does NOT include
// employee_count so queries work before migration 000020 is applied.
const businessBaseSelect = `
	SELECT id, owner_id, business_name, owner_name, contact_role, business_type, email, mobile_number,
	       fssai_license, gst_number, logo_url, city, state, address_text, latitude, longitude,
	       is_active, language, created_at, updated_at`

func scanBusiness(scanner interface {
	Scan(dest ...any) error
}, b *models.Business) error {
	var lat, lng sql.NullFloat64
	err := scanner.Scan(
		&b.ID, &b.OwnerID, &b.BusinessName, &b.OwnerName, &b.ContactRole,
		&b.BusinessType, &b.Email, &b.MobileNumber, &b.FSAILicense, &b.GSTNumber,
		&b.LogoURL, &b.City, &b.State, &b.AddressText, &lat, &lng,
		&b.IsActive, &b.Language, &b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		return err
	}
	b.Latitude = lat.Float64
	b.Longitude = lng.Float64
	return nil
}

func (r *businessRepository) Create(ctx context.Context, business *models.Business) error {
	if business == nil {
		return errors.NewValidationError("business cannot be nil", nil)
	}
	if business.OwnerID == "" {
		return errors.NewValidationError("owner_id is required", nil)
	}
	if business.BusinessName == "" {
		return errors.NewValidationError("business_name is required", nil)
	}

	// Core INSERT — no employee_count so this works before migration 000020
	query := `
		INSERT INTO businesses
			(id, owner_id, business_name, owner_name, contact_role, business_type,
			 email, mobile_number, fssai_license, gst_number, logo_url,
			 city, state, address_text, latitude, longitude, is_active, language)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
		RETURNING id, created_at, updated_at
	`

	row := r.executor.QueryRowContext(ctx, query,
		business.ID, business.OwnerID, business.BusinessName, business.OwnerName, business.ContactRole,
		business.BusinessType, business.Email, business.MobileNumber, business.FSAILicense, business.GSTNumber,
		business.LogoURL, business.City, business.State, business.AddressText,
		business.Latitude, business.Longitude, business.IsActive, business.Language,
	)

	if err := row.Scan(&business.ID, &business.CreatedAt, &business.UpdatedAt); err != nil {
		return errors.NewDatabaseError("failed to create business", err)
	}

	// Optional: save employee_count if column exists (migration 000020)
	if business.EmployeeCount != 0 {
		r.trySetEmployeeCount(ctx, business.ID, business.EmployeeCount)
	}

	return nil
}

func (r *businessRepository) GetByID(ctx context.Context, id string) (*models.Business, error) {
	if id == "" {
		return nil, errors.NewValidationError("business id is required", nil)
	}

	b := &models.Business{}
	query := businessBaseSelect + ` FROM businesses WHERE id = $1`
	if err := scanBusiness(r.executor.QueryRowContext(ctx, query, id), b); err != nil {
		return nil, handleScanError(err, "business")
	}
	r.tryFetchEmployeeCount(ctx, b.ID, &b.EmployeeCount)
	return b, nil
}

func (r *businessRepository) GetByOwnerID(ctx context.Context, ownerID string) ([]*models.Business, error) {
	if ownerID == "" {
		return nil, errors.NewValidationError("owner_id is required", nil)
	}

	query := businessBaseSelect + `
		FROM businesses WHERE owner_id = $1 AND is_active = TRUE
		ORDER BY created_at DESC`

	rows, err := r.executor.QueryContext(ctx, query, ownerID)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to get businesses by owner", err)
	}
	defer rows.Close()

	var businesses []*models.Business
	for rows.Next() {
		b := &models.Business{}
		if err := scanBusiness(rows, b); err != nil {
			return nil, errors.NewDatabaseError("failed to scan business", err)
		}
		r.tryFetchEmployeeCount(ctx, b.ID, &b.EmployeeCount)
		businesses = append(businesses, b)
	}
	return businesses, rows.Err()
}

func (r *businessRepository) GetFirstByOwnerID(ctx context.Context, ownerID string) (*models.Business, error) {
	if ownerID == "" {
		return nil, errors.NewValidationError("owner_id is required", nil)
	}

	b := &models.Business{}
	query := businessBaseSelect + `
		FROM businesses WHERE owner_id = $1 AND is_active = TRUE
		ORDER BY created_at ASC LIMIT 1`

	if err := scanBusiness(r.executor.QueryRowContext(ctx, query, ownerID), b); err != nil {
		return nil, handleScanError(err, "business")
	}
	r.tryFetchEmployeeCount(ctx, b.ID, &b.EmployeeCount)
	return b, nil
}

func (r *businessRepository) Update(ctx context.Context, business *models.Business) error {
	if business == nil || business.ID == "" {
		return errors.NewValidationError("business and id cannot be nil", nil)
	}

	// Core UPDATE — no employee_count so this works before migration 000020
	query := `
		UPDATE businesses
		SET business_name = $1, owner_name = $2, contact_role = $3, business_type = $4,
		    email = $5, mobile_number = $6, fssai_license = $7, gst_number = $8,
		    logo_url = $9, city = $10, state = $11, address_text = $12,
		    latitude = $13, longitude = $14, is_active = $15, language = $16,
		    updated_at = NOW()
		WHERE id = $17
		RETURNING updated_at
	`

	row := r.executor.QueryRowContext(ctx, query,
		business.BusinessName, business.OwnerName, business.ContactRole, business.BusinessType,
		business.Email, business.MobileNumber, business.FSAILicense, business.GSTNumber,
		business.LogoURL, business.City, business.State, business.AddressText,
		business.Latitude, business.Longitude, business.IsActive, business.Language,
		business.ID,
	)

	if err := row.Scan(&business.UpdatedAt); err != nil {
		if err == sql.ErrNoRows {
			return errors.NewResourceNotFoundError("business", business.ID)
		}
		return errors.NewDatabaseError("failed to update business", err)
	}

	// Optional: persist employee_count if column exists
	r.trySetEmployeeCount(ctx, business.ID, business.EmployeeCount)

	return nil
}

func (r *businessRepository) Delete(ctx context.Context, id string) error {
	if id == "" {
		return errors.NewValidationError("business id is required", nil)
	}

	query := `UPDATE businesses SET is_active = FALSE, updated_at = NOW() WHERE id = $1`
	result, err := r.executor.ExecContext(ctx, query, id)
	if err != nil {
		return errors.NewDatabaseError("failed to delete business", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		return errors.NewResourceNotFoundError("business", id)
	}
	return nil
}

func (r *businessRepository) ListByCity(ctx context.Context, city string) ([]*models.Business, error) {
	if city == "" {
		return nil, errors.NewValidationError("city is required", nil)
	}

	query := businessBaseSelect + `
		FROM businesses WHERE city = $1 AND is_active = TRUE
		ORDER BY created_at DESC`

	rows, err := r.executor.QueryContext(ctx, query, city)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list businesses by city", err)
	}
	defer rows.Close()

	var businesses []*models.Business
	for rows.Next() {
		b := &models.Business{}
		if err := scanBusiness(rows, b); err != nil {
			return nil, errors.NewDatabaseError("failed to scan business", err)
		}
		businesses = append(businesses, b)
	}
	return businesses, rows.Err()
}

func (r *businessRepository) ListByType(ctx context.Context, businessType string) ([]*models.Business, error) {
	if businessType == "" {
		return nil, errors.NewValidationError("business_type is required", nil)
	}

	query := businessBaseSelect + `
		FROM businesses WHERE business_type = $1 AND is_active = TRUE
		ORDER BY created_at DESC`

	rows, err := r.executor.QueryContext(ctx, query, businessType)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list businesses by type", err)
	}
	defer rows.Close()

	var businesses []*models.Business
	for rows.Next() {
		b := &models.Business{}
		if err := scanBusiness(rows, b); err != nil {
			return nil, errors.NewDatabaseError("failed to scan business", err)
		}
		businesses = append(businesses, b)
	}
	return businesses, rows.Err()
}

func (r *businessRepository) ListActive(ctx context.Context) ([]*models.Business, error) {
	query := businessBaseSelect + `
		FROM businesses WHERE is_active = TRUE
		ORDER BY created_at DESC`

	rows, err := r.executor.QueryContext(ctx, query)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list active businesses", err)
	}
	defer rows.Close()

	var businesses []*models.Business
	for rows.Next() {
		b := &models.Business{}
		if err := scanBusiness(rows, b); err != nil {
			return nil, errors.NewDatabaseError("failed to scan business", err)
		}
		businesses = append(businesses, b)
	}
	return businesses, rows.Err()
}

func (r *businessRepository) ExistsByID(ctx context.Context, id string) (bool, error) {
	if id == "" {
		return false, errors.NewValidationError("business id is required", nil)
	}

	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM businesses WHERE id = $1 AND is_active = TRUE)`
	if err := r.executor.QueryRowContext(ctx, query, id).Scan(&exists); err != nil {
		return false, errors.NewDatabaseError("failed to check business existence", err)
	}
	return exists, nil
}
