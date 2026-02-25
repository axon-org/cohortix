-- ============================================================================
-- PPV Core Tables Enhancement
-- Migration: 20260225000001_ppv_core_tables.sql
-- Generated: 2026-02-25
-- ============================================================================
--
-- This migration:
-- 1. Creates the domains table (Life Pillars — top of PPV pyramid)
-- 2. Enhances visions table (add domain_id, timeline fields, progress)
-- 3. Enhances missions table (add priority, start_date, success_criteria, key_results)
-- 4. Adds recurrence fields to tasks table
-- 5. Sets up RLS, indexes, and triggers
--
-- Existing tables: visions (20260211), missions (20260213), projects, tasks
-- New table: domains
-- ============================================================================

-- ===========================================================================
-- 1. CREATE DOMAINS TABLE
-- ===========================================================================

CREATE TABLE IF NOT EXISTS domains (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_type      VARCHAR(50)  NOT NULL DEFAULT 'user',
  owner_id        UUID         NOT NULL,
  created_by_type VARCHAR(50)  NOT NULL DEFAULT 'user',
  created_by_id   UUID         NOT NULL,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  color           VARCHAR(7),  -- Hex color (#FF5733)
  icon            VARCHAR(50), -- Icon identifier
  order_index     INTEGER      NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_domains_org ON domains(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_org_name
  ON domains(organization_id, name);

-- RLS
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- RLS policies (Clerk-based, matching existing patterns)
DO $$
BEGIN
  -- Check if we have the Clerk helper function (from rls_clerk_option_a_foundation)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_current_clerk_user_id') THEN
    -- Clerk-based policies
    CREATE POLICY "domains_select_org_member" ON domains
      FOR SELECT USING (
        organization_id IN (
          SELECT om.organization_id FROM organization_memberships om
          WHERE om.clerk_user_id = get_current_clerk_user_id()
        )
      );

    CREATE POLICY "domains_insert_org_member" ON domains
      FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT om.organization_id FROM organization_memberships om
          WHERE om.clerk_user_id = get_current_clerk_user_id()
        )
      );

    CREATE POLICY "domains_update_org_member" ON domains
      FOR UPDATE USING (
        organization_id IN (
          SELECT om.organization_id FROM organization_memberships om
          WHERE om.clerk_user_id = get_current_clerk_user_id()
        )
      );

    CREATE POLICY "domains_delete_admin_only" ON domains
      FOR DELETE USING (
        organization_id IN (
          SELECT om.organization_id FROM organization_memberships om
          WHERE om.clerk_user_id = get_current_clerk_user_id()
            AND om.role IN ('owner', 'admin')
        )
      );
  END IF;
END;
$$;

-- Service role bypass
CREATE POLICY "domains_service_role" ON domains
  FOR ALL USING (
    COALESCE(current_setting('role', true), '') = 'service_role'
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role'
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_domains_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER domains_updated_at
  BEFORE UPDATE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION update_domains_updated_at();

COMMENT ON TABLE domains IS 'PPV Hierarchy: Domains are core life pillars (Health, Career, Family, etc.)';

-- ===========================================================================
-- 2. ENHANCE VISIONS TABLE
-- ===========================================================================

-- Add domain_id FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'visions'
      AND column_name = 'domain_id'
  ) THEN
    ALTER TABLE visions ADD COLUMN domain_id UUID REFERENCES domains(id) ON DELETE SET NULL;
  END IF;
END;
$$;

-- Add owner fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'visions'
      AND column_name = 'owner_type'
  ) THEN
    ALTER TABLE visions ADD COLUMN owner_type VARCHAR(50) NOT NULL DEFAULT 'user';
    ALTER TABLE visions ADD COLUMN owner_id UUID;
  END IF;
END;
$$;

-- Add timeline and progress fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'visions'
      AND column_name = 'target_date'
  ) THEN
    ALTER TABLE visions ADD COLUMN target_date DATE;
    ALTER TABLE visions ADD COLUMN review_date DATE;
    ALTER TABLE visions ADD COLUMN progress INTEGER DEFAULT 0;
    ALTER TABLE visions ADD COLUMN color VARCHAR(7);
    ALTER TABLE visions ADD COLUMN icon VARCHAR(50);
    ALTER TABLE visions ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE visions ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END;
$$;

-- Rename 'title' to 'name' for consistency (if title exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'visions'
      AND column_name = 'title'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'visions'
      AND column_name = 'name'
  ) THEN
    ALTER TABLE visions RENAME COLUMN title TO name;
  END IF;
END;
$$;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_visions_domain ON visions(domain_id) WHERE domain_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visions_status ON visions(organization_id, status);

-- ===========================================================================
-- 3. ENHANCE MISSIONS TABLE
-- ===========================================================================

-- Add priority
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'missions'
      AND column_name = 'priority'
  ) THEN
    ALTER TABLE missions ADD COLUMN priority VARCHAR(50) DEFAULT 'medium';
  END IF;
END;
$$;

-- Add start_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'missions'
      AND column_name = 'start_date'
  ) THEN
    ALTER TABLE missions ADD COLUMN start_date DATE;
  END IF;
END;
$$;

-- Add completed_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'missions'
      AND column_name = 'completed_date'
  ) THEN
    ALTER TABLE missions ADD COLUMN completed_date DATE;
  END IF;
END;
$$;

-- Add success_criteria and key_results
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'missions'
      AND column_name = 'success_criteria'
  ) THEN
    ALTER TABLE missions ADD COLUMN success_criteria JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE missions ADD COLUMN key_results JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE missions ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE missions ADD COLUMN order_index INTEGER NOT NULL DEFAULT 0;
  END IF;
END;
$$;

-- Rename 'title' to 'name' for consistency (if title exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'missions'
      AND column_name = 'title'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'missions'
      AND column_name = 'name'
  ) THEN
    ALTER TABLE missions RENAME COLUMN title TO name;
  END IF;
END;
$$;

-- ===========================================================================
-- 4. ADD RECURRENCE TO TASKS
-- ===========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tasks'
      AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT false;
    ALTER TABLE tasks ADD COLUMN recurrence JSONB;
    -- recurrence shape: { frequency: 'daily'|'weekly'|'monthly', days?: string[], endDate?: string }
  END IF;
END;
$$;

-- Remove rhythmId FK if it exists (rhythms table is being dropped conceptually)
-- We don't drop the column if it exists to avoid data loss, just leave it

COMMENT ON COLUMN tasks.is_recurring IS 'Whether this task recurs on a schedule';
COMMENT ON COLUMN tasks.recurrence IS 'Recurrence config: { frequency, days?, endDate? }';

-- ===========================================================================
-- 5. DOCUMENTATION
-- ===========================================================================

COMMENT ON COLUMN visions.domain_id IS 'Optional reference to parent Domain (life pillar)';
COMMENT ON COLUMN visions.target_date IS 'Target date for vision achievement';
COMMENT ON COLUMN visions.review_date IS 'Next scheduled review date (quarterly recommended)';
COMMENT ON COLUMN visions.progress IS 'Progress percentage (0-100), rolled up from missions';
COMMENT ON COLUMN missions.priority IS 'Mission priority: low, medium, high, urgent';
COMMENT ON COLUMN missions.start_date IS 'When work on this mission begins';
COMMENT ON COLUMN missions.success_criteria IS 'JSON array of success criteria strings';
COMMENT ON COLUMN missions.key_results IS 'JSON array of measurable key results';
