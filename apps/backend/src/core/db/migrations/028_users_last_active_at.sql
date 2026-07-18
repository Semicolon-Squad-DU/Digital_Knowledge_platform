-- Migration: NFR-006 — server-side 30-minute inactivity session timeout.
-- last_active_at is bumped on every authenticated request; auth.middleware
-- rejects requests where it has gone stale beyond the inactivity window,
-- independent of the JWT access token's own (longer) expiry.
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
