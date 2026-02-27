-- ============================================================================
-- CA-S1-04: Extend agents table for personal agents + scoped ownership
-- ============================================================================

-- Enum: scope_type (ensure exists)
DO $$ BEGIN
  CREATE TYPE scope_type AS ENUM ('personal', 'cohort', 'org');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- organization_id now nullable for personal agents
ALTER TABLE agents
  ALTER COLUMN organization_id DROP NOT NULL;

-- New columns
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scope_type scope_type,
  ADD COLUMN IF NOT EXISTS scope_id UUID,
  ADD COLUMN IF NOT EXISTS default_cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL;

-- Backfill existing agents to org scope
UPDATE agents
SET scope_type = 'org',
    scope_id = organization_id
WHERE scope_type IS NULL;

ALTER TABLE agents
  ALTER COLUMN scope_type SET NOT NULL,
  ALTER COLUMN scope_type SET DEFAULT 'personal',
  ALTER COLUMN scope_id SET NOT NULL;

-- Scope checks
ALTER TABLE agents
  DROP CONSTRAINT IF EXISTS agents_personal_org_scope_check;

ALTER TABLE agents
  ADD CONSTRAINT agents_personal_org_scope_check CHECK (
    (scope_type = 'personal' AND owner_user_id IS NOT NULL AND organization_id IS NULL)
    OR (scope_type = 'org' AND organization_id IS NOT NULL)
    OR (scope_type = 'cohort')
  );

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
