ALTER TABLE projects ADD COLUMN IF NOT EXISTS story_sections jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE services ADD COLUMN IF NOT EXISTS story_sections jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE services ADD COLUMN IF NOT EXISTS process_steps jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE services ADD COLUMN IF NOT EXISTS faqs jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE services ADD COLUMN IF NOT EXISTS highlights jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS story_sections jsonb NOT NULL DEFAULT '[]'::jsonb;
