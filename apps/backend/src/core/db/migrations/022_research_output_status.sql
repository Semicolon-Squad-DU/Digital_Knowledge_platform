-- Research outputs had no status/retraction concept — once published there was
-- no self-service way for a researcher to take down a wrong upload short of an
-- admin manually deleting the row. Adds a "published"/"retracted" status; existing
-- rows default to published so nothing currently live disappears.
CREATE TYPE research_output_status AS ENUM ('published', 'retracted');

ALTER TABLE research_outputs ADD COLUMN IF NOT EXISTS status research_output_status NOT NULL DEFAULT 'published';

CREATE INDEX IF NOT EXISTS idx_research_status ON research_outputs(status);
