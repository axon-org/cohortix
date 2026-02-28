-- ============================================================================
-- CA-S1-08: RLS policies for scoped access (personal/cohort/org)
-- ============================================================================

-- Enable RLS for scoped tables
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_user_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_agent_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE visions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_evolution_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Drop legacy policies (org-only / permissive)
-- ---------------------------------------------------------------------------
-- Cohorts
DROP POLICY IF EXISTS "cohorts_service_bypass" ON cohorts;
DROP POLICY IF EXISTS "cohorts_select_tenant" ON cohorts;
DROP POLICY IF EXISTS "cohorts_insert_tenant" ON cohorts;
DROP POLICY IF EXISTS "cohorts_update_tenant" ON cohorts;
DROP POLICY IF EXISTS "cohorts_delete_tenant" ON cohorts;
DROP POLICY IF EXISTS "cohorts_select_policy" ON cohorts;
DROP POLICY IF EXISTS "cohorts_insert_policy" ON cohorts;
DROP POLICY IF EXISTS "cohorts_update_policy" ON cohorts;
DROP POLICY IF EXISTS "cohorts_delete_policy" ON cohorts;
DROP POLICY IF EXISTS "Service role bypass" ON cohorts;

-- Comments
DROP POLICY IF EXISTS "comments_service_bypass" ON comments;
DROP POLICY IF EXISTS "comments_select_tenant" ON comments;
DROP POLICY IF EXISTS "comments_insert_tenant" ON comments;
DROP POLICY IF EXISTS "comments_update_tenant" ON comments;
DROP POLICY IF EXISTS "comments_delete_tenant" ON comments;

-- Insights
DROP POLICY IF EXISTS "insights_service_bypass" ON insights;
DROP POLICY IF EXISTS "insights_select_tenant" ON insights;
DROP POLICY IF EXISTS "insights_insert_tenant" ON insights;
DROP POLICY IF EXISTS "insights_update_tenant" ON insights;
DROP POLICY IF EXISTS "insights_delete_tenant" ON insights;

-- Visions
DROP POLICY IF EXISTS "Enable SELECT for organization members and service role" ON visions;
DROP POLICY IF EXISTS "Enable INSERT for organization members and service role" ON visions;
DROP POLICY IF EXISTS "Enable UPDATE for organization members and service role" ON visions;
DROP POLICY IF EXISTS "Enable DELETE for organization members and service role" ON visions;

-- Tasks / Projects
DROP POLICY IF EXISTS tasks_org_read ON tasks;
DROP POLICY IF EXISTS tasks_org_insert ON tasks;
DROP POLICY IF EXISTS tasks_org_update ON tasks;
DROP POLICY IF EXISTS tasks_org_delete ON tasks;
DROP POLICY IF EXISTS projects_org_read ON projects;
DROP POLICY IF EXISTS projects_org_insert ON projects;
DROP POLICY IF EXISTS projects_org_update ON projects;
DROP POLICY IF EXISTS projects_org_delete ON projects;

-- ---------------------------------------------------------------------------
-- Helpers: service role bypass condition
-- ---------------------------------------------------------------------------
-- Use auth.role() and legacy is_service_role() for compatibility

-- ---------------------------------------------------------------------------
-- Cohorts: personal (owner only), shared (members only)
-- ---------------------------------------------------------------------------
CREATE POLICY cohorts_service_bypass ON cohorts
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

CREATE POLICY cohorts_select_scoped ON cohorts
  FOR SELECT
  USING (
    (type = 'personal' AND owner_user_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (type = 'shared' AND id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  );

CREATE POLICY cohorts_insert_scoped ON cohorts
  FOR INSERT
  WITH CHECK (
    (type = 'personal' AND owner_user_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (type = 'shared' AND organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  );

CREATE POLICY cohorts_update_scoped ON cohorts
  FOR UPDATE
  USING (
    (type = 'personal' AND owner_user_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (type = 'shared' AND id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  );

CREATE POLICY cohorts_delete_scoped ON cohorts
  FOR DELETE
  USING (
    (type = 'personal' AND owner_user_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (type = 'shared' AND id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  );

-- ---------------------------------------------------------------------------
-- Cohort members (users + agents): visible to cohort members only
-- ---------------------------------------------------------------------------
CREATE POLICY cohort_user_members_service_bypass ON cohort_user_members
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

CREATE POLICY cohort_user_members_scoped ON cohort_user_members
  FOR ALL
  USING (
    cohort_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  )
  WITH CHECK (
    cohort_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  );

CREATE POLICY cohort_agent_members_service_bypass ON cohort_agent_members
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

CREATE POLICY cohort_agent_members_scoped ON cohort_agent_members
  FOR ALL
  USING (
    cohort_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  )
  WITH CHECK (
    cohort_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Scoped entities (personal/cohort/org)
-- ---------------------------------------------------------------------------
-- Generic scope condition repeated per table

-- Agents
CREATE POLICY agents_service_bypass ON agents
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

CREATE POLICY agents_scoped_access ON agents
  FOR ALL
  USING (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  )
  WITH CHECK (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  );

-- Visions
CREATE POLICY visions_service_bypass ON visions
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

CREATE POLICY visions_scoped_access ON visions
  FOR ALL
  USING (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  )
  WITH CHECK (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  );

-- Projects (operations)
CREATE POLICY projects_service_bypass ON projects
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

CREATE POLICY projects_scoped_access ON projects
  FOR ALL
  USING (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  )
  WITH CHECK (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  );

-- Tasks
CREATE POLICY tasks_service_bypass ON tasks
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

CREATE POLICY tasks_scoped_access ON tasks
  FOR ALL
  USING (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  )
  WITH CHECK (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  );

-- Comments
CREATE POLICY comments_service_bypass ON comments
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

CREATE POLICY comments_scoped_access ON comments
  FOR ALL
  USING (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  )
  WITH CHECK (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  );

-- Knowledge entries
CREATE POLICY knowledge_entries_service_bypass ON knowledge_entries
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

CREATE POLICY knowledge_entries_scoped_access ON knowledge_entries
  FOR ALL
  USING (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  )
  WITH CHECK (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  );

-- Insights
CREATE POLICY insights_service_bypass ON insights
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

CREATE POLICY insights_scoped_access ON insights
  FOR ALL
  USING (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  )
  WITH CHECK (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  );

-- Task sessions
CREATE POLICY task_sessions_service_bypass ON task_sessions
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

CREATE POLICY task_sessions_scoped_access ON task_sessions
  FOR ALL
  USING (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  )
  WITH CHECK (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  );

-- Agent evolution events
CREATE POLICY agent_evolution_events_service_bypass ON agent_evolution_events
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

CREATE POLICY agent_evolution_events_scoped_access ON agent_evolution_events
  FOR ALL
  USING (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  )
  WITH CHECK (
    (scope_type = 'personal' AND scope_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'cohort' AND scope_id IN (
      SELECT cum.cohort_id
      FROM cohort_user_members cum
      JOIN profiles p ON cum.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
    OR (scope_type = 'org' AND scope_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    ))
  );

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
