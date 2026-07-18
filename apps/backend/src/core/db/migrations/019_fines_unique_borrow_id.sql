-- Missing on the live DB (schema drift from init.sql). Without this, returning any
-- overdue book crashes with "no unique or exclusion constraint matching ON CONFLICT"
-- because borrow.service.ts relies on ON CONFLICT (borrow_id) when creating fines.
-- init.sql's own `fines` table already declares UNIQUE (borrow_id) inline (which
-- Postgres names fines_borrow_id_key by default), so this is a no-op on any fresh
-- database — wrapped in a DO block so it stays a no-op instead of erroring there.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fines_borrow_id_key'
  ) THEN
    ALTER TABLE fines ADD CONSTRAINT fines_borrow_id_key UNIQUE (borrow_id);
  END IF;
END $$;
