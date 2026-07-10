-- Migration: Add requested_role to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS requested_role user_role;
