# Cohortix QA Audit Plan
**Created:** 2026-02-14  
**Status:** Draft  
**Purpose:** Comprehensive audit to ensure all pages display real DB data, not hardcoded/dummy data

---

## 🔍 Initial Investigation Findings

### Operations Page (`/operations`)
**Status:** ✅ Properly wired to real data  
**Implementation:**
- Uses `useOperations` hook → calls `/api/v1/operations`
- API fetches from `projects` table (Supabase)
- Supports both Kanban and List views
- Components: `OperationsTableClient`, `KanbanBoard`

**Potential Issues:**
- ⚠️ Database may be empty (no operations exist)
- ⚠️ RLS policies may be blocking data access
- ⚠️ Organization membership may not be set up correctly

---

### Tasks Page (`/tasks`)
**Status:** ✅ Properly wired to real data  
**Implementation:**
- Server-side: Uses `getOperations()` from `server/db/queries/operations.ts`
- Fetches from `projects` table (same as Operations)
- Passes data to `KanbanView` component
- Component: `KanbanView` → `KanbanBoard`

**Potential Issues:**
- ⚠️ Database may be empty (no tasks/operations exist)
- ⚠️ RLS policies may be blocking data access

---

### Root Cause Hypothesis

Ahmad reports "dummy/hardcoded data" but code review shows **all APIs are properly wired**. Most likely causes:

1. **Empty Database** - No seed data, components showing empty states
2. **RLS Policy Issues** - User can't access data due to Row-Level Security
3. **Auth Context Issues** - `BYPASS_AUTH=true` may not be working correctly
4. **Data Not Created Yet** - No operations/tasks have been created via UI

---

## 📋 Complete Application Audit Checklist

### Legend
- **Priority:**
  - **P0** = Blocks all testing (auth, data access)
  - **P1** = Core functionality (main pages, CRUD operations)
  - **P2** = Enhanced functionality (analytics, insights)
- **Status:**
  - 🔴 Broken / Shows Dummy Data
  - 🟡 Needs Verification
  - 🟢 Verified Working
  - ⚪ Not Yet Tested

---

## 🔐 Authentication & Setup (P0)

| Page/Feature | Route | API Endpoint | Expected Data | Status | Owner | Notes |
|-------------|-------|--------------|---------------|--------|-------|-------|
| Sign In | `/sign-in` | Supabase Auth | Redirect to dashboard on success | ⚪ | John | BYPASS_AUTH should skip |
| Sign Up | `/sign-up` | Supabase Auth | Create user + profile | ⚪ | John | BYPASS_AUTH should skip |
| Forgot Password | `/forgot-password` | Supabase Auth | Send reset email | ⚪ | John | BYPASS_AUTH should skip |
| Auth Bypass | All routes | `getAuthContext()` | Mock user when BYPASS_AUTH=true | 🟡 | John | **CRITICAL**: Verify this works |
| Organization Setup | Auto-created | DB: `organizations`, `organization_memberships` | User has org_id | 🟡 | John | **CRITICAL**: Needed for RLS |

**Pass Criteria:**
- ✅ Can access all dashboard routes without login when `BYPASS_AUTH=true`
- ✅ `getAuthContext()` returns mock organization_id
- ✅ All API calls include organization_id in queries

**Fail Criteria:**
- ❌ Redirects to sign-in page
- ❌ API calls return 401 Unauthorized
- ❌ RLS blocks data access

**Specialist Assignment:**
- **John (backend-developer)**: Fix auth bypass, RLS policies, seed organization data
- **Nina (qa-engineer)**: Verify after John's fixes

---

## 🏠 Dashboard (P1)

