# Agent Command Center — Database Schema

> Comprehensive PostgreSQL schema design with multi-tenant isolation and vector storage

*Version: 1.0.0 | Last Updated: 2026-02-05*

---

## Overview

The database schema is designed for:

- **Multi-tenancy**: Row-Level Security (RLS) for tenant isolation
- **Scalability**: Optimized indexes, efficient queries
- **Flexibility**: JSONB for extensible metadata
- **AI-Native**: pgvector for semantic search
- **Auditability**: Full audit trail of all changes

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ENTITY RELATIONSHIP DIAGRAM                            │
└─────────────────────────────────────────────────────────────────────────────────┘

                                  ┌─────────────────┐
                                  │  ORGANIZATIONS  │
                                  │─────────────────│
                                  │ id (PK)         │
                                  │ name            │
                                  │ slug            │◀──────────────────────┐
                                  │ settings (JSONB)│                       │
                                  │ created_at      │                       │
                                  └────────┬────────┘                       │
                                           │                                │
                    ┌──────────────────────┼──────────────────────┐         │
                    │                      │                      │         │
                    ▼                      ▼                      ▼         │
          ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
          │     USERS       │    │     AGENTS      │    │   WORKSPACES   │ │
          │─────────────────│    │─────────────────│    │─────────────────│ │
          │ id (PK)         │    │ id (PK)         │    │ id (PK)         │ │
          │ clerk_id        │    │ org_id (FK)     │───▶│ org_id (FK)     │─┘
          │ email           │    │ name            │    │ name            │
          │ name            │    │ avatar_url      │    │ slug            │
          │ avatar_url      │    │ role            │    │ settings        │
          │ created_at      │    │ status          │    │ created_at      │
          └────────┬────────┘    │ capabilities    │    └────────┬────────┘
                   │             │ runtime_config  │             │
                   │             └────────┬────────┘             │
                   │                      │                      │
                   │                      │                      │
          ┌────────▼────────┐             │                      │
          │ ORG_MEMBERSHIPS │             │             ┌────────▼────────┐
          │─────────────────│             │             │    PROJECTS     │
          │ id (PK)         │             │             │─────────────────│
          │ org_id (FK)     │◀────────────┼─────────────│ id (PK)         │
          │ user_id (FK)    │             │             │ org_id (FK)     │───┐
          │ role            │             │             │ workspace_id    │   │
          │ permissions     │             │             │ owner_type      │   │
          │ created_at      │             │             │ owner_id        │   │
          └─────────────────┘             │             │ name            │   │
                                          │             │ description     │   │
                                          │             │ status          │   │
                                          │             │ settings        │   │
                                          │             │ created_at      │   │
                                          │             └────────┬────────┘   │
                                          │                      │            │
                    ┌─────────────────────┴─────────────────────┐│            │
                    │                                           ││            │
                    ▼                                           ▼│            │
          ┌─────────────────┐                         ┌─────────────────┐     │
          │ AGENT_ASSIGN-   │                         │     TASKS       │     │
          │    MENTS        │                         │─────────────────│     │
          │─────────────────│                         │ id (PK)         │     │
          │ id (PK)         │                         │ org_id (FK)     │─────┘
          │ agent_id (FK)   │◀────────────────────────│ project_id (FK) │
          │ project_id (FK) │                         │ parent_task_id  │──┐
          │ role            │                         │ assignee_type   │  │
          │ assigned_at     │                         │ assignee_id     │  │
          └─────────────────┘                         │ title           │  │
                                                      │ description     │  │
                                                      │ status          │  │
                                                      │ priority        │  │
                                                      │ due_date        │  │
                                                      │ order           │  │
                                                      │ metadata        │  │
                                                      │ created_at      │  │
                                                      └────────┬────────┘  │
                                                               │           │
                                                               │◀──────────┘
                    ┌──────────────────┬───────────────────────┤
                    │                  │                       │
                    ▼                  ▼                       ▼
          ┌─────────────────┐ ┌─────────────────┐   ┌─────────────────┐
          │    COMMENTS     │ │ TASK_DEPENDEN-  │   │  TIME_ENTRIES   │
          │─────────────────│ │     CIES        │   │─────────────────│
          │ id (PK)         │ │─────────────────│   │ id (PK)         │
          │ org_id (FK)     │ │ id (PK)         │   │ org_id (FK)     │
          │ task_id (FK)    │ │ task_id (FK)    │   │ task_id (FK)    │
          │ parent_id       │ │ depends_on (FK) │   │ agent_id (FK)   │
          │ author_type     │ │ dependency_type │   │ started_at      │
          │ author_id       │ └─────────────────┘   │ ended_at        │
          │ content         │                       │ duration_ms     │
          │ mentions        │                       │ description     │
          │ created_at      │                       └─────────────────┘
          └─────────────────┘


          ┌─────────────────┐                       ┌─────────────────┐
          │   MILESTONES    │                       │      GOALS      │
          │─────────────────│                       │─────────────────│
          │ id (PK)         │                       │ id (PK)         │
          │ org_id (FK)     │                       │ org_id (FK)     │
          │ project_id (FK) │                       │ owner_type      │
          │ name            │                       │ owner_id        │
          │ description     │                       │ title           │
          │ due_date        │                       │ description     │
          │ status          │                       │ status          │
          │ created_at      │                       │ target_date     │
          └─────────────────┘                       │ progress        │
                                                    │ created_at      │
                                                    └─────────────────┘


          ┌─────────────────┐                       ┌─────────────────┐
          │   KNOWLEDGE     │                       │ KNOWLEDGE_      │
          │    ENTRIES      │                       │   EMBEDDINGS    │
          │─────────────────│                       │─────────────────│
          │ id (PK)         │                       │ id (PK)         │
          │ org_id (FK)     │──────────────────────▶│ entry_id (FK)   │
          │ agent_id (FK)   │                       │ embedding       │
          │ source_type     │                       │   (vector)      │
          │ source_id       │                       │ chunk_index     │
          │ title           │                       │ chunk_text      │
          │ content         │                       └─────────────────┘
          │ category        │
          │ tags            │
          │ metadata        │
          │ created_at      │
          └─────────────────┘


          ┌─────────────────┐                       ┌─────────────────┐
          │  INTEGRATIONS   │                       │   AUDIT_LOGS    │
          │─────────────────│                       │─────────────────│
          │ id (PK)         │                       │ id (PK)         │
          │ org_id (FK)     │                       │ org_id (FK)     │
          │ provider        │                       │ actor_type      │
          │ credentials     │                       │ actor_id        │
          │   (encrypted)   │                       │ action          │
          │ settings        │                       │ resource_type   │
          │ status          │                       │ resource_id     │
          │ created_at      │                       │ old_values      │
          └─────────────────┘                       │ new_values      │
                                                    │ ip_address      │
                                                    │ user_agent      │
                                                    │ created_at      │
                                                    └─────────────────┘
