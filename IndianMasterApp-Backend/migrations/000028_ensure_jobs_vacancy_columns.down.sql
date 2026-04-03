-- Rollback 000028: Remove vacancy / gender columns added as safety net.
-- Only removes them if they were not present before this migration ran.
-- WARNING: this drops data. Only run in non-production environments.

ALTER TABLE jobs
    DROP COLUMN IF EXISTS gender_preference,
    DROP COLUMN IF EXISTS male_vacancies,
    DROP COLUMN IF EXISTS female_vacancies,
    DROP COLUMN IF EXISTS others_vacancies;
