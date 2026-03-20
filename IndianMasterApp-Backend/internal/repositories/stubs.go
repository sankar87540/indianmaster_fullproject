package repositories

import (
	"context"
	"database/sql"
	"myapp/internal/errors"
	"myapp/internal/models"
)

// ============= WORKER REPOSITORY =============

type workerRepository struct {
	executor executor
}

func NewWorkerRepository(db *sql.DB) WorkerRepository {
	return &workerRepository{executor: db}
}

func NewWorkerRepositoryWithTx(tx *sql.Tx) WorkerRepository {
	return &workerRepository{executor: tx}
}

func (r *workerRepository) Create(ctx context.Context, worker *models.Worker) error {
	if worker == nil {
		return errors.NewValidationError("worker cannot be nil", nil)
	}
	if worker.UserID == "" {
		return errors.NewValidationError("user_id is required", nil)
	}

	query := `
		INSERT INTO workers (
			id, user_id, profile_photo_url, experience_years,
			selected_roles, venue_preferences, work_types, availability,
			business_types, job_categories, job_roles, languages_known,
			availability_status, expected_salary_min, expected_salary_max,
			live_latitude, live_longitude, language, is_active,
			age, gender, address, city, state,
			is_educated, education_level, degree, college, aadhaar_number,
			full_name, phone, email
		) VALUES (
			$1, $2, $3, $4,
			$5, $6, $7, $8,
			$9, $10, $11, $12,
			$13, $14, $15,
			$16, $17, $18, $19,
			$20, $21, $22, $23, $24,
			$25, $26, $27, $28, $29,
			$30, $31, $32
		)
		RETURNING id, created_at, updated_at
	`

	row := r.executor.QueryRowContext(ctx, query,
		worker.ID, worker.UserID, worker.ProfilePhotoURL, worker.ExperienceYears,
		worker.SelectedRoles, worker.VenuePreferences, worker.WorkTypes, worker.Availability,
		worker.BusinessTypes, worker.JobCategories, worker.JobRoles, worker.LanguagesKnown,
		worker.AvailabilityStatus, worker.ExpectedSalaryMin, worker.ExpectedSalaryMax,
		worker.LiveLatitude, worker.LiveLongitude, worker.Language, worker.IsActive,
		worker.Age, worker.Gender, worker.Address, worker.City, worker.State,
		worker.IsEducated, worker.EducationLevel, worker.Degree, worker.College, worker.AadhaarNumber,
		worker.FullName, worker.Phone, worker.Email,
	)

	err := row.Scan(&worker.ID, &worker.CreatedAt, &worker.UpdatedAt)
	if err != nil {
		return errors.NewDatabaseError("failed to create worker", err)
	}

	return nil
}

func (r *workerRepository) GetByID(ctx context.Context, id string) (*models.Worker, error) {
	if id == "" {
		return nil, errors.NewValidationError("worker id is required", nil)
	}

	worker := &models.Worker{}
	query := `
		SELECT id, user_id, profile_photo_url, experience_years,
		       selected_roles, venue_preferences, work_types, availability,
		       business_types, job_categories, job_roles, languages_known,
		       availability_status, expected_salary_min, expected_salary_max,
		       live_latitude, live_longitude, last_active,
		       completion_percentage, rating, total_reviews,
		       age, gender, address, city, state,
		       is_educated, education_level, degree, college, aadhaar_number,
		       full_name, phone, email,
		       language, is_active, created_at, updated_at
		FROM workers WHERE id = $1
	`

	err := r.executor.QueryRowContext(ctx, query, id).Scan(
		&worker.ID, &worker.UserID, &worker.ProfilePhotoURL, &worker.ExperienceYears,
		&worker.SelectedRoles, &worker.VenuePreferences, &worker.WorkTypes, &worker.Availability,
		&worker.BusinessTypes, &worker.JobCategories, &worker.JobRoles, &worker.LanguagesKnown,
		&worker.AvailabilityStatus, &worker.ExpectedSalaryMin, &worker.ExpectedSalaryMax,
		&worker.LiveLatitude, &worker.LiveLongitude, &worker.LastActive,
		&worker.CompletionPercentage, &worker.Rating, &worker.TotalReviews,
		&worker.Age, &worker.Gender, &worker.Address, &worker.City, &worker.State,
		&worker.IsEducated, &worker.EducationLevel, &worker.Degree, &worker.College, &worker.AadhaarNumber,
		&worker.FullName, &worker.Phone, &worker.Email,
		&worker.Language, &worker.IsActive, &worker.CreatedAt, &worker.UpdatedAt,
	)

	if err != nil {
		return nil, handleScanError(err, "worker")
	}

	return worker, nil
}

