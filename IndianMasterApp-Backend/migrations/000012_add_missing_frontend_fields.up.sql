-- =============================================================================
-- Migration: 000012_add_missing_frontend_fields
-- Purpose  : Add columns required by frontend that are absent from the schema.
--            Fix pre-existing JSONB vs TEXT[] type conflicts in workers and jobs.
-- Safe     : No tables dropped. No existing columns removed. Idempotent ADD COLUMNs.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. FIX: workers JSONB -> TEXT[] type conversions
-- =============================================================================
-- Migration 006 created selected_roles, venue_preferences, work_types, availability
-- as JSONB. The Go model (pq.StringArray) and all migrations from 010 onward use
-- TEXT[]. These four columns must be converted to TEXT[] to match the model.

ALTER TABLE workers
    ALTER COLUMN selected_roles TYPE TEXT[]
        USING COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(selected_roles)),
            '{}'::TEXT[]
        );

ALTER TABLE workers
    ALTER COLUMN venue_preferences TYPE TEXT[]
        USING COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(venue_preferences)),
            '{}'::TEXT[]
        );

ALTER TABLE workers
    ALTER COLUMN work_types TYPE TEXT[]
        USING COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(work_types)),
            '{}'::TEXT[]
        );

ALTER TABLE workers
    ALTER COLUMN availability TYPE TEXT[]
        USING COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(availability)),
            '{}'::TEXT[]
        );

-- =============================================================================
-- 2. FIX: jobs.benefits JSONB -> TEXT[]
-- =============================================================================
-- Migration 006 created benefits as JSONB. Migration 010 attempted:
--   ADD COLUMN IF NOT EXISTS benefits TEXT[]
-- But the column already existed, so the statement was silently skipped.
-- The Go model maps it as pq.StringArray. Must convert.
--
-- The btree index from migration 010 is incompatible with TEXT[] array operators.
-- Drop it, convert the column, recreate as GIN.

DROP INDEX IF EXISTS idx_jobs_benefits;

ALTER TABLE jobs
    ALTER COLUMN benefits TYPE TEXT[]
        USING COALESCE(
            ARRAY(SELECT jsonb_array_elements_text(benefits)),
            '{}'::TEXT[]
        );

CREATE INDEX IF NOT EXISTS idx_jobs_benefits ON jobs USING GIN(benefits);

-- =============================================================================
-- 3. ADD: Missing worker personal / education columns
-- =============================================================================

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
CREATE INDEX IF NOT EXISTS idx_workers_is_educated ON workers(is_educated);
CREATE INDEX IF NOT EXISTS idx_workers_gender      ON workers(gender);

-- =============================================================================
-- 4. ADD: Missing job posting columns
-- =============================================================================

ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS locality    VARCHAR(255),
    ADD COLUMN IF NOT EXISTS availability TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_jobs_locality     ON jobs(locality);
CREATE INDEX IF NOT EXISTS idx_jobs_availability ON jobs USING GIN(availability);

-- =============================================================================
-- 5. FIX + ADD: businesses - single business_type -> business_types array
-- =============================================================================
-- Strategy:
--   a. Add business_types TEXT[] as the canonical multi-value column.
--   b. Backfill it from the existing single business_type value.
--   c. Drop NOT NULL from business_type so new inserts driven by business_types
--      can leave it blank (backward-compat: existing Go code that sets it still works).
--   d. Add employee_count.
-- Do NOT drop business_type yet - existing Go model and handlers still reference it.

ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS business_types TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS employee_count INTEGER;

UPDATE businesses
    SET business_types = ARRAY[business_type]
    WHERE business_type IS NOT NULL
      AND business_type <> ''
      AND (business_types IS NULL OR business_types = '{}');

ALTER TABLE businesses
    ALTER COLUMN business_type DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_business_types ON businesses USING GIN(business_types);

COMMIT;


-- =============================================================================
-- 4. ADD: Missing job posting columns
-- =============================================================================

ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS locality    VARCHAR(255),
    ADD COLUMN IF NOT EXISTS availability TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_jobs_locality     ON jobs(locality);
CREATE INDEX IF NOT EXISTS idx_jobs_availability ON jobs USING GIN(availability);

-- =============================================================================
-- 5. FIX + ADD: businesses - single business_type -> business_types array
-- =============================================================================
-- Strategy:
--   a. Add business_types TEXT[] as the canonical multi-value column.
--   b. Backfill it from the existing single business_type value.
--   c. Drop NOT NULL from business_type so new inserts driven by business_types
--      can leave it blank (backward-compat: existing Go code that sets it still works).
--   d. Add employee_count.
-- Do NOT drop business_type yet - existing Go model and handlers still reference it.

ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS business_types TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS employee_count INTEGER;

UPDATE businesses
    SET business_types = ARRAY[business_type]
    WHERE business_type IS NOT NULL
      AND business_type <> ''
      AND (business_types IS NULL OR business_types = '{}');

ALTER TABLE businesses
    ALTER COLUMN business_type DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_business_types ON businesses USING GIN(business_types);

COMMIT;
