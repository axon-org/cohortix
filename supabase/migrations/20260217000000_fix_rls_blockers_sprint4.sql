-- ============================================================================
-- MIGRATION: Fix RLS Blockers - Sprint 4 Tables + Policy Hardening
-- Date: 2026-02-17
-- Branch: dev
-- 
-- Fixes:
-- 1. Enable RLS on comments, activity_log, insights (missing from sprint_4_backend)
-- 2. Harden cohorts/cohort_members policies (remove USING(true) permissive policies)
-- 3. Clerk-compatible policies for ALL tables (get_current_clerk_user_id() via profiles)
-- 4. Tenant isolation for all new tables
--
-- Identity model: Clerk Option A
--   - auth.uid() is NOT used (Clerk sub is a string, not UUID; auth.uid() returns NULL)
--   - All user identity resolved via:
--       profiles.id WHERE profiles.clerk_user_id = get_current_clerk_user_id()
--   - Service bypass: get_current_clerk_user_id() IS NULL AND is_service_role()
--     (matches pattern in 20260217010000_rls_clerk_option_a_foundation.sql)
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON SPRINT 4 TABLES (comments, activity_log, insights)
-- ============================================================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies (defense in depth)
DROP POLICY IF EXISTS "comments_select_all" ON comments;
DROP POLICY IF EXISTS "comments_insert_all" ON comments;
DROP POLICY IF EXISTS "activity_log_select_all" ON activity_log;
DROP POLICY IF EXISTS "activity_log_insert_all" ON activity_log;
DROP POLICY IF EXISTS "insights_select_all" ON insights;
DROP POLICY IF EXISTS "insights_insert_all" ON insights;

-- ============================================================================
-- 2. RLS POLICIES FOR comments TABLE
-- ============================================================================

-- Helper: Check if the current Clerk user has access to a comment's organization.
-- NOTE: Uses get_current_clerk_user_id() — Clerk Option A identity model.
CREATE OR REPLACE FUNCTION can_access_comment_entity(c comments)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_memberships om
    JOIN profiles p ON om.user_id = p.id
    WHERE om.organization_id = c.organization_id
      AND p.clerk_user_id = get_current_clerk_user_id()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Service role bypass for all tables
CREATE POLICY "comments_service_bypass" ON comments
  FOR ALL
  USING (get_current_clerk_user_id() IS NULL AND is_service_role());

-- Users can view comments in their organization
CREATE POLICY "comments_select_tenant" ON comments
  FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  );

-- Users can create comments in their organization
CREATE POLICY "comments_insert_tenant" ON comments
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  );

-- Users can update their own comments; org admins can update any in org
CREATE POLICY "comments_update_tenant" ON comments
  FOR UPDATE
  USING (
    author_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    )
    OR organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Users can delete their own comments; org admins can delete any in org
CREATE POLICY "comments_delete_tenant" ON comments
  FOR DELETE
  USING (
    author_id IN (
      SELECT id FROM profiles WHERE clerk_user_id = get_current_clerk_user_id()
    )
    OR organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
        AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 3. RLS POLICIES FOR activity_log TABLE
-- ============================================================================

CREATE POLICY "activity_log_service_bypass" ON activity_log
  FOR ALL
  USING (get_current_clerk_user_id() IS NULL AND is_service_role());

-- Users can view activity log in their organization (read-only)
CREATE POLICY "activity_log_select_tenant" ON activity_log
  FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  );

-- Inserts scoped to membership (service role preferred for audit writes)
CREATE POLICY "activity_log_insert_system" ON activity_log
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  );

-- No UPDATE/DELETE allowed for activity_log (immutable audit trail)

-- ============================================================================
-- 4. RLS POLICIES FOR insights TABLE
-- ============================================================================

CREATE POLICY "insights_service_bypass" ON insights
  FOR ALL
  USING (get_current_clerk_user_id() IS NULL AND is_service_role());

-- Users can view insights in their organization
CREATE POLICY "insights_select_tenant" ON insights
  FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  );

-- Users can create insights in their organization
CREATE POLICY "insights_insert_tenant" ON insights
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  );

-- Users can update insights in their organization
CREATE POLICY "insights_update_tenant" ON insights
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  );

-- Only admins can delete insights
CREATE POLICY "insights_delete_admin" ON insights
  FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
        AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 5. HARDEN COHORTS POLICIES (Remove USING(true) permissive policies)
-- ============================================================================

-- Drop old permissive policies from 20260212163340_create_cohorts.sql
DROP POLICY IF EXISTS "cohorts_select_policy" ON cohorts;
DROP POLICY IF EXISTS "cohorts_insert_policy" ON cohorts;
DROP POLICY IF EXISTS "cohorts_update_policy" ON cohorts;
DROP POLICY IF EXISTS "cohorts_delete_policy" ON cohorts;
DROP POLICY IF EXISTS "cohort_members_select_policy" ON cohort_members;
DROP POLICY IF EXISTS "cohort_members_insert_policy" ON cohort_members;
DROP POLICY IF EXISTS "cohort_members_update_policy" ON cohort_members;
DROP POLICY IF EXISTS "cohort_members_delete_policy" ON cohort_members;

