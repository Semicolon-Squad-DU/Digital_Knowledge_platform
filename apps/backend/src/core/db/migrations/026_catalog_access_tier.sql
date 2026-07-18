-- Library catalog items had no access control at all — every book (and its
-- attached PDF) was visible to guests and logged-in users alike. Adds the
-- same access_tier gating already used by archive_items/research_outputs so
-- librarians/admins can restrict certain titles. Existing rows default to
-- public so nothing already-catalogued becomes suddenly inaccessible.
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS access_tier access_tier NOT NULL DEFAULT 'public';

CREATE INDEX IF NOT EXISTS idx_catalog_access_tier ON catalog_items(access_tier);
