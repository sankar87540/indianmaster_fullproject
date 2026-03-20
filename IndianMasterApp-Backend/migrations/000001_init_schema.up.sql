-- ===============================
-- EXTENSIONS
-- ===============================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================
-- USERS TABLE
-- ===============================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    phone VARCHAR(15) UNIQUE NOT NULL,
    phone_verified BOOLEAN DEFAULT FALSE,

    user_type VARCHAR(20) NOT NULL
        CHECK (user_type IN ('hirer','worker','both')),

    full_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,

    city VARCHAR(100),
    area VARCHAR(100),

    job_roles TEXT[],
    experience_years INTEGER DEFAULT 0 CHECK (experience_years >= 0),

    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_job_roles ON users USING GIN(job_roles);

-- ===============================
-- RESTAURANTS
-- ===============================
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    name VARCHAR(200) NOT NULL,
    city VARCHAR(100),
    locality VARCHAR(100),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_restaurants_owner ON restaurants(owner_id);

-- ===============================
-- JOBS
-- ===============================
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    posted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    job_title VARCHAR(200) NOT NULL,
    description TEXT,

    salary_min INTEGER NOT NULL,
    salary_max INTEGER NOT NULL,
    CHECK (salary_min <= salary_max),

    status VARCHAR(20) DEFAULT 'active'
        CHECK (status IN ('draft','active','closed','filled')),

    city VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_city_status ON jobs(city, status);

-- ===============================
-- APPLICATIONS
-- ===============================
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending','shortlisted','rejected','accepted')),

    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(job_id, worker_id)
);

CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_applications_worker ON applications(worker_id);

-- ===============================
-- REVIEWS
-- ===============================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,

    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(reviewer_id, reviewee_id, job_id)
);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);

-- ===============================
-- UPDATED_AT TRIGGER
-- ===============================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_restaurants_updated
BEFORE UPDATE ON restaurants
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_jobs_updated
BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
