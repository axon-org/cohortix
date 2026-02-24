# Cohortix Sprint Backlog - February 2026

**Sprint Goal:** Implement Mission Control Dashboard + Cohorts CRUD based on
Lubna's v3 mockups

**Design Reference:** Linear-inspired dark theme (#0A0A0B background, monochrome
with status colors) **Mockups:** `/Users/alimai/clawd/cohortix-mockups/v3/`

---

## 🎯 Sprint Priority Order

1. **Mission Control Dashboard** (refine existing implementation)
2. **Cohorts CRUD** (new feature - grid, detail, create/edit)
3. **Agent Profiles** (new feature)
4. **Goals/Missions Enhancement** (based on existing projects table)

---

## 📋 BACKLOG TASKS

### EPIC 1: Mission Control Dashboard Refinement

**Mockup:** `01-mission-control-linear-dark.png` **Status:** Partial
implementation exists, needs design alignment

#### Backend Tasks (Devi)

- [ ] **MC-B1: Enhance Dashboard Queries**
  - File: `apps/web/src/server/db/queries/dashboard.ts`
  - Add engagement velocity data for chart (30-day trend)
  - Add retention metrics calculation
  - Add MRR calculation (if revenue tracking exists)
  - Optimize queries with proper indexes
  - Spec: Document data shape in `docs/specs/dashboard-data-contract.md`
  - Test: Write integration tests for all queries

- [ ] **MC-B2: Create Dashboard API Routes**
  - File: `apps/web/src/app/api/dashboard/route.ts`
  - GET `/api/dashboard` - returns full dashboard data
  - GET `/api/dashboard/kpis` - KPIs only
  - GET `/api/dashboard/chart-data` - engagement velocity data
  - Add rate limiting (10 req/min per user)
  - Add caching (Redis or Next.js cache, 5min TTL)
  - Spec: OpenAPI schema in `docs/specs/api/dashboard.yml`
  - Test: API integration tests

#### Frontend Tasks (Sami)

- [ ] **MC-F1: Align KPI Cards with Mockup**
  - File: `apps/web/src/components/dashboard/kpi-cards.tsx`
  - Match exact design: #1A1A1E background, white text, subtle shadows
  - Add sparkline mini-charts to each card
  - Add trend indicators (green/amber/red dots + arrows)
  - Match spacing: 20px padding, 8px border-radius
  - Update to use design tokens from `packages/ui/tokens/`
  - Test: Storybook stories + visual regression

- [ ] **MC-F2: Implement Engagement Velocity Chart**
  - File: `apps/web/src/components/dashboard/engagement-chart.tsx`
  - Replace placeholder with real chart (use Recharts or Tremor)
  - Match mockup: white line on dark background, subtle grid
  - 30/90/1Y time period toggles
  - Responsive: collapse to mobile view at 768px
  - Loading skeleton state
  - Test: Component tests with mock data

- [ ] **MC-F3: Refine Recent Activity Feed**
  - File: `apps/web/src/components/dashboard/recent-activity.tsx`
  - Match mockup styling exactly
  - Add status dots (green/amber/red) for activity types
  - Add timestamps ("2m ago", "15m ago")
  - Add entity links (click cohort name → cohort detail)
  - Empty state design
  - Test: Snapshot tests

- [ ] **MC-F4: Refine Urgent Alerts Panel**
  - File: `apps/web/src/components/dashboard/urgent-alerts.tsx`
  - Match mockup: red left border, priority dots
  - Add action buttons ("Assign now", "Review")
  - Add dismiss functionality (update user preferences)
  - Empty state: "All good! No urgent alerts"
  - Test: Interaction tests

- [ ] **MC-F5: Dashboard Layout Polish**
  - File: `apps/web/src/app/(dashboard)/page.tsx`
  - Match exact grid layout from mockup
  - Responsive breakpoints (mobile: 1 col, tablet: 2 col, desktop: 4 col for
    KPIs)
  - Add loading states for all sections
  - Add error boundaries
  - Verify accessibility (ARIA labels, keyboard navigation)
  - Test: E2E test for full dashboard load

---

### EPIC 2: Cohorts CRUD (NEW FEATURE)

