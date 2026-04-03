ALTER TABLE jobs
    DROP COLUMN IF EXISTS locality,
    DROP COLUMN IF EXISTS description,
    DROP COLUMN IF EXISTS availability;
