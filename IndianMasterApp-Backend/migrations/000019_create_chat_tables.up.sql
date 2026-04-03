-- =============================================================================
-- Migration: 000019_create_chat_tables
-- Purpose  : Create chat_threads and chat_messages tables for worker-hirer
--            real-time messaging. Ownership is enforced via user_id FKs.
-- Safe     : Uses IF NOT EXISTS throughout. Safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- chat_threads: one conversation per unique worker-hirer pair
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_threads (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Participants
    worker_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hirer_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Optional job context (nullable — conversation may not be job-specific)
    job_id          UUID        REFERENCES jobs(id) ON DELETE SET NULL,

    -- Denormalised for fast sorting of thread list
    last_message_at TIMESTAMPTZ,

    is_archived     BOOLEAN     NOT NULL DEFAULT FALSE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Enforce one conversation per worker-hirer pair
    UNIQUE (worker_id, hirer_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_worker_id
    ON chat_threads(worker_id);

CREATE INDEX IF NOT EXISTS idx_chat_threads_hirer_id
    ON chat_threads(hirer_id);

CREATE INDEX IF NOT EXISTS idx_chat_threads_last_message
    ON chat_threads(last_message_at DESC NULLS LAST);

-- ---------------------------------------------------------------------------
-- chat_messages: individual messages inside a thread
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    thread_id       UUID        NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    sender_id       UUID        NOT NULL REFERENCES users(id),

    message_text    TEXT        NOT NULL,
    attachment_urls TEXT[]      NOT NULL DEFAULT '{}',

    is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
    read_at         TIMESTAMPTZ,

    -- Soft delete support
    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID        REFERENCES users(id),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup of all messages in a thread ordered by time
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_created
    ON chat_messages(thread_id, created_at ASC);

-- Fast unread count calculation per thread
CREATE INDEX IF NOT EXISTS idx_chat_messages_unread
    ON chat_messages(thread_id, is_read, sender_id)
    WHERE deleted_at IS NULL;
