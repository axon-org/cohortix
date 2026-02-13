-- =============================================================================
-- MIGRATION 0006: PPV Pro Terminology Alignment
-- Date: 2026-02-12
-- Purpose: Implement complete PPV Pro hierarchy for Cohortix
-- Reference: /docs/TERMINOLOGY.md (authoritative source)
-- =============================================================================
--
-- PPV Pro Alignment Zone (The Pyramid):
--   Domain → Vision → Mission → Operation/Rhythm → Task
--
-- Knowledge Zone:
--   Intelligence (topics) → Insights (learning captures)
--
-- Rhythm Zone:
--   Debriefs (daily/weekly/cycle reviews)
--
-- Note: Both humans AND allies own PPV stacks via polymorphic owner fields
-- =============================================================================

-- =============================================================================
-- 1. DOMAINS TABLE (Pillars & Purpose)
-- =============================================================================

CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Polymorphic owner (human user or ally/agent)
  owner_type owner_type NOT NULL,
  owner_id UUID NOT NULL,
  
  -- Created by (who defined this domain)
  created_by_type owner_type NOT NULL,
  created_by_id UUID NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Visual settings
  color VARCHAR(7), -- Hex color
  icon VARCHAR(50), -- Icon name
  
  -- Ordering
  order_index INTEGER DEFAULT 0 NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}' NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for domains
CREATE INDEX idx_domains_org ON domains(organization_id);
CREATE INDEX idx_domains_owner ON domains(owner_type, owner_id);
CREATE INDEX idx_domains_order ON domains(organization_id, owner_type, owner_id, order_index);

-- RLS for domains
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY domains_service_role_all ON domains
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY domains_tenant_select ON domains
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY domains_tenant_insert ON domains
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY domains_tenant_update ON domains
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY domains_tenant_delete ON domains
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 2. VISIONS TABLE (Life Aspirations)
-- =============================================================================

CREATE TYPE vision_status AS ENUM ('active', 'on_hold', 'achieved', 'archived');

CREATE TABLE IF NOT EXISTS visions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Polymorphic owner (human user or ally/agent)
  owner_type owner_type NOT NULL,
  owner_id UUID NOT NULL,
  
  -- Created by (who defined this vision)
  created_by_type owner_type NOT NULL,
  created_by_id UUID NOT NULL,
  
  -- Linked domain (Visions roll up to Domains)
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Why this matters (emotional driver)
  why_statement TEXT,
  
  status vision_status DEFAULT 'active' NOT NULL,
  
  -- Visual settings
  color VARCHAR(7), -- Hex color
  icon VARCHAR(50), -- Icon name
  
  -- Ordering within domain
  order_index INTEGER DEFAULT 0 NOT NULL,
  
  -- Achievement tracking (optional - visions are aspirational)
  achieved_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}' NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for visions
CREATE INDEX idx_visions_org ON visions(organization_id);
CREATE INDEX idx_visions_owner ON visions(owner_type, owner_id);
CREATE INDEX idx_visions_domain ON visions(domain_id);
CREATE INDEX idx_visions_status ON visions(status);

-- RLS for visions
ALTER TABLE visions ENABLE ROW LEVEL SECURITY;

CREATE POLICY visions_service_role_all ON visions
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY visions_tenant_select ON visions
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY visions_tenant_insert ON visions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY visions_tenant_update ON visions
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY visions_tenant_delete ON visions
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 3. ADD VISION LINK TO MISSIONS (GOALS TABLE)
-- =============================================================================

-- Add vision_id column to existing goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS vision_id UUID REFERENCES visions(id) ON DELETE SET NULL;

-- Index for vision linkage
CREATE INDEX IF NOT EXISTS idx_goals_vision ON goals(vision_id);

-- =============================================================================
-- 4. RHYTHMS TABLE (Routines)
-- =============================================================================

CREATE TYPE rhythm_status AS ENUM ('active', 'paused', 'completed', 'archived');
CREATE TYPE rhythm_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'custom');

