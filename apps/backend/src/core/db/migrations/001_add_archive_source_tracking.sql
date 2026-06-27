-- Migration: Add source tracking to archive_items
-- This tracks where auto-archived items originated from
-- (library, research, or showcase)

ALTER TABLE archive_items
ADD COLUMN IF NOT EXISTS source_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS source_id UUID;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_archive_source ON archive_items(source_type, source_id);

-- Add comment for documentation
COMMENT ON COLUMN archive_items.source_type IS 'Source of auto-archived item: library, research, showcase, or null for direct archive uploads';
COMMENT ON COLUMN archive_items.source_id IS 'ID of the source item (catalog_id, output_id, or project_id)';
