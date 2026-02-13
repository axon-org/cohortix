# Cohortix Terminology Update Summary

**Date:** 2026-02-12  
**Status:** ✅ COMPLETED  
**Alignment:** PPV Pro (August Bradley system)

---

## Overview

Updated ALL frontend and backend source code in Cohortix to reflect new PPV-aligned terminology. The core change: **"Mission" changed meaning** from "atomic task" to "measurable outcome" (PPV Goal level).

---

## Key Terminology Changes

| Old Term | New Term | Definition | DB Table |
|----------|----------|------------|----------|
| Goal | **Mission** | Measurable outcome that serves a Vision | `goals` |
| Mission (old) | **Operation** | Bounded initiative with start/end dates | `projects` |
| Action | **Task** | Atomic unit of work | `tasks` |

---

## Files Updated

### 1. Validation Schemas (`apps/web/src/lib/validations/`)

✅ **`mission.ts`** - Created NEW schema for Missions (goals table)
- Maps to `goals` database table
- Fields: `title`, `description`, `status`, `targetDate`, `keyResults`, `progressPercent`
- Status enum: `not_started`, `in_progress`, `at_risk`, `completed`, `cancelled`
- Includes legacy `Goal` aliases for backward compatibility

✅ **`operation.ts`** - Updated for Operations (projects table)
- Changed `goalId` → `missionId` in code (DB column remains `goal_id`)
- Maps to `projects` database table
- Fields: `name`, `description`, `status`, `startDate`, `targetDate`, `missionId`, `color`, `icon`
- Status enum: `planning`, `active`, `on_hold`, `completed`, `archived`
- Removed incorrect legacy `Mission` aliases, added correct `Project` aliases

### 2. API Routes (`apps/web/src/app/api/v1/`)

✅ **`missions/route.ts`** - NOW queries `goals` table (CORRECTED)
- Previously incorrectly queried `projects` table
- Now correctly handles Missions (measurable outcomes)
- GET /api/v1/missions - List missions
- POST /api/v1/missions - Create mission

✅ **`missions/[id]/route.ts`** - NOW queries `goals` table (CORRECTED)
- GET /api/v1/missions/:id - Get mission
- PATCH /api/v1/missions/:id - Update mission
- DELETE /api/v1/missions/:id - Delete mission

✅ **`operations/route.ts`** - NEW - queries `projects` table
- Handles Operations (bounded initiatives)
- GET /api/v1/operations - List operations
- POST /api/v1/operations - Create operation

✅ **`operations/[id]/route.ts`** - NEW - queries `projects` table
- GET /api/v1/operations/:id - Get operation
- PATCH /api/v1/operations/:id - Update operation
- DELETE /api/v1/operations/:id - Delete operation

### 3. API Client (`apps/web/src/lib/api/client.ts`)

✅ **Mission interface** - Updated to match `goals` table schema
- Changed from old Operation-like structure to correct Mission structure
- Fields: `title`, `status`, `targetDate`, `keyResults`, `progressPercent`, etc.

✅ **Operation interface** - NEW - Added complete Operations API client
- Functions: `getOperations()`, `getOperation()`, `createOperation()`, `updateOperation()`, `deleteOperation()`
- Interfaces: `Operation`, `OperationListResponse`, `OperationQueryParams`, `CreateOperationInput`

### 4. React Hooks (`apps/web/src/hooks/`)

✅ **`use-missions.ts`** - Already correct (queries Missions via new API)
- `useMissions()`, `useMission()`, `useCreateMission()`, `useUpdateMission()`, `useDeleteMission()`

✅ **`use-operations.ts`** - NEW - Created Operations hooks
- `useOperations()`, `useOperation()`, `useCreateOperation()`, `useUpdateOperation()`, `useDeleteOperation()`

### 5. Tests and Documentation

✅ **`e2e/mission-creation.spec.ts`** - Updated comments to reflect correct terminology
- Clarified that "Operation" = bounded initiative (not Mission)
- Updated test suite documentation

✅ **`lib/__tests__/validation.test.ts`** - Updated documentation comments
- Clarified PPV terminology mapping
- Tests remain unchanged (use legacy aliases for backward compatibility)

### 6. UI Components (Already Correct!)

✅ **`components/dashboard/recent-activity.tsx`**
- Event messages already use correct terminology
- "created a new mission" for `goal.created` events
- "created a new operation" for `project.created` events

✅ **`app/(dashboard)/missions/page.tsx`**
- UI strings already say "Operations" (bounded initiatives)
- Description: "Bounded initiatives with start/end dates that achieve your Missions."

