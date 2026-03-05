-- Add missing slug column to cohorts table
-- This column is defined in the Drizzle schema but was never created via migration
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS slug VARCHAR(100) NOT NULL DEFAULT '';

-- Backfill slugs from name (lowercase, alphanumeric with hyphens)
UPDATE cohorts SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug = '';