func (r *workerRepository) GetByUserID(ctx context.Context, userID string) (*models.Worker, error) {
	if userID == "" {
		return nil, errors.NewValidationError("user_id is required", nil)
	}

	worker := &models.Worker{}
	query := `
		SELECT id, user_id, profile_photo_url, experience_years,
		       selected_roles, venue_preferences, work_types, availability,
		       business_types, job_categories, job_roles, languages_known,
		       availability_status, expected_salary_min, expected_salary_max,
		       live_latitude, live_longitude, last_active,
		       completion_percentage, rating, total_reviews,
		       age, gender, address, city, state,
		       is_educated, education_level, degree, college, aadhaar_number,
		       full_name, phone, email,
		       language, is_active, created_at, updated_at
		FROM workers WHERE user_id = $1
	`

	err := r.executor.QueryRowContext(ctx, query, userID).Scan(
		&worker.ID, &worker.UserID, &worker.ProfilePhotoURL, &worker.ExperienceYears,
		&worker.SelectedRoles, &worker.VenuePreferences, &worker.WorkTypes, &worker.Availability,
		&worker.BusinessTypes, &worker.JobCategories, &worker.JobRoles, &worker.LanguagesKnown,
		&worker.AvailabilityStatus, &worker.ExpectedSalaryMin, &worker.ExpectedSalaryMax,
		&worker.LiveLatitude, &worker.LiveLongitude, &worker.LastActive,
		&worker.CompletionPercentage, &worker.Rating, &worker.TotalReviews,
		&worker.Age, &worker.Gender, &worker.Address, &worker.City, &worker.State,
		&worker.IsEducated, &worker.EducationLevel, &worker.Degree, &worker.College, &worker.AadhaarNumber,
		&worker.FullName, &worker.Phone, &worker.Email,
		&worker.Language, &worker.IsActive, &worker.CreatedAt, &worker.UpdatedAt,
	)

	if err != nil {
		return nil, handleScanError(err, "worker")
	}

	return worker, nil
}

func (r *workerRepository) Update(ctx context.Context, worker *models.Worker) error {
	if worker == nil || worker.ID == "" {
		return errors.NewValidationError("worker and id cannot be nil", nil)
	}

	query := `
		UPDATE workers
		SET profile_photo_url = $1, experience_years = $2,
		    selected_roles = $3, venue_preferences = $4, work_types = $5, availability = $6,
		    business_types = $7, job_categories = $8, job_roles = $9, languages_known = $10,
		    availability_status = $11, expected_salary_min = $12, expected_salary_max = $13,
		    live_latitude = $14, live_longitude = $15, language = $16, is_active = $17,
		    age = $18, gender = $19, address = $20, city = $21, state = $22,
		    is_educated = $23, education_level = $24, degree = $25, college = $26, aadhaar_number = $27,
		    full_name = $28, phone = $29, email = $30,
		    updated_at = NOW()
		WHERE id = $31
		RETURNING updated_at
	`

	row := r.executor.QueryRowContext(ctx, query,
		worker.ProfilePhotoURL, worker.ExperienceYears,
		worker.SelectedRoles, worker.VenuePreferences, worker.WorkTypes, worker.Availability,
		worker.BusinessTypes, worker.JobCategories, worker.JobRoles, worker.LanguagesKnown,
		worker.AvailabilityStatus, worker.ExpectedSalaryMin, worker.ExpectedSalaryMax,
		worker.LiveLatitude, worker.LiveLongitude, worker.Language, worker.IsActive,
		worker.Age, worker.Gender, worker.Address, worker.City, worker.State,
		worker.IsEducated, worker.EducationLevel, worker.Degree, worker.College, worker.AadhaarNumber,
		worker.FullName, worker.Phone, worker.Email,
		worker.ID,
	)

	err := row.Scan(&worker.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.NewResourceNotFoundError("worker", worker.ID)
		}
		return errors.NewDatabaseError("failed to update worker", err)
	}

	return nil
}

func (r *workerRepository) Delete(ctx context.Context, id string) error {
	if id == "" {
		return errors.NewValidationError("worker id is required", nil)
	}

	query := `UPDATE workers SET is_active = FALSE, updated_at = NOW() WHERE id = $1`
	result, err := r.executor.ExecContext(ctx, query, id)
	if err != nil {
		return errors.NewDatabaseError("failed to delete worker", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		return errors.NewResourceNotFoundError("worker", id)
	}

	return nil
}

func (r *workerRepository) ListActive(ctx context.Context) ([]*models.Worker, error) {
	query := `
		SELECT id, user_id, profile_photo_url, experience_years,
		       selected_roles, venue_preferences, work_types, availability,
		       business_types, job_categories, job_roles, languages_known,
		       availability_status, expected_salary_min, expected_salary_max,
		       live_latitude, live_longitude, last_active,
		       completion_percentage, rating, total_reviews,
		       age, gender, address, city, state,
		       is_educated, education_level, degree, college, aadhaar_number,
		       full_name, phone, email,
		       language, is_active, created_at, updated_at
		FROM workers WHERE is_active = TRUE
		ORDER BY created_at DESC
	`

	rows, err := r.executor.QueryContext(ctx, query)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list active workers", err)
	}
	defer rows.Close()

	var workers []*models.Worker
	for rows.Next() {
		worker := &models.Worker{}
		err := rows.Scan(
			&worker.ID, &worker.UserID, &worker.ProfilePhotoURL, &worker.ExperienceYears,
			&worker.SelectedRoles, &worker.VenuePreferences, &worker.WorkTypes, &worker.Availability,
			&worker.BusinessTypes, &worker.JobCategories, &worker.JobRoles, &worker.LanguagesKnown,
			&worker.AvailabilityStatus, &worker.ExpectedSalaryMin, &worker.ExpectedSalaryMax,
			&worker.LiveLatitude, &worker.LiveLongitude, &worker.LastActive,
			&worker.CompletionPercentage, &worker.Rating, &worker.TotalReviews,
			&worker.Age, &worker.Gender, &worker.Address, &worker.City, &worker.State,
			&worker.IsEducated, &worker.EducationLevel, &worker.Degree, &worker.College, &worker.AadhaarNumber,
			&worker.FullName, &worker.Phone, &worker.Email,
			&worker.Language, &worker.IsActive, &worker.CreatedAt, &worker.UpdatedAt,
		)
		if err != nil {
			return nil, errors.NewDatabaseError("failed to scan worker", err)
		}
		workers = append(workers, worker)
	}

	return workers, rows.Err()
}

