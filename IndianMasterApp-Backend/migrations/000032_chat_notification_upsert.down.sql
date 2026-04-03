-- 000032_chat_notification_upsert.down.sql
DROP INDEX IF EXISTS idx_notifications_chat_thread_upsert;
ALTER TABLE notifications
    DROP COLUMN IF EXISTS unread_count,
    DROP COLUMN IF EXISTS updated_at;
