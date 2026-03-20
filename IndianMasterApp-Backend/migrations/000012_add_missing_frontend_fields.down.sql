BEGIN;

DROP INDEX IF EXISTS idx_workers_availability;

-- Remove TEXT[] defaults first
ALTER TABLE workers ALTER COLUMN selected_roles DROP DEFAULT;
ALTER TABLE workers ALTER COLUMN venue_preferences DROP DEFAULT;
ALTER TABLE workers ALTER COLUMN work_types DROP DEFAULT;
ALTER TABLE workers ALTER COLUMN availability DROP DEFAULT;

ALTER TABLE workers
    ALTER COLUMN selected_roles TYPE JSONB USING to_jsonb(selected_roles),
    ALTER COLUMN venue_preferences TYPE JSONB USING to_jsonb(venue_preferences),
    ALTER COLUMN work_types TYPE JSONB USING to_jsonb(work_types),
    ALTER COLUMN availability TYPE JSONB USING to_jsonb(availability);

-- Restore JSONB defaults
ALTER TABLE workers ALTER COLUMN selected_roles SET DEFAULT '[]'::jsonb;
ALTER TABLE workers ALTER COLUMN venue_preferences SET DEFAULT '[]'::jsonb;
ALTER TABLE workers ALTER COLUMN work_types SET DEFAULT '[]'::jsonb;
ALTER TABLE workers ALTER COLUMN availability SET DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_workers_availability ON workers USING GIN(availability);

COMMIT;