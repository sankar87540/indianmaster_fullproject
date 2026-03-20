-- ===============================
-- ROLLBACK: MULTILINGUAL SUPPORT
-- ===============================

DROP INDEX IF EXISTS idx_jobs_language_code;
DROP INDEX IF EXISTS idx_job_seekers_language_code;
DROP INDEX IF EXISTS idx_employers_language_code;

ALTER TABLE jobs DROP COLUMN IF EXISTS language_code;
ALTER TABLE job_seekers DROP COLUMN IF EXISTS language_code;
ALTER TABLE employers DROP COLUMN IF EXISTS language_code;
