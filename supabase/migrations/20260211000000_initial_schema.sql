-- ============================================================================
-- Initial Schema — Supabase Migrations Baseline
-- Migration:  20260211000000_initial_schema.sql
-- Created:    2026-02-11  (back-dated to precede all other supabase migrations)
-- Purpose:    Create the base tables that later migrations depend upon but
--             that previously existed only in the Drizzle schema
--             (packages/database/src/migrations/0000_initial_with_rls.sql).
--
--             Without this file Supabase Preview (clean DB replay) fails with
--             "relation X does not exist" when later migrations try to
--             reference these tables in FK constraints or RLS policies.
--
-- Design notes:
--   • All CREATE TABLE / CREATE TYPE statements are idempotent (IF NOT EXISTS /
--     exception-swallowing DO blocks) so they are safe to re-run.
--   • Only the tables that later supabase migrations depend on are created here
--     (organizations, profiles, organization_memberships, visions).
--     Tables that later migrations create themselves are intentionally omitted.
--   • RLS is enabled on every table so the DB Policy Guard workflow passes.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ---------------------------------------------------------------------------
-- ENUMs  (idempotent — ignore "already exists" errors)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- organizations
-- Required by: comments, activity_log, insights (sprint_4_backend),
--              missions (create_missions_table), cohorts RLS policies,
--              add_clerk_integration, rls_clerk_option_a_foundation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) UNIQUE NOT NULL,
  logo_url    TEXT,
  settings    JSONB        NOT NULL DEFAULT '{}'::jsonb,
  plan        VARCHAR(50)  NOT NULL DEFAULT 'free'
                           CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profiles  (user profiles for Clerk auth)
-- Required by: add_clerk_integration (adds clerk columns),
--              rls_clerk_option_a_foundation (RLS policies)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL,
  name          VARCHAR(255),
  avatar_url    TEXT,
  settings      JSONB        NOT NULL DEFAULT '{}'::jsonb,
  last_active_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- organization_memberships
-- Required by: fix_cohorts_rls (RLS policy subqueries),
--              rls_clerk_option_a_foundation, fix_rls_blockers_sprint4
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_memberships (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID         NOT NULL REFERENCES profiles(id)      ON DELETE CASCADE,
  role            org_role     NOT NULL DEFAULT 'member',
  permissions     JSONB        NOT NULL DEFAULT '{}'::jsonb,
  invited_by      UUID         REFERENCES profiles(id),
  invited_at      TIMESTAMPTZ,
  accepted_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_memberships_org  ON organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON organization_memberships(user_id);

ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- visions
-- Required by: create_missions_table (missions.vision_id FK)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS visions (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  status          VARCHAR(50)  NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'completed', 'archived')),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visions_org ON visions(organization_id);

ALTER TABLE visions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Clerk helper functions
-- These are used by 20260217000000_fix_rls_blockers_sprint4.sql but defined
-- in 20260217010000_rls_clerk_option_a_foundation.sql (which runs AFTER).
-- Moving them here (earliest migration) resolves the ordering dependency.
-- CREATE OR REPLACE is idempotent — safe to re-run.
-- ---------------------------------------------------------------------------

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

-- ============================================================================
-- End of initial schema baseline
-- ============================================================================

-- Grant and RLS fixes (added by policy guard compliance)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_memberships TO authenticated;
GRANT ALL ON public.organization_memberships TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visions TO authenticated;
GRANT ALL ON public.visions TO service_role;
