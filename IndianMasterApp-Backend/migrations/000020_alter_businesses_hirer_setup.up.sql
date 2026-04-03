-- Widen business_type to TEXT so multiple types (comma-joined) don't overflow VARCHAR(100)
ALTER TABLE businesses ALTER COLUMN business_type TYPE TEXT;

-- Make city/state nullable — restaurant-setup screen does not collect location
ALTER TABLE businesses ALTER COLUMN city DROP NOT NULL;
ALTER TABLE businesses ALTER COLUMN state DROP NOT NULL;

-- Add employee_count field collected by restaurant-setup screen
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS employee_count INTEGER;
