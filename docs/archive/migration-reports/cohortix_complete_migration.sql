-- =============================================================================
-- COHORTIX COMPLETE DATABASE MIGRATION
-- Generated: 2026-02-11
-- =============================================================================
-- 
-- Execute this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rfwscvklcokzuofyzqwx/sql/new
--
-- This file combines all migrations in the correct order:
-- 1. Initial schema with RLS (0000_initial_with_rls.sql)
-- 2. Cohorts table (0001_thin_hardball.sql)
-- 3. Cohorts RLS policies (0002_cohorts_rls_policies.sql)
-- =============================================================================

-- Cohortix Database Migration: Initial Schema with RLS
-- Generated: 2026-02-11
-- Updated: 2026-02-11 (Added PPV terminology comments)
-- 
-- This migration creates all core tables for Cohortix with:
-- - Multi-tenant isolation via Row-Level Security (RLS)
-- - Proper indexes for performance
-- - Foreign key constraints
-- - Supabase Auth integration (auth.uid())
--
-- TERMINOLOGY NOTE (PPV Hierarchy):
-- - User-facing: Pillars → Aspirations → Goals → Missions → Actions
-- - Database tables: goals → projects (Missions) → tasks (Actions)
-- - "Allies" = agents in user-facing terminology

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE agent_status AS ENUM ('active', 'idle', 'busy', 'offline', 'error');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'archived');
CREATE TYPE owner_type AS ENUM ('user', 'agent');
CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE assignee_type AS ENUM ('user', 'agent', 'unassigned');
CREATE TYPE milestone_status AS ENUM ('upcoming', 'active', 'completed', 'missed');
CREATE TYPE goal_status AS ENUM ('not_started', 'in_progress', 'at_risk', 'completed', 'cancelled');
CREATE TYPE knowledge_source_type AS ENUM ('task', 'research', 'manual', 'conversation', 'integration');
CREATE TYPE knowledge_category AS ENUM ('technical', 'strategic', 'operational', 'domain', 'process', 'other');
CREATE TYPE knowledge_scope_level AS ENUM ('company', 'client', 'project');
CREATE TYPE author_type AS ENUM ('user', 'agent', 'system');
CREATE TYPE agent_project_role AS ENUM ('owner', 'contributor', 'viewer');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}' NOT NULL,
  plan VARCHAR(50) DEFAULT 'free' NOT NULL CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  settings JSONB DEFAULT '{}' NOT NULL,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_profiles_email ON profiles(email);

-- Organization Memberships
CREATE TABLE organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '{}' NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_memberships_org ON organization_memberships(organization_id);
CREATE INDEX idx_org_memberships_user ON organization_memberships(user_id);

-- Clients
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  industry VARCHAR(100),
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_clients_org ON clients(organization_id);
CREATE INDEX idx_clients_slug ON clients(organization_id, slug);
CREATE INDEX idx_clients_industry ON clients(industry) WHERE industry IS NOT NULL;

-- Workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_workspaces_org ON workspaces(organization_id);

-- Agents
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(255),
  description TEXT,
  status agent_status DEFAULT 'idle' NOT NULL,
  capabilities JSONB DEFAULT '[]' NOT NULL,
  runtime_type VARCHAR(50) DEFAULT 'clawdbot' NOT NULL,
  runtime_config JSONB DEFAULT '{}' NOT NULL,
  total_tasks_completed INTEGER DEFAULT 0 NOT NULL,
  total_time_worked_ms BIGINT DEFAULT 0 NOT NULL,
  last_active_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_agents_org ON agents(organization_id);
CREATE INDEX idx_agents_status ON agents(organization_id, status);
CREATE INDEX idx_agents_external_id ON agents(external_id) WHERE external_id IS NOT NULL;

-- Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  owner_type owner_type NOT NULL,
  owner_id UUID NOT NULL,
  created_by_type owner_type NOT NULL,
  created_by_id UUID NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status goal_status DEFAULT 'not_started' NOT NULL,
  progress_percent INTEGER DEFAULT 0 NOT NULL CHECK (progress_percent BETWEEN 0 AND 100),
  progress_auto_calculate JSONB DEFAULT 'true' NOT NULL,
  target_date DATE,
  completed_at TIMESTAMPTZ,
  key_results JSONB DEFAULT '[]' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_goals_org ON goals(organization_id);