func (r *workerRepository) ListByCity(ctx context.Context, city string) ([]*models.Worker, error) {
	// Note: Workers don't have city directly; would need to join with users table
	return nil, errors.NewAppError(errors.ErrInternal, "not implemented", 500, nil)
}

func (r *workerRepository) UpdateLocation(ctx context.Context, workerID string, latitude, longitude float64) error {
	if workerID == "" {
		return errors.NewValidationError("worker_id is required", nil)
	}

	query := `
		UPDATE workers
		SET live_latitude = $1, live_longitude = $2, last_active = NOW(), updated_at = NOW()
		WHERE id = $3
	`

	result, err := r.executor.ExecContext(ctx, query, latitude, longitude, workerID)
	if err != nil {
		return errors.NewDatabaseError("failed to update worker location", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		return errors.NewResourceNotFoundError("worker", workerID)
	}

	return nil
}

func (r *workerRepository) ExistsByUserID(ctx context.Context, userID string) (bool, error) {
	if userID == "" {
		return false, errors.NewValidationError("user_id is required", nil)
	}

	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM workers WHERE user_id = $1)`
	err := r.executor.QueryRowContext(ctx, query, userID).Scan(&exists)
	if err != nil {
		return false, errors.NewDatabaseError("failed to check worker existence", err)
	}

	return exists, nil
}

// ============= JOB REPOSITORY =============

type jobRepository struct {
	executor executor
}

func NewJobRepository(db *sql.DB) JobRepository {
	return &jobRepository{executor: db}
}

func NewJobRepositoryWithTx(tx *sql.Tx) JobRepository {
	return &jobRepository{executor: tx}
}

func (r *jobRepository) Create(ctx context.Context, job *models.Job) error {
	if job == nil {
		return errors.NewValidationError("job cannot be nil", nil)
	}

	query := `
		INSERT INTO jobs (id, business_id, job_role, position, categories, roles, preferred_languages,
		                  salary_min_amount, salary_max_amount, experience_min, experience_max,
		                  vacancies, working_hours, weekly_leaves, benefits, work_type, address_text,
		                  city, state, latitude, longitude, status, language)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
		RETURNING id, created_at, updated_at
	`

	row := r.executor.QueryRowContext(ctx, query,
		job.ID, job.BusinessID, job.JobRole, job.Position, job.Categories, job.Roles, job.PreferredLanguages,
		job.SalaryMinAmount, job.SalaryMaxAmount,
		job.ExperienceMin, job.ExperienceMax, job.Vacancies, job.WorkingHours, job.WeeklyLeaves,
		job.Benefits, job.WorkType, job.AddressText, job.City, job.State, job.Latitude, job.Longitude,
		job.Status, job.Language,
	)

	err := row.Scan(&job.ID, &job.CreatedAt, &job.UpdatedAt)
	if err != nil {
		return errors.NewDatabaseError("failed to create job", err)
	}

	return nil
}

func (r *jobRepository) GetByID(ctx context.Context, id string) (*models.Job, error) {
	if id == "" {
		return nil, errors.NewValidationError("job id is required", nil)
	}

	job := &models.Job{}
	query := `
		SELECT id, business_id, job_role, position, categories, roles, preferred_languages,
		       salary_min_amount, salary_max_amount, experience_min, experience_max,
		       vacancies, working_hours, weekly_leaves, benefits, work_type, address_text, city, state, latitude, longitude,
		       status, language, is_active, created_at, updated_at
		FROM jobs WHERE id = $1
	`

	err := r.executor.QueryRowContext(ctx, query, id).Scan(
		&job.ID, &job.BusinessID, &job.JobRole, &job.Position, &job.Categories, &job.Roles, &job.PreferredLanguages,
		&job.SalaryMinAmount, &job.SalaryMaxAmount,
		&job.ExperienceMin, &job.ExperienceMax, &job.Vacancies, &job.WorkingHours, &job.WeeklyLeaves,
		&job.Benefits, &job.WorkType, &job.AddressText, &job.City, &job.State, &job.Latitude, &job.Longitude,
		&job.Status, &job.Language, &job.IsActive, &job.CreatedAt, &job.UpdatedAt,
	)

	if err != nil {
		return nil, handleScanError(err, "job")
	}

	return job, nil
}

func (r *jobRepository) GetByBusinessID(ctx context.Context, businessID string) ([]*models.Job, error) {
	if businessID == "" {
		return nil, errors.NewValidationError("business_id is required", nil)
	}

	query := `
		SELECT id, business_id, job_role, position, categories, roles, preferred_languages,
		       salary_min_amount, salary_max_amount, experience_min, experience_max,
		       vacancies, working_hours, weekly_leaves, benefits, work_type, address_text, city, state, latitude, longitude,
		       status, language, is_active, created_at, updated_at
		FROM jobs WHERE business_id = $1 AND is_active = TRUE
		ORDER BY created_at DESC
	`

	rows, err := r.executor.QueryContext(ctx, query, businessID)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list jobs", err)
	}
	defer rows.Close()

	var jobs []*models.Job
	for rows.Next() {
		job := &models.Job{}
		err := rows.Scan(
			&job.ID, &job.BusinessID, &job.JobRole, &job.Position, &job.Categories, &job.Roles, &job.PreferredLanguages,
			&job.SalaryMinAmount, &job.SalaryMaxAmount,
			&job.ExperienceMin, &job.ExperienceMax, &job.Vacancies, &job.WorkingHours, &job.WeeklyLeaves,
			&job.Benefits, &job.WorkType, &job.AddressText, &job.City, &job.State, &job.Latitude, &job.Longitude,
			&job.Status, &job.Language, &job.IsActive, &job.CreatedAt, &job.UpdatedAt,
		)
		if err != nil {
			return nil, errors.NewDatabaseError("failed to scan job", err)
		}
		jobs = append(jobs, job)
	}

	return jobs, rows.Err()
}

func (r *jobRepository) Update(ctx context.Context, job *models.Job) error {
	if job == nil || job.ID == "" {
		return errors.NewValidationError("job and id cannot be nil", nil)
	}

	query := `
		UPDATE jobs
		SET job_role = $1, position = $2, categories = $3, roles = $4, preferred_languages = $5,
		    salary_min_amount = $6, salary_max_amount = $7,
		    experience_min = $8, experience_max = $9, vacancies = $10, working_hours = $11,
		    weekly_leaves = $12, benefits = $13, work_type = $14, address_text = $15,
		    city = $16, state = $17, latitude = $18, longitude = $19, language = $20, is_active = $21
		WHERE id = $22
		RETURNING updated_at
	`

	row := r.executor.QueryRowContext(ctx, query,
		job.JobRole, job.Position, job.Categories, job.Roles, job.PreferredLanguages,
		job.SalaryMinAmount, job.SalaryMaxAmount,
		job.ExperienceMin, job.ExperienceMax, job.Vacancies, job.WorkingHours,
		job.WeeklyLeaves, job.Benefits, job.WorkType, job.AddressText,
		job.City, job.State, job.Latitude, job.Longitude, job.Language, job.IsActive, job.ID,
	)

	err := row.Scan(&job.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.NewResourceNotFoundError("job", job.ID)
		}
		return errors.NewDatabaseError("failed to update job", err)
	}

	return nil
}

func (r *jobRepository) Delete(ctx context.Context, id string) error {
	if id == "" {
		return errors.NewValidationError("job id is required", nil)
	}

	query := `UPDATE jobs SET is_active = FALSE, updated_at = NOW() WHERE id = $1`
	result, err := r.executor.ExecContext(ctx, query, id)
	if err != nil {
		return errors.NewDatabaseError("failed to delete job", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		return errors.NewResourceNotFoundError("job", id)
	}

	return nil
}

func (r *jobRepository) ListByStatus(ctx context.Context, status string) ([]*models.Job, error) {
	if status == "" {
		return nil, errors.NewValidationError("status is required", nil)
	}

	query := `
		SELECT id, business_id, job_role, position, categories, roles, preferred_languages,
		       salary_min_amount, salary_max_amount, experience_min, experience_max,
		       vacancies, working_hours, weekly_leaves, benefits, work_type, address_text, city, state, latitude, longitude,
		       status, language, is_active, created_at, updated_at
		FROM jobs WHERE status = $1 AND is_active = TRUE
		ORDER BY created_at DESC
	`

	rows, err := r.executor.QueryContext(ctx, query, status)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list jobs by status", err)
	}
	defer rows.Close()

	var jobs []*models.Job
	for rows.Next() {
		job := &models.Job{}
		err := rows.Scan(
			&job.ID, &job.BusinessID, &job.JobRole, &job.Position, &job.Categories, &job.Roles, &job.PreferredLanguages,
			&job.SalaryMinAmount, &job.SalaryMaxAmount,
			&job.ExperienceMin, &job.ExperienceMax, &job.Vacancies, &job.WorkingHours, &job.WeeklyLeaves,
			&job.Benefits, &job.WorkType, &job.AddressText, &job.City, &job.State, &job.Latitude, &job.Longitude,
			&job.Status, &job.Language, &job.IsActive, &job.CreatedAt, &job.UpdatedAt,
		)
		if err != nil {
			return nil, errors.NewDatabaseError("failed to scan job", err)
		}
		jobs = append(jobs, job)
	}

	return jobs, rows.Err()
}

func (r *jobRepository) ListByCity(ctx context.Context, city string) ([]*models.Job, error) {
	if city == "" {
		return nil, errors.NewValidationError("city is required", nil)
	}

	query := `
		SELECT id, business_id, job_role, position, categories, roles, preferred_languages,
		       salary_min_amount, salary_max_amount, experience_min, experience_max,
		       vacancies, working_hours, weekly_leaves, benefits, work_type, address_text, city, state, latitude, longitude,
		       status, language, is_active, created_at, updated_at
		FROM jobs WHERE city = $1 AND is_active = TRUE
		ORDER BY created_at DESC
	`

	rows, err := r.executor.QueryContext(ctx, query, city)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list jobs by city", err)
	}
	defer rows.Close()

	var jobs []*models.Job
	for rows.Next() {
		job := &models.Job{}
		err := rows.Scan(
			&job.ID, &job.BusinessID, &job.JobRole, &job.Position, &job.Categories, &job.Roles, &job.PreferredLanguages,
			&job.SalaryMinAmount, &job.SalaryMaxAmount,
			&job.ExperienceMin, &job.ExperienceMax, &job.Vacancies, &job.WorkingHours, &job.WeeklyLeaves,
			&job.Benefits, &job.WorkType, &job.AddressText, &job.City, &job.State, &job.Latitude, &job.Longitude,
			&job.Status, &job.Language, &job.IsActive, &job.CreatedAt, &job.UpdatedAt,
		)
		if err != nil {
			return nil, errors.NewDatabaseError("failed to scan job", err)
		}
		jobs = append(jobs, job)
	}

	return jobs, rows.Err()
}

func (r *jobRepository) ListOpenJobs(ctx context.Context) ([]*models.Job, error) {
	query := `
		SELECT id, business_id, job_role, position, categories, roles, preferred_languages,
		       salary_min_amount, salary_max_amount, experience_min, experience_max,
		       vacancies, working_hours, weekly_leaves, benefits, work_type, address_text, city, state, latitude, longitude,
		       status, language, is_active, created_at, updated_at
		FROM jobs WHERE status = 'OPEN' AND is_active = TRUE
		ORDER BY created_at DESC
	`

	rows, err := r.executor.QueryContext(ctx, query)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list open jobs", err)
	}
	defer rows.Close()

	var jobs []*models.Job
	for rows.Next() {
		job := &models.Job{}
		err := rows.Scan(
			&job.ID, &job.BusinessID, &job.JobRole, &job.Position, &job.Categories, &job.Roles, &job.PreferredLanguages,
			&job.SalaryMinAmount, &job.SalaryMaxAmount,
			&job.ExperienceMin, &job.ExperienceMax, &job.Vacancies, &job.WorkingHours, &job.WeeklyLeaves,
			&job.Benefits, &job.WorkType, &job.AddressText, &job.City, &job.State, &job.Latitude, &job.Longitude,
			&job.Status, &job.Language, &job.IsActive, &job.CreatedAt, &job.UpdatedAt,
		)
		if err != nil {
			return nil, errors.NewDatabaseError("failed to scan job", err)
		}
		jobs = append(jobs, job)
	}

	return jobs, rows.Err()
}

func (r *jobRepository) UpdateStatus(ctx context.Context, jobID, status string) error {
	if jobID == "" {
		return errors.NewValidationError("job_id is required", nil)
	}
	if status == "" {
		return errors.NewValidationError("status is required", nil)
	}

	query := `UPDATE jobs SET status = $1, updated_at = NOW() WHERE id = $2`
	result, err := r.executor.ExecContext(ctx, query, status, jobID)
	if err != nil {
		return errors.NewDatabaseError("failed to update job status", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		return errors.NewResourceNotFoundError("job", jobID)
	}

	return nil
}

func (r *jobRepository) ExistsByID(ctx context.Context, id string) (bool, error) {
	if id == "" {
		return false, errors.NewValidationError("job id is required", nil)
	}

	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM jobs WHERE id = $1)`
	err := r.executor.QueryRowContext(ctx, query, id).Scan(&exists)
	if err != nil {
		return false, errors.NewDatabaseError("failed to check job existence", err)
	}

	return exists, nil
}

