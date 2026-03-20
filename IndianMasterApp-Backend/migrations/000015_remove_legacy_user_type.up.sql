-- Migration 000015: Remove legacy user_type column from users table.
--
-- Root cause: Migration 000001 created user_type VARCHAR(20) NOT NULL.
-- Migration 000006 added the role column and dropped the CHECK constraint
-- on user_type but never dropped the column itself.
-- Result: every INSERT into users fails with:
--   pq: null value in column "user_type" violates not-null constraint
-- because the application INSERT does not include user_type (it uses role).
--
-- user_type is not referenced by any model, handler, service, or query in
-- the current codebase. It is safe to drop.

ALTER TABLE users DROP COLUMN IF EXISTS user_type;
