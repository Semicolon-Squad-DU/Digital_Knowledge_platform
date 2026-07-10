-- Barcode/QR feature: every catalog item needs a scannable code. Items created
-- before this feature (or without a printed ISBN barcode) have barcode = NULL,
-- so default it to the item's own catalog_id, matching what POST /catalog now
-- does automatically for new items.
UPDATE catalog_items
SET barcode = catalog_id::text
WHERE barcode IS NULL AND deleted_at IS NULL;
