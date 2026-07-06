-- Normalize research output_type values to the vocabulary used by the
-- upload form and the type filters (journal, conference, thesis, dataset,
-- report). Earlier bulk-seeded rows used journal_article/conference_paper,
-- which made the type filters return zero results for existing data.

UPDATE research_outputs SET output_type = 'journal'    WHERE output_type = 'journal_article';
UPDATE research_outputs SET output_type = 'conference' WHERE output_type = 'conference_paper';

ALTER TABLE research_outputs ALTER COLUMN output_type SET DEFAULT 'journal';
