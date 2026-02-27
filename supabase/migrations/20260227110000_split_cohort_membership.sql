-- ============================================================================
-- CA-S1-01: Split cohort_members into cohort_user_members + cohort_agent_members
-- ============================================================================

-- Enum: cohort_member_role
DO $$ BEGIN
  CREATE TYPE cohort_member_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- cohort_user_members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cohort_user_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role cohort_member_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cohort_id, user_id)
);

-- ---------------------------------------------------------------------------
-- cohort_agent_members
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cohort_agent_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  role cohort_member_role NOT NULL DEFAULT 'member',
  engagement_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cohort_id, agent_id)
);

-- ---------------------------------------------------------------------------
-- Backfill: move existing cohort_members (agents) to cohort_agent_members
-- ---------------------------------------------------------------------------
INSERT INTO cohort_agent_members (
  id,
  cohort_id,
  agent_id,
  role,
  engagement_score,
  joined_at,
  updated_at
)
SELECT
  id,
  cohort_id,
  agent_id,
  'member'::cohort_member_role,
  engagement_score,
  joined_at,
  updated_at
FROM cohort_members;

-- ---------------------------------------------------------------------------
-- Drop old table
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS cohort_members;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