CREATE TABLE IF NOT EXISTS rhythms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Polymorphic owner (human user or ally/agent)
  owner_type owner_type NOT NULL,
  owner_id UUID NOT NULL,
  
  -- Created by (who established this rhythm)
  created_by_type owner_type NOT NULL,
  created_by_id UUID NOT NULL,
  
  -- Linked mission (Rhythms support Missions in PPV hierarchy)
  mission_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status rhythm_status DEFAULT 'active' NOT NULL,
  
  -- Recurrence pattern
  frequency rhythm_frequency NOT NULL,
  custom_frequency JSONB, -- For complex patterns
  
  -- Scheduling
  start_date TIMESTAMPTZ,
  next_occurrence TIMESTAMPTZ,
  
  -- Checklist template (reusable steps for each occurrence)
  checklist_template JSONB DEFAULT '[]' NOT NULL,
  
  -- Tracking
  completion_count INTEGER DEFAULT 0 NOT NULL,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_completed_at TIMESTAMPTZ,
  
  -- Visual settings
  color VARCHAR(7), -- Hex color
  icon VARCHAR(50), -- Icon name
  
  -- Metadata
  metadata JSONB DEFAULT '{}' NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for rhythms
CREATE INDEX idx_rhythms_org ON rhythms(organization_id);
CREATE INDEX idx_rhythms_owner ON rhythms(owner_type, owner_id);
CREATE INDEX idx_rhythms_mission ON rhythms(mission_id);
CREATE INDEX idx_rhythms_status ON rhythms(status);
CREATE INDEX idx_rhythms_next_occurrence ON rhythms(next_occurrence);

-- RLS for rhythms
ALTER TABLE rhythms ENABLE ROW LEVEL SECURITY;

CREATE POLICY rhythms_service_role_all ON rhythms
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY rhythms_tenant_select ON rhythms
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY rhythms_tenant_insert ON rhythms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY rhythms_tenant_update ON rhythms
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY rhythms_tenant_delete ON rhythms
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 5. ADD RHYTHM LINK TO TASKS TABLE
-- =============================================================================

-- Add rhythm_id column to existing tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS rhythm_id UUID REFERENCES rhythms(id) ON DELETE CASCADE;

-- Make project_id nullable (tasks can belong to rhythms instead of projects)
ALTER TABLE tasks ALTER COLUMN project_id DROP NOT NULL;

-- Index for rhythm linkage
CREATE INDEX IF NOT EXISTS idx_tasks_rhythm ON tasks(rhythm_id);

-- Add constraint: task must belong to either project OR rhythm
ALTER TABLE tasks ADD CONSTRAINT tasks_project_or_rhythm_check 
  CHECK (
    (project_id IS NOT NULL AND rhythm_id IS NULL) OR 
    (project_id IS NULL AND rhythm_id IS NOT NULL)
  );

-- =============================================================================
-- 6. INTELLIGENCE TABLE (Topic Vault)
-- =============================================================================

CREATE TABLE IF NOT EXISTS intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Polymorphic owner (human user or ally/agent)
  owner_type owner_type NOT NULL,
  owner_id UUID NOT NULL,
  
  -- Created by (who created this topic)
  created_by_type owner_type NOT NULL,
  created_by_id UUID NOT NULL,
  
  -- Topic hierarchy (for nested topics)
  parent_topic_id UUID REFERENCES intelligence(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Topic summary (AI-generated from insights)
  summary TEXT,
  
  -- Classification
  tags JSONB DEFAULT '[]' NOT NULL,
  
  -- Visual settings
  color VARCHAR(7), -- Hex color
  icon VARCHAR(50), -- Icon name
  
  -- Metrics
  insight_count INTEGER DEFAULT 0 NOT NULL,
  relevance_score DECIMAL(3,2) DEFAULT 1.0 NOT NULL,
  last_insight_at TIMESTAMPTZ,
  
  -- Ordering
  order_index INTEGER DEFAULT 0 NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}' NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for intelligence
CREATE INDEX idx_intelligence_org ON intelligence(organization_id);
CREATE INDEX idx_intelligence_owner ON intelligence(owner_type, owner_id);
CREATE INDEX idx_intelligence_parent ON intelligence(parent_topic_id);

-- RLS for intelligence
ALTER TABLE intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY intelligence_service_role_all ON intelligence
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY intelligence_tenant_select ON intelligence
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY intelligence_tenant_insert ON intelligence
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY intelligence_tenant_update ON intelligence
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY intelligence_tenant_delete ON intelligence
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 7. INSIGHTS TABLE (NeuroBits)
-- =============================================================================

CREATE TYPE insight_source_type AS ENUM (
  'article',
  'book',
  'video',
  'conversation',
  'experience',
  'research',
  'course',
  'other'
);

CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Polymorphic owner (human user or ally/agent)
  owner_type owner_type NOT NULL,
  owner_id UUID NOT NULL,
  
  -- Created by (who captured this insight)
  created_by_type owner_type NOT NULL,
  created_by_id UUID NOT NULL,
  
  -- Linked intelligence topic (Insights roll up to Intelligence)
  intelligence_id UUID REFERENCES intelligence(id) ON DELETE SET NULL,
  
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  
  -- Source information
  source_type insight_source_type NOT NULL,
  source_url TEXT,
  source_title VARCHAR(500),
  source_author VARCHAR(255),
  
  -- Key takeaway (AI-generated or manual)
  key_takeaway TEXT,
  
  -- Classification
  tags JSONB DEFAULT '[]' NOT NULL,
  
  -- Related insights (for concept mapping)
  related_insight_ids JSONB DEFAULT '[]' NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}' NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for insights
CREATE INDEX idx_insights_org ON insights(organization_id);
CREATE INDEX idx_insights_owner ON insights(owner_type, owner_id);
CREATE INDEX idx_insights_intelligence ON insights(intelligence_id);
CREATE INDEX idx_insights_source_type ON insights(source_type);

-- RLS for insights
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY insights_service_role_all ON insights
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY insights_tenant_select ON insights
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY insights_tenant_insert ON insights
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY insights_tenant_update ON insights
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY insights_tenant_delete ON insights
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- 8. DEBRIEFS TABLE (Daily/Weekly/Cycle Reviews)
-- =============================================================================

CREATE TYPE debrief_type AS ENUM ('daily', 'weekly', 'cycle'); -- cycle = bi-monthly
CREATE TYPE debrief_status AS ENUM ('draft', 'completed', 'archived');

CREATE TABLE IF NOT EXISTS debriefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Polymorphic owner (human user or ally/agent)
  owner_type owner_type NOT NULL,
  owner_id UUID NOT NULL,
  
  -- Created by (who conducted the debrief)
  created_by_type owner_type NOT NULL,
  created_by_id UUID NOT NULL,
  
  -- Debrief metadata
  type debrief_type NOT NULL,
  status debrief_status DEFAULT 'draft' NOT NULL,
  
  -- Date range covered
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  title VARCHAR(500) NOT NULL,
  
  -- Structured reflection
  wins TEXT, -- What went well
  challenges TEXT, -- What was difficult
  learnings TEXT, -- What was learned
  next_steps TEXT, -- Action items
  
  -- Metrics snapshot (optional - from missions/operations)
  metrics_snapshot JSONB DEFAULT '{}' NOT NULL,
  
  -- Mood/energy tracking (optional - 1-10 scale)
  mood INTEGER CHECK (mood >= 1 AND mood <= 10),
  energy INTEGER CHECK (energy >= 1 AND energy <= 10),
  
  -- Tags and notes
  tags JSONB DEFAULT '[]' NOT NULL,
  notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}' NOT NULL,
  
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for debriefs
CREATE INDEX idx_debriefs_org ON debriefs(organization_id);
CREATE INDEX idx_debriefs_owner ON debriefs(owner_type, owner_id);
CREATE INDEX idx_debriefs_type ON debriefs(type);
CREATE INDEX idx_debriefs_period ON debriefs(period_start, period_end);

-- RLS for debriefs
ALTER TABLE debriefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY debriefs_service_role_all ON debriefs
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY debriefs_tenant_select ON debriefs
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY debriefs_tenant_insert ON debriefs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY debriefs_tenant_update ON debriefs
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY debriefs_tenant_delete ON debriefs
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- VERIFICATION QUERIES (commented out — run manually if needed)
-- =============================================================================

-- Verify all new tables were created:
-- SELECT tablename FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('domains', 'visions', 'rhythms', 'intelligence', 'insights', 'debriefs')
-- ORDER BY tablename;

-- Verify column additions:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'goals' AND column_name = 'vision_id';

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'tasks' AND column_name = 'rhythm_id';

-- Verify RLS policies:
-- SELECT schemaname, tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('domains', 'visions', 'rhythms', 'intelligence', 'insights', 'debriefs')
-- ORDER BY tablename, policyname;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Summary:
-- ✅ Created 6 new tables: domains, visions, rhythms, intelligence, insights, debriefs
-- ✅ Added vision_id to goals table (missions)
-- ✅ Added rhythm_id to tasks table
-- ✅ Made tasks.project_id nullable (can belong to rhythm instead)
-- ✅ Created comprehensive indexes for all new tables
-- ✅ Enabled RLS with service role bypass for all new tables
-- ✅ Maintained backwards compatibility via table naming (goals, projects)
-- =============================================================================
