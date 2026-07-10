-- New notification types for platform-wide broadcast events:
-- new_event (admin/archivist/librarian schedules a seminar/event) and
-- pending_approval (a privileged-role signup needs an admin's review).
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_event';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'pending_approval';
