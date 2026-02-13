# PPV Data Model Migration Instructions

**Migration Date:** 2026-02-13
**Migration File:** `supabase/migrations/20260213185300_create_missions_table.sql`

## Migration Steps

### Option 1: Supabase SQL Editor (Recommended)

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/rfwscvklcokzuofyzqwx/sql/new
2. Copy the contents of `supabase/migrations/20260213185300_create_missions_table.sql`
3. Paste into the SQL editor
4. Click "Run"
5. Verify the `missions` table was created successfully

### Option 2: psql Command Line

```bash
# From project root
psql "postgresql://postgres:[password]@db.rfwscvklcokzuofyzqwx.supabase.co:5432/postgres" \
  -f supabase/migrations/20260213185300_create_missions_table.sql
```

### Option 3: Automated Script (if psql available)

```bash
pnpm tsx scripts/apply-migration.ts supabase/migrations/20260213185300_create_missions_table.sql
```

## Verification

Run this query in SQL Editor to verify:

```sql
-- Check missions table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'missions';

-- Check mission_id column in projects
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'mission_id';

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'missions';
```

Expected results:
- `missions` table exists
- `projects.mission_id` column exists (UUID type)
- 5 RLS policies on `missions` table

## After Migration

Run the seed script:

```bash
pnpm tsx scripts/seed-ppv-hierarchy.ts
```

This will create:
- 4 sample missions
- 4 new operations (+ link existing operations to missions)
- 10 sample tasks

## Rollback (if needed)

```sql
-- Drop missions table (will also drop mission_id foreign key)
DROP TABLE IF EXISTS missions CASCADE;

-- Remove mission_id from projects
ALTER TABLE projects DROP COLUMN IF EXISTS mission_id;
```
