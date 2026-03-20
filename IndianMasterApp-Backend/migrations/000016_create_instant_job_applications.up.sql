-- 000016_create_instant_job_applications.up.sql
-- Stores worker instant job application form submissions.
-- Separate from the main applications table — no job_id required.

CREATE TABLE IF NOT EXISTS instant_job_applications (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         REFERENCES users(id) ON DELETE SET NULL,
    name         VARCHAR(255) NOT NULL,
    phone        VARCHAR(20)  NOT NULL,
    role         VARCHAR(255) NOT NULL,
    experience   VARCHAR(100),
    location     VARCHAR(255),
    company_name VARCHAR(255),
    created_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instant_job_applications_user_id ON instant_job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_instant_job_applications_created_at ON instant_job_applications(created_at DESC);
