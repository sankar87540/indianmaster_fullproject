-- ===============================
-- MULTILINGUAL SUPPORT MIGRATION
-- ===============================
-- Safe Add-Only Migration
-- No existing columns or tables are modified or removed
-- All new columns have defaults to maintain backward compatibility

-- ===============================
-- ADD LANGUAGE_CODE TO JOBS TABLE
-- ===============================
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'en' NOT NULL;
ALTER TABLE jobs ADD CONSTRAINT chk_jobs_language_code CHECK (language_code IN ('en', 'ta', 'hi'));

CREATE INDEX IF NOT EXISTS idx_jobs_language_code ON jobs(language_code);

-- ===============================
-- ADD LANGUAGE_CODE TO JOB_SEEKERS TABLE
-- ===============================
ALTER TABLE job_seekers ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'en' NOT NULL;
ALTER TABLE job_seekers ADD CONSTRAINT chk_job_seekers_language_code CHECK (language_code IN ('en', 'ta', 'hi'));

CREATE INDEX IF NOT EXISTS idx_job_seekers_language_code ON job_seekers(language_code);

-- ===============================
-- ADD LANGUAGE_CODE TO EMPLOYERS TABLE
-- ===============================
ALTER TABLE employers ADD COLUMN IF NOT EXISTS language_code VARCHAR(5) DEFAULT 'en' NOT NULL;
ALTER TABLE employers ADD CONSTRAINT chk_employers_language_code CHECK (language_code IN ('en', 'ta', 'hi'));

CREATE INDEX IF NOT EXISTS idx_employers_language_code ON employers(language_code);

-- ===============================
-- COMMENT: TRANSLATION STORAGE STRATEGY
-- ===============================
-- Translations are NOT stored in the database.
-- Only the language preference of user-created content is tracked.
-- 
-- User content (job_description, bio, company_description, address, etc.)
-- is stored exactly as typed by the user in their selected language.
--
-- Enum/code values (job_role, status, shift_timing, etc.) remain in English
-- and are translated on-the-fly for API responses based on the
-- "lang" query parameter or Accept-Language header.
--
-- This approach:
-- ✓ Keeps database clean and normalized
-- ✓ Maintains system integrity (all internal codes in English)
-- ✓ Supports any number of languages without schema changes
-- ✓ Allows user content in any language without database bloat
-- ✓ Simplifies maintenance and scaling
