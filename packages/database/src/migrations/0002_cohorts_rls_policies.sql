-- RLS Policies for Cohorts Table
-- Ensures multi-tenant isolation: users can only access cohorts in their organization

-- Enable Row Level Security on cohorts table
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can SELECT cohorts in their organization
CREATE POLICY cohorts_tenant_select ON cohorts
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can INSERT cohorts for their organization
CREATE POLICY cohorts_tenant_insert ON cohorts
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can UPDATE cohorts in their organization
CREATE POLICY cohorts_tenant_update ON cohorts
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can DELETE cohorts in their organization
CREATE POLICY cohorts_tenant_delete ON cohorts
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cohorts_organization ON cohorts(organization_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts(status);
CREATE INDEX IF NOT EXISTS idx_cohorts_created_at ON cohorts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cohorts_slug ON cohorts(organization_id, slug);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_cohorts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cohorts_updated_at_trigger
  BEFORE UPDATE ON cohorts
  FOR EACH ROW
  EXECUTE FUNCTION update_cohorts_updated_at();