| Widget/Section | API Endpoint | Expected Data | Status | Owner | Notes |
|---------------|--------------|---------------|--------|-------|-------|
| KPI Cards | `/api/v1/dashboard/mission-control` | Active cohorts, total allies, avg engagement, at-risk | 🟡 | Devi | Check if returns 0 or actual data |
| Quick Stats | Server query: `getDashboardKPIs()` | Active missions, allies, cohorts counts | 🟡 | Devi | May show 0 if DB empty |
| Recent Activity | Server query: `getRecentActivity()` | From `audit_logs` table | 🟡 | Devi | Empty if no actions logged |
| Urgent Alerts | Server query: `getActiveAlerts()` | Unassigned/overdue/blocked tasks | 🟡 | Devi | Empty if no tasks exist |
| Active Missions Preview | Server query: `getActiveMissions()` | From `missions` table with stats | 🟡 | Devi | Empty if no missions exist |
| Global Intel Feed | Component: `GlobalIntelFeed` | TBD - check implementation | 🟡 | Lubna | Verify data source |

**Pass Criteria:**
- ✅ KPIs show real counts (even if 0)
- ✅ Activity feed shows DB records or "No activity yet"
- ✅ Alerts show DB records or "No alerts"
- ✅ No hardcoded placeholder text like "Example Mission"

**Fail Criteria:**
- ❌ Shows sample data that doesn't match DB
- ❌ API errors in console
- ❌ Infinite loading states

**Specialist Assignment:**
- **Devi (ai-developer)**: Verify all dashboard APIs return real data, add error handling
- **John (backend-developer)**: Create seed data script for testing
- **Lubna (ui-designer)**: Improve empty states UX
- **Nina (qa-engineer)**: Final verification + test with seeded data

---

## 👥 Cohorts (P1)

| Page/Feature | Route | API Endpoint | Expected Data | Status | Owner | Notes |
|-------------|-------|--------------|---------------|--------|-------|-------|
| Cohorts List | `/cohorts` | `/api/v1/cohorts` | List of cohorts with member count, engagement | 🟢 | N/A | **CONFIRMED WORKING** |
| Cohort Detail | `/cohorts/[id]` | `/api/cohorts/[id]` | Single cohort with stats | 🟢 | N/A | **CONFIRMED WORKING** |
| Cohort Members | `/cohorts/[id]` | `/api/cohorts/[id]/members` | Agent members list | 🟢 | N/A | **CONFIRMED WORKING** |
| Cohort Timeline | `/cohorts/[id]` | `/api/cohorts/[id]/timeline` | Interaction timeline chart | 🟢 | N/A | **CONFIRMED WORKING** |
| Cohort Activity | `/cohorts/[id]` | `/api/cohorts/[id]/activity` | Activity feed | 🟢 | N/A | **CONFIRMED WORKING** |
| Create Cohort | Modal | `POST /api/v1/cohorts` | Creates new cohort | 🟡 | Nina | Test CRUD operations |
| Edit Cohort | Modal | `PATCH /api/v1/cohorts/[id]` | Updates cohort | 🟡 | Nina | Test CRUD operations |
| Delete Cohort | Action | `DELETE /api/v1/cohorts/[id]` | Deletes cohort | 🟡 | Nina | Test CRUD operations |

**Pass Criteria:**
- ✅ List shows real cohorts from DB
- ✅ Detail page shows correct stats
- ✅ Create/Edit/Delete work without errors

**Specialist Assignment:**
- **Nina (qa-engineer)**: Test full CRUD flow, verify data consistency

---

## 🤖 Allies (P1)

