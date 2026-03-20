-- Rollback: re-add user_type as nullable so existing rows are not affected.
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20);
