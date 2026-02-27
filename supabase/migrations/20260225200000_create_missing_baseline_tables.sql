-- ============================================================================
-- Missing Baseline Tables
-- Migration:  20260211200000_create_missing_baseline_tables.sql
-- Created:    2026-02-27  (back-dated to run after agents baseline)
-- Purpose:    Create tables that exist in Drizzle schema and remote DB but
--             were never added to the migration system. Required for local
--             Supabase (clean DB replay) to work.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- clients
-- Referenced by: knowledge_entries (client_id FK)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(100),
  description     TEXT,
  logo_url        TEXT,
  website         TEXT,
  industry        VARCHAR(100),
  contact_name    VARCHAR(255),
  contact_email   VARCHAR(255),
  status          VARCHAR(50)  NOT NULL DEFAULT 'active',
  settings        JSONB        NOT NULL DEFAULT '{}'::jsonb,
  metadata        JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY clients_service_role_all ON clients FOR ALL USING (is_service_role());

-- ---------------------------------------------------------------------------
-- knowledge_entries
-- Referenced by: CA-S1-03b scope columns migration
-- ---------------------------------------------------------------------------
DO $$ BEGIN CREATE TYPE knowledge_source_type AS ENUM ('task', 'research', 'manual', 'conversation', 'integration'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE knowledge_category AS ENUM ('technical', 'strategic', 'operational', 'domain', 'process', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE knowledge_scope_level AS ENUM ('company', 'client', 'project'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS knowledge_entries (
  id                UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID                  NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id          UUID                  REFERENCES agents(id) ON DELETE SET NULL,
  source_type       knowledge_source_type NOT NULL,
  source_id         UUID,
  title             VARCHAR(500)          NOT NULL,
  content           TEXT                  NOT NULL,
  summary           TEXT,
  category          knowledge_category    NOT NULL DEFAULT 'other',
  tags              JSONB                 NOT NULL DEFAULT '[]'::jsonb,
  project_id        UUID                  REFERENCES projects(id) ON DELETE SET NULL,
  client_id         UUID                  REFERENCES clients(id) ON DELETE SET NULL,
  scope_level       knowledge_scope_level NOT NULL DEFAULT 'company',
  scope_id          UUID,
  relevance_score   DECIMAL(3,2)          NOT NULL DEFAULT 1.0,
  access_count      INTEGER               NOT NULL DEFAULT 0,
  last_accessed_at  TIMESTAMPTZ,
  helpful_count     INTEGER               NOT NULL DEFAULT 0,
  unhelpful_count   INTEGER               NOT NULL DEFAULT 0,
  decay_disabled    BOOLEAN               NOT NULL DEFAULT false,
  metadata          JSONB                 NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_org ON knowledge_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_agent ON knowledge_entries(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON knowledge_entries(organization_id, category);
CREATE INDEX IF NOT EXISTS idx_knowledge_client ON knowledge_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_scope ON knowledge_entries(organization_id, scope_level, scope_id);

ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY knowledge_entries_service_role_all ON knowledge_entries FOR ALL USING (is_service_role());

-- ---------------------------------------------------------------------------
-- workspaces (if referenced)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspaces (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(100),
  description     TEXT,
  settings        JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY workspaces_service_role_all ON workspaces FOR ALL USING (is_service_role());

-- ---------------------------------------------------------------------------
-- rhythms (legacy, referenced by tasks.rhythm_id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rhythms (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  frequency       VARCHAR(50)  NOT NULL DEFAULT 'daily',
  settings        JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE rhythms ENABLE ROW LEVEL SECURITY;
CREATE POLICY rhythms_service_role_all ON rhythms FOR ALL USING (is_service_role());

-- ============================================================================
-- End of missing baseline tables
-- ============================================================================
