# Cohort Detail Screen API - Ready for Frontend Integration

**Date:** 2026-02-11  
**Prepared by:** Devi (AI Developer)  
**Status:** ✅ Ready for Sami to wire up

---

## Overview

The API layer for the **Cohort Detail Screen** is now complete. All necessary endpoints, queries, and database schema are in place to support the Linear-inspired detail view shown in `/mockups/v3/03-cohort-detail-linear-dark.png`.

---

## New Database Schema

### `cohort_members` Table

Links agents (allies) to cohorts with engagement tracking.

**Columns:**
- `id` (UUID) - Primary key
- `cohort_id` (UUID) - References `cohorts.id`
- `agent_id` (UUID) - References `agents.id`
- `engagement_score` (NUMERIC) - Agent engagement score (0-100)
- `joined_at` (TIMESTAMPTZ) - When agent joined cohort
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

**Unique Constraint:** `(cohort_id, agent_id)` - Prevents duplicate memberships

**Auto-triggers:**
- Updates `cohorts.member_count` on insert/delete
- Updates `cohorts.engagement_percent` on engagement_score changes

---

## New API Endpoints

### 1. GET `/api/cohorts/:id/members`

**Purpose:** Fetch all members (allies) in a cohort with engagement scores and statuses.

**Response:**
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

**Used for:** "Batch Members (8)" section in detail view

---

### 2. GET `/api/cohorts/:id/timeline`

**Purpose:** Get daily engagement timeline data for the graph.

**Query Parameters:**
- `days` (optional, default: 30) - Number of days to fetch (max: 365)

**Response:**
```json
{
  "timeline": [
    {
      "date": "2025-01-15",
      "interaction_count": 127
    },
    {
      "date": "2025-01-16",
      "interaction_count": 143
    }
  ],
  "period": {
    "days": 30,
    "start": "2025-01-15",
    "end": "2025-02-14"
  }
}
```

**Used for:** "Engagement Timeline" graph showing daily interaction count

---

### 3. GET `/api/cohorts/:id/activity`

**Purpose:** Get recent activity log entries for the cohort.

**Query Parameters:**
- `limit` (optional, default: 20, max: 100) - Number of activities to return

**Response:**
```json
{
  "activities": [
    {
      "id": "uuid",
      "entity_id": "cohort-uuid",
      "action": "joined_cohort",
      "description": "Nexus-7 successfully joined the cohort",
      "created_at": "2025-02-11T14:20:00Z",
      "metadata": {}
    }
  ],
  "count": 15
}
```

**Used for:** "Activity Log" section showing recent events

---

### 4. GET `/api/cohorts/:id` (Enhanced)

**Already exists** - Returns cohort details with stats:

```json
{
  "id": "uuid",
  "name": "Alpha Batch 2025",
  "slug": "alpha-batch-2025",
  "description": "Q1 2025 pilot cohort",
  "status": "active",
  "member_count": 8,
  "engagement_percent": 78.5,
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "created_at": "2025-01-01T00:00:00Z",
  "stats": {
    "memberCount": 8,
    "engagementPercent": 78.5,
    "daysActive": 42,
    "status": "active",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
  }
}
```

**Used for:** Cohort header (name, date range, status badge, "Invite AI Ally" button)

---

## Migration Required

**File:** `/migrations/0003_cohort_members_table.sql`

**To apply:**
```bash
# Run in Supabase SQL Editor
# https://supabase.com/dashboard/project/rfwscvklcokzuofyzqwx/sql/new
# Copy and execute the entire 0003_cohort_members_table.sql file
```

**What it does:**
1. Creates `cohort_members` table with RLS policies
2. Creates `get_cohort_engagement_timeline()` database function
3. Adds auto-update triggers for `member_count` and `engagement_percent`
4. Grants necessary permissions

---

## Frontend Integration Guide

### Fetching Cohort Detail Data

```typescript
// In your Cohort Detail page component
import { useEffect, useState } from 'react';

export default function CohortDetailPage({ params }: { params: { id: string } }) {
  const [cohort, setCohort] = useState(null);
  const [members, setMembers] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCohortDetail() {
      try {
        // Fetch all data in parallel
        const [cohortRes, membersRes, timelineRes, activityRes] = await Promise.all([
          fetch(`/api/cohorts/${params.id}`),
          fetch(`/api/cohorts/${params.id}/members`),
          fetch(`/api/cohorts/${params.id}/timeline?days=30`),
          fetch(`/api/cohorts/${params.id}/activity?limit=20`),
        ]);

        const cohortData = await cohortRes.json();
        const membersData = await membersRes.json();
        const timelineData = await timelineRes.json();
        const activityData = await activityRes.json();

        setCohort(cohortData);
        setMembers(membersData.members);
        setTimeline(timelineData.timeline);
        setActivities(activityData.activities);
      } catch (error) {
        console.error('Failed to fetch cohort detail:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCohortDetail();
  }, [params.id]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="cohort-detail">
      {/* Header */}
      <CohortHeader cohort={cohort} />
      
      {/* Engagement Timeline Graph */}
      <EngagementTimeline data={timeline} />
      
      {/* Activity Log */}
      <ActivityLog activities={activities} />
      
      {/* Batch Members List */}
      <MembersList members={members} />
    </div>
  );
}
```