// ============= APPLICATION REPOSITORY =============

type applicationRepository struct {
	executor executor
}

func NewApplicationRepository(db *sql.DB) ApplicationRepository {
	return &applicationRepository{executor: db}
}

func NewApplicationRepositoryWithTx(tx *sql.Tx) ApplicationRepository {
	return &applicationRepository{executor: tx}
}

func (r *applicationRepository) Create(ctx context.Context, application *models.Application) error {
	if application == nil {
		return errors.NewValidationError("application cannot be nil", nil)
	}

	query := `
		INSERT INTO applications (id, job_id, worker_id, status)
		VALUES ($1, $2, $3, $4)
		RETURNING id, applied_at, updated_at
	`

	row := r.executor.QueryRowContext(ctx, query, application.ID, application.JobID, application.WorkerID, application.Status)
	err := row.Scan(&application.ID, &application.AppliedAt, &application.UpdatedAt)
	if err != nil {
		return errors.NewDatabaseError("failed to create application", err)
	}

	return nil
}

func (r *applicationRepository) GetByID(ctx context.Context, id string) (*models.Application, error) {
	if id == "" {
		return nil, errors.NewValidationError("application id is required", nil)
	}

	app := &models.Application{}
	query := `SELECT id, job_id, worker_id, status, applied_at, updated_at FROM applications WHERE id = $1`

	err := r.executor.QueryRowContext(ctx, query, id).Scan(&app.ID, &app.JobID, &app.WorkerID, &app.Status, &app.AppliedAt, &app.UpdatedAt)
	if err != nil {
		return nil, handleScanError(err, "application")
	}

	return app, nil
}

