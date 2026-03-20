-- 000011_add_notifications_table.up.sql
-- Adds notifications table and required indexes (idempotent for safer deployments)

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP,
    related_entity_type VARCHAR(50),
    related_entity_id UUID
);

CREATE INDEX IF NOT EXISTS index_notifications_user_id
    ON notifications(user_id);

CREATE INDEX IF NOT EXISTS index_notifications_is_read
    ON notifications(is_read);

CREATE INDEX IF NOT EXISTS index_notifications_created_at
    ON notifications(created_at DESC);
