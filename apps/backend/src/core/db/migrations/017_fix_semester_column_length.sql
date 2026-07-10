-- The Supabase database has student_projects.semester as VARCHAR(20), which
-- doesn't match init.sql's VARCHAR(100) (schema drift from an earlier
-- provisioning of the Supabase project). Any realistic semester value (e.g.
-- the frontend's own placeholder "4th Year 1st Semester 2026", 26 chars)
-- overflows it and crashes showcase submission with a 500.
ALTER TABLE student_projects ALTER COLUMN semester TYPE VARCHAR(100);
