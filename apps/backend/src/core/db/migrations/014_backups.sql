-- Real database backup tracking (replaces the mocked Admin > Backups tab)
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'BACKUP';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'RESTORE';

CREATE TABLE IF NOT EXISTS backups (
  backup_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  s3_key TEXT,
  size_bytes BIGINT,
  status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  triggered_by VARCHAR(20) NOT NULL CHECK (triggered_by IN ('scheduled', 'manual')),
  triggered_by_user UUID REFERENCES users(user_id) ON DELETE SET NULL,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups (created_at DESC);

-- Whether the scheduled backup cron job is active (backup_cron_expression already exists from migration 004)
INSERT INTO system_configs (key, value, description, category) VALUES
('backup_enabled', 'true', 'Whether the scheduled automated backup job is active', 'backup')
ON CONFLICT (key) DO NOTHING;