| Page/Feature | Route | API Endpoint | Expected Data | Status | Owner | Notes |
|-------------|-------|--------------|---------------|--------|-------|-------|
| Allies List | `/allies` | `/api/v1/allies` | List of agents with stats | 🟡 | Devi | Verify API returns real data |
| Ally Detail | `/allies/[id]` | `/api/v1/allies/[id]` | Single agent details | 🟡 | Devi | Check detail page implementation |
| Ally Status | List + Detail | From `agents` table | active/idle/busy/offline | 🟡 | Devi | Status should be real-time |
| Ally Stats | List + Detail | `total_tasks_completed`, `total_time_worked_ms` | Real stats | 🟡 | Devi | Check if incremented properly |
| Ally Capabilities | Detail | `capabilities` array | Real capabilities list | 🟡 | Lubna | Verify UI rendering |
| Create Ally | Modal | `POST /api/v1/allies` | Creates new agent | 🟡 | Nina | Test CRUD operations |
| Edit Ally | Modal | `PATCH /api/v1/allies/[id]` | Updates agent | 🟡 | Nina | Test CRUD operations |
| Delete Ally | Action | `DELETE /api/v1/allies/[id]` | Deletes agent | 🟡 | Nina | Test CRUD operations |

**Pass Criteria:**
- ✅ List shows real agents from `agents` table
- ✅ Stats show real numbers (even if 0)
- ✅ Status reflects actual agent state
- ✅ No placeholder text like "Sample Agent"

**Fail Criteria:**
- ❌ Shows hardcoded dummy agents
- ❌ Stats always show same numbers
- ❌ API errors in console

**Specialist Assignment:**
- **Devi (ai-developer)**: Verify API data flow, add logging
- **Lubna (ui-designer)**: Verify UI components render real data correctly
- **Nina (qa-engineer)**: Test CRUD operations + verify data consistency

---

## 🎯 Missions (P1)

| Page/Feature | Route | API Endpoint | Expected Data | Status | Owner | Notes |
|-------------|-------|--------------|---------------|--------|-------|-------|
| Missions List | `/missions` | `/api/v1/missions` | List of missions with progress | 🟡 | Devi | Verify API returns real data |
| Mission Detail | `/missions/[id]` | `/api/v1/missions/[id]` | Single mission with operations | 🟡 | Devi | Check detail page implementation |
| Mission Progress | List + Detail | Calculated from operations | % complete based on linked ops | 🟡 | Devi | Verify calculation logic |
| Linked Operations | Detail | From `projects` table | Operations where `goal_id = mission.id` | 🟡 | Devi | Check foreign key join |
| Create Mission | Modal | `POST /api/v1/missions` | Creates new mission | 🟡 | Nina | Test CRUD operations |
| Edit Mission | Modal | `PATCH /api/v1/missions/[id]` | Updates mission | 🟡 | Nina | Test CRUD operations |
| Delete Mission | Action | `DELETE /api/v1/missions/[id]` | Deletes mission | 🟡 | Nina | Test CRUD operations |

**Pass Criteria:**
- ✅ List shows real missions from `missions` table
- ✅ Progress calculated correctly from linked operations
- ✅ Detail page shows linked operations
- ✅ CRUD operations work correctly

**Fail Criteria:**
- ❌ Shows hardcoded sample missions
- ❌ Progress always 0% or hardcoded value
- ❌ Linked operations don't load

**Specialist Assignment:**
- **Devi (ai-developer)**: Verify mission-operation linking, progress calculation
- **John (backend-developer)**: Check DB schema, foreign keys, RLS policies
- **Nina (qa-engineer)**: Test full CRUD + linking flow

---

## 📊 Operations (P1) - **REPORTED ISSUE**

| Page/Feature | Route | API Endpoint | Expected Data | Status | Owner | Notes |
|-------------|-------|--------------|---------------|--------|-------|-------|
| Operations Kanban | `/operations` | `/api/v1/operations` | Operations grouped by status | 🟡 | Devi | **Ahmad reported dummy data** |
| Operations List | `/operations` | `/api/v1/operations` | Table view of operations | 🟡 | Devi | **Ahmad reported dummy data** |
| Operation Detail | `/operations/[id]` | `/api/v1/operations/[id]` | Single operation with tasks | 🟡 | Devi | Check detail page implementation |
| Linked Mission | List + Detail | FK: `goal_id` in `projects` table | Mission name/color | 🟡 | Devi | Verify FK join works |
| Owner (Ally) | List + Detail | FK: `owner_id` in `projects` table | Ally name | 🟡 | Devi | Verify FK join works |
| Task Stats | List + Detail | Count from `tasks` table | Total/completed/in-progress | 🟡 | Devi | Check aggregation query |
| Create Operation | Modal | `POST /api/v1/operations` | Creates new operation | 🟡 | Nina | Test CRUD operations |
| Edit Operation | Modal/Detail | `PATCH /api/v1/operations/[id]` | Updates operation | 🟡 | Nina | Test CRUD operations |
| Drag & Drop Status | Kanban | `PATCH /api/v1/operations/[id]` | Updates status on drop | 🟡 | Lubna | Test interaction |
| Delete Operation | Action | `DELETE /api/v1/operations/[id]` | Deletes operation | 🟡 | Nina | Test CRUD operations |

