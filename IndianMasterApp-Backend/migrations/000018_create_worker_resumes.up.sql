-- =============================================================================
-- Migration: 000018_create_worker_resumes
-- Purpose  : Create a dedicated worker_resumes table to store resume metadata
--            and file references. No binary data is stored in the DB.
--            Each resume row is linked to its owner via worker_id (FK → workers.id).
-- Safe     : Uses IF NOT EXISTS throughout. Safe to re-run.
-- =============================================================================

CREATE TABLE IF NOT EXISTS worker_resumes (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership: identifies whose resume this is
    worker_id     UUID        NOT NULL REFERENCES workers(id) ON DELETE CASCADE,

    -- File location (path or full URL served by the backend)
    file_url      TEXT        NOT NULL,

    -- File metadata — no binary data stored here
    original_name TEXT        NOT NULL,
    stored_name   TEXT        NOT NULL,
    mime_type     TEXT        NOT NULL,
    file_size     BIGINT      NOT NULL,

    -- Activity flag: only one active resume per worker at a time
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,

    -- Timestamps
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Soft delete (optional, for audit trail)
    deleted_at    TIMESTAMPTZ
);

-- Index on worker_id for fast lookup of a worker's resumes
CREATE INDEX IF NOT EXISTS idx_worker_resumes_worker_id
    ON worker_resumes(worker_id);

-- Partial index for fast lookup of the single active resume per worker
CREATE INDEX IF NOT EXISTS idx_worker_resumes_worker_active
    ON worker_resumes(worker_id, is_active)
    WHERE deleted_at IS NULL;
