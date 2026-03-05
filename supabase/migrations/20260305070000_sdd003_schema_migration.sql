-- SDD-003: OpenClaw Integration — Schema Migration
-- Adds engine connection, task queue, engine events, and clone foundation tables.

-- =============================================================================
-- 1. Cohorts table changes
-- =============================================================================

-- Rename authTokenHash → authTokenEncrypted (we need to decrypt, not just verify)
ALTER TABLE cohorts RENAME COLUMN auth_token_hash TO auth_token_encrypted;

-- Add connection configuration (JSONB for httpEndpoint, healthCheckIntervalMs, etc.)
ALTER TABLE cohorts ADD COLUMN connection_config jsonb NOT NULL DEFAULT '{}';

-- Track minimum gateway version
ALTER TABLE cohorts ADD COLUMN gateway_version varchar(50);

-- =============================================================================
-- 2. New enum types
-- =============================================================================

CREATE TYPE task_queue_status AS ENUM (
  'queued',
  'processing',
  'completed',
  'failed',
  'expired'
);

CREATE TYPE engine_event_type AS ENUM (
  'connected',
  'disconnected',
  'health_check_failed',
  'health_check_recovered',
  'auth_failed',
  'token_rotated',
  'agent_synced',
  'clone_synced',
  'queue_drained',
  'version_checked'
);

-- =============================================================================
-- 3. Task Queue table
-- =============================================================================

CREATE TABLE task_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES comments(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  session_key varchar(255) NOT NULL,
  status task_queue_status NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  error jsonb,
  queued_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  expires_at timestamptz
);

CREATE INDEX idx_task_queue_cohort_status ON task_queue(cohort_id, status);
CREATE INDEX idx_task_queue_queued_at ON task_queue(queued_at);

-- =============================================================================
-- 4. Engine Events table
-- =============================================================================

CREATE TABLE engine_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  event_type engine_event_type NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_engine_events_cohort_created ON engine_events(cohort_id, created_at);
CREATE INDEX idx_engine_events_type ON engine_events(event_type);

-- =============================================================================
-- 5. Clone Foundation table
-- =============================================================================

CREATE TABLE clone_foundation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name varchar(255) NOT NULL,
  "values" jsonb NOT NULL DEFAULT '[]',
  decision_making text,
  expertise jsonb NOT NULL DEFAULT '[]',
  communication_style text,
  aspirations text,
  custom_fields jsonb NOT NULL DEFAULT '{}',
  last_synced_at timestamptz,
  synced_to_cohort_id uuid REFERENCES cohorts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 6. RLS Policies
-- =============================================================================

-- Task Queue: scoped to cohort membership
ALTER TABLE task_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY task_queue_service_bypass ON task_queue FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY task_queue_scoped_access ON task_queue FOR ALL
  USING (cohort_id IN (
    SELECT cohort_id FROM cohort_user_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM cohorts WHERE owner_user_id = auth.uid()
  ));

-- Engine Events: scoped to cohort membership (SELECT only for non-service)
ALTER TABLE engine_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY engine_events_service_bypass ON engine_events FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY engine_events_scoped_access ON engine_events FOR SELECT
  USING (cohort_id IN (
    SELECT cohort_id FROM cohort_user_members WHERE user_id = auth.uid()
    UNION
    SELECT id FROM cohorts WHERE owner_user_id = auth.uid()
  ));

-- Clone Foundation: user-owned only
ALTER TABLE clone_foundation ENABLE ROW LEVEL SECURITY;

CREATE POLICY clone_foundation_service_bypass ON clone_foundation FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY clone_foundation_user_access ON clone_foundation FOR ALL
  USING (user_id = auth.uid());
