-- ===============================
-- JOB SEEKERS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS job_seekers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    profile_photo_url TEXT,
    current_location VARCHAR(255),
    willing_to_relocate BOOLEAN DEFAULT FALSE,
    preferred_locations JSONB DEFAULT '[]'::jsonb,
    total_experience_years DECIMAL(4,2) DEFAULT 0,
    preferred_job_roles JSONB DEFAULT '[]'::jsonb,
    preferred_shift_timings JSONB DEFAULT '[]'::jsonb,
    expected_salary_min INTEGER,
    expected_salary_max INTEGER,
    immediate_availability BOOLEAN DEFAULT FALSE,
    notice_period_days INTEGER DEFAULT 0,
    languages_known JSONB DEFAULT '[]'::jsonb,
    bio TEXT,
    resume_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_job_seekers_user_id ON job_seekers(user_id);
CREATE INDEX idx_job_seekers_location ON job_seekers(current_location);
CREATE INDEX idx_job_seekers_roles ON job_seekers USING gin(preferred_job_roles);
CREATE INDEX idx_job_seekers_availability ON job_seekers(immediate_availability);

-- ===============================
-- EMPLOYERS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS employers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50),
    cuisine_types JSONB DEFAULT '[]'::jsonb,
    logo_url TEXT,
    description TEXT,
    establishment_year INTEGER,
    number_of_outlets INTEGER DEFAULT 1,
    website VARCHAR(255),
    gstin VARCHAR(20),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employers_user_id ON employers(user_id);
CREATE INDEX idx_employers_business_type ON employers(business_type);
CREATE INDEX idx_employers_verified ON employers(is_verified);

