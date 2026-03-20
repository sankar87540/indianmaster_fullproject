-- ===============================
-- Migration Rollback: Complete Schema Refactor
-- ===============================

-- Drop tables in reverse order of creation (respecting FK constraints)
DROP TABLE IF EXISTS worker_contact_limit_logs CASCADE;
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS business_verifications CASCADE;
DROP TABLE IF EXISTS worker_verifications CASCADE;
DROP TABLE IF EXISTS saved_workers CASCADE;
DROP TABLE IF EXISTS saved_jobs CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_threads CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS get_user_unread_chat_count(UUID);
DROP FUNCTION IF EXISTS get_user_unread_notification_count(UUID);
DROP FUNCTION IF EXISTS on_chat_thread_message_insert();

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_chat_messages_update_thread ON chat_messages CASCADE;

-- Remove added columns from existing tables
ALTER TABLE workers DROP COLUMN IF EXISTS phone_verified;
ALTER TABLE workers DROP COLUMN IF EXISTS is_verified;
ALTER TABLE workers DROP COLUMN IF EXISTS verification_status;

ALTER TABLE subscriptions DROP COLUMN IF EXISTS start_date;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS end_date;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS contact_limit;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS contact_limit_daily;

ALTER TABLE applications DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE applications DROP COLUMN IF EXISTS deleted_by;

ALTER TABLE jobs DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE jobs DROP COLUMN IF EXISTS deleted_by;

-- Drop constraints
ALTER TABLE applications DROP CONSTRAINT IF EXISTS uq_application_worker_job;
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS chk_job_salary_valid;
ALTER TABLE worker_profiles DROP CONSTRAINT IF EXISTS chk_worker_salary_valid;

-- Drop indexes
DROP INDEX IF EXISTS idx_subscription_active_user;

-- ===============================
-- Rollback complete
-- ===============================
