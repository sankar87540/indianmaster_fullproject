-- Rollback 000029
-- Restores the 3-column unique key and drops the 2-column key.
-- Does NOT convert attachment_urls back to JSONB (not worth the risk of data loss).
ALTER TABLE chat_threads DROP CONSTRAINT IF EXISTS uq_chat_thread_worker_hirer;