**INVESTIGATION FINDINGS:**
- ✅ Code review confirms APIs are properly wired (no hardcoded data)
- ✅ `/api/v1/operations` fetches from `projects` table
- ✅ `useOperations` hook correctly calls API
- ⚠️ **Hypothesis:** Database is empty OR RLS is blocking access

**Diagnostic Steps:**
1. Check browser console for API errors
2. Check API response: `curl http://localhost:3000/api/v1/operations`
3. Check database directly: `SELECT * FROM projects WHERE organization_id = '<org_id>'`
4. Check RLS policies on `projects` table
5. Verify `BYPASS_AUTH=true` creates mock organization

**Pass Criteria:**
- ✅ Operations list shows real data from `projects` table
- ✅ Kanban columns populated with real operations
- ✅ Can create, edit, delete operations
- ✅ Status changes persist to DB
- ✅ Linked mission and owner display correctly

**Fail Criteria:**
- ❌ Empty or hardcoded data
- ❌ API returns empty array when data exists in DB
- ❌ CRUD operations fail silently
- ❌ Changes don't persist

**Specialist Assignment:**
- **Devi (ai-developer)**: 
  - Add detailed logging to `/api/v1/operations` route
  - Verify organization_id is being passed correctly
  - Check FK joins for mission/owner names
- **John (backend-developer)**: 
  - Verify RLS policies on `projects` table
  - Create seed data script
  - Fix auth bypass if broken
- **Lubna (ui-designer)**:
  - Verify empty states show helpful messaging
  - Test drag-and-drop functionality
- **Nina (qa-engineer)**: 
  - Final verification after fixes
  - Test full CRUD + interaction flow

---

## ✅ Tasks/Kanban (P1) - **REPORTED ISSUE**

| Page/Feature | Route | API Endpoint | Expected Data | Status | Owner | Notes |
|-------------|-------|--------------|---------------|--------|-------|-------|
| Tasks Kanban | `/tasks` | Server query: `getOperations()` | Operations grouped by status | 🟡 | Devi | **Ahmad reported dummy data** |
| Drag & Drop | `/tasks` | `PATCH /api/v1/operations/[id]` | Updates status on drop | 🟡 | Lubna | Test interaction |
| Task Detail Sheet | Side panel | `/api/v1/operations/[id]` | Full operation details | 🟡 | Lubna | Check detail sheet |
| Group By Status | Toggle | Client-side grouping | Columns: Planning/Active/On Hold/Completed | 🟡 | Lubna | Test grouping |
| Group By Mission | Toggle | Client-side grouping | Columns: Mission names + Unassigned | 🟡 | Lubna | Test grouping |
| Group By Ally | Toggle | Client-side grouping | Columns: Ally names | 🟡 | Lubna | Test grouping |

**INVESTIGATION FINDINGS:**
- ✅ `/tasks` uses server-side `getOperations()` query
- ✅ `getOperations()` fetches from `projects` table with task counts
- ✅ No hardcoded data in `KanbanView` or `KanbanBoard`
- ⚠️ **Same root cause as Operations page**

