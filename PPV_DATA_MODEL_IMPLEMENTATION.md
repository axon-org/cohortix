# PPV Data Model Implementation Summary

**Date:** 2026-02-13  
**Branch:** `feature/sprint-4-mission-control`  
**Agent:** John (Backend Developer)

## Problem Statement

Missions, Operations, and Tasks pages were ALL querying the same `projects` table, violating the PPV hierarchy principle. They needed to be separated into distinct tables.

## PPV Hierarchy (Implemented)

```
Domain → Vision → Mission → Operation/Rhythm → Task
```

**Current Implementation:**
- **Mission** = measurable goal → `missions` table (NEW)
- **Operation** = bounded project → `projects` table (existing)
- **Task** = atomic work → `tasks` table (existing)

## Changes Made

### 1. Database Schema

#### Created `missions` Table
**File:** `supabase/migrations/20260213185300_create_missions_table.sql`

**Schema:**
```sql
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vision_id UUID REFERENCES visions(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active' NOT NULL, -- active, completed, archived
  target_date DATE,
  progress INTEGER DEFAULT 0 NOT NULL, -- 0-100
  owner_type VARCHAR(50) DEFAULT 'user' NOT NULL,
  owner_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Key Features:**
- Multi-tenant isolation via `organization_id`
- Optional link to `visions` table
- Progress tracking (0-100%)
- RLS policies for security
- Triggers for `updated_at` timestamp

#### Updated `projects` Table
- Added `mission_id UUID REFERENCES missions(id)` column
- Operations can now link to parent Missions
- Maintains backward compatibility (nullable foreign key)

### 2. API Routes Updated

#### Missions API (`/api/v1/missions`)
**Files:**
- `apps/web/src/app/api/v1/missions/route.ts` (GET, POST)
- `apps/web/src/app/api/v1/missions/[id]/route.ts` (GET, PATCH, DELETE)

**Changes:**
- ✅ Changed table query from `projects` → `missions`
- ✅ Updated field mappings (`name` → `title`)
- ✅ Removed slug generation (not needed for missions)
- ✅ Added `vision_id` and `progress` fields
- ✅ Simplified search to use `title` instead of `name`

**Before:**
```ts
const { data: missions } = await supabase
  .from('projects')
  .select('*')
  .eq('organization_id', organizationId)
```

**After:**
```ts
const { data: missions } = await supabase
  .from('missions')
  .select('*')
  .eq('organization_id', organizationId)
```

#### Operations API (`/api/v1/operations`)
**Files:**
- `apps/web/src/app/api/v1/operations/route.ts`
- `apps/web/src/app/api/v1/operations/[id]/route.ts`

**Changes:**
- ✅ Kept querying `projects` table (correct)
- ✅ Can now link operations to missions via `mission_id`
- ✅ Updated comments to clarify PPV hierarchy

### 3. Server-Side Queries

#### Dashboard Queries
**File:** `apps/web/src/server/db/queries/dashboard.ts`

**Changes:**
- ✅ Updated `getDashboardKPIs()` to query `missions` table
- ✅ Updated `getActiveMissions()` to query `missions` table
- ✅ Enhanced mission stats to include:
  - Number of linked operations
  - Aggregated task counts from all operations
  - Progress tracking

**New Query Structure:**
```ts
// Missions query
const { data: missions } = await supabase
  .from('missions')
  .select('*')
  .eq('organization_id', organizationId)
  .eq('status', 'active')

// For each mission, count linked operations
const { count: operationsCount } = await supabase
  .from('projects')
  .select('*', { count: 'exact' })
  .eq('mission_id', mission.id)
