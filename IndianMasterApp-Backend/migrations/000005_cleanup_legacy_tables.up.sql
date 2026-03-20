-- ===============================
-- CLEANUP LEGACY TABLES
-- ===============================
-- This migration removes tables and columns no longer needed
-- as per the new frontend entity structure

-- Drop JHB test table
DROP TABLE IF EXISTS jhb CASCADE;

-- Drop legacy restaurants table (replaced by businesses)
DROP TABLE IF EXISTS restaurants CASCADE;

-- Drop old applications table (will be recreated with proper structure)
DROP TABLE IF EXISTS applications CASCADE;

-- Clean up unused columns from users table
ALTER TABLE users DROP COLUMN IF EXISTS job_roles;
ALTER TABLE users DROP COLUMN IF EXISTS area;
ALTER TABLE users DROP COLUMN IF EXISTS rating;
ALTER TABLE users DROP COLUMN IF EXISTS total_reviews;

-- Note: We keep users, jobs, job_seekers, employers, and employer_locations
-- for now as they will be restructured in the next migration
