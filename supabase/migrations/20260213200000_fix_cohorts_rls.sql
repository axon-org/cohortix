-- RLS policies for cohorts and cohort_members tables
-- Applied: 2026-02-13

-- Service role bypass (for API routes using service key)
CREATE POLICY "Service role bypass" ON cohorts FOR ALL USING (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "Service role bypass" ON cohort_members FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Cohorts: Users can view cohorts in their organization
CREATE POLICY "Users can view cohorts in their org" ON cohorts FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid())
);

-- Cohorts: Admins can create cohorts
CREATE POLICY "Users can create cohorts in their org" ON cohorts FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid())
);

-- Cohorts: Users can update cohorts in their org
CREATE POLICY "Users can update cohorts in their org" ON cohorts FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid())
);

-- Cohorts: Admins can delete cohorts
CREATE POLICY "Admins can delete cohorts in their org" ON cohorts FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Cohort members: View if in same org (join through cohort)
CREATE POLICY "Users can view cohort members" ON cohort_members FOR SELECT USING (
  cohort_id IN (SELECT id FROM cohorts WHERE organization_id IN (
    SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
  ))
);

-- Cohort members: Add members if in same org
CREATE POLICY "Users can add cohort members" ON cohort_members FOR INSERT WITH CHECK (
  cohort_id IN (SELECT id FROM cohorts WHERE organization_id IN (
    SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
  ))
);

-- Cohort members: Update if in same org  
CREATE POLICY "Users can update cohort members" ON cohort_members FOR UPDATE USING (
  cohort_id IN (SELECT id FROM cohorts WHERE organization_id IN (
    SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
  ))
);

-- Cohort members: Delete if admin in same org
CREATE POLICY "Admins can delete cohort members" ON cohort_members FOR DELETE USING (
  cohort_id IN (SELECT id FROM cohorts WHERE organization_id IN (
    SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ))
);
