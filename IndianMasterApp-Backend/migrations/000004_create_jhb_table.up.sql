-- Enable extension (needed for gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS jhb (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(100) NOT NULL,
    salary NUMERIC(10,2),
    joining_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_jhb_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_jhb_phone_number ON jhb(phone_number);

-- Auto update updated_at column
CREATE OR REPLACE FUNCTION update_jhb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_jhb_updated ON jhb;

CREATE TRIGGER trigger_jhb_updated
BEFORE UPDATE ON jhb
FOR EACH ROW
EXECUTE FUNCTION update_jhb_updated_at();