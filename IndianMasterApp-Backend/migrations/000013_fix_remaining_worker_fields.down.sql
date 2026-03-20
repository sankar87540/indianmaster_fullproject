-- =============================================================================
-- Migration: 000013_fix_remaining_worker_fields (DOWN)
-- Purpose  : Reverse all changes made by the up migration.
-- =============================================================================

BEGIN;

DROP INDEX IF EXISTS idx_workers_city;
DROP INDEX IF EXISTS idx_workers_state;
DROP INDEX IF EXISTS idx_workers_gender;
DROP INDEX IF EXISTS idx_workers_is_educated;

ALTER TABLE workers
    DROP COLUMN IF EXISTS age,
    DROP COLUMN IF EXISTS gender,
    DROP COLUMN IF EXISTS address,
    DROP COLUMN IF EXISTS city,
    DROP COLUMN IF EXISTS state,
    DROP COLUMN IF EXISTS is_educated,
    DROP COLUMN IF EXISTS education_level,
    DROP COLUMN IF EXISTS degree,
    DROP COLUMN IF EXISTS college,
    DROP COLUMN IF EXISTS aadhaar_number;

COMMIT;