**Diagnostic Steps:**
1. Check server logs for query errors
2. Verify `getOperations()` includes proper organization filter
3. Check if RLS allows access to `projects` table

**Pass Criteria:**
- ✅ Tasks kanban shows real operations from DB
- ✅ Grouping by Status/Mission/Ally works correctly
- ✅ Drag and drop updates DB
- ✅ Detail sheet shows correct data

**Specialist Assignment:**
- **Devi (ai-developer)**: 
  - Add logging to `getOperations()` server query
  - Verify data transformation pipeline
- **John (backend-developer)**: 
  - Same as Operations (RLS, seed data, auth)
- **Lubna (ui-designer)**:
  - Test all grouping modes
  - Verify drag-and-drop UX
- **Nina (qa-engineer)**: 
  - Final verification after fixes

---

## 🔬 Diagnostic Testing Protocol (P0)

**Run these tests FIRST before fixing individual pages:**

### Test 1: Auth Bypass Verification
```bash
# Check if BYPASS_AUTH is set
echo $BYPASS_AUTH

# Expected: true

# Check getAuthContext behavior
# Add logging to /lib/auth-helper.ts getAuthContext()
# Should return mock user + organization_id when BYPASS_AUTH=true
```

**Owner:** John (backend-developer)  
**Pass:** Mock user with valid organization_id  
**Fail:** Returns null or no organization_id

---

### Test 2: Database Connectivity
```bash
# Test DB connection
curl http://localhost:3000/api/health

# Test direct query
curl http://localhost:3000/api/test-db

# Expected: Success responses
```

**Owner:** John (backend-developer)  
**Pass:** Both endpoints return success  
**Fail:** Errors or timeouts

---

### Test 3: RLS Policy Verification
```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('projects', 'missions', 'agents', 'cohorts', 'tasks');

-- Check policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('projects', 'missions', 'agents', 'cohorts', 'tasks');

-- Test query WITH organization filter
SELECT * FROM projects WHERE organization_id = '<test_org_id>';
```

**Owner:** John (backend-developer)  
**Pass:** Tables have RLS + policies, queries return data  
**Fail:** No policies OR policies block all access

---

### Test 4: Seed Data Creation
```bash
# Create test data script
cd ~/Projects/cohortix
# Run seed script (to be created)
pnpm db:seed

# Verify data exists
curl http://localhost:3000/api/v1/cohorts
curl http://localhost:3000/api/v1/allies
curl http://localhost:3000/api/v1/missions
curl http://localhost:3000/api/v1/operations

# Expected: All return non-empty arrays
```

**Owner:** John (backend-developer)  
**Pass:** All endpoints return data  
**Fail:** Empty arrays or errors

---

### Test 5: API Response Verification
```bash
# Test each API endpoint
curl -v http://localhost:3000/api/v1/operations

# Check response:
# - Status 200 OK
# - JSON with { data: [], meta: {...} }
# - data array has items (if seeded)
# - No errors in response

# Check browser console:
# - No 401 Unauthorized
# - No CORS errors
# - No network errors
```

**Owner:** Devi (ai-developer)  
**Pass:** All APIs return 200 + expected structure  
**Fail:** 401, 500, or malformed responses

---

## 🛠️ Fix Priority Order

### Phase 1: Foundation (P0) - **DO FIRST**
**Owner:** John (backend-developer)

1. ✅ Verify `BYPASS_AUTH=true` works correctly
2. ✅ Fix `getAuthContext()` to return mock organization_id
3. ✅ Verify RLS policies allow access with mock organization
4. ✅ Create seed data script with sample data:
   - 1 organization
   - 3-5 cohorts
   - 5-10 allies (agents)
   - 3-5 missions
   - 10-15 operations (projects)
   - 20-30 tasks
5. ✅ Run seed script and verify data in DB

**Deliverable:** All diagnostic tests pass

---

### Phase 2: Data Layer (P1) - **THEN**
**Owner:** Devi (ai-developer)

