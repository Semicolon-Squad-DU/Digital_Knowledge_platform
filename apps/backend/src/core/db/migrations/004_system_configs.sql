-- Create system_configs table
CREATE TABLE IF NOT EXISTS system_configs (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default configuration parameters if not exists
INSERT INTO system_configs (key, value, description, category) VALUES
('session_timeout_minutes', '15', 'JWT access token expiry in minutes', 'security'),
('password_min_length', '8', 'Minimum password character length', 'security'),
('password_require_special_char', 'true', 'Require at least one special character', 'security'),
('max_login_attempts', '5', 'Max failed login attempts before lockout', 'security'),
('maintenance_mode', 'false', 'Put platform in read-only maintenance mode', 'general'),
('backup_cron_expression', '0 9 * * *', 'Cron schedule for automated backups', 'backup')
ON CONFLICT (key) DO NOTHING;

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER trg_system_configs_updated_at
BEFORE UPDATE ON system_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
