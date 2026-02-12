# Cohort Detail Screen Implementation

**Date:** 2026-02-11  
**Implementer:** Sami (Frontend Developer)  
**Status:** ✅ Complete - Pending Migration

---

## Implementation Summary

Built the complete Cohort Detail Screen UI with Linear.app-inspired monochrome aesthetic.

### ✅ Components Created

1. **`cohort-header.tsx`** - Header with name, status badge, date range, "Invite AI Ally" button
2. **`engagement-timeline.tsx`** - Line chart showing daily interaction counts (Recharts)
3. **`batch-members.tsx`** - Table of AI allies with engagement scores and status
4. **`activity-log.tsx`** - Live feed of cohort activities
5. **`cohort-detail-client.tsx`** - Client component orchestrating data fetching
6. **`app/(dashboard)/cohorts/[id]/page.tsx`** - Server component page wrapper

### ✅ API Integration

- **API Client** (`lib/api/client.ts`) - Added functions for:
  - `getCohortDetail(id)` - Fetch cohort header info
  - `getCohortMembers(id)` - Fetch batch members list
  - `getCohortTimeline(id, days)` - Fetch engagement timeline data
  - `getCohortActivity(id, limit)` - Fetch activity log
  
- **Hooks** (`hooks/use-cohort-detail.ts`) - React Query hooks for data fetching:
  - `useCohortDetail(id)`
  - `useCohortMembers(id)`
  - `useCohortTimeline(id, days)`
  - `useCohortActivity(id, limit)`

### ✅ Design System Compliance

- **Strict Monochrome:** Black (#0A0A0B), white (#FAFAFA), gray surfaces (#141416)
- **Color ONLY for status:** Green (active), amber (paused), red (at-risk)
- **White glow effects:** Subtle luminosity on hover states
- **Typography:** Inter for text, SF Mono for numbers/data
- **Spacing:** Consistent 8px grid system
- **Accessibility:** WCAG 2.2 AA contrast ratios maintained

### 🚧 Pending: Database Migration

**CRITICAL:** The migration must be applied before the UI will work.

**File:** `~/Projects/cohortix/migrations/0003_cohort_members_table.sql`

**To Apply:**
1. Open Supabase Dashboard → SQL Editor
   - URL: https://supabase.com/dashboard/project/rfwscvklcokzuofyzqwx/sql/new
2. Copy the entire contents of `migrations/0003_cohort_members_table.sql`
3. Paste into SQL Editor
4. Click "Run" to execute

**What the Migration Does:**
- Creates `cohort_members` table (links agents to cohorts)
- Adds RLS policies for tenant isolation
- Creates `get_cohort_engagement_timeline()` database function
- Sets up auto-update triggers for `member_count` and `engagement_percent`
- Grants necessary permissions

---

## File Structure

```
apps/web/src/
├── app/(dashboard)/cohorts/[id]/
│   └── page.tsx                    # Server component page
├── components/cohorts/
│   ├── cohort-header.tsx           # Header component
│   ├── engagement-timeline.tsx     # Timeline chart
│   ├── batch-members.tsx           # Members table
│   ├── activity-log.tsx            # Activity feed
│   └── cohort-detail-client.tsx    # Client orchestrator
├── hooks/
│   └── use-cohort-detail.ts        # React Query hooks
└── lib/api/
    └── client.ts                   # API client functions
```

---

## Testing Checklist

Once migration is applied:

- [ ] Navigate to `/cohorts` page
- [ ] Click on any cohort row
- [ ] Verify cohort detail page loads
- [ ] Check header displays: name, status badge, date range
- [ ] Check engagement timeline renders with data
- [ ] Check batch members table shows allies with engagement scores
- [ ] Check activity log shows recent activities
- [ ] Verify loading states display correctly
- [ ] Verify error states display correctly
- [ ] Test responsive layout on mobile/tablet

---

## Known Limitations

### Timeline Data Accuracy
- Currently uses `audit_logs` table for interaction counts
- May need refinement based on domain-specific "interactions" definition
- If `audit_logs.user_id` doesn't store agent IDs, query needs adjustment

### Activity Log Format
- Returns raw `audit_logs` entries
- Could benefit from formatted/transformed activity types
- Consider adding specific activity types (e.g., "agent_joined", "engagement_spike")

### Member Management
- No endpoints yet for adding/removing members from cohorts
- "Invite AI Ally" button is UI-only (no backend handler yet)
- Future feature: POST/DELETE `/api/cohorts/:id/members`

### Timeline Period Selector
- 7D, 30D, 90D buttons are UI-only (not functional yet)
- Currently hardcoded to 30 days
- TODO: Wire up period selector to refetch with different `days` parameter

---

## Next Steps

1. **Apply Migration** - Run `0003_cohort_members_table.sql` in Supabase SQL Editor
2. **Seed Test Data** - Add test `cohort_members` records to verify UI
3. **Test Navigation** - Verify clicking cohort rows navigates to detail page
4. **Implement "Invite AI Ally"** - Build modal/form for adding members
5. **Add Timeline Period Selector** - Wire up 7D/30D/90D buttons
6. **Add Member Actions Menu** - Implement "⋯" menu in members table

---

## API Endpoint Summary

All endpoints use direct `/api/cohorts/:id` path (not `/api/v1`):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cohorts/:id` | GET | Fetch cohort details with stats |
| `/api/cohorts/:id/members` | GET | Fetch batch members with engagement scores |
| `/api/cohorts/:id/timeline?days=30` | GET | Fetch engagement timeline data |
| `/api/cohorts/:id/activity?limit=20` | GET | Fetch activity log entries |

---

## Design Specifications Reference

- **Mockup:** `~/Projects/cohortix/mockups/v3/03-cohort-detail-linear-dark.png`
- **Design Specs:** `~/Projects/cohortix/mockups/v5/DESIGN_SPECIFICATIONS.md`
- **API Guide:** `~/Projects/cohortix/COHORT_DETAIL_API_READY.md`

---

**Implementation complete. Ready for migration and testing.**
