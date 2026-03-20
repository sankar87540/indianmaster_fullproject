-- =============================================================================
-- Migration: 000017_add_identity_fields_to_workers
-- Purpose  : Add full_name, phone, and email columns directly to the workers
--            table so basic identity details are stored alongside the profile.
-- Safe     : Only ADD COLUMN IF NOT EXISTS. No existing columns touched.
--            DEFAULT '' ensures existing rows get an empty string (not NULL)
--            so existing SELECT/Scan code continues to work unchanged.
-- =============================================================================

ALTER TABLE workers
    ADD COLUMN IF NOT EXISTS full_name TEXT    NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS phone     TEXT    NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS email     TEXT    NOT NULL DEFAULT '';
