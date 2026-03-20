-- ===============================
-- Migration: Add new array fields to workers and jobs
-- ===============================
-- Adds missing array fields and new columns to align with frontend schema
-- ===============================

-- ===============================
-- WORKERS TABLE ADDITIONS
-- ===============================
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS business_types TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS job_categories TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS job_roles TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS languages_known TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20),
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating FLOAT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workers_business_types ON workers(business_types);
CREATE INDEX IF NOT EXISTS idx_workers_job_categories ON workers(job_categories);
CREATE INDEX IF NOT EXISTS idx_workers_availability_status ON workers(availability_status);
CREATE INDEX IF NOT EXISTS idx_workers_rating ON workers(rating);

-- ===============================
-- JOBS TABLE ADDITIONS
-- ===============================
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS preferred_languages TEXT[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}'::text[];

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_categories ON jobs(categories);
CREATE INDEX IF NOT EXISTS idx_jobs_roles ON jobs(roles);
CREATE INDEX IF NOT EXISTS idx_jobs_preferred_languages ON jobs(preferred_languages);
CREATE INDEX IF NOT EXISTS idx_jobs_benefits ON jobs(benefits);
