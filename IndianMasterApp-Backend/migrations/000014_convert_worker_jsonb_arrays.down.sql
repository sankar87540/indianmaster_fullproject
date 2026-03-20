-- =============================================================================
-- Migration: 000014_convert_worker_jsonb_arrays (rollback)
-- Purpose  : Revert selected_roles, venue_preferences, work_types, availability
--            from TEXT[] back to JSONB.
--
-- Uses to_jsonb(col) which converts TEXT[] directly to a JSON array.
-- No helper function or subquery is needed for this direction.
-- Example: to_jsonb('{Chef,Waiter}'::TEXT[]) -> '["Chef","Waiter"]'::jsonb
-- =============================================================================

BEGIN;

DROP INDEX IF EXISTS idx_workers_availability;

ALTER TABLE workers
    ALTER COLUMN selected_roles    TYPE JSONB USING to_jsonb(selected_roles);

ALTER TABLE workers
    ALTER COLUMN venue_preferences TYPE JSONB USING to_jsonb(venue_preferences);

ALTER TABLE workers
    ALTER COLUMN work_types        TYPE JSONB USING to_jsonb(work_types);

ALTER TABLE workers
    ALTER COLUMN availability      TYPE JSONB USING to_jsonb(availability);

-- Restore the GIN index. GIN on JSONB supports @> and ? operators.
CREATE INDEX IF NOT EXISTS idx_workers_availability ON workers USING GIN(availability);

COMMIT;
