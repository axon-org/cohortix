-- ============================================================================
-- CA-S1-06: Create task_sessions table (per-task session isolation)
-- ============================================================================

-- Enum: task_session_status
DO $$ BEGIN
  CREATE TYPE task_session_status AS ENUM ('running', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS task_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  scope_type scope_type NOT NULL DEFAULT 'personal',
  scope_id UUID NOT NULL,
  gateway_session_id TEXT,
  status task_session_status NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  error JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_sessions_task ON task_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_sessions_agent ON task_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_task_sessions_cohort ON task_sessions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_task_sessions_status ON task_sessions(status);
CREATE INDEX IF NOT EXISTS idx_task_sessions_scope ON task_sessions(scope_type, scope_id);

-- RLS + grants
ALTER TABLE task_sessions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_sessions TO authenticated;
GRANT ALL ON public.task_sessions TO service_role;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