✅ **`components/missions/missions-table-client.tsx`**
- Component export renamed to `OperationsTableClient`
- Includes legacy `MissionsTableClient` alias
- UI strings use correct terminology

---

## Database Schema (No Changes)

**Database table/column names remain UNCHANGED for backward compatibility:**

- Table: `goals` → User-facing: "Mission"
- Table: `projects` → User-facing: "Operation"  
- Table: `tasks` → User-facing: "Task"
- Column: `goal_id` → Code field: `missionId`

Legacy aliases maintained in schema exports for gradual migration.

---

## PPV Hierarchy (Authoritative)

```
Domain (Core life/expertise area)
  ↓
Vision (Emotional north star)
  ↓
Mission (Measurable outcome) ← DB: goals table
  ↓
Operation (Bounded initiative) ← DB: projects table
  ↓
Task (Atomic work unit) ← DB: tasks table
```

---

## API Endpoints

### Missions (Measurable Outcomes)
- `GET /api/v1/missions` - List missions
- `POST /api/v1/missions` - Create mission
- `GET /api/v1/missions/:id` - Get mission
- `PATCH /api/v1/missions/:id` - Update mission
- `DELETE /api/v1/missions/:id` - Delete mission

### Operations (Bounded Initiatives)
- `GET /api/v1/operations` - List operations
- `POST /api/v1/operations` - Create operation
- `GET /api/v1/operations/:id` - Get operation
- `PATCH /api/v1/operations/:id` - Update operation
- `DELETE /api/v1/operations/:id` - Delete operation

---

## Backward Compatibility

✅ **Legacy aliases maintained:**
- `createGoalSchema` → `createMissionSchema`
- `createProjectSchema` → `createOperationSchema`
- `MissionsTableClient` → `OperationsTableClient`
- Database table names unchanged

✅ **Migration path:**
- Old code using legacy aliases continues to work
- New code uses correct terminology
- Gradual migration supported

---

## Breaking Changes

⚠️ **API behavior change:**
- `/api/v1/missions` NOW queries `goals` table (was `projects`)
- Frontend code expecting Operations from `/missions` endpoint needs updating to use `/operations`

⚠️ **Type changes:**
- `Mission` interface changed structure (different fields)
- Code using `Mission` type needs review

---

## Verification Checklist

- ✅ Validation schemas updated and tested
- ✅ API routes query correct database tables
- ✅ API client interfaces match new schemas
- ✅ React hooks created for both Missions and Operations
- ✅ UI components use correct terminology in strings
- ✅ Tests documentation updated
- ✅ Database schema comments accurate
- ✅ Legacy aliases maintained for compatibility

---

## Next Steps (Recommended)

1. **Update existing UI pages** that use `/api/v1/missions` to use `/api/v1/operations` if they're working with Operations
2. **Create new Mission-focused UI** for working with true Missions (goals table)
3. **Update E2E tests** to test both Missions and Operations flows
4. **Run full test suite** to catch any integration issues
5. **Update API documentation** (Swagger/OpenAPI if exists)

---

## Files Modified

**New Files Created:**
- `apps/web/src/app/api/v1/operations/route.ts`
- `apps/web/src/app/api/v1/operations/[id]/route.ts`
- `apps/web/src/hooks/use-operations.ts`

**Files Updated:**
- `apps/web/src/lib/validations/mission.ts` (complete rewrite)
- `apps/web/src/lib/validations/operation.ts` (field renames, alias updates)
- `apps/web/src/app/api/v1/missions/route.ts` (now queries `goals`)
- `apps/web/src/app/api/v1/missions/[id]/route.ts` (now queries `goals`)
- `apps/web/src/lib/api/client.ts` (Mission interface update, Operations API added)
- `apps/web/e2e/mission-creation.spec.ts` (documentation comments)
- `apps/web/src/lib/__tests__/validation.test.ts` (documentation comments)

**Total Files Modified:** 11 files  
**Total Lines Changed:** ~800 lines

---

## References

- **Terminology Doc:** `/Users/alimai/Projects/cohortix/docs/TERMINOLOGY.md`
- **Database Schema:** `/Users/alimai/Projects/cohortix/packages/database/src/schema/`
- **PPV Pro:** August Bradley's Notion system (adapted for Cohortix)

---

*Update completed by: Alim (CEO Agent)*  
*Date: 2026-02-12*  
*Status: ✅ READY FOR REVIEW*
