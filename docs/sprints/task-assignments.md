# Task Assignments - Sprint Kickoff

## 🎯 IMMEDIATE PRIORITY (Start Today)

### Backend Track - Devi (ai-developer)

**Session 1: Cohorts Database Foundation**

```
Label: devi-cohorts-schema
Task: COH-B1 - Create Cohorts Database Schema

Instructions:
1. Review mockups at /Users/alimai/clawd/cohortix-mockups/v3/02-cohort-grid-linear-dark.png and 03-cohort-detail-linear-dark.png
2. Create migration file: supabase/migrations/YYYYMMDDHHMMSS_create_cohorts.sql
3. Define tables:
   - cohorts (id, organization_id, name, description, status, start_date, end_date, metadata, created_at, updated_at)
   - cohort_members (id, cohort_id, user_id/agent_id, joined_at, engagement_score, metadata)
4. Add RLS policies for tenant isolation
5. Add indexes on frequently queried columns
6. Write spec: docs/specs/database/cohorts-schema.md
7. Write migration rollback test
8. Apply migration to local Supabase
9. Store learnings in your memory

Working directory: ~/Projects/cohortix/
```

**Session 2: Dashboard Query Enhancements**

```
Label: devi-dashboard-queries
Task: MC-B1 - Enhance Dashboard Queries

Instructions:
1. Review current queries in apps/web/src/server/db/queries/dashboard.ts
2. Add engagement velocity data for chart (30-day trend)
3. Add retention metrics calculation
4. Add MRR calculation (if revenue tracking exists)
5. Optimize queries with proper indexes
6. Write spec: docs/specs/dashboard-data-contract.md (document data shape)
7. Write integration tests for all new queries
8. Store learnings in your memory

Working directory: ~/Projects/cohortix/
```

**Session 3: Cohort Queries Module**

```
Label: devi-cohort-queries
Task: COH-B2 - Cohort Queries Module (after COH-B1 completes)

Instructions:
1. Create apps/web/src/server/db/queries/cohorts.ts
2. Implement:
   - getCohorts(orgId, filters) - list with pagination, filters, sorting
   - getCohortById(id) - single cohort with members
   - getCohortStats(id) - engagement metrics, retention
   - getCohortActivity(id, limit) - activity timeline
3. Add engagement score calculation logic
4. Write spec: docs/specs/cohorts-data-contract.md
5. Write unit tests for all queries
6. Store learnings

Working directory: ~/Projects/cohortix/
```

---

### Frontend Track - Sami (frontend-developer)

**Session 1: Mission Control KPI Cards**

```
Label: sami-kpi-cards
Task: MC-F1 - Align KPI Cards with Mockup

Instructions:
1. Review mockup: /Users/alimai/clawd/cohortix-mockups/v3/01-mission-control-linear-dark.png
2. Review design specs: /Users/alimai/clawd/cohortix-mockups/v5/DESIGN_SPECIFICATIONS.md
3. Update apps/web/src/components/dashboard/kpi-cards.tsx
4. Match exact design:
   - Background: #1A1A1E
   - Text: white (#F2F2F2)
   - Subtle shadows: 0 2px 8px rgba(0,0,0,0.4)
   - Border radius: 8px
   - Padding: 20px
5. Add sparkline mini-charts to each card
6. Add trend indicators (green/amber/red dots + arrows)
7. Use design tokens from packages/ui/tokens/
8. Create Storybook stories
9. Write component tests
10. Store learnings

Working directory: ~/Projects/cohortix/
```

**Session 2: Cohorts Grid Page**

```
Label: sami-cohorts-grid
Task: COH-F1 - Cohorts Grid Page (after COH-B2 completes)

Instructions:
1. Review mockup: /Users/alimai/clawd/cohortix-mockups/v3/02-cohort-grid-linear-dark.png
2. Create apps/web/src/app/(dashboard)/cohorts/page.tsx
3. Implement:
   - Search bar (debounced, 300ms)
   - Status filter dropdown (All, Active, Paused, At-Risk, Completed)
   - Date range filter
   - "+ New Cohort" button (top right)
   - Server-side pagination (20 per page)
   - Loading states, error states
4. Match exact layout from mockup
5. Write E2E test for page load + filters
6. Store learnings

Working directory: ~/Projects/cohortix/
```

**Session 3: Cohorts Data Table**

```
Label: sami-cohorts-table
Task: COH-F2 - Cohorts Data Table Component (parallel with COH-F1)

Instructions:
1. Review mockup: /Users/alimai/clawd/cohortix-mockups/v3/02-cohort-grid-linear-dark.png
2. Create apps/web/src/components/cohorts/cohorts-table.tsx
3. Implement:
   - Columns: Name, Status, Members, Engagement, Start Date, Actions
   - Status pills: Active (green), Paused (amber), At-Risk (red), Completed (blue)
   - Engagement: progress bar + percentage
   - Sortable columns
   - Row hover state (#202025)
   - Row click → navigate to detail
4. Match exact design from mockup
5. Create Storybook stories
6. Write component tests
7. Store learnings

Working directory: ~/Projects/cohortix/
```

