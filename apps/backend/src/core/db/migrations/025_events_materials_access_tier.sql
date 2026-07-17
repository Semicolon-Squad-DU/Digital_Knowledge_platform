-- Migration: FR-060 — access tier gating for event materials (slides/recordings)
ALTER TABLE events ADD COLUMN IF NOT EXISTS materials_access_tier access_tier NOT NULL DEFAULT 'member';
