-- ===============================
-- Migration Rollback: Remove new array fields from workers and jobs
-- ===============================

-- ===============================
-- WORKERS TABLE ROLLBACK
-- ===============================
DROP INDEX IF EXISTS idx_workers_rating;
DROP INDEX IF EXISTS idx_workers_availability_status;
DROP INDEX IF EXISTS idx_workers_job_categories;
DROP INDEX IF EXISTS idx_workers_business_types;

ALTER TABLE workers
DROP COLUMN IF EXISTS business_types,
DROP COLUMN IF EXISTS job_categories,
DROP COLUMN IF EXISTS job_roles,
DROP COLUMN IF EXISTS languages_known,
DROP COLUMN IF EXISTS availability_status,
DROP COLUMN IF EXISTS completion_percentage,
DROP COLUMN IF EXISTS rating,
DROP COLUMN IF EXISTS total_reviews;

-- ===============================
-- JOBS TABLE ROLLBACK
-- ===============================
DROP INDEX IF EXISTS idx_jobs_benefits;
DROP INDEX IF EXISTS idx_jobs_preferred_languages;
DROP INDEX IF EXISTS idx_jobs_roles;
DROP INDEX IF EXISTS idx_jobs_categories;

ALTER TABLE jobs
DROP COLUMN IF EXISTS categories,
DROP COLUMN IF EXISTS roles,
DROP COLUMN IF EXISTS preferred_languages,
DROP COLUMN IF EXISTS benefits;