**Mockups:** `02-cohort-grid-linear-dark.png`,
`03-cohort-detail-linear-dark.png` **Priority:** HIGH

#### Backend Tasks (Devi)

- [ ] **COH-B1: Create Cohorts Database Schema**
  - File: `supabase/migrations/YYYYMMDDHHMMSS_create_cohorts.sql`
  - Table: `cohorts` (id, organization_id, name, description, status,
    start_date, end_date, metadata, created_at, updated_at)
  - Table: `cohort_members` (id, cohort_id, user_id/agent_id, joined_at,
    engagement_score, metadata)
  - Add RLS policies for tenant isolation
  - Add indexes on frequently queried columns
  - Spec: Schema documentation in `docs/specs/database/cohorts-schema.md`
  - Test: Migration rollback test

- [ ] **COH-B2: Cohort Queries Module**
  - File: `apps/web/src/server/db/queries/cohorts.ts`
  - `getCohorts(orgId, filters)` - list with pagination, filters, sorting
  - `getCohortById(id)` - single cohort with members
  - `getCohortStats(id)` - engagement metrics, retention, etc.
  - `getCohortActivity(id, limit)` - activity timeline
  - Add engagement score calculation logic
  - Spec: Document in `docs/specs/cohorts-data-contract.md`
  - Test: Unit tests for all queries

- [ ] **COH-B3: Cohort Mutations Module**
  - File: `apps/web/src/server/db/mutations/cohorts.ts`
  - `createCohort(data)` - create new cohort
  - `updateCohort(id, data)` - update cohort
  - `deleteCohort(id)` - soft delete (status = 'archived')
  - `addCohortMember(cohortId, userId)` - add member
  - `removeCohortMember(cohortId, userId)` - remove member
  - `updateMemberEngagement(cohortId, userId, score)` - update engagement
  - Add validation (Zod schemas)
  - Spec: Document in `docs/specs/cohorts-mutations.md`
  - Test: Integration tests

- [ ] **COH-B4: Cohort API Routes**
  - File: `apps/web/src/app/api/cohorts/route.ts`
  - GET `/api/cohorts` - list cohorts
  - POST `/api/cohorts` - create cohort
  - File: `apps/web/src/app/api/cohorts/[id]/route.ts`
  - GET `/api/cohorts/:id` - get single cohort
  - PATCH `/api/cohorts/:id` - update cohort
  - DELETE `/api/cohorts/:id` - archive cohort
  - File: `apps/web/src/app/api/cohorts/[id]/members/route.ts`
  - GET `/api/cohorts/:id/members` - list members
  - POST `/api/cohorts/:id/members` - add member
  - DELETE `/api/cohorts/:id/members/:memberId` - remove member
  - Add input validation, rate limiting, error handling
  - Spec: OpenAPI schema in `docs/specs/api/cohorts.yml`
  - Test: API integration tests

#### Frontend Tasks (Sami)

- [ ] **COH-F1: Cohorts Grid Page**
  - File: `apps/web/src/app/(dashboard)/cohorts/page.tsx`
  - Implement layout matching mockup exactly
  - Search bar (debounced, 300ms)
  - Status filter dropdown (All, Active, Paused, At-Risk, Completed)
  - Date range filter
  - "+ New Cohort" button (top right)
  - Server-side pagination (20 per page)
  - Loading states, error states
  - Test: E2E test for page load + filters