```

---

## Multi-Tenant Data Isolation

### Strategy: Shared Database with Row-Level Security (RLS)

Every table containing tenant data includes an `organization_id` column. PostgreSQL RLS policies enforce isolation.

```sql
-- Enable RLS on all tenant tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
-- ... (all tenant tables)

-- Create isolation policy
CREATE POLICY tenant_isolation_policy ON projects
  USING (organization_id = current_setting('app.current_org_id')::uuid);

-- Set context per request (done by application)
SET app.current_org_id = 'org_uuid_here';

-- All queries now automatically filtered
SELECT * FROM projects; -- Only returns current org's projects
```

### Context Setting in Application

```typescript
// middleware.ts or API route handler
import { db } from '@repo/database';

async function setTenantContext(organizationId: string) {
  await db.execute(sql`SET app.current_org_id = ${organizationId}`);
}

// Every request sets the context based on authenticated user
```

---

## Core Tables Schema

### Organizations

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_organization_id VARCHAR(255) UNIQUE, -- Clerk's org ID
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_clerk_id ON organizations(clerk_organization_id);
```

### Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id VARCHAR(255) UNIQUE NOT NULL, -- Clerk's user ID
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_clerk_id ON users(clerk_user_id);
```

### Organization Memberships

```sql
CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'member',
  permissions JSONB DEFAULT '{}', -- Granular permissions override
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_memberships_org ON organization_memberships(organization_id);
CREATE INDEX idx_org_memberships_user ON organization_memberships(user_id);
```

### Workspaces (Optional Team Grouping)

```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, slug)
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY workspace_isolation ON workspaces
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_workspaces_org ON workspaces(organization_id);
```

### Agents

```sql
CREATE TYPE agent_status AS ENUM ('active', 'idle', 'busy', 'offline', 'error');

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  external_id VARCHAR(255), -- ID in external runtime (e.g., Clawdbot agent ID)
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(255), -- e.g., "AI Developer", "UI Designer"
  description TEXT,
  status agent_status DEFAULT 'idle',
  capabilities JSONB DEFAULT '[]', -- ["coding", "design", "research"]
  
  -- Runtime configuration (Clawdbot now, custom later)
  runtime_type VARCHAR(50) DEFAULT 'clawdbot', -- 'clawdbot', 'custom', etc.
  runtime_config JSONB DEFAULT '{}',
  
  -- Metrics
  total_tasks_completed INTEGER DEFAULT 0,
  total_time_worked_ms BIGINT DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, slug)
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_isolation ON agents
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_agents_org ON agents(organization_id);
CREATE INDEX idx_agents_status ON agents(organization_id, status);
CREATE INDEX idx_agents_external_id ON agents(external_id);
```

### Projects

```sql
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'archived');
CREATE TYPE owner_type AS ENUM ('user', 'agent');

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  
  -- Polymorphic owner (can be user or agent)
  owner_type owner_type NOT NULL DEFAULT 'user',
  owner_id UUID NOT NULL, -- References users(id) or agents(id)
  
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  status project_status DEFAULT 'planning',
  
  -- Visual settings
  color VARCHAR(7), -- Hex color
  icon VARCHAR(50), -- Icon name
  
  -- Dates
  start_date DATE,
  target_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Linked goal
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, slug)
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_isolation ON projects
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_projects_status ON projects(organization_id, status);
CREATE INDEX idx_projects_owner ON projects(owner_type, owner_id);
```

### Tasks

```sql
CREATE TYPE task_status AS ENUM ('backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE assignee_type AS ENUM ('user', 'agent', 'unassigned');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- For subtasks
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  
  -- Polymorphic assignee
  assignee_type assignee_type DEFAULT 'unassigned',
  assignee_id UUID, -- References users(id) or agents(id), NULL if unassigned
  
  -- Creator
  created_by_type owner_type NOT NULL,
  created_by_id UUID NOT NULL,
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status task_status DEFAULT 'backlog',
  priority task_priority DEFAULT 'medium',
  
  -- Dates
  due_date TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Ordering (for Kanban)
  order_index INTEGER DEFAULT 0,
  
  -- Estimation
  estimated_hours DECIMAL(6, 2),
  actual_hours DECIMAL(6, 2),
  
  -- Tags and metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY task_isolation ON tasks
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_tasks_org ON tasks(organization_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_type, assignee_id);
CREATE INDEX idx_tasks_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_order ON tasks(project_id, status, order_index);
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
```

### Task Dependencies

```sql
CREATE TYPE dependency_type AS ENUM (
  'blocks',      -- This task blocks the other
  'blocked_by',  -- This task is blocked by the other
  'relates_to'   -- Related but not blocking
);

CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  dependency_type dependency_type NOT NULL DEFAULT 'blocked_by',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id) -- Can't depend on self
);

