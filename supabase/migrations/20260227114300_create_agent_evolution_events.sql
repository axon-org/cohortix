-- ============================================================================
-- CA-S1-07: Create agent_evolution_events table
-- ============================================================================

-- Enum: agent_evolution_event_type
DO $$ BEGIN
  CREATE TYPE agent_evolution_event_type AS ENUM ('learning', 'correction', 'milestone');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS agent_evolution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  scope_type scope_type NOT NULL DEFAULT 'personal',
  scope_id UUID NOT NULL,
  event_type agent_evolution_event_type NOT NULL,
  summary TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_evolution_agent_created
  ON agent_evolution_events(agent_id, created_at);
CREATE INDEX IF NOT EXISTS idx_agent_evolution_event_type
  ON agent_evolution_events(event_type);

-- RLS + grants
ALTER TABLE agent_evolution_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_evolution_events TO authenticated;
GRANT ALL ON public.agent_evolution_events TO service_role;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