func (r *applicationRepository) GetByJobID(ctx context.Context, jobID string) ([]*models.Application, error) {
	if jobID == "" {
		return nil, errors.NewValidationError("job_id is required", nil)
	}

	query := `SELECT id, job_id, worker_id, status, applied_at, updated_at FROM applications WHERE job_id = $1 ORDER BY applied_at DESC`

	rows, err := r.executor.QueryContext(ctx, query, jobID)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list applications", err)
	}
	defer rows.Close()

	var applications []*models.Application
	for rows.Next() {
		app := &models.Application{}
		err := rows.Scan(&app.ID, &app.JobID, &app.WorkerID, &app.Status, &app.AppliedAt, &app.UpdatedAt)
		if err != nil {
			return nil, errors.NewDatabaseError("failed to scan application", err)
		}
		applications = append(applications, app)
	}

	return applications, rows.Err()
}

func (r *applicationRepository) GetByWorkerID(ctx context.Context, workerID string) ([]*models.Application, error) {
	if workerID == "" {
		return nil, errors.NewValidationError("worker_id is required", nil)
	}

	query := `SELECT id, job_id, worker_id, status, applied_at, updated_at FROM applications WHERE worker_id = $1 ORDER BY applied_at DESC`

	rows, err := r.executor.QueryContext(ctx, query, workerID)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list applications", err)
	}
	defer rows.Close()

	var applications []*models.Application
	for rows.Next() {
		app := &models.Application{}
		err := rows.Scan(&app.ID, &app.JobID, &app.WorkerID, &app.Status, &app.AppliedAt, &app.UpdatedAt)
		if err != nil {
			return nil, errors.NewDatabaseError("failed to scan application", err)
		}
		applications = append(applications, app)
	}

	return applications, rows.Err()
}

