-- 000031_add_notification_read_at.down.sql

ALTER TABLE notifications DROP COLUMN IF EXISTS read_at;
