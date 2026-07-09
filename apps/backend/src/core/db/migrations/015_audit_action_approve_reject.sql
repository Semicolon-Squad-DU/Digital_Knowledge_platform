-- The admin user-approval endpoint (POST /api/admin/users/:id/approve) has
-- always logged action = 'APPROVE_USER' / 'REJECT_USER', but those values
-- were never added to the audit_action enum, so the audit_logs insert threw
-- and the whole request 500'd after the membership_status update already
-- committed (the approval silently "worked" but the response/email never
-- went out). This adds the missing enum values.
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'APPROVE_USER';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'REJECT_USER';
