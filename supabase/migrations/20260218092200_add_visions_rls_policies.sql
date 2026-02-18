-- 20260218092200_add_visions_rls_policies.sql

-- Ensure RLS is enabled for the visions table
ALTER TABLE visions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies on visions to prevent conflicts
DROP POLICY IF EXISTS "Enable SELECT for organization members and service role" ON visions;
DROP POLICY IF EXISTS "Enable INSERT for organization members and service role" ON visions;
DROP POLICY IF EXISTS "Enable UPDATE for organization members and service role" ON visions;
DROP POLICY IF EXISTS "Enable DELETE for organization members and service role" ON visions;

-- Create policy for SELECT: user is org member or service role
CREATE POLICY "Enable SELECT for organization members and service role"
ON visions FOR SELECT
USING (
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = visions.organization_id
      AND p.clerk_user_id = get_current_clerk_user_id()
  )
);

-- Create policy for INSERT: user is org member or service role
CREATE POLICY "Enable INSERT for organization members and service role"
ON visions FOR INSERT
WITH CHECK (
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = visions.organization_id
      AND p.clerk_user_id = get_current_clerk_user_id()
  )
);

-- Create policy for UPDATE: user is org member or service role
CREATE POLICY "Enable UPDATE for organization members and service role"
ON visions FOR UPDATE
USING (
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = visions.organization_id
      AND p.clerk_user_id = get_current_clerk_user_id()
  )
)
WITH CHECK (
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = visions.organization_id
      AND p.clerk_user_id = get_current_clerk_user_id()
  )
);

-- Create policy for DELETE: user is org admin/owner or service role
CREATE POLICY "Enable DELETE for organization members and service role"
ON visions FOR DELETE
USING (
  (get_current_clerk_user_id() IS NULL AND is_service_role()) OR
  EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = visions.organization_id
      AND p.clerk_user_id = get_current_clerk_user_id()
      AND om.role IN ('owner', 'admin')
  )
);
