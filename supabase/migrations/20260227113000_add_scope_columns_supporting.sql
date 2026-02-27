-- ============================================================================
-- CA-S1-03b: Add scope columns to supporting entities
-- Tables: knowledge_entries, insights, comments
-- ============================================================================

-- Enum: scope_type (ensure exists)
DO $$ BEGIN
  CREATE TYPE scope_type AS ENUM ('personal', 'cohort', 'org');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- knowledge_entries
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_entries' AND column_name = 'scope_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_entries' AND column_name = 'knowledge_scope_id'
  ) THEN
    ALTER TABLE knowledge_entries RENAME COLUMN scope_id TO knowledge_scope_id;
  END IF;
END $$;

ALTER TABLE knowledge_entries
  ADD COLUMN IF NOT EXISTS scope_type scope_type,
  ADD COLUMN IF NOT EXISTS scope_id UUID,
  ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL;

UPDATE knowledge_entries
SET scope_type = 'org',
    scope_id = organization_id
WHERE scope_type IS NULL;

ALTER TABLE knowledge_entries
  ALTER COLUMN scope_type SET NOT NULL,
  ALTER COLUMN scope_type SET DEFAULT 'personal',
  ALTER COLUMN scope_id SET NOT NULL;

-- ---------------------------------------------------------------------------
-- insights
-- ---------------------------------------------------------------------------
ALTER TABLE insights
  ADD COLUMN IF NOT EXISTS scope_type scope_type,
  ADD COLUMN IF NOT EXISTS scope_id UUID,
  ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL;

UPDATE insights
SET scope_type = 'org',
    scope_id = organization_id
WHERE scope_type IS NULL;

ALTER TABLE insights
  ALTER COLUMN scope_type SET NOT NULL,
  ALTER COLUMN scope_type SET DEFAULT 'personal',
  ALTER COLUMN scope_id SET NOT NULL;

-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS scope_type scope_type,
  ADD COLUMN IF NOT EXISTS scope_id UUID,
  ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL;

UPDATE comments
SET scope_type = 'org',
    scope_id = organization_id
WHERE scope_type IS NULL;

ALTER TABLE comments
  ALTER COLUMN scope_type SET NOT NULL,
  ALTER COLUMN scope_type SET DEFAULT 'personal',
  ALTER COLUMN scope_id SET NOT NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
