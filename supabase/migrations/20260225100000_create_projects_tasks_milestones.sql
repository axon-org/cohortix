-- ============================================================================
-- PPV Core Tables: projects (Operations), milestones, tasks
-- Creates the execution-layer tables for the PPV hierarchy.
-- Idempotent: uses IF NOT EXISTS / DO $$ blocks throughout.
-- ============================================================================

-- ============================================================================
-- 1. Enum types
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE milestone_status AS ENUM ('upcoming', 'active', 'completed', 'missed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE assignee_type AS ENUM ('user', 'agent', 'unassigned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- owner_type may already exist from goals/visions migration
DO $$ BEGIN
  CREATE TYPE owner_type AS ENUM ('user', 'agent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. projects table (Operations in Cohortix terminology)
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID,       -- optional, workspaces table may not exist yet
  client_id UUID,          -- optional, clients table may not exist yet

  owner_type owner_type NOT NULL DEFAULT 'user',
  owner_id UUID NOT NULL,

  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'planning',

  color VARCHAR(7),        -- hex color
  icon VARCHAR(50),        -- icon name

  start_date DATE,
  target_date DATE,
  completed_at TIMESTAMPTZ,

  mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,

  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS: org members can see their org's projects
DO $$ BEGIN
  CREATE POLICY "projects_org_read" ON projects
    FOR SELECT USING (
      (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
      EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN profiles p ON om.user_id = p.id
        WHERE om.organization_id = organization_id
        AND p.clerk_user_id = get_current_clerk_user_id()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "projects_org_insert" ON projects
    FOR INSERT WITH CHECK (
      (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
      EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN profiles p ON om.user_id = p.id
        WHERE om.organization_id = organization_id
        AND p.clerk_user_id = get_current_clerk_user_id()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "projects_org_update" ON projects
    FOR UPDATE USING (
      (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
      EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN profiles p ON om.user_id = p.id
        WHERE om.organization_id = organization_id
        AND p.clerk_user_id = get_current_clerk_user_id()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "projects_org_delete" ON projects
    FOR DELETE USING (
      (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
      EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN profiles p ON om.user_id = p.id
        WHERE om.organization_id = organization_id
        AND p.clerk_user_id = get_current_clerk_user_id()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_mission ON projects(mission_id);

-- ============================================================================
-- 3. milestones table
-- ============================================================================

CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status milestone_status NOT NULL DEFAULT 'upcoming',
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "milestones_org_read" ON milestones
    FOR SELECT USING (
      (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
      EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN profiles p ON om.user_id = p.id
        WHERE om.organization_id = organization_id
        AND p.clerk_user_id = get_current_clerk_user_id()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "milestones_org_all" ON milestones
    FOR ALL USING (
      (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
      EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN profiles p ON om.user_id = p.id
        WHERE om.organization_id = organization_id
        AND p.clerk_user_id = get_current_clerk_user_id()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);

-- ============================================================================
-- 4. tasks table
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  rhythm_id UUID,          -- legacy, kept for backwards compat

  -- Recurrence
  is_recurring BOOLEAN DEFAULT false,
  recurrence JSONB,        -- { frequency, days, endDate }
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,

  -- Polymorphic assignee
  assignee_type assignee_type NOT NULL DEFAULT 'unassigned',
  assignee_id UUID,

  -- Creator
  created_by_type owner_type NOT NULL,
  created_by_id UUID NOT NULL,

  title VARCHAR(500) NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'backlog',
  priority task_priority NOT NULL DEFAULT 'medium',

  -- Dates
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Ordering
  order_index INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,

  -- Estimation
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),

  -- Tags and metadata
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "tasks_org_read" ON tasks
    FOR SELECT USING (
      (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
      EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN profiles p ON om.user_id = p.id
        WHERE om.organization_id = organization_id
        AND p.clerk_user_id = get_current_clerk_user_id()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "tasks_org_insert" ON tasks
    FOR INSERT WITH CHECK (
      (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
      EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN profiles p ON om.user_id = p.id
        WHERE om.organization_id = organization_id
        AND p.clerk_user_id = get_current_clerk_user_id()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "tasks_org_update" ON tasks
    FOR UPDATE USING (
      (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
      EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN profiles p ON om.user_id = p.id
        WHERE om.organization_id = organization_id
        AND p.clerk_user_id = get_current_clerk_user_id()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "tasks_org_delete" ON tasks
    FOR DELETE USING (
      (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
      EXISTS (
        SELECT 1 FROM organization_memberships om
        JOIN profiles p ON om.user_id = p.id
        WHERE om.organization_id = organization_id
        AND p.clerk_user_id = get_current_clerk_user_id()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_projects BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_milestones BEFORE UPDATE ON milestones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_tasks BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 5. Notify PostgREST to reload schema cache
-- ============================================================================
NOTIFY pgrst, 'reload schema';

-- Grant and RLS fixes (added by policy guard compliance)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestones TO authenticated;
GRANT ALL ON public.milestones TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