func (r *applicationRepository) Update(ctx context.Context, application *models.Application) error {
	if application == nil || application.ID == "" {
		return errors.NewValidationError("application and id cannot be nil", nil)
	}

	query := `UPDATE applications SET status = $1 WHERE id = $2 RETURNING updated_at`
	err := r.executor.QueryRowContext(ctx, query, application.Status, application.ID).Scan(&application.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return errors.NewResourceNotFoundError("application", application.ID)
		}
		return errors.NewDatabaseError("failed to update application", err)
	}

	return nil
}

func (r *applicationRepository) Delete(ctx context.Context, id string) error {
	if id == "" {
		return errors.NewValidationError("application id is required", nil)
	}

	query := `DELETE FROM applications WHERE id = $1`
	result, err := r.executor.ExecContext(ctx, query, id)
	if err != nil {
		return errors.NewDatabaseError("failed to delete application", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		return errors.NewResourceNotFoundError("application", id)
	}

	return nil
}

func (r *applicationRepository) UpdateStatus(ctx context.Context, applicationID, status string) error {
	if applicationID == "" {
		return errors.NewValidationError("application_id is required", nil)
	}
	if status == "" {
		return errors.NewValidationError("status is required", nil)
	}

	query := `UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2`
	result, err := r.executor.ExecContext(ctx, query, status, applicationID)
	if err != nil {
		return errors.NewDatabaseError("failed to update application status", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		return errors.NewResourceNotFoundError("application", applicationID)
	}

	return nil
}

func (r *applicationRepository) ListByStatus(ctx context.Context, status string) ([]*models.Application, error) {
	if status == "" {
		return nil, errors.NewValidationError("status is required", nil)
	}

	query := `SELECT id, job_id, worker_id, status, applied_at, updated_at FROM applications WHERE status = $1 ORDER BY applied_at DESC`

	rows, err := r.executor.QueryContext(ctx, query, status)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list applications by status", err)
	}
	defer rows.Close()

	var applications []*models.Application
	for rows.Next() {
		app := &models.Application{}
		err := rows.Scan(&app.ID, &app.JobID, &app.WorkerID, &app.Status, &app.AppliedAt, &app.UpdatedAt)
		if err != nil {
			return nil, errors.NewDatabaseError("failed to scan application", err)
		}
		applications = append(applications, app)
	}

	return applications, rows.Err()
}

func (r *applicationRepository) ExistsByJobAndWorker(ctx context.Context, jobID, workerID string) (bool, error) {
	if jobID == "" {
		return false, errors.NewValidationError("job_id is required", nil)
	}
	if workerID == "" {
		return false, errors.NewValidationError("worker_id is required", nil)
	}

	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM applications WHERE job_id = $1 AND worker_id = $2)`
	err := r.executor.QueryRowContext(ctx, query, jobID, workerID).Scan(&exists)
	if err != nil {
		return false, errors.NewDatabaseError("failed to check application existence", err)
	}

	return exists, nil
}

// ============= SUBSCRIPTION REPOSITORY =============

type subscriptionRepository struct {
	executor executor
}

func NewSubscriptionRepository(db *sql.DB) SubscriptionRepository {
	return &subscriptionRepository{executor: db}
}

func NewSubscriptionRepositoryWithTx(tx *sql.Tx) SubscriptionRepository {
	return &subscriptionRepository{executor: tx}
}

func (r *subscriptionRepository) Create(ctx context.Context, subscription *models.Subscription) error {
	if subscription == nil {
		return errors.NewValidationError("subscription cannot be nil", nil)
	}

	query := `
		INSERT INTO subscriptions (id, user_id, plan_name, amount, status, expiry_date, payment_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`

	row := r.executor.QueryRowContext(ctx, query,
		subscription.ID, subscription.UserID, subscription.PlanName, subscription.Amount, subscription.Status, subscription.ExpiryDate, subscription.PaymentID,
	)
	err := row.Scan(&subscription.ID, &subscription.CreatedAt, &subscription.UpdatedAt)
	if err != nil {
		return errors.NewDatabaseError("failed to create subscription", err)
	}

	return nil
}

func (r *subscriptionRepository) GetByID(ctx context.Context, id string) (*models.Subscription, error) {
	if id == "" {
		return nil, errors.NewValidationError("subscription id is required", nil)
	}

	sub := &models.Subscription{}
	query := `SELECT id, user_id, plan_name, amount, status, expiry_date, payment_id, created_at, updated_at FROM subscriptions WHERE id = $1`

	err := r.executor.QueryRowContext(ctx, query, id).Scan(
		&sub.ID, &sub.UserID, &sub.PlanName, &sub.Amount, &sub.Status, &sub.ExpiryDate, &sub.PaymentID, &sub.CreatedAt, &sub.UpdatedAt,
	)
	if err != nil {
		return nil, handleScanError(err, "subscription")
	}

	return sub, nil
}

func (r *subscriptionRepository) GetByUserID(ctx context.Context, userID string) (*models.Subscription, error) {
	if userID == "" {
		return nil, errors.NewValidationError("user_id is required", nil)
	}

	sub := &models.Subscription{}
	query := `SELECT id, user_id, plan_name, amount, status, expiry_date, payment_id, created_at, updated_at FROM subscriptions WHERE user_id = $1`

	err := r.executor.QueryRowContext(ctx, query, userID).Scan(
		&sub.ID, &sub.UserID, &sub.PlanName, &sub.Amount, &sub.Status, &sub.ExpiryDate, &sub.PaymentID, &sub.CreatedAt, &sub.UpdatedAt,
	)
	if err != nil {
		return nil, handleScanError(err, "subscription")
	}

	return sub, nil
}

func (r *subscriptionRepository) Update(ctx context.Context, subscription *models.Subscription) error {
	if subscription == nil || subscription.ID == "" {
		return errors.NewValidationError("subscription and id cannot be nil", nil)
	}

	query := `
		UPDATE subscriptions SET plan_name = $1, amount = $2, status = $3, expiry_date = $4, payment_id = $5
		WHERE id = $6
		RETURNING updated_at
	`

	err := r.executor.QueryRowContext(ctx, query,
		subscription.PlanName, subscription.Amount, subscription.Status, subscription.ExpiryDate, subscription.PaymentID, subscription.ID,
	).Scan(&subscription.UpdatedAt)

	if err != nil {
		if err == sql.ErrNoRows {
			return errors.NewResourceNotFoundError("subscription", subscription.ID)
		}
		return errors.NewDatabaseError("failed to update subscription", err)
	}

	return nil
}

func (r *subscriptionRepository) Delete(ctx context.Context, id string) error {
	if id == "" {
		return errors.NewValidationError("subscription id is required", nil)
	}

	query := `DELETE FROM subscriptions WHERE id = $1`
	result, err := r.executor.ExecContext(ctx, query, id)
	if err != nil {
		return errors.NewDatabaseError("failed to delete subscription", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		return errors.NewResourceNotFoundError("subscription", id)
	}

	return nil
}

func (r *subscriptionRepository) ListByStatus(ctx context.Context, status string) ([]*models.Subscription, error) {
	if status == "" {
		return nil, errors.NewValidationError("status is required", nil)
	}

	query := `SELECT id, user_id, plan_name, amount, status, expiry_date, payment_id, created_at, updated_at FROM subscriptions WHERE status = $1 ORDER BY created_at DESC`

	rows, err := r.executor.QueryContext(ctx, query, status)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list subscriptions", err)
	}
	defer rows.Close()

	var subscriptions []*models.Subscription
	for rows.Next() {
		sub := &models.Subscription{}
		err := rows.Scan(&sub.ID, &sub.UserID, &sub.PlanName, &sub.Amount, &sub.Status, &sub.ExpiryDate, &sub.PaymentID, &sub.CreatedAt, &sub.UpdatedAt)
		if err != nil {
			return nil, errors.NewDatabaseError("failed to scan subscription", err)
		}
		subscriptions = append(subscriptions, sub)
	}

	return subscriptions, rows.Err()
}

func (r *subscriptionRepository) ListExpiring(ctx context.Context, days int) ([]*models.Subscription, error) {
	query := `SELECT id, user_id, plan_name, amount, status, expiry_date, payment_id, created_at, updated_at FROM subscriptions WHERE status = 'ACTIVE' AND expiry_date <= NOW() + INTERVAL '1 day' * $1 ORDER BY expiry_date ASC`

	rows, err := r.executor.QueryContext(ctx, query, days)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list expiring subscriptions", err)
	}
	defer rows.Close()

	var subscriptions []*models.Subscription
	for rows.Next() {
		sub := &models.Subscription{}
		err := rows.Scan(&sub.ID, &sub.UserID, &sub.PlanName, &sub.Amount, &sub.Status, &sub.ExpiryDate, &sub.PaymentID, &sub.CreatedAt, &sub.UpdatedAt)
		if err != nil {
			return nil, errors.NewDatabaseError("failed to scan subscription", err)
		}
		subscriptions = append(subscriptions, sub)
	}

	return subscriptions, rows.Err()
}

func (r *subscriptionRepository) UpdateStatus(ctx context.Context, subscriptionID, status string) error {
	if subscriptionID == "" {
		return errors.NewValidationError("subscription_id is required", nil)
	}
	if status == "" {
		return errors.NewValidationError("status is required", nil)
	}

	query := `UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE id = $2`
	result, err := r.executor.ExecContext(ctx, query, status, subscriptionID)
	if err != nil {
		return errors.NewDatabaseError("failed to update subscription status", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		return errors.NewResourceNotFoundError("subscription", subscriptionID)
	}

	return nil
}

// ============= LIVE TRACKING REPOSITORY =============

type liveTrackingRepository struct {
	executor executor
}

func NewLiveTrackingRepository(db *sql.DB) WorkerLiveTrackingRepository {
	return &liveTrackingRepository{executor: db}
}

func NewLiveTrackingRepositoryWithTx(tx *sql.Tx) WorkerLiveTrackingRepository {
	return &liveTrackingRepository{executor: tx}
}

func (r *liveTrackingRepository) Create(ctx context.Context, tracking *models.WorkerLiveTracking) error {
	if tracking == nil {
		return errors.NewValidationError("tracking cannot be nil", nil)
	}

	query := `
		INSERT INTO worker_live_tracking (id, worker_id, latitude, longitude, active_route_id, timestamp)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, timestamp
	`

	row := r.executor.QueryRowContext(ctx, query, tracking.ID, tracking.WorkerID, tracking.Latitude, tracking.Longitude, tracking.ActiveRouteID, tracking.Timestamp)
	err := row.Scan(&tracking.ID, &tracking.Timestamp)
	if err != nil {
		return errors.NewDatabaseError("failed to create live tracking", err)
	}

	return nil
}

func (r *liveTrackingRepository) GetLatest(ctx context.Context, workerID string) (*models.WorkerLiveTracking, error) {
	if workerID == "" {
		return nil, errors.NewValidationError("worker_id is required", nil)
	}

	tracking := &models.WorkerLiveTracking{}
	query := `SELECT id, worker_id, latitude, longitude, active_route_id, timestamp FROM worker_live_tracking WHERE worker_id = $1 ORDER BY timestamp DESC LIMIT 1`

	err := r.executor.QueryRowContext(ctx, query, workerID).Scan(
		&tracking.ID, &tracking.WorkerID, &tracking.Latitude, &tracking.Longitude, &tracking.ActiveRouteID, &tracking.Timestamp,
	)
	if err != nil {
		return nil, handleScanError(err, "live tracking")
	}

	return tracking, nil
}

func (r *liveTrackingRepository) ListRecent(ctx context.Context, workerID string, limit int) ([]*models.WorkerLiveTracking, error) {
	if workerID == "" {
		return nil, errors.NewValidationError("worker_id is required", nil)
	}

	query := `SELECT id, worker_id, latitude, longitude, active_route_id, timestamp FROM worker_live_tracking WHERE worker_id = $1 ORDER BY timestamp DESC LIMIT $2`

	rows, err := r.executor.QueryContext(ctx, query, workerID, limit)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list recent tracking", err)
	}
	defer rows.Close()

	var trackings []*models.WorkerLiveTracking
	for rows.Next() {
		tracking := &models.WorkerLiveTracking{}
		err := rows.Scan(&tracking.ID, &tracking.WorkerID, &tracking.Latitude, &tracking.Longitude, &tracking.ActiveRouteID, &tracking.Timestamp)
		if err != nil {
			return nil, errors.NewDatabaseError("failed to scan tracking", err)
		}
		trackings = append(trackings, tracking)
	}

	return trackings, rows.Err()
}

func (r *liveTrackingRepository) Delete(ctx context.Context, id string) error {
	if id == "" {
		return errors.NewValidationError("tracking id is required", nil)
	}

	query := `DELETE FROM worker_live_tracking WHERE id = $1`
	result, err := r.executor.ExecContext(ctx, query, id)
	if err != nil {
		return errors.NewDatabaseError("failed to delete tracking", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		return errors.NewResourceNotFoundError("tracking", id)
	}

	return nil
}

func (r *liveTrackingRepository) DeleteOlderThanDays(ctx context.Context, days int) error {
	query := `DELETE FROM worker_live_tracking WHERE timestamp < NOW() - INTERVAL '1 day' * $1`
	_, err := r.executor.ExecContext(ctx, query, days)
	if err != nil {
		return errors.NewDatabaseError("failed to delete old tracking records", err)
	}

	return nil
}

func (r *liveTrackingRepository) ListActiveWorkers(ctx context.Context, minMinutesAgo int) ([]*models.WorkerLiveTracking, error) {
	query := `
		SELECT id, worker_id, latitude, longitude, active_route_id, timestamp 
		FROM worker_live_tracking 
		WHERE timestamp > NOW() - INTERVAL '1 minute' * $1 
		ORDER BY timestamp DESC
	`

	rows, err := r.executor.QueryContext(ctx, query, minMinutesAgo)
	if err != nil {
		return nil, errors.NewDatabaseError("failed to list active workers", err)
	}
	defer rows.Close()

	var trackings []*models.WorkerLiveTracking
	for rows.Next() {
		tracking := &models.WorkerLiveTracking{}
		err := rows.Scan(&tracking.ID, &tracking.WorkerID, &tracking.Latitude, &tracking.Longitude, &tracking.ActiveRouteID, &tracking.Timestamp)
		if err != nil {
			return nil, errors.NewDatabaseError("failed to scan tracking", err)
		}
		trackings = append(trackings, tracking)
	}

	return trackings, rows.Err()
}
