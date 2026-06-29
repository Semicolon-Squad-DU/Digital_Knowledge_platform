-- Reconciles the live schema with what the active lending-workflow code
-- (borrow.service.ts, library.routes.ts) actually queries. The original
-- init.sql schema used lending_transactions/fines.transaction_id, but the
-- lending feature branch was written against a renamed borrows/fines.borrow_id
-- shape that was never migrated onto the shared database — every issue/
-- return/history/fines/holds endpoint was throwing "relation does not exist".

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lending_transactions')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'borrows') THEN
    ALTER TABLE lending_transactions RENAME TO borrows;
    ALTER TABLE borrows RENAME COLUMN transaction_id TO id;
    ALTER TABLE borrows RENAME COLUMN member_id TO user_id;
    ALTER TABLE borrows RENAME COLUMN catalog_id TO resource_id;
    ALTER TABLE borrows RENAME COLUMN status TO borrow_status;
  END IF;
END $$;

ALTER TABLE borrows ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fines' AND column_name = 'transaction_id')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fines' AND column_name = 'borrow_id') THEN
    ALTER TABLE fines RENAME COLUMN transaction_id TO borrow_id;
  END IF;
END $$;

ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) NOT NULL DEFAULT 'available';
ALTER TABLE archive_items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
