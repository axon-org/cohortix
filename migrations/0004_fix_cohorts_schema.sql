-- Fix cohorts table schema - add missing columns
-- Run this in Supabase SQL Editor

-- First, check if cohort_status enum exists, create if not
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cohort_status') THEN
        CREATE TYPE cohort_status AS ENUM ('active', 'paused', 'at-risk', 'completed');
    END IF;
END $$;

-- Add missing columns to cohorts table
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS slug varchar(100);
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS member_count integer DEFAULT 0 NOT NULL;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS engagement_percent numeric(5, 2) DEFAULT 0 NOT NULL;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}'::jsonb NOT NULL;

-- Update status column to use proper enum (if needed)
-- ALTER TABLE cohorts ALTER COLUMN status TYPE cohort_status USING status::cohort_status;

-- Generate slugs for existing rows that don't have one
UPDATE cohorts SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL;

-- Add unique constraint on slug within org
-- ALTER TABLE cohorts ADD CONSTRAINT cohorts_org_slug_unique UNIQUE (organization_id, slug);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cohorts_organization_id ON cohorts(organization_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts(status);
CREATE INDEX IF NOT EXISTS idx_cohorts_slug ON cohorts(slug);
CREATE INDEX IF NOT EXISTS idx_cohorts_created_at ON cohorts(created_at);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the fix
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cohorts';
