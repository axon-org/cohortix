-- =============================================================================
-- MIGRATION 0005: Fix RLS Policies - Add Service Role Bypass
-- Date: 2026-02-12
-- Purpose: Allow service role to bypass RLS for admin operations and dev mode
-- Issue: Activity endpoint returning 404, members list empty due to RLS blocking access
-- =============================================================================

-- =============================================================================
-- COHORTS TABLE: Add service role bypass
-- =============================================================================

-- Drop existing policies (we'll recreate them with service role bypass)
DROP POLICY IF EXISTS cohorts_tenant_select ON cohorts;
DROP POLICY IF EXISTS cohorts_tenant_insert ON cohorts;
DROP POLICY IF EXISTS cohorts_tenant_update ON cohorts;
DROP POLICY IF EXISTS cohorts_tenant_delete ON cohorts;

-- Policy: Service role can access all cohorts
CREATE POLICY cohorts_service_role_all ON cohorts
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Policy: Regular users can SELECT cohorts in their organization
CREATE POLICY cohorts_tenant_select ON cohorts
  FOR SELECT
  TO authenticated
  USING (
    -- Service role bypass is handled by separate policy above
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Regular users can INSERT cohorts for their organization
CREATE POLICY cohorts_tenant_insert ON cohorts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Regular users can UPDATE cohorts in their organization
CREATE POLICY cohorts_tenant_update ON cohorts
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Regular users can DELETE cohorts in their organization
CREATE POLICY cohorts_tenant_delete ON cohorts
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- COHORT_MEMBERS TABLE: Add service role bypass
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS cohort_members_tenant_select ON cohort_members;
DROP POLICY IF EXISTS cohort_members_tenant_insert ON cohort_members;
DROP POLICY IF EXISTS cohort_members_tenant_update ON cohort_members;
DROP POLICY IF EXISTS cohort_members_tenant_delete ON cohort_members;

-- Policy: Service role can access all cohort members
CREATE POLICY cohort_members_service_role_all ON cohort_members
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Policy: Regular users can SELECT members of cohorts in their organization
CREATE POLICY cohort_members_tenant_select ON cohort_members
  FOR SELECT
  TO authenticated
  USING (
    cohort_id IN (
      SELECT id FROM cohorts WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_memberships 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Regular users can INSERT members for cohorts in their organization
CREATE POLICY cohort_members_tenant_insert ON cohort_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    cohort_id IN (
      SELECT id FROM cohorts WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_memberships 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Regular users can UPDATE members of cohorts in their organization
CREATE POLICY cohort_members_tenant_update ON cohort_members
  FOR UPDATE
  TO authenticated
  USING (
    cohort_id IN (
      SELECT id FROM cohorts WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_memberships 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Policy: Regular users can DELETE members from cohorts in their organization
CREATE POLICY cohort_members_tenant_delete ON cohort_members
  FOR DELETE
  TO authenticated
  USING (
    cohort_id IN (
      SELECT id FROM cohorts WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_memberships 
        WHERE user_id = auth.uid()
      )
    )
  );

-- =============================================================================
-- AUDIT_LOGS TABLE: Add service role bypass (for activity queries)
-- =============================================================================

-- Check if audit_logs table exists and has RLS enabled
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'audit_logs') THEN
    -- Enable RLS if not already enabled
    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
    
    -- Add service role bypass policy
    DROP POLICY IF EXISTS audit_logs_service_role_all ON audit_logs;
    CREATE POLICY audit_logs_service_role_all ON audit_logs
      FOR ALL
      TO authenticated
      USING (auth.jwt() ->> 'role' = 'service_role')
      WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
    
    -- If no other policies exist, add basic tenant isolation
    -- (This assumes audit_logs has organization_id or similar)
    -- Adjust this if audit_logs structure is different
  END IF;
END $$;

-- =============================================================================
-- VERIFICATION QUERIES (commented out — run manually if needed)
-- =============================================================================

-- Verify policies were created:
-- SELECT schemaname, tablename, policyname, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('cohorts', 'cohort_members', 'audit_logs')
-- ORDER BY tablename, policyname;

-- Test service role access (as superuser):
-- SET ROLE service_role;
-- SELECT COUNT(*) FROM cohorts;
-- SELECT COUNT(*) FROM cohort_members;
-- RESET ROLE;
