package repositories

import (
	"context"
	"crypto/rand"
	"database/sql"
	"fmt"
	"log"
	"myapp/internal/errors"
	"myapp/internal/models"
)

// userRepository implements UserRepository interface
type userRepository struct {
	executor executor
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{executor: db}
}

// NewUserRepositoryWithTx creates a user repository within a transaction
func NewUserRepositoryWithTx(tx *sql.Tx) UserRepository {
	return &userRepository{executor: tx}
}

// Create inserts a new user
// Returns proper error types that map to HTTP status codes:
// - Validation errors → 400 Bad Request
// - Duplicate phone → 409 Conflict
// - Database errors → Mapped appropriately
func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	if user == nil {
		return errors.NewValidationError("user cannot be nil", nil)
	}

	if user.Phone == "" {
		return errors.NewValidationError("phone number is required", nil)
	}

	if user.Role == "" {
		return errors.NewValidationError("role is required", nil)
	}

	// Validate role enum
	validRoles := []string{"ADMIN", "WORKER", "HIRER"}
	isValidRole := false
	for _, validRole := range validRoles {
		if user.Role == validRole {
			isValidRole = true
			break
		}
	}
	if !isValidRole {
		return errors.NewValidationError(
			"invalid role value",
			map[string]interface{}{
				"role":         user.Role,
				"valid_values": validRoles,
			},
		)
	}

	// Validate language enum if provided
	if user.Language != "" {
		validLanguages := []string{"en", "hi", "ta"}
		isValidLanguage := false
		for _, validLang := range validLanguages {
			if user.Language == validLang {
				isValidLanguage = true
				break
			}
		}
		if !isValidLanguage {
			return errors.NewValidationError(
				"invalid language value",
				map[string]interface{}{
					"language":     user.Language,
					"valid_values": validLanguages,
				},
			)
		}
	} else {
		user.Language = "en" // Default language
	}

	// Generate ID if not provided
	if user.ID == "" {
		user.ID = generateUUID()
	}

	query := `
		INSERT INTO users (id, phone, full_name, role, language, email, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (phone) DO NOTHING
		RETURNING id, created_at, updated_at
	`

	// Pass nil for empty email to satisfy the chk_users_email_not_empty constraint
	// (DB allows NULL but not empty string "")
	var emailArg interface{}
	if user.Email != "" {
		emailArg = user.Email
	}

	row := r.executor.QueryRowContext(ctx, query,
		user.ID,
		user.Phone,
		user.FullName,
		user.Role,
		user.Language,
		emailArg,
		user.IsActive,
	)

	err := row.Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		// Log the actual database error for debugging
		log.Printf("DATABASE ERROR in Create: %v", err)

		if err == sql.ErrNoRows {
			return errors.NewConflictError("user with this phone number already exists")
		}

		// Map database error to proper application error
		return MapDatabaseError(err, "user creation")
	}

	return nil
}

// GetByID retrieves a user by ID
func (r *userRepository) GetByID(ctx context.Context, id string) (*models.User, error) {
	if id == "" {
		return nil, errors.NewValidationError("user id is required", nil)
	}

	user := &models.User{}
	query := `
		SELECT id, phone, full_name, role, language, email, is_active, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var email sql.NullString
	err := r.executor.QueryRowContext(ctx, query, id).Scan(
		&user.ID,
		&user.Phone,
		&user.FullName,
		&user.Role,
		&user.Language,
		&email,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, handleScanError(err, "user")
	}

	user.Email = email.String
	return user, nil
}

// GetByPhone retrieves a user by phone number
func (r *userRepository) GetByPhone(ctx context.Context, phone string) (*models.User, error) {
	if phone == "" {
		return nil, errors.NewValidationError("phone number is required", nil)
	}

	user := &models.User{}
	query := `
		SELECT id, phone, full_name, role, language, email, is_active, created_at, updated_at
		FROM users
		WHERE phone = $1
	`

	var email sql.NullString
	err := r.executor.QueryRowContext(ctx, query, phone).Scan(
		&user.ID,
		&user.Phone,
		&user.FullName,
		&user.Role,
		&user.Language,
		&email,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, handleScanError(err, "user")
	}

	user.Email = email.String
	return user, nil
}

// GetByEmail retrieves a user by email
func (r *userRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	if email == "" {
		return nil, errors.NewValidationError("email is required", nil)
	}

	user := &models.User{}
	query := `
		SELECT id, phone, full_name, role, language, email, password_hash, is_active, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	err := r.executor.QueryRowContext(ctx, query, email).Scan(
		&user.ID,
		&user.Phone,
		&user.FullName,
		&user.Role,
		&user.Language,
		&user.Email,
		&user.PasswordHash,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		return nil, handleScanError(err, "user")
	}

	return user, nil
}

// Update updates an existing user
func (r *userRepository) Update(ctx context.Context, user *models.User) error {
	if user == nil || user.ID == "" {
		return errors.NewValidationError("user and id cannot be nil", nil)
	}

	query := `
		UPDATE users
		SET phone = $1, full_name = $2, role = $3, language = $4, email = $5, is_active = $6
		WHERE id = $7
		RETURNING updated_at
	`

	// Pass nil for empty email to satisfy the chk_users_email_not_empty constraint
	// (DB allows NULL but not empty string "")
	var emailArg interface{}
	if user.Email != "" {
		emailArg = user.Email
	}

	err := r.executor.QueryRowContext(ctx, query,
		user.Phone, user.FullName, user.Role, user.Language, emailArg, user.IsActive, user.ID,
	).Scan(&user.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return errors.NewResourceNotFoundError("user", user.ID)
		}
		return errors.NewDatabaseError("failed to update user", err)
	}

	return nil
}

