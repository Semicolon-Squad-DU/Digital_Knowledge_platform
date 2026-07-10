-- Book renewal workflow: track how many times each loan has been renewed so
-- BorrowService.renewResource can enforce a max-renewals limit.
ALTER TABLE borrows ADD COLUMN IF NOT EXISTS renewal_count INTEGER NOT NULL DEFAULT 0;
