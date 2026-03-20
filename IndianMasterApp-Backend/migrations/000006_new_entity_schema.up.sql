-- ===============================
-- NEW BACKEND ENTITY SCHEMA
-- ===============================
-- Complete restructuring to match frontend entities
-- This migration creates a clean schema aligned with frontend requirements

-- ===============================
-- 1. USERS TABLE (Primary Account Entity)
-- ===============================
-- Restructure existing users table or keep as is and add necessary columns

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;

ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20);
ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('HIRER', 'WORKER', 'ADMIN'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_language;
ALTER TABLE users ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en';
ALTER TABLE users ADD CONSTRAINT chk_users_language CHECK (language IN ('en', 'hi', 'ta'));

-- Rename phone to mobile_number for clarity (if needed in application layer)
-- Keep phone column for backward compatibility, sync with mobile_number

-- ===============================
-- 2. BUSINESSES TABLE (Replaces Employers + Employer Locations)
-- ===============================
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Business Identity
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    contact_role VARCHAR(50),
    business_type VARCHAR(100) NOT NULL,
    
    -- Contact Information
    email VARCHAR(255),
    mobile_number VARCHAR(20),
    
    -- Compliance
    fssai_license VARCHAR(100),
    gst_number VARCHAR(20),
    
    -- Media
    logo_url TEXT,
    
    -- Location
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    address_text TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Status & Metadata
    is_active BOOLEAN DEFAULT TRUE,
    language VARCHAR(5) DEFAULT 'en',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_business_type ON businesses(business_type);
CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON businesses(is_active);

-- ===============================
-- 3. WORKERS TABLE (Worker Profile Entity)
-- ===============================
CREATE TABLE IF NOT EXISTS workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Profile Information
    profile_photo_url TEXT,
    experience_years INTEGER DEFAULT 0,
    
    -- Job & Role Preferences
    selected_roles JSONB DEFAULT '[]'::jsonb,  -- Array of job role IDs/names
    venue_preferences JSONB DEFAULT '[]'::jsonb,  -- Types of establishments
    work_types JSONB DEFAULT '[]'::jsonb,  -- Full Time, Part Time, etc.
    availability JSONB DEFAULT '[]'::jsonb,  -- Morning, Night, Flexible, etc.
    
    -- Salary Expectations
    expected_salary_min INTEGER,
    expected_salary_max INTEGER,
    
    -- Live Tracking
    live_latitude DECIMAL(10, 8),
    live_longitude DECIMAL(11, 8),
    last_active TIMESTAMPTZ,
    
    -- Metadata
    language VARCHAR(5) DEFAULT 'en',
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workers_user_id ON workers(user_id);
CREATE INDEX IF NOT EXISTS idx_workers_experience ON workers(experience_years);
CREATE INDEX IF NOT EXISTS idx_workers_availability ON workers USING GIN(availability);
CREATE INDEX IF NOT EXISTS idx_workers_last_active ON workers(last_active);

-- ===============================
-- 4. JOBS TABLE (Job Posting Entity)
-- ===============================
-- Restructure existing jobs table
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

-- Remove old columns not in new schema
ALTER TABLE jobs DROP COLUMN IF EXISTS restaurant_id;
ALTER TABLE jobs DROP COLUMN IF EXISTS posted_by;
ALTER TABLE jobs DROP COLUMN IF EXISTS job_title;
ALTER TABLE jobs DROP COLUMN IF EXISTS description;
ALTER TABLE jobs DROP COLUMN IF EXISTS employer_id;
ALTER TABLE jobs DROP COLUMN IF EXISTS location_id;
ALTER TABLE jobs DROP COLUMN IF EXISTS required_experience_min;
ALTER TABLE jobs DROP COLUMN IF EXISTS required_experience_max;
ALTER TABLE jobs DROP COLUMN IF EXISTS cuisine_expertise_required;
ALTER TABLE jobs DROP COLUMN IF EXISTS number_of_openings;
ALTER TABLE jobs DROP COLUMN IF EXISTS salary_type;
ALTER TABLE jobs DROP COLUMN IF EXISTS shift_timing;
ALTER TABLE jobs DROP COLUMN IF EXISTS shift_hours;
ALTER TABLE jobs DROP COLUMN IF EXISTS employment_type;
ALTER TABLE jobs DROP COLUMN IF EXISTS required_qualifications;
ALTER TABLE jobs DROP COLUMN IF EXISTS preferred_qualifications;
ALTER TABLE jobs DROP COLUMN IF EXISTS languages_required;
ALTER TABLE jobs DROP COLUMN IF EXISTS job_description;
ALTER TABLE jobs DROP COLUMN IF EXISTS cuisine_types;

-- Add new columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_role VARCHAR(100) NOT NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS position VARCHAR(200);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_min INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_max INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS vacancies INTEGER DEFAULT 1;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS working_hours INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS weekly_leaves INTEGER DEFAULT 1;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS work_type VARCHAR(50);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address_text TEXT;

-- Ensure status column exists with proper values
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_jobs_status;
ALTER TABLE jobs ADD CONSTRAINT chk_jobs_status CHECK (status IN ('OPEN', 'CLOSED', 'FILLED', 'active', 'closed', 'filled', 'draft'));

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en';

-- Rename salary columns for clarity (keep existing for compatibility)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'jobs' AND column_name = 'salary_min'
    ) THEN
        ALTER TABLE jobs RENAME COLUMN salary_min TO salary_min_amount;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'jobs' AND column_name = 'salary_max'
    ) THEN
        ALTER TABLE jobs RENAME COLUMN salary_max TO salary_max_amount;
    END IF;
END $$;

-- Update check constraint
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_salary_check;
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_jobs_salary;
ALTER TABLE jobs ADD CONSTRAINT chk_jobs_salary CHECK (salary_min_amount <= salary_max_amount);

CREATE INDEX IF NOT EXISTS idx_jobs_business_id ON jobs(business_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(latitude, longitude);

-- ===============================
-- 5. APPLICATIONS TABLE (Job Application)
-- ===============================
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'pending',
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE applications DROP CONSTRAINT IF EXISTS chk_applications_status;
ALTER TABLE applications ADD CONSTRAINT chk_applications_status CHECK (status IN ('pending', 'shortlisted', 'rejected', 'accepted'));

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_worker_id ON applications(worker_id);

-- ===============================
-- 6. SUBSCRIPTIONS TABLE (Subscription & Payment Entity)
-- ===============================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    plan_name VARCHAR(50),
    amount DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    
    expiry_date TIMESTAMPTZ,
    payment_id VARCHAR(100),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS chk_subscriptions_status;
ALTER TABLE subscriptions ADD CONSTRAINT chk_subscriptions_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELLED'));

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ===============================
-- 7. LIVE TRACKING TABLE (Real-time Worker Coordinates)
-- ===============================
CREATE TABLE IF NOT EXISTS worker_live_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    
    active_route_id UUID,  -- Optional link to specific job
    
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_tracking_worker_id ON worker_live_tracking(worker_id);
CREATE INDEX IF NOT EXISTS idx_live_tracking_timestamp ON worker_live_tracking(timestamp);

-- ===============================
-- 8. AUTO-UPDATE TRIGGERS
-- ===============================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_businesses_updated_at ON businesses;
CREATE TRIGGER trigger_businesses_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_workers_updated_at ON workers;
CREATE TRIGGER trigger_workers_updated_at
BEFORE UPDATE ON workers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_jobs_updated_at ON jobs;
CREATE TRIGGER trigger_jobs_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_applications_updated_at ON applications;
CREATE TRIGGER trigger_applications_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trigger_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
