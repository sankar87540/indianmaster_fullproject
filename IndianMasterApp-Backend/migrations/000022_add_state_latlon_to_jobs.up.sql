-- Migration: 000022_add_state_latlon_to_jobs
-- Adds state, latitude, longitude to the jobs table.
-- These columns were referenced in migration 000006 indexes but never added via ADD COLUMN.
-- All statements use IF NOT EXISTS and are safe to run multiple times.

ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS state     VARCHAR(100),
    ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10, 8),
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
