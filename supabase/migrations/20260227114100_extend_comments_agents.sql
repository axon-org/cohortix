-- ============================================================================
-- CA-S1-05: Extend comments for agent authors + @mentions
-- ============================================================================

-- Enum: comment_author_type
DO $$ BEGIN
  CREATE TYPE comment_author_type AS ENUM ('user', 'agent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Drop FK to users to allow agent authors
ALTER TABLE comments
  DROP CONSTRAINT IF EXISTS comments_author_id_fkey;

-- New columns
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS author_type comment_author_type,
  ADD COLUMN IF NOT EXISTS mentioned_agent_ids UUID[] DEFAULT '{}'::uuid[] NOT NULL,
  ADD COLUMN IF NOT EXISTS thread_root_id UUID REFERENCES comments(id) ON DELETE SET NULL;

-- Backfill author_type for existing comments
UPDATE comments
SET author_type = 'user'
WHERE author_type IS NULL;

ALTER TABLE comments
  ALTER COLUMN author_type SET NOT NULL,
  ALTER COLUMN author_type SET DEFAULT 'user';

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
