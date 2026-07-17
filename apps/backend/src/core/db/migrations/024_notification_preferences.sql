-- Migration: FR-044 — per-user notification channel/event-type preferences
-- A table of this name already existed with an unrelated, unused schema
-- (email_notifications/digest_frequency/last_digest_sent_at — no code
-- referenced it). Replacing it since it held no real user data.
DROP TABLE IF EXISTS notification_preferences;

CREATE TABLE notification_preferences (
  user_id            UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  due_date_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  hold_availability  BOOLEAN NOT NULL DEFAULT TRUE,
  weekly_digest      BOOLEAN NOT NULL DEFAULT FALSE,
  in_app_alerts      BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
