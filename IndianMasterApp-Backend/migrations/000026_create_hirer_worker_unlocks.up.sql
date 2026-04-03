-- Tracks which hirers have unlocked a worker's contact details.
-- An unlock is created when a hirer with an active subscription contacts a worker for the first time.
-- Re-contacting the same worker never costs another contact slot.

CREATE TABLE IF NOT EXISTS hirer_worker_unlocks (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    hirer_user_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    worker_id     UUID        NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    unlocked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (hirer_user_id, worker_id)
);

CREATE INDEX IF NOT EXISTS idx_hirer_worker_unlocks_hirer_user_id
    ON hirer_worker_unlocks (hirer_user_id);
