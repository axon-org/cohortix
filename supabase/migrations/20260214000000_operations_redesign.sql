-- ============================================================================
-- Operations Redesign: Week 1 Backend
-- Migration: 20260214000000_operations_redesign.sql
-- Generated: 2026-02-14 11:55 GMT+5
-- ============================================================================
--
-- This migration implements the operations redesign spec:
-- 1. Creates workstreams table (task grouping/phases)
-- 2. Creates operation_notes table (project notes)
-- 3. Creates operation_files table (file metadata)
-- 4. Creates operation_timeline_items table (activity log)
-- 5. Adds 9 new columns to projects table (operations metadata)
-- 6. Adds workstream_id to tasks table
-- ============================================================================

-- ============================================================================
-- 1. Create workstreams table
-- ============================================================================

CREATE TABLE IF NOT EXISTS workstreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0 NOT NULL,
  
  -- Progress tracking
  total_tasks INTEGER DEFAULT 0 NOT NULL,
  completed_tasks INTEGER DEFAULT 0 NOT NULL,
  
  -- Metadata
  created_by_type VARCHAR(50) DEFAULT 'user' NOT NULL,
  created_by_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for workstreams
CREATE INDEX IF NOT EXISTS idx_workstreams_project ON workstreams(project_id);
CREATE INDEX IF NOT EXISTS idx_workstreams_org ON workstreams(organization_id);
CREATE INDEX IF NOT EXISTS idx_workstreams_position ON workstreams(project_id, position);

-- ============================================================================
-- 2. Create operation_notes table
-- ============================================================================

CREATE TABLE IF NOT EXISTS operation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  content TEXT,
  note_type VARCHAR(50) DEFAULT 'document' NOT NULL CHECK (note_type IN ('document', 'pinned', 'important')),
  status VARCHAR(50) DEFAULT 'processing' NOT NULL CHECK (status IN ('processing', 'completed')),
  
  -- Metadata
  created_by_type VARCHAR(50) DEFAULT 'user' NOT NULL,
  created_by_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for operation_notes
CREATE INDEX IF NOT EXISTS idx_operation_notes_project ON operation_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_operation_notes_org ON operation_notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_operation_notes_type ON operation_notes(note_type);
CREATE INDEX IF NOT EXISTS idx_operation_notes_created_at ON operation_notes(created_at DESC);

-- ============================================================================
-- 3. Create operation_files table
-- ============================================================================

CREATE TABLE IF NOT EXISTS operation_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('pdf', 'zip', 'figma', 'image', 'generic')),
  file_size BIGINT NOT NULL, -- Size in bytes
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  mime_type VARCHAR(100),
  
  -- Metadata
  uploaded_by_type VARCHAR(50) DEFAULT 'user' NOT NULL,
  uploaded_by_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for operation_files
CREATE INDEX IF NOT EXISTS idx_operation_files_project ON operation_files(project_id);
CREATE INDEX IF NOT EXISTS idx_operation_files_org ON operation_files(organization_id);
CREATE INDEX IF NOT EXISTS idx_operation_files_type ON operation_files(file_type);
CREATE INDEX IF NOT EXISTS idx_operation_files_created_at ON operation_files(created_at DESC);

-- ============================================================================
-- 4. Create operation_timeline_items table
-- ============================================================================

CREATE TABLE IF NOT EXISTS operation_timeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'created', 'updated', 'status_changed', 'assigned', 
    'task_completed', 'note_added', 'file_uploaded', 
    'comment_added', 'ai_action'
  )),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}' NOT NULL,
  
  -- Actor (human or AI)
  actor_type VARCHAR(50) DEFAULT 'user' NOT NULL,
  actor_id UUID NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for operation_timeline_items