// Delete marks a user as inactive
func (r *userRepository) Delete(ctx context.Context, id string) error {
	if id == "" {
		return errors.NewValidationError("user id is required", nil)
	}

	query := `UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = $1`
	result, err := r.executor.ExecContext(ctx, query, id)
	if err != nil {
		return errors.NewDatabaseError("failed to delete user", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		return errors.NewResourceNotFoundError("user", id)
	}

	return nil
}

// ListByRole retrieves all users with a specific role
func (r *userRepository) ListByRole(ctx context.Context, role string) ([]*models.User, error) {
	if role == "" {
		return nil, errors.NewValidationError("role is required", nil)
	}

	query := `
		SELECT id, phone, full_name, role, language, email, is_active, created_at, updated_at
		FROM users
		WHERE role = $1
		ORDER BY created_at DESC
	`

	rows, err := r.executor.QueryContext(ctx, query, role)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list users by role", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID, &user.Phone, &user.FullName, &user.Role, &user.Language,
			&user.Email, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			return nil, errors.NewDatabaseError("failed to scan user", err)
		}
		users = append(users, user)
	}

	return users, rows.Err()
}

// ListByRoleWithPagination retrieves paginated users with a specific role
// Returns the users, total count, and any error
// Supports sorting and pagination
func (r *userRepository) ListByRoleWithPagination(ctx context.Context, role string, page, limit int, sort, order string) ([]*models.User, int64, error) {
	if role == "" {
		return nil, 0, errors.NewValidationError("role is required", nil)
	}

	if limit > 100 {
		limit = 100
	}
	if limit < 1 {
		limit = 20
	}
	if page < 1 {
		page = 1
	}

	// Default sort to created_at if not provided
	if sort == "" {
		sort = "created_at"
	}

	// Default order to desc if not provided
	switch order {
	case "asc":
		order = "ASC"
	default:
		order = "DESC"
	}

	// Get total count
	countQuery := `SELECT COUNT(*) FROM users WHERE role = $1`
	var totalCount int64
	err := r.executor.QueryRowContext(ctx, countQuery, role).Scan(&totalCount)
	if err != nil {
		return nil, 0, errors.NewDatabaseError("failed to count users", err)
	}

	offset := (page - 1) * limit

	// Get paginated data
	query := fmt.Sprintf(`
		SELECT id, phone, full_name, role, language, email, is_active, created_at, updated_at
		FROM users
		WHERE role = $1
		ORDER BY %s %s
		LIMIT $2 OFFSET $3
	`, sort, order)

	rows, err := r.executor.QueryContext(ctx, query, role, limit, offset)
	if err != nil {
		return nil, 0, errors.NewDatabaseError("failed to list users by role with pagination", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID, &user.Phone, &user.FullName, &user.Role, &user.Language,
			&user.Email, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			return nil, 0, errors.NewDatabaseError("failed to scan user", err)
		}
		users = append(users, user)
	}

	return users, totalCount, rows.Err()
}

// ListActive retrieves all active users
func (r *userRepository) ListActive(ctx context.Context) ([]*models.User, error) {
	query := `
		SELECT id, phone, full_name, role, language, email, is_active, created_at, updated_at
		FROM users
		WHERE is_active = TRUE
		ORDER BY created_at DESC
	`

	rows, err := r.executor.QueryContext(ctx, query)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list active users", err)
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		user := &models.User{}
		err := rows.Scan(
			&user.ID, &user.Phone, &user.FullName, &user.Role, &user.Language,
			&user.Email, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
		)
		if err != nil {
			fmt.Println("REAL DB ERROR:", err)
			return nil, err // Return nil for users and the error
		}
		users = append(users, user)
	}

	return users, rows.Err()
}

// UpdatePushToken stores or replaces the Expo push token for a user.
func (r *userRepository) UpdatePushToken(ctx context.Context, userID, token string) error {
	if userID == "" {
		return errors.NewValidationError("user id is required", nil)
	}
	query := `UPDATE users SET push_token = $1, updated_at = NOW() WHERE id = $2`
	_, err := r.executor.ExecContext(ctx, query, token, userID)
	if err != nil {
		return errors.NewDatabaseError("failed to update push token", err)
	}
	return nil
}

// GetPushToken retrieves the stored Expo push token for a user.
// Returns an empty string (and no error) if the user has no token.
func (r *userRepository) GetPushToken(ctx context.Context, userID string) (string, error) {
	if userID == "" {
		return "", errors.NewValidationError("user id is required", nil)
	}
	var token sql.NullString
	query := `SELECT push_token FROM users WHERE id = $1`
	err := r.executor.QueryRowContext(ctx, query, userID).Scan(&token)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", errors.NewDatabaseError("failed to get push token", err)
	}
	return token.String, nil
}

// generateUUID creates a UUID v4 string
func generateUUID() string {
	uuid := make([]byte, 16)
	if _, err := rand.Read(uuid); err != nil {
		// Fallback if rand.Read fails (shouldn't happen)
		return "00000000-0000-0000-0000-000000000000"
	}

	// Set version (4) and variant bits
	uuid[6] = (uuid[6] & 0x0f) | 0x40
	uuid[8] = (uuid[8] & 0x3f) | 0x80

	// Format as UUID string
	return fmt.Sprintf("%08x-%04x-%04x-%04x-%012x",
		uuid[0:4], uuid[4:6], uuid[6:8], uuid[8:10], uuid[10:16])
}
