# Cohort Detail Screen API Implementation Summary

**Task:** PREP: Cohort Detail Screen API  
**Date:** 2026-02-11  
**Developer:** Devi (AI Developer)  
**Status:** ✅ Complete

---

## What Was Built

Implemented the complete data layer for the Cohort Detail screen to support the
Linear-inspired UI design in `/mockups/v3/03-cohort-detail-linear-dark.png`.

---

## Deliverables

### 1. Database Schema

**File:** `/migrations/0003_cohort_members_table.sql`

- Created `cohort_members` table (many-to-many: cohorts ↔ agents)
- Added RLS policies for multi-tenant isolation
- Created triggers for auto-updating cohort stats
- Created SQL function `get_cohort_engagement_timeline()`

**Key features:**

- Unique constraint on `(cohort_id, agent_id)`
- Auto-updates `cohorts.member_count` on insert/delete
- Auto-updates `cohorts.engagement_percent` on score changes
- Stores engagement scores (0-100) per agent per cohort

---

### 2. Query Functions

**File:** `/apps/web/src/server/db/queries/cohort-members.ts` (NEW)

- `getCohortMembers(cohortId)` - Fetch all agents in a cohort with engagement
  scores
- `getCohortMemberCount(cohortId)` - Count members
- `getCohortAvgEngagement(cohortId)` - Calculate average engagement

**File:** `/apps/web/src/server/db/queries/cohorts.ts` (UPDATED)

- Added `getCohortEngagementTimeline(cohortId, daysBack)` - Daily interaction
  counts for graph

---

### 3. API Routes

All routes have authentication, RLS enforcement, and error handling.

#### **GET `/api/cohorts/:id/members`** (NEW)

- **File:** `/apps/web/src/app/api/cohorts/[id]/members/route.ts`
- **Purpose:** List all agents in a cohort with engagement scores and statuses
- **Response:** Array of `CohortMember` objects

#### **GET `/api/cohorts/:id/timeline`** (NEW)

- **File:** `/apps/web/src/app/api/cohorts/[id]/timeline/route.ts`
- **Purpose:** Get daily engagement data for timeline graph
- **Query Params:** `days` (default: 30, max: 365)
- **Response:** Array of `{ date, interaction_count }`

#### **GET `/api/cohorts/:id/activity`** (NEW)

- **File:** `/apps/web/src/app/api/cohorts/[id]/activity/route.ts`
- **Purpose:** Get recent activity log for cohort
- **Query Params:** `limit` (default: 20, max: 100)
- **Response:** Array of audit log entries

#### **GET `/api/cohorts/:id`** (EXISTING)

- **Status:** Already implemented, no changes needed
- **Purpose:** Get cohort details with stats
- **Response:** Full cohort object with stats

---

## Design-to-API Mapping

Based on mockup analysis:

| UI Section                      | API Endpoint                    | Data Used                                                      |
| ------------------------------- | ------------------------------- | -------------------------------------------------------------- |
| **Header** (Name, Status, Date) | `GET /api/cohorts/:id`          | `name`, `status`, `start_date`, `end_date`                     |
| **"Invite AI Agent" Button**    | Manual action                   | Opens modal (future: `POST /api/cohorts/:id/members`)          |
| **Engagement Timeline**         | `GET /api/cohorts/:id/timeline` | `timeline[]` array                                             |
| **Activity Log**                | `GET /api/cohorts/:id/activity` | `activities[]` array                                           |
| **Batch Members (8)**           | `GET /api/cohorts/:id/members`  | `members[]` array                                              |
| **Member Card** (Nexus-7, etc.) | -                               | `agent_name`, `agent_role`, `agent_status`, `engagement_score` |

---

## Response Schemas

### GET `/api/cohorts/:id/members`

```json
{
  "members": [
    {
      "id": "uuid",
      "cohort_id": "uuid",
      "agent_id": "uuid",
      "agent_name": "Nexus-7",
      "agent_slug": "nexus-7",
      "agent_avatar_url": "https://...",
      "agent_role": "Strategic",
      "agent_status": "active",
      "engagement_score": 94,
      "joined_at": "2025-01-15T10:30:00Z",
      "last_active_at": "2025-02-11T14:20:00Z"
    }
  ],
  "count": 8
}
```

### GET `/api/cohorts/:id/timeline?days=30`

```json
{
  "timeline": [
    { "date": "2025-01-15", "interaction_count": 127 },
    { "date": "2025-01-16", "interaction_count": 143 }
  ],
  "period": {
    "days": 30,
    "start": "2025-01-15",
    "end": "2025-02-14"
  }
}
```

### GET `/api/cohorts/:id/activity?limit=20`

