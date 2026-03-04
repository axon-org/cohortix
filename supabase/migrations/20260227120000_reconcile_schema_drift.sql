-- ============================================================================
-- Schema Drift Reconciliation Migration
-- Migration:  20260227120000_reconcile_schema_drift.sql
-- Created:    2026-02-28
-- Purpose:    Add columns that exist in Drizzle schemas but were never
--             created via SQL migrations. Uses IF NOT EXISTS so this is
--             safe to run on both fresh DBs and existing remote DBs.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- cohorts — missing: created_by, engagement_percent, member_count, settings
-- ---------------------------------------------------------------------------
ALTER TABLE cohorts
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS engagement_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS member_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- missions — missing: cohort_id, scope_type, scope_id, slug, color, icon,
--            position, workspace_id, client_id
-- Note: scope columns should already be added by CA-S1-03a but the missions
--       table in the Drizzle schema may reference additional columns.
-- ---------------------------------------------------------------------------
ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scope_type scope_type,
  ADD COLUMN IF NOT EXISTS scope_id UUID,
  ADD COLUMN IF NOT EXISTS slug VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS color VARCHAR(50),
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
  ADD COLUMN IF NOT EXISTS position INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS workspace_id UUID,
  ADD COLUMN IF NOT EXISTS client_id UUID;

-- Backfill scope for missions
UPDATE missions
SET scope_type = 'org',
    scope_id = organization_id
WHERE scope_type IS NULL AND organization_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- visions — verify scope columns (should already exist from CA-S1-03a)
-- Adding IF NOT EXISTS is safe either way
-- ---------------------------------------------------------------------------
ALTER TABLE visions
  ADD COLUMN IF NOT EXISTS title VARCHAR(500);

-- Copy name → title if title is null (Drizzle schema uses 'title', migration uses 'name')
UPDATE visions SET title = name WHERE title IS NULL;

-- ============================================================================
-- End of reconciliation
-- ============================================================================
