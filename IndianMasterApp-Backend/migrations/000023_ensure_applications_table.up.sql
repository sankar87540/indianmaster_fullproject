-- =============================================================================
-- Migration: 000023_ensure_applications_table
-- Purpose  : Create the applications table if it doesn't exist.
--            Migration 000006 created this table but was baselined (skipped)
--            on existing databases where the users table was already present,
--            leaving the applications table missing on those deployments.
-- Safe     : All DDL uses IF NOT EXISTS / IF EXISTS guards — fully idempotent.
-- =============================================================================

-- Create the table with all required columns if it is absent
CREATE TABLE IF NOT EXISTS applications (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id     UUID        NOT NULL REFERENCES jobs(id)  ON DELETE CASCADE,
    worker_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status     VARCHAR(20) NOT NULL DEFAULT 'pending',
    applied_at TIMESTAMPTZ          DEFAULT NOW(),
    updated_at TIMESTAMPTZ          DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID        REFERENCES users(id) ON DELETE SET NULL
);

-- If the table already existed without deleted_at / deleted_by, add them
ALTER TABLE applications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Status check constraint
ALTER TABLE applications DROP CONSTRAINT IF EXISTS chk_applications_status;
ALTER TABLE applications ADD  CONSTRAINT  chk_applications_status
    CHECK (status IN ('pending', 'shortlisted', 'rejected', 'accepted'));

-- Unique constraint to prevent duplicate applications
ALTER TABLE applications DROP CONSTRAINT IF EXISTS uq_application_worker_job;
ALTER TABLE applications ADD  CONSTRAINT  uq_application_worker_job UNIQUE (job_id, worker_id);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_applications_job_id    ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_worker_id ON applications(worker_id);
CREATE INDEX IF NOT EXISTS idx_applications_status    ON applications(status);
