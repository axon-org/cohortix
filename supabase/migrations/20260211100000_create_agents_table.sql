-- ============================================================================
-- Create Agents Table — Baseline Migration
-- Migration:  20260211100000_create_agents_table.sql
-- Created:    2026-02-27  (back-dated to run after initial_schema)
-- Purpose:    Create the agents table that exists in the Drizzle schema but
--             was missing from the migration system. Later migrations
--             (cohort_agent_members, agent_evolution_events, etc.) depend on it.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ENUMs
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE agent_status AS ENUM ('active', 'idle', 'busy', 'offline', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

-- ---------------------------------------------------------------------------
-- agents
-- Required by: cohort_agent_members (FK), agent_evolution_events (FK),
--              task_sessions (FK), comments (author_id), insights (agent_id),
--              knowledge_entries (agent_id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agents (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id            VARCHAR(255),
  name                   VARCHAR(255) NOT NULL,
  slug                   VARCHAR(100) NOT NULL,
  avatar_url             TEXT,
  role                   VARCHAR(255),
  description            TEXT,
  status                 agent_status NOT NULL DEFAULT 'idle',
  capabilities           JSONB        NOT NULL DEFAULT '[]'::jsonb,
  runtime_type           VARCHAR(50)  NOT NULL DEFAULT 'clawdbot',
  runtime_config         JSONB        NOT NULL DEFAULT '{}'::jsonb,
  total_tasks_completed  INTEGER      NOT NULL DEFAULT 0,
  total_time_worked_ms   BIGINT       NOT NULL DEFAULT 0,
  last_active_at         TIMESTAMPTZ,
  settings               JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_org ON agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_agents_slug ON agents(slug);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Basic RLS: service role bypass only for now.
-- Full scoped policies added in 20260227114400_rls_scoped_access.sql
CREATE POLICY agents_service_role_all ON agents
  FOR ALL USING (is_service_role());

-- ============================================================================
-- End of agents baseline
-- ============================================================================
