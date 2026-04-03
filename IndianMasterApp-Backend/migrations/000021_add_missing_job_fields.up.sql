-- Migration: 000021_add_missing_job_fields
-- Adds locality, description, and availability to the jobs table.
-- These columns were defined in migration 000012 but that migration is
-- baselined (skipped) on existing databases, so they may be absent.
-- All statements use IF NOT EXISTS and are safe to run multiple times.

ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS locality     VARCHAR(255),
    ADD COLUMN IF NOT EXISTS description  TEXT,
    ADD COLUMN IF NOT EXISTS availability TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_jobs_locality     ON jobs(locality);
CREATE INDEX IF NOT EXISTS idx_jobs_availability ON jobs USING GIN(availability);