1. ✅ Add detailed logging to all API routes
2. ✅ Verify all queries include `organization_id` filter
3. ✅ Test all CRUD endpoints with Postman/curl
4. ✅ Fix any broken foreign key joins (mission names, owner names)
5. ✅ Verify aggregations (task counts, progress %) calculate correctly

**Deliverable:** All APIs return real data + proper error handling

---

### Phase 3: UI Components (P1) - **THEN**
**Owner:** Lubna (ui-designer)

1. ✅ Verify all list/table components render real data
2. ✅ Test empty states show helpful messages
3. ✅ Test loading states don't hang indefinitely
4. ✅ Test error states display properly
5. ✅ Verify drag-and-drop interactions work
6. ✅ Test all modal forms (create/edit)

**Deliverable:** UI displays data correctly, no broken interactions

---

### Phase 4: Full System QA (P1) - **FINALLY**
**Owner:** Nina (qa-engineer)

1. ✅ Test complete CRUD flow for each entity type
2. ✅ Verify data consistency across related pages
3. ✅ Test all navigation flows
4. ✅ Verify all filters/search work
5. ✅ Test all sorting/grouping options
6. ✅ Load test with realistic data volumes
7. ✅ Verify no console errors/warnings
8. ✅ Create regression test checklist

**Deliverable:** Full QA sign-off, production-ready

---

## 📊 Progress Tracking

### Overall Status Dashboard

| Category | Total Items | ✅ Verified | 🟡 In Progress | 🔴 Broken | ⚪ Not Tested |
|----------|-------------|------------|----------------|-----------|--------------|
| Auth & Setup (P0) | 5 | 0 | 2 | 0 | 3 |
| Dashboard (P1) | 6 | 0 | 6 | 0 | 0 |
| Cohorts (P1) | 8 | 5 | 3 | 0 | 0 |
| Allies (P1) | 8 | 0 | 8 | 0 | 0 |
| Missions (P1) | 7 | 0 | 7 | 0 | 0 |
| Operations (P1) | 10 | 0 | 10 | 0 | 0 |
| Tasks (P1) | 6 | 0 | 6 | 0 | 0 |
| **TOTAL** | **50** | **5** | **42** | **0** | **3** |

**Health:** 🟡 **10% Complete** (5/50 verified)

---

## 🚨 Blocker Status

### Critical Blockers (P0)
1. 🔴 **Auth Bypass Not Working** - Blocks all testing
   - **Status:** Not Yet Verified
   - **Owner:** John (backend-developer)
   - **ETA:** TBD

2. 🔴 **No Seed Data** - Can't verify UI without data
   - **Status:** Not Yet Created
   - **Owner:** John (backend-developer)
   - **ETA:** TBD

3. 🔴 **RLS Policies Unknown** - May block all data access
   - **Status:** Not Yet Verified
   - **Owner:** John (backend-developer)
   - **ETA:** TBD

---

## 📝 Testing Checklist

### For Each Page/Feature:

```markdown
## [Page Name] - [Date]

**Tester:** [Name]  
**Environment:** Dev (localhost:3000)  
**BYPASS_AUTH:** true

### Pre-Checks
- [ ] Page loads without errors
- [ ] No console errors
- [ ] No infinite loading states

### Data Verification
- [ ] API returns 200 OK
- [ ] Response has expected structure
- [ ] Data matches database
- [ ] No hardcoded dummy data

### UI Verification
- [ ] Components render correctly
- [ ] Empty states show helpful messages
- [ ] Loading states work
- [ ] Error states display properly

### Functionality
- [ ] All filters work
- [ ] Sorting works
- [ ] Search works
- [ ] Create/Edit/Delete work (if applicable)
- [ ] Navigation works
- [ ] Interactions persist to DB

### Cross-Browser (if applicable)
- [ ] Chrome
- [ ] Firefox
- [ ] Safari

### Issues Found
[List any issues discovered]

### Sign-Off
- [ ] **PASS** - Ready for production
- [ ] **FAIL** - Needs fixes (see issues)
```

