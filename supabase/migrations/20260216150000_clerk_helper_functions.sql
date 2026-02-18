-- ============================================================================
-- Clerk Helper Functions
-- Migration: 20260216150000_clerk_helper_functions.sql
-- Purpose:   Define get_current_clerk_user_id() and is_service_role() before
--            any migration uses them.
--
--            20260217000000_fix_rls_blockers_sprint4.sql references these
--            functions in POLICY definitions, but they were originally only
--            defined in 20260217010000_rls_clerk_option_a_foundation.sql which
--            runs AFTER the sprint4 blocker file.  On a clean DB replay this
--            produces: "function get_current_clerk_user_id() does not exist".
--
--            This migration (timestamp 20260216150000) runs before both of
--            those files and guarantees the functions exist.
--            CREATE OR REPLACE is idempotent — safe to re-run.
-- ============================================================================

-- Returns the Clerk user ID stored in the current session config.
-- Set by the API layer via: SET LOCAL app.current_clerk_user_id = '<id>';
CREATE OR REPLACE FUNCTION get_current_clerk_user_id()
RETURNS VARCHAR(255) AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.current_clerk_user_id', true),
    NULL
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Returns TRUE when the current connection is using the service role.
-- Set by the API layer via: SET LOCAL app.is_service_role = 'true';
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.is_service_role', true),
    'false'
  )::BOOLEAN;
END;
$$ LANGUAGE plpgsql STABLE;
