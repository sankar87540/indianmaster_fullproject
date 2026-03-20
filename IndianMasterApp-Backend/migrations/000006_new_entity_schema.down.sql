-- ===============================
-- ROLLBACK: NEW ENTITY SCHEMA
-- ===============================

-- Drop new tables
DROP TABLE IF EXISTS worker_live_tracking CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;

-- Restore jobs table to previous state
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_jobs_status;
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_jobs_salary;
ALTER TABLE jobs DROP COLUMN IF EXISTS business_id;
ALTER TABLE jobs DROP COLUMN IF EXISTS job_role;
ALTER TABLE jobs DROP COLUMN IF EXISTS position;
ALTER TABLE jobs DROP COLUMN IF EXISTS experience_min;
ALTER TABLE jobs DROP COLUMN IF EXISTS experience_max;
ALTER TABLE jobs DROP COLUMN IF EXISTS vacancies;
ALTER TABLE jobs DROP COLUMN IF EXISTS working_hours;
ALTER TABLE jobs DROP COLUMN IF EXISTS weekly_leaves;
ALTER TABLE jobs DROP COLUMN IF EXISTS benefits;
ALTER TABLE jobs DROP COLUMN IF EXISTS work_type;
ALTER TABLE jobs DROP COLUMN IF EXISTS address_text;
ALTER TABLE jobs DROP COLUMN IF EXISTS language;

-- Restore old column names
ALTER TABLE jobs RENAME COLUMN salary_min_amount TO salary_min;
ALTER TABLE jobs RENAME COLUMN salary_max_amount TO salary_max;

-- Restore users table
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_language;
ALTER TABLE users DROP COLUMN IF EXISTS role;
ALTER TABLE users DROP COLUMN IF EXISTS language;

-- Drop update_updated_at_column function (if no other table uses it)
DROP TRIGGER IF EXISTS trigger_businesses_updated_at ON businesses;
DROP TRIGGER IF EXISTS trigger_workers_updated_at ON workers;
DROP TRIGGER IF EXISTS trigger_jobs_updated_at ON jobs;
DROP TRIGGER IF EXISTS trigger_applications_updated_at ON applications;
DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON subscriptions;
