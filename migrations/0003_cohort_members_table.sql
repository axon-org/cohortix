-- =============================================================================
-- MIGRATION 0003: Add Cohort Members Table
-- Date: 2026-02-11
-- Purpose: Link agents (allies) to cohorts with engagement tracking
-- =============================================================================

-- Create cohort_members table
CREATE TABLE IF NOT EXISTS cohort_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  engagement_score NUMERIC(5, 2) DEFAULT 0 NOT NULL CHECK (engagement_score BETWEEN 0 AND 100),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Prevent duplicate memberships
  UNIQUE(cohort_id, agent_id)
);

-- Indexes for performance
CREATE INDEX idx_cohort_members_cohort ON cohort_members(cohort_id);
CREATE INDEX idx_cohort_members_agent ON cohort_members(agent_id);
CREATE INDEX idx_cohort_members_engagement ON cohort_members(cohort_id, engagement_score DESC);

-- Enable Row Level Security
ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access members of cohorts in their organization
CREATE POLICY cohort_members_tenant_select ON cohort_members
  FOR SELECT
  USING (
    cohort_id IN (
      SELECT id FROM cohorts WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_memberships 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY cohort_members_tenant_insert ON cohort_members
  FOR INSERT
  WITH CHECK (
    cohort_id IN (
      SELECT id FROM cohorts WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_memberships 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY cohort_members_tenant_update ON cohort_members
  FOR UPDATE
  USING (
    cohort_id IN (
      SELECT id FROM cohorts WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_memberships 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY cohort_members_tenant_delete ON cohort_members
  FOR DELETE
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
-- Database Function: Get Cohort Engagement Timeline
-- =============================================================================

CREATE OR REPLACE FUNCTION get_cohort_engagement_timeline(
  p_cohort_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date TEXT,
  interaction_count INTEGER
) AS $$
BEGIN
  -- Generate date series for the range
  RETURN QUERY
  WITH date_range AS (
    SELECT 
      generate_series(
        p_start_date::timestamp,
        p_end_date::timestamp,
        '1 day'::interval
      )::date AS date
  ),
  cohort_agent_ids AS (
    SELECT agent_id 
    FROM cohort_members 
    WHERE cohort_id = p_cohort_id
  ),
  daily_interactions AS (
    SELECT 
      DATE(al.created_at) AS activity_date,
      COUNT(*) AS interaction_count
    FROM audit_logs al
    WHERE 
      -- Filter by cohort members
      al.user_id IN (SELECT agent_id::text FROM cohort_agent_ids)
      -- Filter by date range
      AND DATE(al.created_at) BETWEEN p_start_date AND p_end_date
    GROUP BY DATE(al.created_at)
  )
  SELECT 
    dr.date::text,
    COALESCE(di.interaction_count, 0)::integer
  FROM date_range dr
  LEFT JOIN daily_interactions di ON dr.date = di.activity_date
  ORDER BY dr.date;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_cohort_engagement_timeline(UUID, DATE, DATE) TO authenticated;

-- =============================================================================
-- Trigger: Auto-update cohort member_count on cohort_members changes
-- =============================================================================

CREATE OR REPLACE FUNCTION update_cohort_member_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update member_count in cohorts table
  IF TG_OP = 'INSERT' THEN
    UPDATE cohorts 
    SET member_count = (SELECT COUNT(*) FROM cohort_members WHERE cohort_id = NEW.cohort_id)
    WHERE id = NEW.cohort_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE cohorts 
    SET member_count = (SELECT COUNT(*) FROM cohort_members WHERE cohort_id = OLD.cohort_id)
    WHERE id = OLD.cohort_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cohort_member_count_trigger
AFTER INSERT OR DELETE ON cohort_members
FOR EACH ROW
EXECUTE FUNCTION update_cohort_member_count();

-- =============================================================================
-- Trigger: Auto-update cohort engagement_percent on member engagement changes
-- =============================================================================

CREATE OR REPLACE FUNCTION update_cohort_engagement()
RETURNS TRIGGER AS $$
BEGIN
  -- Update average engagement_percent in cohorts table
  UPDATE cohorts 
  SET engagement_percent = (
    SELECT COALESCE(ROUND(AVG(engagement_score), 2), 0)
    FROM cohort_members 
    WHERE cohort_id = NEW.cohort_id
  )
  WHERE id = NEW.cohort_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cohort_engagement_trigger
AFTER INSERT OR UPDATE OF engagement_score ON cohort_members
FOR EACH ROW
EXECUTE FUNCTION update_cohort_engagement();

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE cohort_members IS 'Links agents (allies) to cohorts with engagement tracking';
COMMENT ON COLUMN cohort_members.engagement_score IS 'Agent engagement score within this cohort (0-100)';
COMMENT ON FUNCTION get_cohort_engagement_timeline IS 'Returns daily interaction counts for cohort timeline graph';
