-- ============================================================================
-- CA-S1-03a: Add scope columns to core PPV entities
-- Tables: visions, missions (projects), operations (projects), tasks
-- ============================================================================

-- Enum: scope_type
DO $$ BEGIN
  CREATE TYPE scope_type AS ENUM ('personal', 'cohort', 'org');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- visions
-- ---------------------------------------------------------------------------
ALTER TABLE visions
  ADD COLUMN IF NOT EXISTS scope_type scope_type,
  ADD COLUMN IF NOT EXISTS scope_id UUID,
  ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL;

UPDATE visions
SET scope_type = 'org',
    scope_id = organization_id
WHERE scope_type IS NULL;

ALTER TABLE visions
  ALTER COLUMN scope_type SET NOT NULL,
  ALTER COLUMN scope_type SET DEFAULT 'personal',
  ALTER COLUMN scope_id SET NOT NULL;

-- ---------------------------------------------------------------------------
-- projects (missions/operations)
-- ---------------------------------------------------------------------------
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS scope_type scope_type,
  ADD COLUMN IF NOT EXISTS scope_id UUID,
  ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL;

UPDATE projects
SET scope_type = 'org',
    scope_id = organization_id
WHERE scope_type IS NULL;

ALTER TABLE projects
  ALTER COLUMN scope_type SET NOT NULL,
  ALTER COLUMN scope_type SET DEFAULT 'personal',
  ALTER COLUMN scope_id SET NOT NULL;

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS scope_type scope_type,
  ADD COLUMN IF NOT EXISTS scope_id UUID,
  ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL;

UPDATE tasks
SET scope_type = 'org',
    scope_id = organization_id
WHERE scope_type IS NULL;

ALTER TABLE tasks
  ALTER COLUMN scope_type SET NOT NULL,
  ALTER COLUMN scope_type SET DEFAULT 'personal',
  ALTER COLUMN scope_id SET NOT NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
