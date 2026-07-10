-- Missing on the live DB (schema drift from init.sql). Without this, returning any
-- overdue book crashes with "no unique or exclusion constraint matching ON CONFLICT"
-- because borrow.service.ts relies on ON CONFLICT (borrow_id) when creating fines.
ALTER TABLE fines ADD CONSTRAINT fines_borrow_id_key UNIQUE (borrow_id);
