-- =============================================================================
-- Migration: 000019_create_chat_tables (DOWN)
-- Drops chat_messages first (FK dependency), then chat_threads.
-- =============================================================================

DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS chat_threads;
