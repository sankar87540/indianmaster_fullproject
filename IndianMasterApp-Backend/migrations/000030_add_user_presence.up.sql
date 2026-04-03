-- Migration 000030: Add last_seen presence column to users
-- Safe to re-run (IF NOT EXISTS).
-- Enables real-time Online/Offline status in chat headers.
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