CREATE INDEX IF NOT EXISTS idx_timeline_project ON operation_timeline_items(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_org ON operation_timeline_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_timeline_event_type ON operation_timeline_items(event_type);
CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON operation_timeline_items(project_id, created_at DESC);

-- ============================================================================
-- 5. Add new columns to projects table (operations metadata)
-- ============================================================================

-- Location
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Sprint/Cycle info
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sprint_info VARCHAR(255);

-- Last sync timestamp
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_sync TIMESTAMPTZ;

-- Scope definition
ALTER TABLE projects ADD COLUMN IF NOT EXISTS in_scope TEXT[];
ALTER TABLE projects ADD COLUMN IF NOT EXISTS out_of_scope TEXT[];

-- Expected outcomes
ALTER TABLE projects ADD COLUMN IF NOT EXISTS expected_outcomes TEXT[];

-- Key features (organized by priority: P0, P1, P2)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS key_features JSONB DEFAULT '{"p0": [], "p1": [], "p2": []}' NOT NULL;

-- Health status (for AI Health Pulse)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS health_status VARCHAR(50) CHECK (health_status IN ('healthy', 'at_risk', 'critical', 'unknown'));

-- Visual label/tag
ALTER TABLE projects ADD COLUMN IF NOT EXISTS label VARCHAR(100);

-- ============================================================================
-- 6. Add workstream_id to tasks table
-- ============================================================================

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workstream_id UUID REFERENCES workstreams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_workstream ON tasks(workstream_id) WHERE workstream_id IS NOT NULL;

-- ============================================================================
-- 7. Enable Row-Level Security (RLS)
-- ============================================================================

ALTER TABLE workstreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_timeline_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. RLS Policies for workstreams
-- ============================================================================

-- Service role bypass
CREATE POLICY "Service role bypass" ON workstreams
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Users can view workstreams in their organization
CREATE POLICY "Users can view workstreams in their organization" ON workstreams
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create workstreams in their organization
CREATE POLICY "Users can create workstreams in their organization" ON workstreams
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Users can update workstreams in their organization
CREATE POLICY "Users can update workstreams in their organization" ON workstreams
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- Users can delete workstreams in their organization
CREATE POLICY "Users can delete workstreams in their organization" ON workstreams
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. RLS Policies for operation_notes
-- ============================================================================

CREATE POLICY "Service role bypass" ON operation_notes
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view notes in their organization" ON operation_notes
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create notes in their organization" ON operation_notes
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update notes in their organization" ON operation_notes
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete notes in their organization" ON operation_notes
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 10. RLS Policies for operation_files
-- ============================================================================

CREATE POLICY "Service role bypass" ON operation_files
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view files in their organization" ON operation_files
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files in their organization" ON operation_files
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update files in their organization" ON operation_files
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files in their organization" ON operation_files
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 11. RLS Policies for operation_timeline_items
-- ============================================================================

CREATE POLICY "Service role bypass" ON operation_timeline_items
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Users can view timeline in their organization" ON operation_timeline_items
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create timeline items in their organization" ON operation_timeline_items
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update timeline items in their organization" ON operation_timeline_items
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete timeline items in their organization" ON operation_timeline_items
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 12. Triggers for updated_at timestamps
-- ============================================================================

-- Workstreams
CREATE OR REPLACE FUNCTION update_workstreams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workstreams_updated_at
  BEFORE UPDATE ON workstreams
  FOR EACH ROW
  EXECUTE FUNCTION update_workstreams_updated_at();

-- Operation notes
CREATE OR REPLACE FUNCTION update_operation_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER operation_notes_updated_at
  BEFORE UPDATE ON operation_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_operation_notes_updated_at();

-- Operation files
CREATE OR REPLACE FUNCTION update_operation_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER operation_files_updated_at
  BEFORE UPDATE ON operation_files
  FOR EACH ROW
  EXECUTE FUNCTION update_operation_files_updated_at();

-- ============================================================================
-- 13. Comments for documentation
-- ============================================================================

COMMENT ON TABLE workstreams IS 'Operations Redesign: Workstream breakdown (task grouping by phase/epic)';
COMMENT ON TABLE operation_notes IS 'Operations Redesign: Project notes with types (document, pinned, important)';
COMMENT ON TABLE operation_files IS 'Operations Redesign: File metadata for operation attachments';
COMMENT ON TABLE operation_timeline_items IS 'Operations Redesign: Activity log for operations (human + AI actions)';

COMMENT ON COLUMN projects.location IS 'Operations Redesign: Geographic location (e.g., "Australia")';
COMMENT ON COLUMN projects.sprint_info IS 'Operations Redesign: Sprint/cycle information';
COMMENT ON COLUMN projects.last_sync IS 'Operations Redesign: Last sync timestamp for external integrations';
COMMENT ON COLUMN projects.in_scope IS 'Operations Redesign: Array of in-scope items';
COMMENT ON COLUMN projects.out_of_scope IS 'Operations Redesign: Array of out-of-scope items';
COMMENT ON COLUMN projects.expected_outcomes IS 'Operations Redesign: Array of expected measurable outcomes';
COMMENT ON COLUMN projects.key_features IS 'Operations Redesign: Key features organized by priority (P0, P1, P2)';
COMMENT ON COLUMN projects.health_status IS 'Operations Redesign: AI Health Pulse status';
COMMENT ON COLUMN projects.label IS 'Operations Redesign: Visual label/tag for categorization';
COMMENT ON COLUMN tasks.workstream_id IS 'Operations Redesign: Reference to parent workstream';