- [ ] **COH-F2: Cohorts Data Table Component**
  - File: `apps/web/src/components/cohorts/cohorts-table.tsx`
  - Match mockup design: dark theme, #1A1A1E rows, #2A2A2E borders
  - Columns: Name, Status, Members, Engagement, Start Date, Actions
  - Status pills: Active (green), Paused (amber), At-Risk (red), Completed
    (blue)
  - Engagement: progress bar + percentage
  - Sortable columns (click header)
  - Row hover state (#202025 background)
  - Row click → navigate to detail
  - Bulk select checkboxes (for future bulk actions)
  - Test: Component tests + Storybook stories

- [ ] **COH-F3: Cohort Detail Page**
  - File: `apps/web/src/app/(dashboard)/cohorts/[id]/page.tsx`
  - Match mockup: header with cohort name, status badge, action buttons
  - Engagement timeline chart (like mockup - blue gradient line)
  - Member list with engagement scores
  - Activity log (right sidebar)
  - "Invite All Agent" button, "Edit Profile" button
  - Tabs: Overview, Members, Activity, Settings (MVP: just Overview)
  - Test: E2E test for detail page

- [ ] **COH-F4: Engagement Timeline Component**
  - File: `apps/web/src/components/cohorts/engagement-timeline.tsx`
  - Match mockup: blue-violet gradient line chart
  - X-axis: dates, Y-axis: engagement percentage
  - Time period toggles: 30D, 90D, 1Y
  - Tooltips on hover showing exact values
  - Responsive design
  - Test: Visual regression test

- [ ] **COH-F5: Cohort Members List Component**
  - File: `apps/web/src/components/cohorts/members-list.tsx`
  - Table with: Avatar, AI Agent name, Role, Status, Engagement Score, Action
    menu
  - Status indicators: Optimal (green), Active (blue), Syncing (amber), Idle
    (gray)
  - Engagement score: colored progress bar
  - Action menu: View Profile, Remove from Cohort
  - Search/filter members
  - Test: Component tests

- [ ] **COH-F6: Create/Edit Cohort Modal**
  - File: `apps/web/src/components/cohorts/cohort-modal.tsx`
  - Form fields: Name, Description, Start Date, End Date, Status
  - Validation (required fields, date logic)
  - Save button → POST/PATCH API
  - Cancel button
  - Loading/error states
  - Test: Form validation tests + E2E

---

### EPIC 3: Agent Profiles (NEW FEATURE)

**Mockup:** `04-agent-profile-linear-dark.png`

#### Backend Tasks (Devi)

- [ ] **AGENT-B1: Enhance Agent Queries**
  - File: `apps/web/src/server/db/queries/agents.ts` (create if doesn't exist)
  - `getAgentById(id)` - full agent profile
  - `getAgentStats(id)` - tasks completed, success rate, avg response time
  - `getAgentActivityHistory(id, limit)` - activity timeline
  - `getAgentActiveMissions(id)` - current active missions
  - Spec: Document in `docs/specs/agents-data-contract.md`
  - Test: Unit tests

- [ ] **AGENT-B2: Agent API Routes**
  - File: `apps/web/src/app/api/agents/[id]/route.ts`
  - GET `/api/agents/:id` - get agent profile
  - PATCH `/api/agents/:id` - update agent (name, avatar, settings)
  - Add authorization check (only org members can view)
  - Test: API tests

#### Frontend Tasks (Sami)

- [ ] **AGENT-F1: Agent Profile Page**
  - File: `apps/web/src/app/(dashboard)/agents/[id]/page.tsx`
  - Match mockup: dark background, avatar with glow, status indicator
  - Profile header: Name, specialty badge, skills/tags
  - Stats grid: Tasks Completed, Success Rate, Avg Response Time
  - Activity History timeline
  - Active Missions list (with status, progress)
  - "Assign Mission" button, "Edit Profile" button
  - Test: E2E test

- [ ] **AGENT-F2: Activity History Component**
  - File: `apps/web/src/components/agents/activity-history.tsx`
  - Timeline layout with dates
  - Activity items: icon, timestamp, description, related entity link
  - Filter by activity type
  - Test: Component tests

- [ ] **AGENT-F3: Active Missions Widget**
  - File: `apps/web/src/components/agents/active-missions.tsx`
  - List of current missions with progress bars
  - Click → navigate to mission detail
  - Empty state if no active missions
  - Test: Component tests

---

### EPIC 4: Campaign Builder (DEFERRED TO SPRINT 2)

**Mockup:** `05-campaign-builder-linear-dark.png` **Reason:** Complex workflow
builder - needs dedicated focus after core CRUD is stable

_Tasks to be defined in Sprint 2 planning_

---

### EPIC 5: Auth Screen Styling Update

**Mockup:** `06-auth-login-linear-dark.png`

#### Frontend Tasks (Sami)

- [ ] **AUTH-F1: Update Login Page Styling**
  - File: `apps/web/src/app/sign-in/page.tsx`
  - Match mockup: centered card, blue-violet gradient glow
  - Logo at top
  - Email/password inputs with Linear styling
  - "Forgot password?" link
  - "Sign in" button (white on primary)
  - Social auth buttons (GitHub, Google) with icons
  - "Don't have an account? Sign up" link at bottom
  - Test: Visual regression test

- [ ] **AUTH-F2: Update Sign Up Page**
  - File: `apps/web/src/app/sign-up/page.tsx`
  - Match login styling
  - Add fields: Display Name, Email, Password, Confirm Password
  - Test: E2E signup flow

---

## 🎨 Design System Tasks

#### Shared (Devi or Sami)

- [ ] **DS-1: Create Shared UI Components**
  - File: `packages/ui/components/status-badge.tsx` - reusable status pills
  - File: `packages/ui/components/stat-card.tsx` - KPI card component
  - File: `packages/ui/components/data-table.tsx` - generic table with
    sorting/filtering
  - File: `packages/ui/components/empty-state.tsx` - empty state pattern
  - All components use design tokens
  - Storybook stories for each
  - Test: Component tests

- [ ] **DS-2: Update Tailwind Config**
  - File: `tailwind.config.ts`
  - Verify all colors from DESIGN_SPECIFICATIONS.md are in config
  - Add utility classes for common patterns (card shadows, glows)
  - Document in `packages/ui/README.md`

---

## 📚 Documentation Tasks

#### Shared (Both)

- [ ] **DOC-1: API Documentation**
  - Complete OpenAPI schemas for all endpoints
  - Add examples and error codes
  - Generate docs with Swagger UI

- [ ] **DOC-2: Component Documentation**
  - Add JSDoc comments to all components
  - Document props, usage examples
  - Storybook docs mode

- [ ] **DOC-3: Data Model Documentation**
  - Entity relationship diagram for cohorts
  - Data flow diagrams
  - Add to `docs/architecture/`

---

## 🧪 Testing Strategy

- **Unit Tests:** Jest + React Testing Library for components
- **Integration Tests:** Vitest for API routes + database queries
- **E2E Tests:** Playwright for critical user flows
- **Coverage Target:** 80% for business logic, 60% for UI components

---

## ✅ Definition of Done

For each task:

1. ✅ Code follows Axon Codex (spec before code)
2. ✅ Tests written and passing (unit + integration where applicable)
3. ✅ Design matches mockup exactly (for frontend tasks)
4. ✅ TypeScript: no `any` types, strict mode
5. ✅ Accessibility: WCAG 2.2 AA compliance
6. ✅ Code reviewed (peer review or AI review)
7. ✅ Documentation updated
8. ✅ Learning captured in agent memory

---

## 📊 Sprint Metrics

- **Total Tasks:** 40+
- **Backend Tasks (Devi):** 10
- **Frontend Tasks (Sami):** 20
- **Shared Tasks:** 5
- **Documentation:** 3
- **Design System:** 2

**Estimated Effort:** 2-3 weeks for core features (Mission Control + Cohorts)

---

## 🚀 Sprint Execution Rules

1. **Specs before code** - Every task starts with a spec document
2. **Tests required** - No PR merges without tests
3. **Agent evolution** - Store learnings after each task
4. **Execution never stops** - Only ping Ahmad when he's the bottleneck
5. **Discord updates** - Post progress daily to #general
6. **Atomic commits** - Small, focused commits with clear messages
7. **Branch naming:** `feature/COH-F1-cohorts-grid`, `fix/MC-B2-api-caching`

---

## 📝 Notes

- **Terminology:** Database uses `projects` (Missions), `tasks` (Actions),
  `agents` (Agents)
- **Goals vs Cohorts:** Ahmad mentioned "Goals CRUD" in priority, but mockups
  show Cohorts. Need clarification - assuming Cohorts for now.
- **Campaign Builder:** Complex feature - deferred to Sprint 2 to ensure quality
- **Existing Code:** Dashboard partially implemented, auth working,
  infrastructure solid

---

**Ready to start? Assign tasks to specialists and GO! 🚀**