CREATE INDEX idx_goals_client ON goals(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_goals_owner ON goals(owner_type, owner_id);
CREATE INDEX idx_goals_status ON goals(organization_id, status);

-- Missions (user-facing terminology: "Mission", database table: "projects")
-- PPV Hierarchy: Goals → Missions → Actions
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  owner_type owner_type DEFAULT 'user' NOT NULL,
  owner_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  status project_status DEFAULT 'planning' NOT NULL,
  color VARCHAR(7),
  icon VARCHAR(50),
  start_date DATE,
  target_date DATE,
  completed_at TIMESTAMPTZ,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_projects_workspace ON projects(workspace_id) WHERE workspace_id IS NOT NULL;
CREATE INDEX idx_projects_client ON projects(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_projects_status ON projects(organization_id, status);
CREATE INDEX idx_projects_owner ON projects(owner_type, owner_id);

-- Milestones
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status milestone_status DEFAULT 'upcoming' NOT NULL,
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_milestones_due ON milestones(due_date);

-- Actions (user-facing terminology: "Action", database table: "tasks")
-- PPV Hierarchy: Individual executable steps within Missions
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  assignee_type assignee_type DEFAULT 'unassigned' NOT NULL,
  assignee_id UUID,
  created_by_type owner_type NOT NULL,
  created_by_id UUID NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status task_status DEFAULT 'backlog' NOT NULL,
  priority task_priority DEFAULT 'medium' NOT NULL,
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  order_index INTEGER DEFAULT 0 NOT NULL,
  estimated_hours DECIMAL(6, 2),
  actual_hours DECIMAL(6, 2),
  tags JSONB DEFAULT '[]' NOT NULL,
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tasks_org ON tasks(organization_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX idx_tasks_assignee ON tasks(assignee_type, assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_tasks_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_order ON tasks(project_id, status, order_index);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_type author_type NOT NULL,
  author_id UUID,
  content TEXT NOT NULL,
  content_html TEXT,
  mentions JSONB DEFAULT '[]' NOT NULL,
  attachments JSONB DEFAULT '[]' NOT NULL,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_comments_author ON comments(author_type, author_id) WHERE author_id IS NOT NULL;

-- Time Entries
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_ms BIGINT,
  description TEXT,
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_time_entries_task ON time_entries(task_id);
CREATE INDEX idx_time_entries_agent ON time_entries(agent_id);
CREATE INDEX idx_time_entries_started ON time_entries(started_at);

-- Agent Assignments (Project-level)
CREATE TABLE agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role agent_project_role DEFAULT 'contributor' NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(agent_id, project_id)
);

CREATE INDEX idx_agent_assignments_agent ON agent_assignments(agent_id);
CREATE INDEX idx_agent_assignments_project ON agent_assignments(project_id);

-- Agent Client Assignments
CREATE TABLE agent_client_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(agent_id, client_id)
);

CREATE INDEX idx_agent_client_assignments_agent ON agent_client_assignments(agent_id);
CREATE INDEX idx_agent_client_assignments_client ON agent_client_assignments(client_id);

-- Knowledge Entries
CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  source_type knowledge_source_type NOT NULL,
  source_id UUID,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  category knowledge_category DEFAULT 'other' NOT NULL,
  tags JSONB DEFAULT '[]' NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  scope_level knowledge_scope_level DEFAULT 'company' NOT NULL,
  scope_id UUID,
  relevance_score DECIMAL(3, 2) DEFAULT 1.0 NOT NULL CHECK (relevance_score BETWEEN 0 AND 1),
  access_count INTEGER DEFAULT 0 NOT NULL,
  last_accessed_at TIMESTAMPTZ,
  helpful_count INTEGER DEFAULT 0 NOT NULL,
  unhelpful_count INTEGER DEFAULT 0 NOT NULL,
  decay_disabled BOOLEAN DEFAULT FALSE NOT NULL,
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_knowledge_org ON knowledge_entries(organization_id);
CREATE INDEX idx_knowledge_agent ON knowledge_entries(agent_id) WHERE agent_id IS NOT NULL;
CREATE INDEX idx_knowledge_category ON knowledge_entries(organization_id, category);
CREATE INDEX idx_knowledge_client ON knowledge_entries(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_knowledge_scope ON knowledge_entries(organization_id, scope_level, scope_id);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_type author_type NOT NULL,
  actor_id UUID,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_type, actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tenant tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_client_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is org member
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_id = org_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if user is org admin/owner
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_id = org_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations Policies
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can update" ON organizations
  FOR UPDATE USING (is_org_admin(id));

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Organization Memberships Policies
CREATE POLICY "Users can view memberships in their orgs" ON organization_memberships
  FOR SELECT USING (is_org_member(organization_id));

CREATE POLICY "Admins can manage memberships" ON organization_memberships
  FOR ALL USING (is_org_admin(organization_id));

-- Tenant Isolation Policies (applies to all multi-tenant tables)
-- Pattern: Users can access data from their organizations

CREATE POLICY "Tenant isolation" ON clients
  FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Tenant isolation" ON workspaces
  FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Tenant isolation" ON agents
  FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Tenant isolation" ON goals
  FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Tenant isolation" ON projects
  FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Tenant isolation" ON milestones
  FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Tenant isolation" ON tasks
  FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Tenant isolation" ON comments
  FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Tenant isolation" ON time_entries
  FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Tenant isolation" ON knowledge_entries
  FOR ALL USING (is_org_member(organization_id));

CREATE POLICY "Tenant isolation" ON audit_logs
  FOR SELECT USING (is_org_member(organization_id));

-- Agent Assignments Policies
CREATE POLICY "Tenant isolation via agent" ON agent_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_assignments.agent_id
        AND is_org_member(agents.organization_id)
    )
  );

CREATE POLICY "Tenant isolation via client" ON agent_client_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = agent_client_assignments.client_id
        AND is_org_member(clients.organization_id)
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_memberships_updated_at BEFORE UPDATE ON organization_memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_entries_updated_at BEFORE UPDATE ON knowledge_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant permissions to authenticated users (Supabase Auth role)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Migration complete
COMMENT ON SCHEMA public IS 'Cohortix database schema v1.0.0 - Multi-tenant AI agent orchestration platform';


-- =============================================================================
-- MIGRATION 0001: Add Cohorts Table
-- =============================================================================

DO $$ BEGIN
 CREATE TYPE "cohort_status" AS ENUM('active', 'paused', 'at-risk', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cohorts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"status" "cohort_status" DEFAULT 'active' NOT NULL,
	"member_count" integer DEFAULT 0 NOT NULL,
	"engagement_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cohorts" ADD CONSTRAINT "cohorts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;


-- =============================================================================
-- MIGRATION 0002: Add Cohorts RLS Policies
-- =============================================================================

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
