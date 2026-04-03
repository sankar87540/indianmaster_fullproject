ALTER TABLE jobs
    DROP COLUMN IF EXISTS gender_preference,
    DROP COLUMN IF EXISTS male_vacancies,
    DROP COLUMN IF EXISTS female_vacancies;