```json
{
  "activities": [
    {
      "id": "uuid",
      "entity_id": "cohort-uuid",
      "action": "joined_cohort",
      "description": "Nexus-7 successfully joined the cohort",
      "created_at": "2025-02-11T14:20:00Z"
    }
  ],
  "count": 15
}
```

---

## Database Migration Required

**Action needed before frontend can work:**

```bash
# 1. Open Supabase SQL Editor
# https://supabase.com/dashboard/project/rfwscvklcokzuofyzqwx/sql/new

# 2. Copy and paste the entire content of:
# /migrations/0003_cohort_members_table.sql

# 3. Execute the migration
```

**What the migration does:**

- Creates `cohort_members` table
- Enables RLS with tenant isolation
- Creates `get_cohort_engagement_timeline()` function
- Adds triggers for auto-updating stats
- Grants permissions to `authenticated` role

---

## Files Created

```
/apps/web/src/server/db/queries/cohort-members.ts            (NEW)
/apps/web/src/app/api/cohorts/[id]/members/route.ts          (NEW)
/apps/web/src/app/api/cohorts/[id]/timeline/route.ts         (NEW)
/apps/web/src/app/api/cohorts/[id]/activity/route.ts         (NEW)
/migrations/0003_cohort_members_table.sql                    (NEW)
/COHORT_DETAIL_API_READY.md                                  (NEW - Frontend guide)
/COHORT_DETAIL_IMPLEMENTATION_SUMMARY.md                     (NEW - This file)
```

## Files Modified

```
/apps/web/src/server/db/queries/cohorts.ts                   (UPDATED - Added timeline query)
```

---

## Testing Status

### Manual Testing Required

Since the `cohort_members` table doesn't exist yet (migration not applied), the
endpoints can't be fully tested until:

1. Migration is applied in Supabase
2. Test data is seeded

**Test Plan:**

```bash
# 1. Apply migration
# (Paste 0003_cohort_members_table.sql into Supabase SQL Editor)

# 2. Seed test data
INSERT INTO cohort_members (cohort_id, agent_id, engagement_score)
SELECT
  c.id as cohort_id,
  a.id as agent_id,
  (RANDOM() * 100)::numeric(5,2) as engagement_score
FROM cohorts c
CROSS JOIN agents a
LIMIT 10;

# 3. Test endpoints
curl http://localhost:3000/api/cohorts/{cohort-id}/members
curl http://localhost:3000/api/cohorts/{cohort-id}/timeline?days=30
curl http://localhost:3000/api/cohorts/{cohort-id}/activity
```

### Type Safety

All endpoints use TypeScript with proper types:

- ✅ Zod schemas for validation (inherited from existing patterns)
- ✅ TypeScript interfaces for responses
- ✅ Proper error handling with RFC 7807

---

## Security & RLS

All endpoints enforce:

- ✅ Authentication (`getCurrentUser()`)
- ✅ Organization membership check (`getUserOrganization()`)
- ✅ RLS policies on database level (tenant isolation)
- ✅ Cohort existence validation before fetching related data

---

## Known Limitations

### 1. Timeline Data Dependency

- Assumes `audit_logs` table tracks agent activity
- Assumes `audit_logs.user_id` can be matched to `agent_id`
- May need schema adjustment if assumptions are incorrect

### 2. Activity Log Format

- Returns raw audit log entries
- Frontend may need to transform/format for better UX
- Consider adding activity type categorization

### 3. Member Management Missing

- No endpoints to add/remove members yet
- Future: `POST /api/cohorts/:id/members` and
  `DELETE /api/cohorts/:id/members/:memberId`

---

## Next Steps

### For Backend (Devi)

- ✅ Complete - All endpoints created
- ⏳ Pending: Apply migration and test with real data

### For Frontend (Sami)

1. Review `/COHORT_DETAIL_API_READY.md` for integration guide
2. Apply database migration in Supabase
3. Build UI components:
   - `CohortHeader` (header with name, status, dates)
   - `EngagementTimeline` (chart component)
   - `ActivityLog` (scrollable list)
   - `MembersList` (table/grid of agents)
4. Wire up data fetching using provided example code
5. Handle loading/error states
6. Style according to Linear-inspired design

### For PM/Review

- All endpoints follow existing conventions
- RLS policies ensure multi-tenant isolation
- Error handling follows RFC 7807
- TypeScript types are consistent
- Ready for frontend integration after migration

---

## Summary

✅ **Database schema:** `cohort_members` table with RLS  
✅ **API routes:** 3 new endpoints + 1 existing  
✅ **Query functions:** Member listing, timeline, activity  
✅ **Documentation:** Integration guide for frontend  
✅ **Migration:** SQL file ready to execute

**Status:** Data layer complete. Frontend can start building the UI after
applying the migration.

---

**Questions or issues?** Ping Devi in #dev-general or check
`/COHORT_DETAIL_API_READY.md` for detailed integration guide.