---

## 📞 Communication Protocol

### Daily Standup Format (during QA sprint)
1. **What I tested yesterday**
2. **What I'm testing today**
3. **Blockers**
4. **Issues found**

### Issue Reporting Template
```markdown
## Issue: [Brief Description]

**Page/Feature:** [Which page/feature]  
**Priority:** P0/P1/P2  
**Status:** 🔴 Broken  
**Reporter:** [Name]  
**Date:** YYYY-MM-DD

### Steps to Reproduce
1. Step 1
2. Step 2
3. ...

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots/Logs
[Attach if applicable]

### Environment
- URL: http://localhost:3000/...
- BYPASS_AUTH: true
- Browser: Chrome 1xx
- Console Errors: [Any errors]

### Assigned To
[Specialist name + role]

### Fix Notes
[To be filled by developer]
```

---

## 🎯 Success Criteria

### Phase 1 Complete (P0)
- ✅ All diagnostic tests pass
- ✅ Seed data script created and working
- ✅ Auth bypass verified
- ✅ RLS policies verified
- ✅ All APIs return data

### Phase 2 Complete (P1)
- ✅ All 50 checklist items verified
- ✅ No hardcoded dummy data anywhere
- ✅ All CRUD operations work
- ✅ No console errors
- ✅ Data consistency across pages

### Production Ready
- ✅ Full QA sign-off from Nina
- ✅ Performance tested (load times < 3s)
- ✅ No known critical bugs
- ✅ Regression test suite created
- ✅ Ahmad approves

---

## 📚 Reference Links

### Key Files for Investigation
```
Apps & Pages:
- apps/web/src/app/(dashboard)/page.tsx (Dashboard)
- apps/web/src/app/(dashboard)/operations/page.tsx
- apps/web/src/app/(dashboard)/tasks/page.tsx
- apps/web/src/app/(dashboard)/allies/page.tsx
- apps/web/src/app/(dashboard)/missions/page.tsx
- apps/web/src/app/(dashboard)/cohorts/page.tsx

API Routes:
- apps/web/src/app/api/v1/operations/route.ts
- apps/web/src/app/api/v1/allies/route.ts
- apps/web/src/app/api/v1/missions/route.ts
- apps/web/src/app/api/v1/cohorts/route.ts
- apps/web/src/app/api/v1/dashboard/mission-control/route.ts

Server Queries:
- apps/web/src/server/db/queries/operations.ts
- apps/web/src/server/db/queries/dashboard.ts

Hooks:
- apps/web/src/hooks/use-operations.ts
- apps/web/src/hooks/use-allies.ts
- apps/web/src/hooks/use-missions.ts
- apps/web/src/hooks/use-cohorts.ts
- apps/web/src/hooks/use-dashboard.ts

API Client:
- apps/web/src/lib/api/client.ts

Auth:
- apps/web/src/lib/auth-helper.ts

Components:
- apps/web/src/components/kanban/kanban-board.tsx
- apps/web/src/components/operations/operations-table-client.tsx
- apps/web/src/components/dashboard/kpi-cards-client.tsx
```

---

## 🔄 Next Actions

**Immediate (Today):**
1. **John**: Run diagnostic tests 1-4
2. **Devi**: Run diagnostic test 5 + add logging
3. **Ahmad**: Confirm this plan covers everything

**This Week:**
1. **John**: Complete Phase 1 (Foundation)
2. **Devi**: Complete Phase 2 (Data Layer)
3. **Lubna**: Begin Phase 3 (UI Components)

**Next Week:**
1. **Nina**: Complete Phase 4 (Full QA)
2. **All**: Bug fixing + iteration
3. **Ahmad**: Final sign-off

---

**Plan Created By:** August (Project Manager)  
**Last Updated:** 2026-02-14  
**Status:** Ready for Review → Ahmad Approval
