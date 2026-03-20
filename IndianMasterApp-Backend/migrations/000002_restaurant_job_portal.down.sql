-- ===============================
-- DROP TRIGGERS
-- ===============================
DROP TRIGGER IF EXISTS increment_applications_count ON applications;
DROP TRIGGER IF EXISTS trigger_job_seekers_updated ON job_seekers;
DROP TRIGGER IF EXISTS trigger_employers_updated ON employers;
DROP TRIGGER IF EXISTS trigger_employer_locations_updated ON employer_locations;
DROP TRIGGER IF EXISTS trigger_work_experience_updated ON work_experience;
DROP TRIGGER IF EXISTS trigger_education_updated ON education;
DROP TRIGGER IF EXISTS trigger_certifications_updated ON certifications;
DROP TRIGGER IF EXISTS trigger_interviews_updated ON interviews;

DROP FUNCTION IF EXISTS increment_job_applications();

-- ===============================
-- DROP TABLES
-- ===============================
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS saved_jobs CASCADE;
DROP TABLE IF EXISTS job_seeker_skills CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS certifications CASCADE;
DROP TABLE IF EXISTS education CASCADE;
DROP TABLE IF EXISTS work_experience CASCADE;

-- Drop extended columns from applications
ALTER TABLE applications DROP COLUMN IF EXISTS job_seeker_id;
ALTER TABLE applications DROP COLUMN IF EXISTS cover_letter;
ALTER TABLE applications DROP COLUMN IF EXISTS expected_salary;
ALTER TABLE applications DROP COLUMN IF EXISTS available_from_date;
ALTER TABLE applications DROP COLUMN IF EXISTS employer_notes;
ALTER TABLE applications DROP COLUMN IF EXISTS updated_at;

-- Drop extended columns from jobs
ALTER TABLE jobs DROP COLUMN IF EXISTS employer_id;
ALTER TABLE jobs DROP COLUMN IF EXISTS location_id;
ALTER TABLE jobs DROP COLUMN IF EXISTS job_role;
ALTER TABLE jobs DROP COLUMN IF EXISTS job_description;
ALTER TABLE jobs DROP COLUMN IF EXISTS required_experience_min;
ALTER TABLE jobs DROP COLUMN IF EXISTS required_experience_max;
ALTER TABLE jobs DROP COLUMN IF EXISTS cuisine_expertise_required;
ALTER TABLE jobs DROP COLUMN IF EXISTS number_of_openings;
ALTER TABLE jobs DROP COLUMN IF EXISTS salary_type;
ALTER TABLE jobs DROP COLUMN IF EXISTS shift_timing;
ALTER TABLE jobs DROP COLUMN IF EXISTS shift_hours;
ALTER TABLE jobs DROP COLUMN IF EXISTS employment_type;
ALTER TABLE jobs DROP COLUMN IF EXISTS required_qualifications;
ALTER TABLE jobs DROP COLUMN IF EXISTS preferred_qualifications;
ALTER TABLE jobs DROP COLUMN IF EXISTS languages_required;
ALTER TABLE jobs DROP COLUMN IF EXISTS benefits;
ALTER TABLE jobs DROP COLUMN IF EXISTS immediate_hiring;
ALTER TABLE jobs DROP COLUMN IF EXISTS walk_in_interview;
ALTER TABLE jobs DROP COLUMN IF EXISTS walk_in_details;
ALTER TABLE jobs DROP COLUMN IF EXISTS application_deadline;
ALTER TABLE jobs DROP COLUMN IF EXISTS is_active;
ALTER TABLE jobs DROP COLUMN IF EXISTS views_count;
ALTER TABLE jobs DROP COLUMN IF EXISTS applications_count;

DROP TABLE IF EXISTS employer_locations CASCADE;
DROP TABLE IF EXISTS employers CASCADE;
DROP TABLE IF EXISTS job_seekers CASCADE;

-- Drop indexes (they'll be dropped automatically with tables)
DROP INDEX IF EXISTS idx_job_seekers_user_id;
DROP INDEX IF EXISTS idx_job_seekers_location;
DROP INDEX IF EXISTS idx_job_seekers_roles;
DROP INDEX IF EXISTS idx_job_seekers_availability;
DROP INDEX IF EXISTS idx_employers_user_id;
DROP INDEX IF EXISTS idx_employers_business_type;
DROP INDEX IF EXISTS idx_employers_verified;
DROP INDEX IF EXISTS idx_employer_locations_employer_id;
DROP INDEX IF EXISTS idx_employer_locations_city;
DROP INDEX IF EXISTS idx_employer_locations_active;
DROP INDEX IF EXISTS idx_jobs_employer_id;
DROP INDEX IF EXISTS idx_jobs_location_id;
DROP INDEX IF EXISTS idx_jobs_role;
DROP INDEX IF EXISTS idx_jobs_active_status;
DROP INDEX IF EXISTS idx_jobs_created_at;
DROP INDEX IF EXISTS idx_jobs_role_location_active;
DROP INDEX IF EXISTS idx_jobs_immediate_hiring;
DROP INDEX IF EXISTS idx_applications_job_seeker_id;
DROP INDEX IF EXISTS idx_applications_status;
DROP INDEX IF EXISTS idx_applications_job_status;
DROP INDEX IF EXISTS idx_work_experience_job_seeker_id;
DROP INDEX IF EXISTS idx_work_experience_created_at;
DROP INDEX IF EXISTS idx_education_job_seeker_id;
DROP INDEX IF EXISTS idx_certifications_job_seeker_id;
DROP INDEX IF EXISTS idx_skills_category;
DROP INDEX IF EXISTS idx_job_seeker_skills_job_seeker_id;
DROP INDEX IF EXISTS idx_job_seeker_skills_skill_id;
DROP INDEX IF EXISTS idx_saved_jobs_job_seeker_id;
DROP INDEX IF EXISTS idx_saved_jobs_job_id;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_is_read;
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP INDEX IF EXISTS idx_interviews_application_id;
DROP INDEX IF EXISTS idx_interviews_status;
