-- Fix RLS policies on tasks, projects, milestones to properly bypass for service_role
-- The Supabase service_role key uses auth.role() = 'service_role', but our original
-- policies only checked is_service_role() (a custom Postgres setting).
-- This adds auth.role() = 'service_role' as an OR condition.

-- TASKS
DROP POLICY IF EXISTS tasks_org_read ON tasks;
CREATE POLICY tasks_org_read ON tasks FOR SELECT USING (
  auth.role() = 'service_role' OR
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1 FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = tasks.organization_id
    AND p.clerk_user_id = get_current_clerk_user_id()
  )
);

DROP POLICY IF EXISTS tasks_org_insert ON tasks;
CREATE POLICY tasks_org_insert ON tasks FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1 FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = tasks.organization_id
    AND p.clerk_user_id = get_current_clerk_user_id()
  )
);

DROP POLICY IF EXISTS tasks_org_update ON tasks;
CREATE POLICY tasks_org_update ON tasks FOR UPDATE USING (
  auth.role() = 'service_role' OR
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1 FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = tasks.organization_id
    AND p.clerk_user_id = get_current_clerk_user_id()
  )
);

DROP POLICY IF EXISTS tasks_org_delete ON tasks;
CREATE POLICY tasks_org_delete ON tasks FOR DELETE USING (
  auth.role() = 'service_role' OR
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1 FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = tasks.organization_id
    AND p.clerk_user_id = get_current_clerk_user_id()
  )
);

-- PROJECTS
DROP POLICY IF EXISTS projects_org_read ON projects;
CREATE POLICY projects_org_read ON projects FOR SELECT USING (
  auth.role() = 'service_role' OR
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1 FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = projects.organization_id
    AND p.clerk_user_id = get_current_clerk_user_id()
  )
);

DROP POLICY IF EXISTS projects_org_insert ON projects;
CREATE POLICY projects_org_insert ON projects FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1 FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = projects.organization_id
    AND p.clerk_user_id = get_current_clerk_user_id()
  )
);

DROP POLICY IF EXISTS projects_org_update ON projects;
CREATE POLICY projects_org_update ON projects FOR UPDATE USING (
  auth.role() = 'service_role' OR
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1 FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = projects.organization_id
    AND p.clerk_user_id = get_current_clerk_user_id()
  )
);

DROP POLICY IF EXISTS projects_org_delete ON projects;
CREATE POLICY projects_org_delete ON projects FOR DELETE USING (
  auth.role() = 'service_role' OR
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1 FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = projects.organization_id
    AND p.clerk_user_id = get_current_clerk_user_id()
  )
);

-- MILESTONES
DROP POLICY IF EXISTS milestones_org_read ON milestones;
CREATE POLICY milestones_org_read ON milestones FOR SELECT USING (
  auth.role() = 'service_role' OR
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1 FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    JOIN projects proj ON proj.organization_id = om.organization_id
    WHERE proj.id = milestones.project_id
    AND p.clerk_user_id = get_current_clerk_user_id()
  )
);

DROP POLICY IF EXISTS milestones_org_insert ON milestones;
CREATE POLICY milestones_org_insert ON milestones FOR INSERT WITH CHECK (
  auth.role() = 'service_role' OR
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1 FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    JOIN projects proj ON proj.organization_id = om.organization_id
    WHERE proj.id = milestones.project_id
    AND p.clerk_user_id = get_current_clerk_user_id()
  )
);

DROP POLICY IF EXISTS milestones_org_update ON milestones;
CREATE POLICY milestones_org_update ON milestones FOR UPDATE USING (
  auth.role() = 'service_role' OR
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1 FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    JOIN projects proj ON proj.organization_id = om.organization_id
    WHERE proj.id = milestones.project_id
    AND p.clerk_user_id = get_current_clerk_user_id()
  )
);

DROP POLICY IF EXISTS milestones_org_delete ON milestones;
CREATE POLICY milestones_org_delete ON milestones FOR DELETE USING (
  auth.role() = 'service_role' OR
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1 FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    JOIN projects proj ON proj.organization_id = om.organization_id
    WHERE proj.id = milestones.project_id
    AND p.clerk_user_id = get_current_clerk_user_id()
  )
);
