-- Migration: Add rejection_message to access_requests table
ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS rejection_message TEXT;
