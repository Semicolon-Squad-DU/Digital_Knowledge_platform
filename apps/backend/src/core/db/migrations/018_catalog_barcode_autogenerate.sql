-- Auto-generate a unique barcode/book-ID for every catalog item.
-- One barcode per catalog_items row — since all copies of a title share a single
-- row (total_copies/available_copies are just counters), every physical copy of
-- a book naturally shares the same barcode, which is what identifies "the book".

CREATE SEQUENCE IF NOT EXISTS catalog_barcode_seq START 1;

CREATE OR REPLACE FUNCTION set_catalog_barcode()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.barcode IS NULL OR NEW.barcode = '' THEN
    NEW.barcode := 'DKP-' || LPAD(nextval('catalog_barcode_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_catalog_barcode ON catalog_items;
CREATE TRIGGER trg_set_catalog_barcode
  BEFORE INSERT ON catalog_items
  FOR EACH ROW
  EXECUTE FUNCTION set_catalog_barcode();

-- Backfill existing rows that don't have one yet.
UPDATE catalog_items
SET barcode = 'DKP-' || LPAD(nextval('catalog_barcode_seq')::TEXT, 6, '0')
WHERE (barcode IS NULL OR barcode = '') AND deleted_at IS NULL;
