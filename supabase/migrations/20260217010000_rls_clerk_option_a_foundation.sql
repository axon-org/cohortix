-- =============================================================================
-- MIGRATION: 20260217010000_rls_clerk_option_a_foundation.sql
-- Date: 2026-02-17
-- Purpose: Implement Clerk-compatible RLS on core tenant tables (Option A)
--          Database-level security as source of truth with app.current_clerk_user_id
-- Tables: profiles, organizations, organization_memberships
-- =============================================================================

-- =============================================================================
-- STEP 0: Helper Functions
-- =============================================================================

-- Function: Set session config (required for setting RLS context from client)
CREATE OR REPLACE FUNCTION set_config(key TEXT, value TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM pg_catalog.set_config(key, value, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION set_config(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_config(TEXT, TEXT) TO anon;

-- Function: Get current Clerk user ID from session config
-- This bridges Clerk JWT claims to PostgreSQL RLS
CREATE OR REPLACE FUNCTION get_current_clerk_user_id()
RETURNS VARCHAR(255) AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.current_clerk_user_id', true),
    NULL
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check if current user is service role
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check for service role in JWT claims (when using Supabase auth)
  -- OR when using service role key (bypasses RLS anyway, but for completeness)
  RETURN COALESCE(
    current_setting('app.is_service_role', true),
    'false'
  )::BOOLEAN;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get internal user UUID from Clerk user ID
CREATE OR REPLACE FUNCTION get_user_id_from_clerk(clerk_id VARCHAR(255))
RETURNS UUID AS $$
DECLARE
  internal_id UUID;
BEGIN
  SELECT id INTO internal_id
  FROM profiles
  WHERE clerk_user_id = clerk_id;
  RETURN internal_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- STEP 1: PROFILES TABLE - Clerk-Compatible RLS
-- =============================================================================

-- Enable RLS (idempotent)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles FORCE ROW LEVEL SECURITY;

-- Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
DROP POLICY IF EXISTS "profiles_service_role_all" ON profiles;
DROP POLICY IF EXISTS "profiles_clerk_select" ON profiles;
DROP POLICY IF EXISTS "profiles_clerk_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_clerk_update" ON profiles;
DROP POLICY IF EXISTS "profiles_clerk_delete" ON profiles;

-- Policy: Service role bypass (for webhooks, admin operations)
CREATE POLICY profiles_service_role_all ON profiles
  FOR ALL
  TO authenticated, anon
  USING (get_current_clerk_user_id() IS NULL AND is_service_role())
  WITH CHECK (get_current_clerk_user_id() IS NULL AND is_service_role());

-- Policy: Users can SELECT their own profile via Clerk user ID
CREATE POLICY profiles_clerk_select ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- User can see their own profile
    clerk_user_id = get_current_clerk_user_id()
    -- OR service role bypass
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

-- Policy: Users can INSERT their own profile (during onboarding)
CREATE POLICY profiles_clerk_insert ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    clerk_user_id = get_current_clerk_user_id()
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

-- Policy: Users can UPDATE their own profile
CREATE POLICY profiles_clerk_update ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    clerk_user_id = get_current_clerk_user_id()
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

-- Policy: Users can DELETE their own profile (account deletion)
CREATE POLICY profiles_clerk_delete ON profiles
  FOR DELETE
  TO authenticated
  USING (
    clerk_user_id = get_current_clerk_user_id()
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

-- =============================================================================
-- STEP 2: ORGANIZATIONS TABLE - Clerk-Compatible RLS
-- =============================================================================

-- Enable RLS (idempotent)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;

-- Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Organization owners can update" ON organizations;
DROP POLICY IF EXISTS "organizations_select" ON organizations;
DROP POLICY IF EXISTS "organizations_insert" ON organizations;
DROP POLICY IF EXISTS "organizations_update" ON organizations;
DROP POLICY IF EXISTS "organizations_delete" ON organizations;
DROP POLICY IF EXISTS "organizations_service_role_all" ON organizations;
DROP POLICY IF EXISTS "organizations_clerk_select" ON organizations;
DROP POLICY IF EXISTS "organizations_clerk_insert" ON organizations;
DROP POLICY IF EXISTS "organizations_clerk_update" ON organizations;
DROP POLICY IF EXISTS "organizations_clerk_delete" ON organizations;

-- Policy: Service role bypass (for webhooks, admin operations)
CREATE POLICY organizations_service_role_all ON organizations
  FOR ALL
  TO authenticated, anon
  USING (get_current_clerk_user_id() IS NULL AND is_service_role())
  WITH CHECK (get_current_clerk_user_id() IS NULL AND is_service_role());

-- Policy: Users can SELECT organizations they are members of
CREATE POLICY organizations_clerk_select ON organizations
  FOR SELECT
  TO authenticated
  USING (
    -- User is a member of this organization
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE om.organization_id = organizations.id
        AND p.clerk_user_id = get_current_clerk_user_id()
    )
    -- OR service role bypass
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

-- Policy: Users can INSERT organizations (during creation)
CREATE POLICY organizations_clerk_insert ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow creation (ownership verified by trigger or app logic)
    get_current_clerk_user_id() IS NOT NULL
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

-- Policy: Only org admins can UPDATE organizations
CREATE POLICY organizations_clerk_update ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    -- User is an admin/owner of this organization
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE om.organization_id = organizations.id
        AND p.clerk_user_id = get_current_clerk_user_id()
        AND om.role IN ('owner', 'admin')
    )
    -- OR service role bypass
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

-- Policy: Only org owners can DELETE organizations
CREATE POLICY organizations_clerk_delete ON organizations
  FOR DELETE
  TO authenticated
  USING (
    -- User is the owner of this organization
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE om.organization_id = organizations.id
        AND p.clerk_user_id = get_current_clerk_user_id()
        AND om.role = 'owner'
    )
    -- OR service role bypass
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

-- =============================================================================
-- STEP 3: ORGANIZATION_MEMBERSHIPS TABLE - Clerk-Compatible RLS
-- =============================================================================

-- Enable RLS (idempotent)
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships FORCE ROW LEVEL SECURITY;

-- Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Users can view memberships in their orgs" ON organization_memberships;
DROP POLICY IF EXISTS "Admins can manage memberships" ON organization_memberships;
DROP POLICY IF EXISTS "organization_memberships_select" ON organization_memberships;
DROP POLICY IF EXISTS "organization_memberships_insert" ON organization_memberships;
DROP POLICY IF EXISTS "organization_memberships_update" ON organization_memberships;
DROP POLICY IF EXISTS "organization_memberships_delete" ON organization_memberships;
DROP POLICY IF EXISTS "organization_memberships_service_role_all" ON organization_memberships;
DROP POLICY IF EXISTS "org_members_clerk_select" ON organization_memberships;
DROP POLICY IF EXISTS "org_members_clerk_insert" ON organization_memberships;
DROP POLICY IF EXISTS "org_members_clerk_update" ON organization_memberships;
DROP POLICY IF EXISTS "org_members_clerk_delete" ON organization_memberships;

-- Policy: Service role bypass (for webhooks, admin operations)
CREATE POLICY org_members_service_role_all ON organization_memberships
  FOR ALL
  TO authenticated, anon
  USING (get_current_clerk_user_id() IS NULL AND is_service_role())
  WITH CHECK (get_current_clerk_user_id() IS NULL AND is_service_role());

-- Policy: Users can SELECT memberships in their organizations
CREATE POLICY org_members_clerk_select ON organization_memberships
  FOR SELECT
  TO authenticated
  USING (
    -- User is a member of the same organization
    EXISTS (
      SELECT 1 FROM organization_memberships om2
      JOIN profiles p ON om2.user_id = p.id
      WHERE om2.organization_id = organization_memberships.organization_id
        AND p.clerk_user_id = get_current_clerk_user_id()
    )
    -- OR viewing their own membership
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = organization_memberships.user_id
        AND p.clerk_user_id = get_current_clerk_user_id()
    )
    -- OR service role bypass
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

-- Policy: Org admins can INSERT memberships
CREATE POLICY org_members_clerk_insert ON organization_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is an admin/owner of this organization
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE om.organization_id = organization_memberships.organization_id
        AND p.clerk_user_id = get_current_clerk_user_id()
        AND om.role IN ('owner', 'admin')
    )
    -- OR service role bypass
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

-- Policy: Org admins can UPDATE memberships
CREATE POLICY org_members_clerk_update ON organization_memberships
  FOR UPDATE
  TO authenticated
  USING (
    -- User is an admin/owner of this organization
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE om.organization_id = organization_memberships.organization_id
        AND p.clerk_user_id = get_current_clerk_user_id()
        AND om.role IN ('owner', 'admin')
    )
    -- OR service role bypass
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

-- Policy: Org admins can DELETE memberships
CREATE POLICY org_members_clerk_delete ON organization_memberships
  FOR DELETE
  TO authenticated
  USING (
    -- User is an admin/owner of this organization
    EXISTS (
      SELECT 1 FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE om.organization_id = organization_memberships.organization_id
        AND p.clerk_user_id = get_current_clerk_user_id()
        AND om.role IN ('owner', 'admin')
    )
    -- OR service role bypass
    OR (get_current_clerk_user_id() IS NULL AND is_service_role())
  );

-- =============================================================================
-- STEP 4: Performance Indexes
-- =============================================================================

-- Ensure indexes exist for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_clerk_org_id ON organizations(clerk_org_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_org ON organization_memberships(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org_role ON organization_memberships(organization_id, role);

-- Composite index for faster membership lookups
CREATE INDEX IF NOT EXISTS idx_org_memberships_clerk_lookup 
ON organization_memberships(organization_id, user_id) 
INCLUDE (role);

-- =============================================================================
-- STEP 5: Update auth-helper.ts Pattern Documentation
-- =============================================================================

COMMENT ON FUNCTION get_current_clerk_user_id() IS 
'Returns the current Clerk user ID from session config (app.current_clerk_user_id). 
Set this via: SET app.current_clerk_user_id = ''user_xxx'';
Used by RLS policies for Clerk-compatible tenant isolation.';

COMMENT ON FUNCTION is_service_role() IS 
'Returns true if the current session is using service role.
Set this via: SET app.is_service_role = ''true'';
Used for admin/webhook operations that bypass user-level RLS.';

COMMENT ON TABLE profiles IS 
'User profiles with Clerk integration. RLS enforced via clerk_user_id column.
Service role bypass available for webhooks/admin.';

COMMENT ON TABLE organizations IS 
'Organizations with Clerk integration. RLS enforced via organization_memberships.
Service role bypass available for webhooks/admin.';

COMMENT ON TABLE organization_memberships IS 
'Organization membership records linking users to orgs with roles.
RLS enforced via clerk_user_id lookup through profiles.
Service role bypass available for webhooks/admin.';

-- =============================================================================
-- STEP 6: Grants for Helper Functions
-- =============================================================================

-- Grant execute on helper functions to authenticated users
GRANT EXECUTE ON FUNCTION get_current_clerk_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_clerk_user_id() TO anon;
GRANT EXECUTE ON FUNCTION is_service_role() TO authenticated;
GRANT EXECUTE ON FUNCTION is_service_role() TO anon;
GRANT EXECUTE ON FUNCTION get_user_id_from_clerk(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_id_from_clerk(VARCHAR) TO anon;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
