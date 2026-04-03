-- 000033_chat_reply_and_delivery.down.sql
DROP INDEX IF EXISTS idx_chat_messages_reply_to;

ALTER TABLE chat_messages
    DROP COLUMN IF EXISTS reply_to_message_id,
    DROP COLUMN IF EXISTS delivered_at;
