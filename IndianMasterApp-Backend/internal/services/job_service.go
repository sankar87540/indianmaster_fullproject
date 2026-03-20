package services

import (
	"database/sql"
	"time"
)

// Job struct matching your database table
type Job struct {
	ID                 int       `json:"id"`
	Title              string    `json:"title"`
	Category           string    `json:"category"`
	Company            string    `json:"company"`
	Location           string    `json:"location"`
	Wage               int       `json:"wage"`
	WageType           string    `json:"wage_type"`
	ExperienceRequired int       `json:"experience_required"`
	JobType            string    `json:"job_type"`
	ContactPhone       string    `json:"contact_phone"`
	Description        string    `json:"description"`
	Status             string    `json:"status"`
	CreatedAt          time.Time `json:"created_at"`
}

// 🔹 GET ALL JOBS
func FetchJobs(db *sql.DB) ([]Job, error) {
	rows, err := db.Query(`
		SELECT id, title, category, company, location, wage,
		       wage_type, experience_required, job_type,
		       contact_phone, description, status, created_at
		FROM jobs
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var jobs []Job

	for rows.Next() {
		var job Job
		err := rows.Scan(
			&job.ID,
			&job.Title,
			&job.Category,
			&job.Company,
			&job.Location,
			&job.Wage,
			&job.WageType,
			&job.ExperienceRequired,
			&job.JobType,
			&job.ContactPhone,
			&job.Description,
			&job.Status,
			&job.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		jobs = append(jobs, job)
	}

	return jobs, nil
}

// 🔹 CREATE JOB
func CreateJob(db *sql.DB, job Job) error {
	query := `
	INSERT INTO jobs 
	(title, category, company, location, wage, wage_type,
	 experience_required, job_type, contact_phone, description)
	VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
	`

	_, err := db.Exec(query,
		job.Title,
		job.Category,
		job.Company,
		job.Location,
		job.Wage,
		job.WageType,
		job.ExperienceRequired,
		job.JobType,
		job.ContactPhone,
		job.Description,
	)

	return err
}