CREATE INDEX idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX idx_task_deps_depends ON task_dependencies(depends_on_task_id);
```

### Comments

```sql
CREATE TYPE author_type AS ENUM ('user', 'agent', 'system');

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For threads
  
  -- Author
  author_type author_type NOT NULL,
  author_id UUID, -- NULL for system comments
  
  content TEXT NOT NULL,
  content_html TEXT, -- Rendered HTML (for rich text)
  
  -- Mentions
  mentions JSONB DEFAULT '[]', -- [{"type": "user", "id": "..."}, {"type": "agent", "id": "..."}]
  
  -- Attachments
  attachments JSONB DEFAULT '[]', -- [{"name": "...", "url": "...", "type": "..."}]
  
  -- Edit tracking
  edited_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY comment_isolation ON comments
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_comments_parent ON comments(parent_comment_id);
CREATE INDEX idx_comments_author ON comments(author_type, author_id);
```

### Milestones

```sql
CREATE TYPE milestone_status AS ENUM ('upcoming', 'active', 'completed', 'missed');

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status milestone_status DEFAULT 'upcoming',
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY milestone_isolation ON milestones
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_milestones_due ON milestones(due_date);
```

### Goals

```sql
CREATE TYPE goal_status AS ENUM ('not_started', 'in_progress', 'at_risk', 'completed', 'cancelled');

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Owner (who is responsible)
  owner_type owner_type NOT NULL,
  owner_id UUID NOT NULL,
  
  -- Created by (who set the goal)
  created_by_type owner_type NOT NULL,
  created_by_id UUID NOT NULL,
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status goal_status DEFAULT 'not_started',
  
  -- Progress tracking
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  progress_auto_calculate BOOLEAN DEFAULT true, -- Calculate from linked projects
  
  -- Dates
  target_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Key Results (OKR style)
  key_results JSONB DEFAULT '[]', -- [{"title": "...", "target": 100, "current": 50}]
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY goal_isolation ON goals
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_goals_org ON goals(organization_id);
CREATE INDEX idx_goals_owner ON goals(owner_type, owner_id);
CREATE INDEX idx_goals_status ON goals(organization_id, status);
```

### Time Entries (Agent Time Tracking)

```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_ms BIGINT, -- Calculated on end
  
  description TEXT,
  metadata JSONB DEFAULT '{}', -- Additional context from agent
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY time_entry_isolation ON time_entries
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_time_entries_task ON time_entries(task_id);
CREATE INDEX idx_time_entries_agent ON time_entries(agent_id);
CREATE INDEX idx_time_entries_started ON time_entries(started_at);
```

---

## Knowledge Base Schema

### Knowledge Entries

```sql
CREATE TYPE knowledge_source_type AS ENUM (
  'task',           -- Learned from completing a task
  'research',       -- From internet research
  'manual',         -- Manually added
  'conversation',   -- From conversation/comment
  'integration'     -- From external integration
);

