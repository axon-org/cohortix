-- Cohortix Sprint 2: Cohorts Feature
-- Migration: Create cohorts and cohort_members tables
-- Author: John (Backend)
-- Date: 2026-02-12

-- cohorts table
CREATE TABLE IF NOT EXISTS cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  slug varchar(100) NOT NULL DEFAULT '',
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'at-risk', 'completed')),
  start_date timestamptz,
  end_date timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- cohort_members table
CREATE TABLE IF NOT EXISTS cohort_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id uuid,
  ally_id uuid,
  joined_at timestamptz DEFAULT now(),
  engagement_score numeric(5,2) DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_or_ally_required CHECK (user_id IS NOT NULL OR ally_id IS NOT NULL)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cohorts_org_id ON cohorts(organization_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts(status);
CREATE INDEX IF NOT EXISTS idx_cohort_members_cohort_id ON cohort_members(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_members_user_id ON cohort_members(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cohort_members_ally_id ON cohort_members(ally_id) WHERE ally_id IS NOT NULL;

-- Row Level Security
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cohorts (placeholder - adjust based on auth setup)
CREATE POLICY "cohorts_select_policy" ON cohorts
  FOR SELECT USING (true); -- TODO: Restrict to organization members

CREATE POLICY "cohorts_insert_policy" ON cohorts
  FOR INSERT WITH CHECK (true); -- TODO: Restrict to organization admins

CREATE POLICY "cohorts_update_policy" ON cohorts
  FOR UPDATE USING (true); -- TODO: Restrict to organization admins

CREATE POLICY "cohorts_delete_policy" ON cohorts
  FOR DELETE USING (true); -- TODO: Restrict to organization admins

-- RLS Policies for cohort_members  
CREATE POLICY "cohort_members_select_policy" ON cohort_members
  FOR SELECT USING (true); -- TODO: Restrict to cohort members' organization

CREATE POLICY "cohort_members_insert_policy" ON cohort_members
  FOR INSERT WITH CHECK (true); -- TODO: Restrict to organization admins

CREATE POLICY "cohort_members_update_policy" ON cohort_members
  FOR UPDATE USING (true); -- TODO: Restrict to organization admins

CREATE POLICY "cohort_members_delete_policy" ON cohort_members
  FOR DELETE USING (true); -- TODO: Restrict to organization admins

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cohorts_updated_at
  BEFORE UPDATE ON cohorts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cohort_members_updated_at
  BEFORE UPDATE ON cohort_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant and RLS fixes (added by policy guard compliance)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cohorts TO authenticated;
GRANT ALL ON public.cohorts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cohort_members TO authenticated;
GRANT ALL ON public.cohort_members TO service_role;
