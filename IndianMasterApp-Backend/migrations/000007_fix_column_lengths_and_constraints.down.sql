-- ===============================
-- Rollback Migration: Revert Column Length Changes
-- ===============================
-- This file reverses the changes made in the up migration.
-- CAUTION: If data exists that violates the original constraints,
-- this migration may fail. Ensure data is compatible before rolling back.
-- ===============================

-- Drop the new indices first
DROP INDEX IF EXISTS idx_users_phone;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_businesses_city_state;
DROP INDEX IF EXISTS idx_businesses_language;
DROP INDEX IF EXISTS idx_workers_language;
DROP INDEX IF EXISTS idx_workers_is_active;
DROP INDEX IF EXISTS idx_jobs_language;
DROP INDEX IF EXISTS idx_jobs_status;
DROP INDEX IF EXISTS idx_jobs_city_state;

-- ===============================
-- Revert USERS TABLE Changes
-- ===============================

-- Revert language column size back to VARCHAR(5)
-- NOTE: This will fail if any language values longer than 5 chars exist
ALTER TABLE users 
  ALTER COLUMN language TYPE VARCHAR(5) USING language::VARCHAR(5);

-- Revert phone column back to original size (or keep as is if original was larger)
ALTER TABLE users 
  ALTER COLUMN phone TYPE VARCHAR(20) USING phone::VARCHAR(20);

-- Revert email back to original size
ALTER TABLE users 
  ALTER COLUMN email TYPE VARCHAR(255) USING COALESCE(email, '')::VARCHAR(255);

-- Revert full_name back to original size
ALTER TABLE users 
  ALTER COLUMN full_name TYPE VARCHAR(255) USING COALESCE(full_name, '')::VARCHAR(255);

-- Revert constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_email_not_empty;
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_phone_not_empty;
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_language;


-- ===============================
-- Revert BUSINESSES TABLE Changes
-- ===============================

ALTER TABLE businesses 
  ALTER COLUMN language TYPE VARCHAR(5) USING language::VARCHAR(5);

ALTER TABLE businesses 
  ALTER COLUMN mobile_number TYPE VARCHAR(20) USING COALESCE(mobile_number, '')::VARCHAR(20);

ALTER TABLE businesses DROP CONSTRAINT IF EXISTS chk_businesses_language;


-- ===============================
-- Revert WORKERS TABLE Changes
-- ===============================

ALTER TABLE workers 
  ALTER COLUMN language TYPE VARCHAR(5) USING language::VARCHAR(5);

ALTER TABLE workers DROP CONSTRAINT IF EXISTS chk_workers_language;


-- ===============================
-- Revert JOBS TABLE Changes
-- ===============================

ALTER TABLE jobs 
  ALTER COLUMN language TYPE VARCHAR(5) USING language::VARCHAR(5);

ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_jobs_language;
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_jobs_status;
