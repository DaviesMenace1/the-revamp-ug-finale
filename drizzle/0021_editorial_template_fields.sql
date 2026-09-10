ALTER TABLE services ADD COLUMN IF NOT EXISTS vision_statement text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS what_we_solve text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS approach text;
ALTER TABLE services ADD COLUMN IF NOT EXISTS deliverables jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE services ADD COLUMN IF NOT EXISTS related_services jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE services ADD COLUMN IF NOT EXISTS related_projects jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE articles ADD COLUMN IF NOT EXISTS introduction text;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS pull_quotes jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS related_articles jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS related_services jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS related_projects jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_brief text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS design_philosophy text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS materials jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS services_involved jsonb NOT NULL DEFAULT '[]'::jsonb;
