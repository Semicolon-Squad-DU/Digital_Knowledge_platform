-- Migration: Discussion, Events, and Analytics upgrades
-- Add is_answer column to comments
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_answer BOOLEAN DEFAULT FALSE;

-- Add waitlisted column to event_rsvps
ALTER TABLE event_rsvps ADD COLUMN IF NOT EXISTS waitlisted BOOLEAN DEFAULT FALSE;

-- Create search_queries table
CREATE TABLE IF NOT EXISTS search_queries (
  query_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_text TEXT NOT NULL,
  module VARCHAR(50) NOT NULL, -- 'archive', 'library'
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_queries_text ON search_queries(query_text);