CREATE TYPE knowledge_category AS ENUM (
  'technical',
  'strategic',
  'operational',
  'domain',
  'process',
  'other'
);

CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Source agent (who learned this)
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  
  -- Source reference
  source_type knowledge_source_type NOT NULL,
  source_id UUID, -- task_id, comment_id, etc.
  
  -- Content
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT, -- AI-generated summary
  
  -- Classification
  category knowledge_category DEFAULT 'other',
  tags TEXT[] DEFAULT '{}',
  
  -- Linked entities
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Full-text search
  search_vector TSVECTOR,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY knowledge_isolation ON knowledge_entries
  USING (organization_id = current_setting('app.current_org_id')::uuid);

-- Full-text search index
CREATE INDEX idx_knowledge_search ON knowledge_entries USING GIN(search_vector);

-- Update search vector on insert/update
CREATE OR REPLACE FUNCTION update_knowledge_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_search_update
  BEFORE INSERT OR UPDATE ON knowledge_entries
  FOR EACH ROW EXECUTE FUNCTION update_knowledge_search_vector();

CREATE INDEX idx_knowledge_org ON knowledge_entries(organization_id);
CREATE INDEX idx_knowledge_agent ON knowledge_entries(agent_id);
CREATE INDEX idx_knowledge_source ON knowledge_entries(source_type, source_id);
CREATE INDEX idx_knowledge_category ON knowledge_entries(organization_id, category);
CREATE INDEX idx_knowledge_tags ON knowledge_entries USING GIN(tags);
```

### Knowledge Embeddings (Vector Storage)

```sql
-- Requires: CREATE EXTENSION vector;

CREATE TABLE knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
  
  -- For chunked content
  chunk_index INTEGER DEFAULT 0,
  chunk_text TEXT NOT NULL,
  
  -- Vector embedding (1536 dimensions for OpenAI ada-002)
  embedding vector(1536) NOT NULL,
  
  -- Embedding metadata
  model VARCHAR(100) DEFAULT 'text-embedding-ada-002',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast approximate nearest neighbor search
CREATE INDEX idx_knowledge_embedding_hnsw ON knowledge_embeddings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX idx_knowledge_embedding_entry ON knowledge_embeddings(entry_id);

