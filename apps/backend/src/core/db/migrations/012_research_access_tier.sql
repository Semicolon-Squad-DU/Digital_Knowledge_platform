-- Research outputs had no access control at all — every paper was visible to
-- guests and logged-in users alike. Adds the same access_tier gating already
-- used by archive_items so signed-in users can get additional research
-- resources beyond what guests see. Existing rows default to public so
-- nothing already-published becomes suddenly inaccessible.
ALTER TABLE research_outputs ADD COLUMN IF NOT EXISTS access_tier access_tier NOT NULL DEFAULT 'public';

CREATE INDEX IF NOT EXISTS idx_research_access_tier ON research_outputs(access_tier);
