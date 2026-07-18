-- Library books can now carry a restricted access_tier (migration 026), but
-- there was no way for a member below that tier to ever get in — Archive
-- already solves this with access_requests + librarian/admin review, so this
-- mirrors that same request/approve/deny flow for catalog_items. A separate
-- table (not a reuse of access_requests) because that table's item_id has a
-- hard FK to archive_items — matches this codebase's existing convention of
-- each domain owning its own request tables (hold_requests, wishlists, etc.)
-- rather than widening a shared table's contract.
CREATE TABLE catalog_access_requests (
  request_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(user_id),
  catalog_id  UUID NOT NULL REFERENCES catalog_items(catalog_id),
  reason      TEXT NOT NULL,
  status      access_request_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ,
  rejection_message TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_catalog_access_requests_status ON catalog_access_requests(status);
CREATE INDEX idx_catalog_access_requests_lookup ON catalog_access_requests(catalog_id, user_id);