-- Drop any old auth.uid()-based service bypass policies
DROP POLICY IF EXISTS "Service role bypass" ON cohorts;
DROP POLICY IF EXISTS "Service role bypass" ON cohort_members;

-- Service role bypass
CREATE POLICY "cohorts_service_bypass" ON cohorts
  FOR ALL
  USING (get_current_clerk_user_id() IS NULL AND is_service_role());

CREATE POLICY "cohort_members_service_bypass" ON cohort_members
  FOR ALL
  USING (get_current_clerk_user_id() IS NULL AND is_service_role());

-- Tenant isolation for cohorts
CREATE POLICY "cohorts_select_tenant" ON cohorts
  FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  );

CREATE POLICY "cohorts_insert_tenant" ON cohorts
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  );

CREATE POLICY "cohorts_update_tenant" ON cohorts
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  );

CREATE POLICY "cohorts_delete_tenant" ON cohorts
  FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Tenant isolation for cohort_members
CREATE POLICY "cohort_members_select_tenant" ON cohort_members
  FOR SELECT
  USING (
    cohort_id IN (
      SELECT c.id FROM cohorts c
      WHERE c.organization_id IN (
        SELECT om.organization_id
        FROM organization_memberships om
        JOIN profiles p ON om.user_id = p.id
        WHERE p.clerk_user_id = get_current_clerk_user_id()
      )
    )
  );

CREATE POLICY "cohort_members_insert_tenant" ON cohort_members
  FOR INSERT
  WITH CHECK (
    cohort_id IN (
      SELECT c.id FROM cohorts c
      WHERE c.organization_id IN (
        SELECT om.organization_id
        FROM organization_memberships om
        JOIN profiles p ON om.user_id = p.id
        WHERE p.clerk_user_id = get_current_clerk_user_id()
      )
    )
  );

CREATE POLICY "cohort_members_update_tenant" ON cohort_members
  FOR UPDATE
  USING (
    cohort_id IN (
      SELECT c.id FROM cohorts c
      WHERE c.organization_id IN (
        SELECT om.organization_id
        FROM organization_memberships om
        JOIN profiles p ON om.user_id = p.id
        WHERE p.clerk_user_id = get_current_clerk_user_id()
      )
    )
  );

CREATE POLICY "cohort_members_delete_tenant" ON cohort_members
  FOR DELETE
  USING (
    cohort_id IN (
      SELECT c.id FROM cohorts c
      WHERE c.organization_id IN (
        SELECT om.organization_id
        FROM organization_memberships om
        JOIN profiles p ON om.user_id = p.id
        WHERE p.clerk_user_id = get_current_clerk_user_id()
          AND om.role IN ('owner', 'admin')
      )
    )
  );

-- ============================================================================
-- 6. CLERK-COMPATIBLE POLICIES FOR MISSIONS TABLE
-- ============================================================================

-- Drop old policies (auth.uid() based — incompatible with Clerk Option A)
DROP POLICY IF EXISTS "Users can view missions in their organization" ON missions;
DROP POLICY IF EXISTS "Users can create missions in their organization" ON missions;
DROP POLICY IF EXISTS "Users can update missions in their organization" ON missions;
DROP POLICY IF EXISTS "Users can delete missions in their organization" ON missions;
DROP POLICY IF EXISTS "Service role bypass" ON missions;

-- Recreate with consistent Clerk-compatible pattern
CREATE POLICY "missions_service_bypass" ON missions
  FOR ALL
  USING (get_current_clerk_user_id() IS NULL AND is_service_role());

CREATE POLICY "missions_select_tenant" ON missions
  FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  );

CREATE POLICY "missions_insert_tenant" ON missions
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  );

CREATE POLICY "missions_update_tenant" ON missions
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
    )
  );

CREATE POLICY "missions_delete_tenant" ON missions
  FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id
      FROM organization_memberships om
      JOIN profiles p ON om.user_id = p.id
      WHERE p.clerk_user_id = get_current_clerk_user_id()
        AND om.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- 7. FORCE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE comments FORCE ROW LEVEL SECURITY;
ALTER TABLE activity_log FORCE ROW LEVEL SECURITY;
ALTER TABLE insights FORCE ROW LEVEL SECURITY;
ALTER TABLE cohorts FORCE ROW LEVEL SECURITY;
ALTER TABLE cohort_members FORCE ROW LEVEL SECURITY;
ALTER TABLE missions FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. INDEXES FOR RLS PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_comments_org_author ON comments(organization_id, author_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_org_actor ON activity_log(organization_id, actor_id);
CREATE INDEX IF NOT EXISTS idx_insights_org ON insights(organization_id);
CREATE INDEX IF NOT EXISTS idx_missions_org ON missions(organization_id);

COMMENT ON TABLE comments IS 'User comments on entities with Clerk-compatible RLS tenant isolation';
COMMENT ON TABLE activity_log IS 'Activity audit log with Clerk-compatible RLS tenant isolation (read-only for users)';
COMMENT ON TABLE insights IS 'AI-generated insights with Clerk-compatible RLS tenant isolation';
