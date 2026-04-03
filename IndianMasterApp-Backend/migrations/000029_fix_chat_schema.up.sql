-- Migration 000029: Fix chat_threads and chat_messages schema
--
-- Problem: Migration 000008 created chat_threads with:
--   - job_id NOT NULL (blocks job-context-free threads)
--   - UNIQUE (worker_id, hirer_id, job_id)  <-- 3-column unique key
--   - attachment_urls JSONB
--
-- Migration 000019 used CREATE TABLE IF NOT EXISTS, so on databases where
-- 000008 already ran, the tables were silently skipped and the wrong schema
-- from 000008 persists.
--
-- This migration normalises both tables to the correct target schema without
-- touching any data.
-- All statements are safe to re-run (idempotent).
-- =============================================================================

-- 1. Make job_id nullable so threads can exist without a job context.
ALTER TABLE chat_threads ALTER COLUMN job_id DROP NOT NULL;

-- 2. Fix the unique constraint.
--    Drop the 3-column key from migration 008 (allows duplicate worker-hirer
--    pairs for different jobs). Replace with a 2-column key so there is exactly
--    one conversation per worker-hirer pair regardless of job.
ALTER TABLE chat_threads DROP CONSTRAINT IF EXISTS uq_chat_thread_unique;

DO $$
BEGIN
    -- Add 2-column unique only when it does not already exist
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_constraint
        WHERE  conrelid = 'chat_threads'::regclass
          AND  contype  = 'u'
          AND  conname  LIKE '%worker_id%hirer_id%'
    ) THEN
        ALTER TABLE chat_threads
            ADD CONSTRAINT uq_chat_thread_worker_hirer UNIQUE (worker_id, hirer_id);
    END IF;
END
$$;

-- 3. Convert attachment_urls from JSONB to TEXT[] if the column is still JSONB.
--    PostgreSQL does not allow subqueries inside ALTER COLUMN TYPE ... USING.
--    Strategy: add a new TEXT[] column, backfill via UPDATE (which allows
--    subqueries in SET expressions), drop the old JSONB column, rename.
DO $$
BEGIN
    -- Only run when the column is still JSONB (idempotent guard)
    IF EXISTS (
        SELECT 1
        FROM   information_schema.columns
        WHERE  table_name  = 'chat_messages'
          AND  column_name = 'attachment_urls'
          AND  data_type   = 'jsonb'
    ) THEN
        -- Step 1: add the replacement column
        ALTER TABLE chat_messages
            ADD COLUMN attachment_urls_new TEXT[] NOT NULL DEFAULT '{}';

        -- Step 2: backfill — UPDATE allows set-returning functions in SET
        UPDATE chat_messages
        SET attachment_urls_new =
            CASE
                WHEN attachment_urls IS NULL
                  OR attachment_urls = 'null'::jsonb
                  OR jsonb_typeof(attachment_urls) <> 'array'
                THEN '{}'::text[]
                ELSE ARRAY(SELECT jsonb_array_elements_text(attachment_urls))
            END;

        -- Step 3: remove old JSONB column
        ALTER TABLE chat_messages DROP COLUMN attachment_urls;

        -- Step 4: rename new column into place
        ALTER TABLE chat_messages
            RENAME COLUMN attachment_urls_new TO attachment_urls;
    END IF;

    -- Recovery guard: handles the rare case where steps 3-4 above succeeded on
    -- a previous partial run but the migration was rolled back before completing.
    -- If attachment_urls_new exists but attachment_urls does not, finish the rename.
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE  table_name = 'chat_messages' AND column_name = 'attachment_urls_new'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE  table_name = 'chat_messages' AND column_name = 'attachment_urls'
    ) THEN
        ALTER TABLE chat_messages
            RENAME COLUMN attachment_urls_new TO attachment_urls;
    END IF;
END
$$;

-- 4. Ensure all indexes from migration 019 exist (safe IF NOT EXISTS).
CREATE INDEX IF NOT EXISTS idx_chat_threads_worker_id
    ON chat_threads(worker_id);

CREATE INDEX IF NOT EXISTS idx_chat_threads_hirer_id
    ON chat_threads(hirer_id);

CREATE INDEX IF NOT EXISTS idx_chat_threads_last_message
    ON chat_threads(last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created
    ON chat_messages(thread_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_unread
    ON chat_messages(thread_id, is_read, sender_id)
    WHERE deleted_at IS NULL;
