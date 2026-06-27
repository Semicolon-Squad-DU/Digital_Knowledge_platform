-- Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  ip_address INET,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_messages(email);
CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_is_read ON contact_messages(is_read);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER trg_contact_messages_updated_at
BEFORE UPDATE ON contact_messages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
