-- Migration 000028: Ensure all vacancy / gender columns exist on the jobs table.
-- Migrations 024 and 025 added these columns but may not have been applied on
-- all environments before the backend code that references them was deployed.
-- All statements use ADD COLUMN IF NOT EXISTS and are safe to run multiple times.

ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS gender_preference VARCHAR(20) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS male_vacancies    INTEGER      NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS female_vacancies  INTEGER      NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS others_vacancies  INTEGER      NOT NULL DEFAULT 0;
