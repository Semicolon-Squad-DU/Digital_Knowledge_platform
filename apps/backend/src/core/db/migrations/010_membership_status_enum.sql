-- Extend membership_status enum with statuses used by the email-verification
-- and researcher-approval flow. Databases created from init.sql before this
-- feature only have ('active', 'inactive', 'suspended').

ALTER TYPE membership_status ADD VALUE IF NOT EXISTS 'pending_verification';
ALTER TYPE membership_status ADD VALUE IF NOT EXISTS 'pending_approval';
