-- Rollback 000030
ALTER TABLE users DROP COLUMN IF EXISTS last_seen;
