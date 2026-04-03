-- Reverse migration: drop worker_resumes table and its indexes
DROP INDEX IF EXISTS idx_worker_resumes_worker_active;
DROP INDEX IF EXISTS idx_worker_resumes_worker_id;
DROP TABLE IF EXISTS worker_resumes;