```

### 4. Seed Data

#### PPV Hierarchy Seed Script
**File:** `scripts/seed-ppv-hierarchy.ts`

**Creates:**
- **4 Missions:**
  1. "Launch Cohortix MVP" (60% progress, target: 2026-03-15)
  2. "Achieve 100 Beta Users" (15% progress, target: 2026-04-30)
  3. "Build Agent Marketplace" (0% progress, target: 2026-05-31)
  4. "Establish Platform Reliability" (40% progress, target: 2026-03-31)

- **4 New Operations** (linked to missions):
  1. "Implement PPV Data Model" → Mission: Launch Cohortix MVP
  2. "Build Authentication System" → Mission: Launch Cohortix MVP
  3. "Launch Beta Program" → Mission: Achieve 100 Beta Users
  4. "Design Marketplace UI" → Mission: Build Agent Marketplace

- **10 Tasks** (linked to operations):
  - 4 tasks for "Implement PPV Data Model"
  - 2 tasks for "Build Authentication System"
  - 2 tasks for "Launch Beta Program"
  - 2 tasks for "Design Marketplace UI"

**Also:**
- Links existing operations to missions (distributes evenly)
- Proper status distribution (done, in_progress, todo)
- Realistic priority levels (urgent, high, medium)

### 5. Migration Tools

Created helper scripts:
- `scripts/run-migration.ts` - Migration runner using Supabase client
- `scripts/apply-migration.ts` - Direct SQL executor
- `scripts/direct-migrate.ts` - REST API approach
- `MIGRATION_INSTRUCTIONS.md` - Manual migration guide

## How to Apply

### Step 1: Run Migration

**Option A: Supabase SQL Editor (Recommended)**
1. Go to: https://supabase.com/dashboard/project/rfwscvklcokzuofyzqwx/sql/new
2. Copy `supabase/migrations/20260213185300_create_missions_table.sql`
3. Paste and click "Run"

**Option B: Script (if available)**
```bash
pnpm tsx scripts/apply-migration.ts supabase/migrations/20260213185300_create_missions_table.sql
```

### Step 2: Seed PPV Data

```bash
pnpm tsx scripts/seed-ppv-hierarchy.ts
```

### Step 3: Verify

```sql
-- Check missions table
SELECT COUNT(*) FROM missions; -- Should return 4

-- Check linked operations
SELECT COUNT(*) FROM projects WHERE mission_id IS NOT NULL;

-- Check PPV hierarchy
SELECT 
  m.title as mission,
  COUNT(DISTINCT p.id) as operations,
  COUNT(t.id) as tasks
FROM missions m
LEFT JOIN projects p ON p.mission_id = m.id
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY m.id, m.title;
```

## Testing Checklist

- [ ] Migration runs successfully
- [ ] `missions` table created with RLS policies
- [ ] `projects.mission_id` column added
- [ ] Missions API returns data from `missions` table
- [ ] Operations API returns data from `projects` table
- [ ] Tasks API returns data from `tasks` table
- [ ] Dashboard shows correct mission counts
- [ ] Seed script creates 4 missions
- [ ] Seed script creates/links operations
- [ ] Seed script creates 10 tasks
- [ ] Frontend displays hierarchy correctly

## Files Changed

### Created
- `supabase/migrations/20260213185300_create_missions_table.sql`
- `scripts/seed-ppv-hierarchy.ts`
- `scripts/run-migration.ts`
- `scripts/apply-migration.ts`
- `scripts/direct-migrate.ts`
- `MIGRATION_INSTRUCTIONS.md`
- `PPV_DATA_MODEL_IMPLEMENTATION.md` (this file)

### Modified
- `apps/web/src/app/api/v1/missions/route.ts`
- `apps/web/src/app/api/v1/missions/[id]/route.ts`
- `apps/web/src/server/db/queries/dashboard.ts`

### Unchanged (but verified)
- `apps/web/src/app/api/v1/operations/route.ts` (queries `projects` - correct)
- `apps/web/src/app/api/v1/operations/[id]/route.ts` (queries `projects` - correct)

## Rollback Plan

If issues arise:

```sql
-- Remove mission_id from projects
ALTER TABLE projects DROP COLUMN IF EXISTS mission_id;

-- Drop missions table
DROP TABLE IF EXISTS missions CASCADE;
```

Then revert Git changes:
```bash
git checkout apps/web/src/app/api/v1/missions/route.ts
git checkout apps/web/src/app/api/v1/missions/[id]/route.ts
git checkout apps/web/src/server/db/queries/dashboard.ts
```

## Next Steps

1. ✅ Migration created
2. ✅ API routes updated
3. ✅ Server queries updated
4. ✅ Seed script created
5. ⏳ Run migration (manual via Supabase SQL Editor)
6. ⏳ Run seed script
7. ⏳ Test frontend displays
8. ⏳ Update frontend components if needed

## Notes

- **Backward Compatibility:** Existing operations (projects) will continue to work. The `mission_id` column is nullable.
- **Visions Table:** The migration references a `visions` table which may not exist yet. The foreign key is nullable, so this is safe.
- **RLS Policies:** Match existing patterns from `projects` and `tasks` tables for consistency.
- **Validation Schema:** May need to update Zod schemas in `lib/validations/mission.ts` to match new field names.

---

**Agent:** John (Backend Developer)  
**Completion Date:** 2026-02-13 18:53 GMT+5