### Component Mapping to API Data

| UI Component | API Endpoint | Data Field |
|-------------|--------------|------------|
| **Cohort Header** | `GET /api/cohorts/:id` | `name`, `status`, `start_date`, `end_date` |
| **"Invite AI Ally" Button** | Manual action (opens modal) | - |
| **Engagement Timeline** | `GET /api/cohorts/:id/timeline` | `timeline[]` |
| **Activity Log** | `GET /api/cohorts/:id/activity` | `activities[]` |
| **Batch Members List** | `GET /api/cohorts/:id/members` | `members[]` |
| **Member Card** | - | `agent_name`, `agent_role`, `agent_status`, `engagement_score` |

---

## Status Mapping (from Design)

### Agent Status Colors

Map `agent_status` values to UI states:

```typescript
const statusConfig = {
  active: { label: 'Active', color: 'green', dotColor: 'bg-green-500' },
  idle: { label: 'Idle', color: 'gray', dotColor: 'bg-gray-400' },
  busy: { label: 'Syncing', color: 'yellow', dotColor: 'bg-yellow-500' },
  offline: { label: 'Offline', color: 'gray', dotColor: 'bg-gray-300' },
  error: { label: 'Error', color: 'red', dotColor: 'bg-red-500' },
};

// In mockup:
// - "Optimal" → active (green dot)
// - "Active" → active (green dot)
// - "Syncing" → busy (yellow dot)
// - "Idle" → idle (gray dot)
```

### Cohort Status Badge

Map `cohort.status` to badge styles:

```typescript
const cohortStatusConfig = {
  active: { label: 'ACTIVE', className: 'bg-purple-500/10 text-purple-400' },
  paused: { label: 'PAUSED', className: 'bg-yellow-500/10 text-yellow-400' },
  'at-risk': { label: 'AT RISK', className: 'bg-red-500/10 text-red-400' },
  completed: { label: 'COMPLETED', className: 'bg-gray-500/10 text-gray-400' },
};
```

---

## Engagement Score Progress Bar

```typescript
// In member card component
<div className="flex items-center gap-2">
  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
    <div 
      className="h-full bg-gradient-to-r from-blue-500 to-violet-500"
      style={{ width: `${member.engagement_score}%` }}
    />
  </div>
  <span className="text-sm font-mono text-gray-400">{member.engagement_score}</span>
</div>
```

---

## Testing the Endpoints

### 1. Apply Migration
```bash
# Copy migrations/0003_cohort_members_table.sql
# Paste into Supabase SQL Editor and execute
```

### 2. Seed Test Data
```bash
# In Supabase SQL Editor:
INSERT INTO cohort_members (cohort_id, agent_id, engagement_score) VALUES
  ('your-cohort-uuid', 'agent-uuid-1', 94),
  ('your-cohort-uuid', 'agent-uuid-2', 72),
  ('your-cohort-uuid', 'agent-uuid-3', 88);
```

### 3. Test Endpoints
```bash
# Get cohort with stats
curl http://localhost:3000/api/cohorts/{cohort-id}

# Get members
curl http://localhost:3000/api/cohorts/{cohort-id}/members

# Get timeline
curl http://localhost:3000/api/cohorts/{cohort-id}/timeline?days=30

# Get activity
curl http://localhost:3000/api/cohorts/{cohort-id}/activity?limit=20
```

---

## Next Steps for Sami

1. ✅ **Apply migration** - Run `0003_cohort_members_table.sql` in Supabase
2. ✅ **Create UI components:**
   - `CohortHeader.tsx` - Name, status badge, date range, invite button
   - `EngagementTimeline.tsx` - Line/area chart using timeline data
   - `ActivityLog.tsx` - Scrollable list of recent activities
   - `MembersList.tsx` - Table/grid of allies with engagement scores
3. ✅ **Wire up data fetching** - Use the example code above
4. ✅ **Handle loading states** - Skeletons for each section
5. ✅ **Handle errors** - Show error boundaries if API fails
6. ✅ **Add "Invite AI Ally" modal** - Opens form to add members to cohort

---

## Known Limitations / Future Work

### Timeline Data Accuracy
- Currently uses `audit_logs` table for interaction counts
- May need refinement based on what "interactions" means in your domain
- If `audit_logs.user_id` doesn't store agent IDs, the timeline query needs adjustment

### Activity Log Format
- Currently returns raw `audit_logs` entries
- You may want to format/transform these for better UX
- Consider adding activity types (e.g., "agent_joined", "engagement_spike")

### Member Management
- No endpoints yet for adding/removing members from cohorts
- That's a future feature (POST/DELETE `/api/cohorts/:id/members`)

---

## Questions / Issues?

If anything is unclear or you hit issues integrating:
1. Check browser Network tab for API errors
2. Check Supabase logs for database errors
3. Ping Devi or drop a note in #dev-general

**Data layer is ready. UI is yours to build! 🚀**
