-- ============================================================================
-- PPV Data Model: Create Missions Table
-- Migration: 20260213185300_create_missions_table.sql
-- Generated: 2026-02-13 18:53 GMT+5
-- ============================================================================
--
-- PPV Hierarchy Implementation:
-- - Mission = measurable goal (NEW dedicated table)
-- - Operation = bounded project (projects table — already exists)
-- - Task = atomic work (tasks table — already exists)
--
-- This migration:
-- 1. Creates the missions table
-- 2. Adds mission_id foreign key to projects table
-- 3. Sets up RLS policies matching existing patterns
-- ============================================================================

-- 1. Create missions table
CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vision_id UUID REFERENCES visions(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'completed', 'archived')),
  target_date DATE,
  progress INTEGER DEFAULT 0 NOT NULL CHECK (progress BETWEEN 0 AND 100),
  owner_type VARCHAR(50) DEFAULT 'user' NOT NULL,
  owner_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_missions_org ON missions(organization_id);
CREATE INDEX IF NOT EXISTS idx_missions_vision ON missions(vision_id) WHERE vision_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_missions_owner ON missions(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_missions_target_date ON missions(target_date) WHERE target_date IS NOT NULL;

-- 3. Add mission_id to projects table (operations reference missions)
-- Guard: projects table may not exist in a clean Supabase Preview DB replay.
-- When absent, skip the column addition and index — becomes a safe no-op.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'projects'
  ) THEN
    -- ADD COLUMN IF NOT EXISTS is idempotent; use plain ALTER when column absent
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'projects'
        AND column_name  = 'mission_id'
    ) THEN
      ALTER TABLE projects ADD COLUMN mission_id UUID REFERENCES missions(id) ON DELETE SET NULL;
    END IF;

    -- Index: only create when the column (and thus the table) exists
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public' AND indexname = 'idx_projects_mission'
    ) THEN
      CREATE INDEX idx_projects_mission ON projects(mission_id) WHERE mission_id IS NOT NULL;
    END IF;
  END IF;
END;
$$;

-- 4. Enable Row-Level Security (RLS)
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (matching existing patterns)

-- Allow service role to bypass RLS (for migrations, admin operations)
CREATE POLICY "Service role bypass" ON missions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Users can view missions in their organization
CREATE POLICY "Users can view missions in their organization" ON missions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create missions in their organization
CREATE POLICY "Users can create missions in their organization" ON missions
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Users can update missions in their organization
CREATE POLICY "Users can update missions in their organization" ON missions
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Users can delete missions in their organization (admins only would be better, but matching existing pattern)
CREATE POLICY "Users can delete missions in their organization" ON missions
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- 6. Add trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_missions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER missions_updated_at
  BEFORE UPDATE ON missions
  FOR EACH ROW
  EXECUTE FUNCTION update_missions_updated_at();

-- 7. Add comment for documentation
COMMENT ON TABLE missions IS 'PPV Hierarchy: Missions are measurable goals with target dates that serve Visions';
COMMENT ON COLUMN missions.vision_id IS 'Optional reference to parent Vision (long-term aspiration)';
COMMENT ON COLUMN missions.progress IS 'Progress percentage (0-100), can be auto-calculated from linked Operations';
COMMENT ON COLUMN missions.status IS 'Mission status: active, completed, archived';
-- Guard: only set the column comment when projects table actually exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'projects'
      AND column_name  = 'mission_id'
  ) THEN
    EXECUTE $c$COMMENT ON COLUMN projects.mission_id IS 'Optional reference to parent Mission (operations roll up to missions)'$c$;
  END IF;
END;
$$;
