-- hold_requests had a blanket UNIQUE(catalog_id, member_id, status), which
-- blocks more than one 'cancelled' (or 'fulfilled') row per member+book ever —
-- so placing a hold, cancelling it, then placing and cancelling again on the
-- same book fails with a unique_violation on the second cancel. The actual
-- business rule (enforced in application code in POST /holds) is just "no two
-- simultaneous active holds" — cancelled/fulfilled history should be
-- unrestricted. Replaces it with a partial unique index over active statuses.
ALTER TABLE hold_requests DROP CONSTRAINT IF EXISTS hold_requests_catalog_id_member_id_status_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_holds_active_unique
  ON hold_requests (catalog_id, member_id)
  WHERE status IN ('pending', 'available');
