-- 000032_chat_notification_upsert.up.sql
-- Adds unread_count and updated_at to notifications.
-- Adds a partial unique index so CHAT_MESSAGE notifications are upserted
-- (one record per thread per user) instead of inserting a new row each time.

ALTER TABLE notifications
    ADD COLUMN IF NOT EXISTS unread_count INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMP DEFAULT NOW();

-- Back-fill updated_at for existing rows
UPDATE notifications SET updated_at = created_at WHERE updated_at IS NULL;

-- Deduplicate existing CHAT_MESSAGE rows before creating the unique index.
-- The old code inserted a new row per message, so the same (user_id, thread)
-- may have many rows. Keep only the latest row (by created_at) in each group;
-- delete the rest. Non-CHAT_MESSAGE rows are untouched.
DELETE FROM notifications
WHERE type = 'CHAT_MESSAGE'
  AND related_entity_id IS NOT NULL
  AND id NOT IN (
    SELECT DISTINCT ON (user_id, related_entity_id) id
    FROM   notifications
    WHERE  type = 'CHAT_MESSAGE'
      AND  related_entity_id IS NOT NULL
    ORDER  BY user_id, related_entity_id, created_at DESC, id DESC
  );

-- Partial unique index: one CHAT_MESSAGE notification per (user, thread).
-- Used as the ON CONFLICT target in the upsert query.
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_chat_thread_upsert
    ON notifications (user_id, type, related_entity_id)
    WHERE type = 'CHAT_MESSAGE' AND related_entity_id IS NOT NULL;