-- Semantic search function
CREATE OR REPLACE FUNCTION search_knowledge_semantic(
  query_embedding vector(1536),
  org_id UUID,
  match_count INTEGER DEFAULT 10,
  similarity_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  entry_id UUID,
  chunk_text TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ke.entry_id,
    ke.chunk_text,
    1 - (ke.embedding <=> query_embedding) as similarity
  FROM knowledge_embeddings ke
  JOIN knowledge_entries k ON k.id = ke.entry_id
  WHERE k.organization_id = org_id
    AND 1 - (ke.embedding <=> query_embedding) > similarity_threshold
  ORDER BY ke.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

---

## System Tables

### Agent Assignments (Project-level)

```sql
CREATE TYPE agent_project_role AS ENUM ('owner', 'contributor', 'viewer');

CREATE TABLE agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role agent_project_role DEFAULT 'contributor',
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  
  UNIQUE(agent_id, project_id)
);

CREATE INDEX idx_agent_assignments_agent ON agent_assignments(agent_id);
CREATE INDEX idx_agent_assignments_project ON agent_assignments(project_id);
```

### Integrations

```sql
CREATE TYPE integration_status AS ENUM ('active', 'disabled', 'error', 'pending');

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  provider VARCHAR(50) NOT NULL, -- 'github', 'slack', 'figma', etc.
  
  -- Encrypted credentials
  credentials_encrypted BYTEA NOT NULL,
  
  -- Configuration
  settings JSONB DEFAULT '{}',
  
  status integration_status DEFAULT 'pending',
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, provider)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY integration_isolation ON integrations
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_integrations_org ON integrations(organization_id);
```

### Notifications

```sql
CREATE TYPE notification_type AS ENUM (
  'task_assigned',
  'task_completed',
  'task_commented',
  'mention',
  'project_update',
  'goal_progress',
  'system'
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Recipient
  recipient_type owner_type NOT NULL,
  recipient_id UUID NOT NULL,
  
  -- Content
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  
  -- Reference
  resource_type VARCHAR(50),
  resource_id UUID,
  
  -- Status
  read_at TIMESTAMPTZ,
  
  -- Delivery tracking
  channels_delivered JSONB DEFAULT '[]', -- ["email", "telegram", "push"]
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_isolation ON notifications
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_type, recipient_id) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

### Audit Logs

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Actor
  actor_type author_type NOT NULL,
  actor_id UUID,
  
  -- Action
  action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'assign', etc.
  
  -- Resource
  resource_type VARCHAR(50) NOT NULL, -- 'project', 'task', 'agent', etc.
  resource_id UUID NOT NULL,
  
  -- Change details
  old_values JSONB,
  new_values JSONB,
  
  -- Request context
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- No RLS on audit logs - admin access only via separate role

CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_type, actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Partitioning by month for large-scale audit logs
-- (Implement when needed for performance)
```

### Goal Proposals (Bidirectional Goal Setting)

```sql
CREATE TYPE goal_proposal_status AS ENUM ('pending', 'approved', 'rejected', 'modified');

CREATE TABLE goal_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Proposing agent
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  -- Proposed goal details
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  justification TEXT NOT NULL, -- Why the agent is proposing this
  evidence JSONB DEFAULT '{}', -- Supporting data (metrics, observations)
  
  -- Target and priority
  target_date DATE,
  suggested_priority VARCHAR(50) DEFAULT 'medium',
  
  -- Approval workflow
  status goal_proposal_status DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_comments TEXT,
  
  -- If approved/modified, link to created goal
  resulting_goal_id UUID REFERENCES goals(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE goal_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY goal_proposal_isolation ON goal_proposals
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_goal_proposals_org ON goal_proposals(organization_id);
CREATE INDEX idx_goal_proposals_agent ON goal_proposals(agent_id);
CREATE INDEX idx_goal_proposals_status ON goal_proposals(organization_id, status);
CREATE INDEX idx_goal_proposals_pending ON goal_proposals(organization_id) WHERE status = 'pending';

-- Add source tracking to goals table (via migration)
-- ALTER TABLE goals ADD COLUMN source VARCHAR(20) DEFAULT 'human' CHECK (source IN ('human', 'agent'));
-- ALTER TABLE goals ADD COLUMN proposal_id UUID REFERENCES goal_proposals(id);
```

---

## Living Knowledge Base Schema

### Knowledge Relationships (Graph)

```sql
CREATE TYPE knowledge_relationship_type AS ENUM (
  'depends_on',    -- Entry A depends on Entry B (prerequisite)
  'related_to',    -- Entries are related (same domain)
  'contradicts',   -- Entries conflict (deprecation signal)
  'supersedes',    -- Entry A replaces Entry B (newer/better)
  'example_of',    -- Entry A is an example of Entry B
  'implements'     -- Entry A implements concept in Entry B
);

CREATE TABLE knowledge_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- From entry → To entry
  from_entry_id UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
  to_entry_id UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
  
  relationship_type knowledge_relationship_type NOT NULL,
  
  -- Context/notes about the relationship
  notes TEXT,
  
  -- Who created this relationship
  created_by_type owner_type NOT NULL,
  created_by_id UUID NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(from_entry_id, to_entry_id, relationship_type),
  CHECK (from_entry_id != to_entry_id) -- Can't relate to self
);

CREATE INDEX idx_knowledge_rel_from ON knowledge_relationships(from_entry_id);
CREATE INDEX idx_knowledge_rel_to ON knowledge_relationships(to_entry_id);
CREATE INDEX idx_knowledge_rel_type ON knowledge_relationships(relationship_type);

-- Graph traversal query example
-- Find all prerequisites for an entry:
-- WITH RECURSIVE prerequisites AS (
--   SELECT to_entry_id, 1 as depth
--   FROM knowledge_relationships
--   WHERE from_entry_id = 'entry_abc' AND relationship_type = 'depends_on'
--   UNION
--   SELECT kr.to_entry_id, p.depth + 1
--   FROM knowledge_relationships kr
--   JOIN prerequisites p ON kr.from_entry_id = p.to_entry_id
--   WHERE kr.relationship_type = 'depends_on' AND depth < 5
-- )
-- SELECT ke.* FROM knowledge_entries ke
-- JOIN prerequisites p ON ke.id = p.to_entry_id;
```

### Knowledge Versions (Evolution Tracking)

```sql
CREATE TYPE knowledge_version_change_type AS ENUM (
  'created',   -- Initial version
  'updated',   -- Content modification
  'refined',   -- Minor improvements
  'deprecated' -- Marked as outdated
);

CREATE TABLE knowledge_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
  
  -- Version tracking
  version_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  change_type knowledge_version_change_type NOT NULL,
  
  -- Content snapshot (immutable)
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Change metadata
  changed_by_type owner_type NOT NULL,
  changed_by_id UUID NOT NULL,
  change_notes TEXT, -- What changed and why
  
  -- Deprecation info
  deprecated_reason TEXT,
  superseded_by_entry_id UUID REFERENCES knowledge_entries(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(entry_id, version_number)
);

ALTER TABLE knowledge_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY knowledge_version_isolation ON knowledge_versions
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_knowledge_versions_entry ON knowledge_versions(entry_id, version_number DESC);
CREATE INDEX idx_knowledge_versions_org ON knowledge_versions(organization_id);
CREATE INDEX idx_knowledge_versions_author ON knowledge_versions(changed_by_type, changed_by_id);

-- Trigger to auto-create version on knowledge_entries insert/update
CREATE OR REPLACE FUNCTION create_knowledge_version()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO knowledge_versions (
    organization_id, entry_id, version_number, change_type,
    title, content, summary, tags,
    changed_by_type, changed_by_id, change_notes
  ) VALUES (
    NEW.organization_id, NEW.id, 
    (SELECT COALESCE(MAX(version_number), 0) + 1 FROM knowledge_versions WHERE entry_id = NEW.id),
    CASE WHEN TG_OP = 'INSERT' THEN 'created'::knowledge_version_change_type ELSE 'updated'::knowledge_version_change_type END,
    NEW.title, NEW.content, NEW.summary, NEW.tags,
    NEW.author_type, NEW.author_id, 'Auto-versioned on ' || TG_OP
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledge_auto_version
  AFTER INSERT OR UPDATE ON knowledge_entries
  FOR EACH ROW EXECUTE FUNCTION create_knowledge_version();
```

### Knowledge Usage Tracking

```sql
CREATE TABLE knowledge_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
  
  -- Who used it
  used_by_type owner_type NOT NULL,
  used_by_id UUID NOT NULL,
  
  -- Context of usage
  task_id UUID REFERENCES tasks(id),
  project_id UUID REFERENCES projects(id),
  
  -- Was it helpful?
  was_helpful BOOLEAN,
  feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE knowledge_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY knowledge_usage_isolation ON knowledge_usage
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_knowledge_usage_entry ON knowledge_usage(entry_id);
CREATE INDEX idx_knowledge_usage_agent ON knowledge_usage(used_by_type, used_by_id);
CREATE INDEX idx_knowledge_usage_helpful ON knowledge_usage(entry_id, was_helpful);
```

---

## Agent Evolution System Schema

### Learning Materials

```sql
CREATE TYPE learning_material_type AS ENUM (
  'course',        -- Structured course
  'documentation', -- Technical documentation
  'book',          -- Book chapter/section
  'article',       -- Blog post/article
  'video',         -- Video content
  'internal'       -- Internal best practices
);

CREATE TYPE learning_material_status AS ENUM (
  'active',        -- Available for learning
  'draft',         -- Not yet published
  'archived'       -- Outdated/removed
);

CREATE TABLE learning_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Material metadata
  title VARCHAR(500) NOT NULL,
  description TEXT,
  type learning_material_type NOT NULL,
  status learning_material_status DEFAULT 'active',
  
  -- Content
  content TEXT, -- For text-based materials
  external_url TEXT, -- For external resources
  file_url TEXT, -- For uploaded files
  duration_minutes INTEGER, -- Estimated learning time
  
  -- Categorization
  skill_domain VARCHAR(100), -- e.g., 'frontend', 'backend', 'devops'
  difficulty VARCHAR(50) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  tags TEXT[] DEFAULT '{}',
  
  -- Prerequisites
  prerequisite_materials UUID[] DEFAULT '{}', -- Array of material IDs
  
  -- Authorship
  created_by_type owner_type NOT NULL,
  created_by_id UUID NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE learning_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY learning_material_isolation ON learning_materials
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_learning_materials_org ON learning_materials(organization_id);
CREATE INDEX idx_learning_materials_status ON learning_materials(organization_id, status);
CREATE INDEX idx_learning_materials_skill ON learning_materials(organization_id, skill_domain);
CREATE INDEX idx_learning_materials_tags ON learning_materials USING GIN(tags);
```

### Agent Evolution Sessions

```sql
CREATE TYPE evolution_session_status AS ENUM (
  'scheduled',  -- Scheduled but not started
  'in_progress',-- Currently running
  'completed',  -- Successfully completed
  'failed',     -- Failed to complete
  'skipped'     -- Skipped (agent unavailable)
);

CREATE TABLE agent_evolution_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  -- Session details
  session_type VARCHAR(50) DEFAULT 'daily', -- 'daily', 'weekly', 'deep_dive'
  status evolution_session_status DEFAULT 'scheduled',
  
  -- What was studied
  material_id UUID REFERENCES learning_materials(id),
  material_title VARCHAR(500),
  
  -- Session timeline
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms BIGINT, -- Actual duration
  
  -- Outcomes
  key_learnings TEXT, -- Agent's summary of learnings
  questions_raised TEXT, -- Questions the agent has
  confidence_before INTEGER CHECK (confidence_before BETWEEN 0 AND 100),
  confidence_after INTEGER CHECK (confidence_after BETWEEN 0 AND 100),
  
  -- Knowledge captured
  knowledge_entries_created INTEGER DEFAULT 0,
  
  -- Metadata
  session_data JSONB DEFAULT '{}', -- Detailed session logs
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_evolution_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY evolution_session_isolation ON agent_evolution_sessions
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_evolution_sessions_agent ON agent_evolution_sessions(agent_id, scheduled_at DESC);
CREATE INDEX idx_evolution_sessions_status ON agent_evolution_sessions(organization_id, status);
CREATE INDEX idx_evolution_sessions_scheduled ON agent_evolution_sessions(scheduled_at) WHERE status = 'scheduled';
```

### Agent Expertise Tracking

```sql
CREATE TABLE agent_expertise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  -- Skill definition
  skill_domain VARCHAR(100) NOT NULL, -- e.g., 'nextjs', 'postgresql', 'api_design'
  skill_category VARCHAR(100), -- e.g., 'frontend', 'backend', 'database'
  
  -- Proficiency tracking (0-100)
  proficiency_score INTEGER DEFAULT 0 CHECK (proficiency_score BETWEEN 0 AND 100),
  previous_score INTEGER, -- For growth tracking
  
  -- Evidence
  total_missions_completed INTEGER DEFAULT 0,
  successful_missions INTEGER DEFAULT 0,
  total_learning_hours DECIMAL(10, 2) DEFAULT 0,
  
  -- Milestones
  beginner_achieved_at TIMESTAMPTZ, -- >= 30
  intermediate_achieved_at TIMESTAMPTZ, -- >= 60
  expert_achieved_at TIMESTAMPTZ, -- >= 85
  
  -- Metadata
  last_practiced_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(agent_id, skill_domain)
);

ALTER TABLE agent_expertise ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_expertise_isolation ON agent_expertise
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_agent_expertise_agent ON agent_expertise(agent_id);
CREATE INDEX idx_agent_expertise_skill ON agent_expertise(organization_id, skill_domain);
CREATE INDEX idx_agent_expertise_proficiency ON agent_expertise(agent_id, proficiency_score DESC);
CREATE INDEX idx_agent_expertise_category ON agent_expertise(organization_id, skill_category);
```

### Agent Learning Paths

```sql
CREATE TYPE learning_path_status AS ENUM ('not_started', 'in_progress', 'completed');

CREATE TABLE agent_learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  
  -- Path definition
  path_name VARCHAR(255) NOT NULL, -- e.g., "Frontend Mastery Track"
  target_skill_domain VARCHAR(100) NOT NULL,
  
  -- Materials in this path (ordered)
  material_ids UUID[] NOT NULL, -- Array of learning_material IDs
  
  -- Progress tracking
  status learning_path_status DEFAULT 'not_started',
  current_material_index INTEGER DEFAULT 0,
  completed_materials UUID[] DEFAULT '{}',
  
  -- Timeline
  started_at TIMESTAMPTZ,
  target_completion_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Assignment
  assigned_by UUID REFERENCES users(id), -- Human-assigned
  auto_assigned BOOLEAN DEFAULT false, -- System-recommended
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY learning_path_isolation ON agent_learning_paths
  USING (organization_id = current_setting('app.current_org_id')::uuid);

CREATE INDEX idx_learning_paths_agent ON agent_learning_paths(agent_id, status);
CREATE INDEX idx_learning_paths_org ON agent_learning_paths(organization_id);
```

---

## Drizzle ORM Schema Example

```typescript
// packages/database/src/schema/tasks.ts
import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { projects } from './projects';

export const taskStatusEnum = pgEnum('task_status', [
  'backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled'
]);

export const taskPriorityEnum = pgEnum('task_priority', [
  'low', 'medium', 'high', 'urgent'
]);

export const assigneeTypeEnum = pgEnum('assignee_type', [
  'user', 'agent', 'unassigned'
]);

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  parentTaskId: uuid('parent_task_id').references(() => tasks.id),
  
  assigneeType: assigneeTypeEnum('assignee_type').default('unassigned'),
  assigneeId: uuid('assignee_id'),
  
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').default('backlog'),
  priority: taskPriorityEnum('priority').default('medium'),
  
  dueDate: timestamp('due_date', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  
  orderIndex: integer('order_index').default(0),
  tags: text('tags').array().default([]),
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tasks.organizationId],
    references: [organizations.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: 'subtasks',
  }),
  subtasks: many(tasks, {
    relationName: 'subtasks',
  }),
  comments: many(comments),
  timeEntries: many(timeEntries),
}));
```

---

## Indexes Summary

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| tasks | project_id, status | B-tree | Kanban board queries |
| tasks | due_date | B-tree | Deadline queries |
| tasks | tags | GIN | Tag filtering |
| knowledge_entries | search_vector | GIN | Full-text search |
| knowledge_embeddings | embedding | HNSW | Vector similarity |
| audit_logs | created_at | B-tree | Time-based queries |
| comments | task_id | B-tree | Comment threads |

---

## Migration Strategy

1. **Initial Setup**: `drizzle-kit push` for development
2. **Production**: `drizzle-kit generate` → review → `drizzle-kit migrate`
3. **Rollback**: Keep previous migration files, use `down` migrations

---

*Document maintained by: Architecture Team*
*Next review: 2026-03-01*
