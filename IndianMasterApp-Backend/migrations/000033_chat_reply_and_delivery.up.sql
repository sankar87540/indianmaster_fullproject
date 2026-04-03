-- 000033_chat_reply_and_delivery.up.sql
-- Adds:
--   1. reply_to_message_id — enables WhatsApp-style quoted replies
--   2. delivered_at        — enables single/double/blue tick status
--
-- Both columns are nullable and default NULL so existing rows require no backfill.

ALTER TABLE chat_messages
    ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS delivered_at         TIMESTAMPTZ;

-- Index for efficient lookup of a reply target (used in LEFT JOIN in GetChatMessages)
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to
    ON chat_messages(reply_to_message_id)
    WHERE reply_to_message_id IS NOT NULL;
