-- ===============================
-- Migration: Add password_hash to users table
-- ===============================
-- Adds password_hash column for authentication support
-- ===============================

ALTER TABLE users
ADD COLUMN password_hash VARCHAR(255);

-- Create index for faster lookups during login
CREATE INDEX idx_users_email_password ON users(email) WHERE is_active = TRUE;
