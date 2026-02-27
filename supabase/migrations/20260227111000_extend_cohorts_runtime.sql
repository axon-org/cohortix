-- ============================================================================
-- CA-S1-02: Extend cohorts with runtime fields + personal/shared semantics
-- ============================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE cohort_type AS ENUM ('personal', 'shared');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE cohort_hosting AS ENUM ('managed', 'self_hosted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE cohort_runtime_status AS ENUM (
    'provisioning',
    'online',
    'offline',
    'error',
    'paused'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Columns
ALTER TABLE cohorts
  ALTER COLUMN organization_id DROP NOT NULL;

ALTER TABLE cohorts
  ADD COLUMN IF NOT EXISTS type cohort_type NOT NULL DEFAULT 'shared',
  ADD COLUMN IF NOT EXISTS owner_user_id UUID,
  ADD COLUMN IF NOT EXISTS hosting cohort_hosting NOT NULL DEFAULT 'managed',
  ADD COLUMN IF NOT EXISTS runtime_status cohort_runtime_status NOT NULL DEFAULT 'provisioning',
  ADD COLUMN IF NOT EXISTS gateway_url TEXT,
  ADD COLUMN IF NOT EXISTS auth_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS hardware_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ;

-- Partial unique index for personal cohorts
CREATE UNIQUE INDEX IF NOT EXISTS cohorts_personal_owner_unique
  ON cohorts(owner_user_id)
  WHERE type = 'personal';

-- Check constraint: personal vs shared requirements
DO $$ BEGIN
  ALTER TABLE cohorts
    ADD CONSTRAINT cohorts_personal_shared_check
      CHECK (
        (type = 'personal' AND organization_id IS NULL AND owner_user_id IS NOT NULL) OR
        (type = 'shared' AND organization_id IS NOT NULL)
      );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
