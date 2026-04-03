-- 000031_add_notification_read_at.up.sql
-- Adds the read_at column to notifications if it was created by an older migration
-- that did not include this column. Uses IF NOT EXISTS so it is safe to run on
-- databases where the column already exists.

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
