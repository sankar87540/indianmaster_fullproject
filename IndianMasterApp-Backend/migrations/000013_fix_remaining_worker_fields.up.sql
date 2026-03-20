-- =============================================================================
-- Migration: 000013_fix_remaining_worker_fields
-- Purpose  : Add missing personal and education columns to the workers table
--            required by the frontend profile setup screens.
-- Safe     : Only ADD COLUMN IF NOT EXISTS statements. No type changes.
--            No existing columns touched.
-- =============================================================================

BEGIN;

ALTER TABLE workers
    ADD COLUMN IF NOT EXISTS age             INTEGER,
    ADD COLUMN IF NOT EXISTS gender          VARCHAR(20),
    ADD COLUMN IF NOT EXISTS address         TEXT,
    ADD COLUMN IF NOT EXISTS city            VARCHAR(100),
    ADD COLUMN IF NOT EXISTS state           VARCHAR(100),
    ADD COLUMN IF NOT EXISTS is_educated     BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS education_level VARCHAR(100),
    ADD COLUMN IF NOT EXISTS degree          VARCHAR(200),
    ADD COLUMN IF NOT EXISTS college         VARCHAR(255),
    ADD COLUMN IF NOT EXISTS aadhaar_number  VARCHAR(12);

CREATE INDEX IF NOT EXISTS idx_workers_city        ON workers(city);
CREATE INDEX IF NOT EXISTS idx_workers_state       ON workers(state);
CREATE INDEX IF NOT EXISTS idx_workers_gender      ON workers(gender);
CREATE INDEX IF NOT EXISTS idx_workers_is_educated ON workers(is_educated);

COMMIT;
