-- Revert jobs.benefits from TEXT[] back to JSONB
ALTER TABLE jobs
    ALTER COLUMN benefits TYPE JSONB
    USING to_jsonb(benefits);

ALTER TABLE jobs ALTER COLUMN benefits SET DEFAULT '[]'::jsonb;
