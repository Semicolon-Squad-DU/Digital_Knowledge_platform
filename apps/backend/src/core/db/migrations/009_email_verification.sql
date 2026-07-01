-- Email verification and registration approval flow
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified        BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verification_otp      VARCHAR(6),
  ADD COLUMN IF NOT EXISTS verification_otp_expires TIMESTAMPTZ;

-- Researcher accounts that have verified email but are awaiting admin approval
-- use membership_status = 'pending_approval' (already supported by the VARCHAR column).

-- Index for fast OTP lookups on verify-email endpoint
CREATE INDEX IF NOT EXISTS idx_users_verification_otp ON users (email, verification_otp)
  WHERE verification_otp IS NOT NULL;