---

## 🔄 PARALLEL WORK STREAMS

### Week 1 Focus

**Devi (Backend):**

1. COH-B1: Cohorts Schema ← START HERE
2. MC-B1: Dashboard Queries (parallel)
3. COH-B2: Cohort Queries (depends on COH-B1)
4. COH-B3: Cohort Mutations (depends on COH-B2)

**Sami (Frontend):**

1. MC-F1: KPI Cards ← START HERE
2. MC-F2: Engagement Chart (parallel)
3. COH-F1: Cohorts Grid Page (wait for COH-B2)
4. COH-F2: Cohorts Table (parallel with COH-F1)

### Week 2 Focus

**Devi:**

1. COH-B4: Cohort API Routes
2. AGENT-B1: Enhance Agent Queries
3. AGENT-B2: Agent API Routes

**Sami:**

1. COH-F3: Cohort Detail Page
2. COH-F4: Engagement Timeline
3. COH-F5: Members List
4. COH-F6: Create/Edit Modal

### Week 3 Focus

**Both:**

1. AGENT-F1: Agent Profile Page (Sami)
2. DS-1: Shared UI Components (Both)
3. AUTH-F1: Login Page Update (Sami)
4. Integration testing
5. Bug fixes
6. Polish

---

## 📋 Session Spawn Commands

### For Devi (Backend)

```bash
# Session 1
sessions_spawn --agent ai-developer --label devi-cohorts-schema \
  --task "COH-B1: Create Cohorts Database Schema. Review mockups, create migration, add RLS policies, write spec and tests. See /Users/alimai/.openclaw/workspace-pm/task-assignments.md for details."

# Session 2
sessions_spawn --agent ai-developer --label devi-dashboard-queries \
  --task "MC-B1: Enhance Dashboard Queries. Add engagement velocity, retention metrics, optimize queries, write spec and tests. See task-assignments.md for details."

# Session 3 (after Session 1 completes)
sessions_spawn --agent ai-developer --label devi-cohort-queries \
  --task "COH-B2: Cohort Queries Module. Create queries for getCohorts, getCohortById, getCohortStats. Write spec and tests. See task-assignments.md."
```

### For Sami (Frontend)

```bash
# Session 1
sessions_spawn --agent frontend-developer --label sami-kpi-cards \
  --task "MC-F1: Align KPI Cards with Mockup. Review mockup, match exact design, add sparklines and trend indicators. Write Storybook stories and tests. See task-assignments.md."

# Session 2 (after devi-cohort-queries completes)
sessions_spawn --agent frontend-developer --label sami-cohorts-grid \
  --task "COH-F1: Cohorts Grid Page. Create page with search, filters, pagination. Match mockup exactly. Write E2E tests. See task-assignments.md."

# Session 3 (parallel with Session 2)
sessions_spawn --agent frontend-developer --label sami-cohorts-table \
  --task "COH-F2: Cohorts Data Table. Create table component with status pills, sortable columns, row interactions. Storybook + tests. See task-assignments.md."
```

---

## ✅ Execution Checklist

- [x] Sprint backlog created
- [x] Tasks detailed with specs requirements
- [x] Dependencies mapped
- [x] Discord update posted
- [ ] Devi sessions spawned (3 initial)
- [ ] Sami sessions spawned (3 initial)
- [ ] Daily standup bot configured (optional)
- [ ] Progress tracking in project board (optional)

---

## 📞 Communication Protocol

**Daily Updates to Discord #general:**

- What completed today
- What's in progress
- Any blockers
- ETA for current tasks

**Ping Ahmad only for:**

- Design decisions not in mockups
- Business logic clarifications
- External dependencies
- Critical blockers

**Agent-to-Agent:**

- Backend → Frontend: "API ready for X, data shape documented in spec"
- Frontend → Backend: "Need endpoint for Y, expected shape is Z"
- Use Discord #dev-updates or direct mentions

---

## 🎯 Success Criteria

**End of Week 1:**

- ✅ Cohorts database schema deployed
- ✅ Dashboard queries enhanced
- ✅ Mission Control KPI cards polished
- ✅ Cohort queries module implemented

**End of Week 2:**

- ✅ Cohorts CRUD API complete
- ✅ Cohorts grid page live
- ✅ Cohort detail page live
- ✅ Create/edit cohort working

**End of Week 3:**

- ✅ Agent profiles implemented
- ✅ Auth screens updated
- ✅ All tests passing (80%+ coverage)
- ✅ Design matches mockups exactly
- ✅ Ready for Ahmad's review

---

**Let's ship! 🚀**
