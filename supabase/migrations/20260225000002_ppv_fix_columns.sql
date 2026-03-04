-- ============================================================================
-- PPV Core Tables Fix — Ensure all columns exist
-- Migration: 20260225000002_ppv_fix_columns.sql
-- ============================================================================
-- The previous migration's DO $$ blocks may have been skipped due to
-- partial application. This migration uses direct ALTER TABLE statements
-- with explicit IF NOT EXISTS guards.

-- ===========================================================================
-- 1. DOMAINS — verify table exists with all columns
-- ===========================================================================

-- Table should already exist from 20260225000001. If not, create it.
CREATE TABLE IF NOT EXISTS domains (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_type      VARCHAR(50)  NOT NULL DEFAULT 'user',
  owner_id        UUID         NOT NULL,
  created_by_type VARCHAR(50)  NOT NULL DEFAULT 'user',
  created_by_id   UUID         NOT NULL,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  color           VARCHAR(7),
  icon            VARCHAR(50),
  order_index     INTEGER      NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_domains_org ON domains(organization_id);

-- Service role bypass (drop and recreate to be safe)
DROP POLICY IF EXISTS "domains_service_role" ON domains;
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

DROP TRIGGER IF EXISTS domains_updated_at ON domains;
CREATE TRIGGER domains_updated_at
  BEFORE UPDATE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION update_domains_updated_at();

-- ===========================================================================
-- 2. VISIONS — add missing columns
-- ===========================================================================

ALTER TABLE visions ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES domains(id) ON DELETE SET NULL;
ALTER TABLE visions ADD COLUMN IF NOT EXISTS owner_type VARCHAR(50) DEFAULT 'user' NOT NULL;
ALTER TABLE visions ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE visions ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE visions ADD COLUMN IF NOT EXISTS review_date DATE;
ALTER TABLE visions ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
ALTER TABLE visions ADD COLUMN IF NOT EXISTS color VARCHAR(7);
ALTER TABLE visions ADD COLUMN IF NOT EXISTS icon VARCHAR(50);
ALTER TABLE visions ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE visions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Rename title → name if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visions' AND column_name='title')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visions' AND column_name='name')
  THEN
    ALTER TABLE visions RENAME COLUMN title TO name;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_visions_domain ON visions(domain_id) WHERE domain_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visions_status ON visions(organization_id, status);

-- ===========================================================================
-- 3. MISSIONS — add missing columns
-- ===========================================================================

ALTER TABLE missions ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'medium';
ALTER TABLE missions ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS completed_date DATE;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS success_criteria JSONB DEFAULT '[]'::jsonb;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS key_results JSONB DEFAULT '[]'::jsonb;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE missions ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0 NOT NULL;

-- Rename title → name if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='missions' AND column_name='title')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='missions' AND column_name='name')
  THEN
    ALTER TABLE missions RENAME COLUMN title TO name;
  END IF;
END $$;

-- ===========================================================================
-- 4. TASKS — add recurrence (only if table exists)
-- ===========================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tasks') THEN
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence JSONB;
  END IF;
END $$;

-- ===========================================================================
-- 5. Notify PostgREST to reload schema cache
-- ===========================================================================

NOTIFY pgrst, 'reload schema';

-- Grant and RLS fixes (added by policy guard compliance)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domains TO authenticated;
GRANT ALL ON public.domains TO service_role;
