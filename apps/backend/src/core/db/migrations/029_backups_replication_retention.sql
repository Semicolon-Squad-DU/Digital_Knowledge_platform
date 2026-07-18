-- Migration: NFR-013 — track second-zone replication status per backup,
-- and support retention-window cleanup queries.
ALTER TABLE backups ADD COLUMN IF NOT EXISTS replicated BOOLEAN NOT NULL DEFAULT FALSE;