-- ===============================
-- EMPLOYER LOCATIONS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS employer_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_id UUID NOT NULL REFERENCES employers(id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employer_locations_employer_id ON employer_locations(employer_id);
CREATE INDEX idx_employer_locations_city ON employer_locations(city);
CREATE INDEX idx_employer_locations_active ON employer_locations(is_active);

-- ===============================
-- ALTER JOBS TABLE
-- ===============================
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS employer_id UUID REFERENCES employers(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES employer_locations(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_role VARCHAR(50);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_description TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_experience_min DECIMAL(4,2) DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_experience_max DECIMAL(4,2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cuisine_expertise_required JSONB DEFAULT '[]'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS number_of_openings INTEGER DEFAULT 1;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_type VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS shift_timing VARCHAR(20);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS shift_hours VARCHAR(100);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20) DEFAULT 'full_time';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_qualifications TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS preferred_qualifications TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS languages_required JSONB DEFAULT '[]'::jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS immediate_hiring BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS walk_in_interview BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS walk_in_details TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_deadline DATE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS applications_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_location_id ON jobs(location_id);
CREATE INDEX IF NOT EXISTS idx_jobs_role ON jobs(job_role);
CREATE INDEX IF NOT EXISTS idx_jobs_active_status ON jobs(is_active, status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_role_location_active ON jobs(job_role, location_id, is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_immediate_hiring ON jobs(immediate_hiring) WHERE immediate_hiring = TRUE;

-- ===============================
-- ALTER APPLICATIONS TABLE
-- ===============================
ALTER TABLE applications ADD COLUMN IF NOT EXISTS job_seeker_id UUID REFERENCES job_seekers(id) ON DELETE CASCADE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS cover_letter TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS expected_salary INTEGER;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS available_from_date DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS employer_notes TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_applications_job_seeker_id ON applications(job_seeker_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_job_status ON applications(job_id, status);

-- ===============================
-- WORK EXPERIENCE TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS work_experience (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_seeker_id UUID NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
    restaurant_name VARCHAR(255) NOT NULL,
    job_role VARCHAR(100) NOT NULL,
    cuisine_type JSONB DEFAULT '[]'::jsonb,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    responsibilities TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_work_experience_job_seeker_id ON work_experience(job_seeker_id);

-- ===============================
-- EDUCATION TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS education (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_seeker_id UUID NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
    degree_diploma VARCHAR(255) NOT NULL,
    institution_name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    year_of_completion INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_education_job_seeker_id ON education(job_seeker_id);

-- ===============================
-- CERTIFICATIONS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_seeker_id UUID NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
    certification_name VARCHAR(255) NOT NULL,
    issuing_organization VARCHAR(255) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE,
    certificate_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_certifications_job_seeker_id ON certifications(job_seeker_id);

-- ===============================
-- SKILLS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_skills_category ON skills(category);

-- ===============================
-- JOB SEEKER SKILLS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS job_seeker_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_seeker_id UUID NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(20) DEFAULT 'intermediate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_seeker_id, skill_id)
);

CREATE INDEX idx_job_seeker_skills_job_seeker_id ON job_seeker_skills(job_seeker_id);
CREATE INDEX idx_job_seeker_skills_skill_id ON job_seeker_skills(skill_id);

-- ===============================
-- SAVED JOBS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_seeker_id UUID NOT NULL REFERENCES job_seekers(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_seeker_id, job_id)
);

CREATE INDEX idx_saved_jobs_job_seeker_id ON saved_jobs(job_seeker_id);
CREATE INDEX idx_saved_jobs_job_id ON saved_jobs(job_id);

-- ===============================
-- NOTIFICATIONS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30),
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_type VARCHAR(50),
    related_entity_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- ===============================
-- INTERVIEWS TABLE
-- ===============================
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    interview_date DATE NOT NULL,
    interview_time TIME NOT NULL,
    interview_mode VARCHAR(20),
    location_address TEXT,
    meeting_link TEXT,
    interviewer_name VARCHAR(255),
    interviewer_contact VARCHAR(20),
    status VARCHAR(20) DEFAULT 'scheduled',
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interviews_application_id ON interviews(application_id);
CREATE INDEX idx_interviews_status ON interviews(status);

-- ===============================
-- TRIGGER FUNCTION
-- ===============================
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_job_seekers_updated ON job_seekers;
DROP TRIGGER IF EXISTS trigger_employers_updated ON employers;
DROP TRIGGER IF EXISTS trigger_employer_locations_updated ON employer_locations;
DROP TRIGGER IF EXISTS trigger_work_experience_updated ON work_experience;
DROP TRIGGER IF EXISTS trigger_education_updated ON education;
DROP TRIGGER IF EXISTS trigger_certifications_updated ON certifications;
DROP TRIGGER IF EXISTS trigger_interviews_updated ON interviews;

CREATE TRIGGER trigger_job_seekers_updated BEFORE UPDATE ON job_seekers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_employers_updated BEFORE UPDATE ON employers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_employer_locations_updated BEFORE UPDATE ON employer_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_work_experience_updated BEFORE UPDATE ON work_experience FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_education_updated BEFORE UPDATE ON education FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_certifications_updated BEFORE UPDATE ON certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_interviews_updated BEFORE UPDATE ON interviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===============================
-- APPLICATION COUNTER FUNCTION
-- ===============================
CREATE OR REPLACE FUNCTION increment_job_applications() RETURNS TRIGGER AS $$
BEGIN
    UPDATE jobs SET applications_count = applications_count + 1 WHERE id = NEW.job_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS increment_applications_count ON applications;
CREATE TRIGGER increment_applications_count AFTER INSERT ON applications FOR EACH ROW EXECUTE FUNCTION increment_job_applications();

-- ===============================
-- SEED SKILLS DATA
-- ===============================
INSERT INTO skills (skill_name, category) VALUES
('Indian Cuisine', 'cooking'),
('Chinese Cuisine', 'cooking'),
('Italian Cuisine', 'cooking'),
('Baking', 'cooking'),
('Grilling', 'cooking'),
('Tandoor Cooking', 'cooking'),
('South Indian Cuisine', 'cooking'),
('North Indian Cuisine', 'cooking'),
('Continental', 'cooking'),
('Customer Service', 'service'),
('Table Service', 'service'),
('Order Taking', 'service'),
('POS Operation', 'service'),
('Cash Handling', 'service'),
('Wine Service', 'service'),
('Coffee Making', 'service'),
('Cocktail Making', 'service'),
('Bar Operations', 'service'),
('Team Management', 'management'),
('Staff Training', 'management'),
('Shift Management', 'management'),
('Cost Control', 'management'),
('Quality Control', 'management'),
('Inventory Management', 'management'),
('Food Safety', 'technical'),
('HACCP', 'technical'),
('FSSAI Compliance', 'technical'),
('Hygiene Standards', 'technical'),
('Equipment Operation', 'technical'),
('Kitchen Organization', 'technical'),
('English', 'language'),
('Hindi', 'language'),
('Tamil', 'language'),
('Telugu', 'language'),
('Kannada', 'language'),
('Malayalam', 'language'),
('Marathi', 'language'),
('Gujarati', 'language'),
('Communication', 'soft_skill'),
('Teamwork', 'soft_skill'),
('Time Management', 'soft_skill'),
('Problem Solving', 'soft_skill'),
('Leadership', 'soft_skill'),
('Adaptability', 'soft_skill'),
('Attention to Detail', 'soft_skill'),
('Stress Management', 'soft_skill');
