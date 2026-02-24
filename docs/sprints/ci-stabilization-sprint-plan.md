# CI Stabilization Sprint — Cohortix

**Sprint Goal:** Fix all CI pipeline failures on `main` and `dev` branches to
enable safe continuation of feature work.

**Success Criteria:** All 17 CI checks pass on both `main` and `dev` branches.

**Branch Strategy:**

- Work branch: `fix/ci-pipeline-failures` (branch from `dev`)
- **OFF LIMITS:** `feature/operations-redesign` (do not touch)

**Sprint Duration:** 3-5 days (estimated)

---

## 📊 Current State

| Category            | Status         | Count                               |
| ------------------- | -------------- | ----------------------------------- |
| Type Errors         | 🔴 Failing     | 1,863 total                         |
| Tests               | 🔴 Failing     | 14 failing / 23 total (190 passing) |
| Lint                | 🟡 Minor       | 5 errors                            |
| **Total CI Checks** | **🔴 Failing** | **17 checks**                       |

---

## 🎯 Workstreams

### 1. Type Errors (1,863 total)

- **TS17004:** 1,334 errors (72%) — likely tsconfig issue
- **TS2307:** 285 errors — missing module imports
- **TS2339:** 63 errors — property doesn't exist on type
- **TS7006:** 50 errors — implicit any
- **TS18048:** 32 errors — possibly undefined
- **Other:** ~99 errors

**Hot zones:**

- `apps/web/src/app` — 413 errors
- `components/cohorts` — 228 errors
- `components/dashboard` — 202 errors
- `components/ui` — 166 errors
- `components/operations` — 162 errors
- `components/kanban` — 151 errors

### 2. Failing Tests (14 total)

- **E2E (4):** auth, dashboard, cohort-detail, mission-creation
- **Integration (4):** API patterns, cohorts API, database, supabase
- **Component (4):** status-chip, activity-log, batch-members, cohorts-table
- **Unit (2):** logger, supabase client

### 3. Lint Errors (5 total)

- Trivial fixes

---

## 📋 Sprint Tasks

### **Phase 1: Root Cause Investigation (Day 1 — 4 hours)**

#### Task 1.1: Investigate TS17004 Root Cause

**Owner:** Devi  
**Priority:** P0 (CRITICAL — blocks 72% of type errors)  
**Time Estimate:** 2 hours  
**Dependencies:** None

**Objective:** Determine if TS17004 (1,334 errors) is a tsconfig
misconfiguration.

**Steps:**

1. Check `tsconfig.json` and `tsconfig.app.json` for incorrect module resolution
   settings
2. Verify `paths` mapping in tsconfig matches actual project structure
3. Check if `moduleResolution` is set correctly (likely needs `bundler` or
   `node16`)
4. Verify `baseUrl` and `rootDir` settings
5. Check for conflicting tsconfig files in subdirectories

**Files to check:**

- `tsconfig.json`
- `apps/web/tsconfig.json`
- `apps/web/tsconfig.app.json`
- Any nested tsconfig files

**Acceptance Criteria:**

- Root cause identified
- Fix approach documented (config change vs code changes)
- If config fix: estimate % of errors that will auto-resolve
- Document findings in task comment

---

#### Task 1.2: Audit Test Failures

**Owner:** Nina  
**Priority:** P1 (HIGH)  
**Time Estimate:** 2 hours  
**Dependencies:** None

**Objective:** Categorize test failures by root cause.

**Steps:**

1. Run test suite locally and capture full error output
2. Group failures by type:
   - Environment issues (setup/teardown)
   - Type errors breaking tests
   - Actual logic failures
   - Flaky tests
3. Identify dependencies on Phase 2 type fixes
4. Document findings

**Tests to analyze:**

- E2E: `auth.spec.ts`, `dashboard.spec.ts`, `cohort-detail.spec.ts`,
  `mission-creation.spec.ts`
- Integration: API patterns, cohorts API, database, supabase tests
- Component: status-chip, activity-log, batch-members, cohorts-table
- Unit: logger, supabase client

**Acceptance Criteria:**

- All 14 test failures categorized
- Dependencies on type fixes identified
- Test fix plan documented

---

### **Phase 2: Type Error Resolution (Day 1-3 — 16-20 hours)**

#### Task 2.1: Fix TS17004 (tsconfig or systematic fix)

**Owner:** Devi  
**Priority:** P0 (CRITICAL)  
**Time Estimate:** 2-4 hours (if config) OR 8-12 hours (if code changes)  
**Dependencies:** Task 1.1 (investigation)

**Objective:** Resolve 1,334 TS17004 errors.

**If config fix:**

1. Update tsconfig module resolution settings
2. Run `tsc --noEmit` to verify error count drops
3. Commit fix
4. Re-count remaining type errors

**If code changes needed:**

1. Identify pattern in TS17004 errors
2. Create systematic fix approach
3. Apply fixes directory-by-directory (prioritize hot zones)
4. Verify with `tsc --noEmit` after each batch

**Hot zones (priority order):**

1. `apps/web/src/app` (413 errors)
2. `components/cohorts` (228 errors)
3. `components/dashboard` (202 errors)
4. `components/operations` (162 errors)
5. `components/ui` (166 errors)
6. `components/kanban` (151 errors)

**Acceptance Criteria:**

- TS17004 error count reduced to 0
- All changes committed to `fix/ci-pipeline-failures`
- Remaining type error count documented

**Expected Outcome:** ~1,334 errors resolved → ~529 errors remaining

---

#### Task 2.2: Fix TS2307 (Missing Module Imports)

**Owner:** Devi  
**Priority:** P1 (HIGH)  
**Time Estimate:** 4-6 hours  
**Dependencies:** Task 2.1 (may reveal actual missing imports)

**Objective:** Resolve 285 missing module import errors.

**Steps:**

1. Run `tsc --noEmit | grep TS2307` to get full list
2. Categorize by missing module type:
   - Incorrect import paths
   - Missing `@/` path aliases
   - Missing type dependencies
   - actually missing modules (need install)
3. Fix systematically:
   - Update import paths
   - Add missing dependencies to package.json
   - Fix path alias mismatches
4. Verify after each batch

**Acceptance Criteria:**

- TS2307 error count reduced to 0
- All necessary dependencies added to package.json
- Import paths corrected

**Expected Outcome:** ~285 errors resolved → ~244 errors remaining

---

#### Task 2.3: Fix TS2339 (Property Doesn't Exist)

**Owner:** Devi (backend/API types) + Frontend Dev (UI component types)  
**Priority:** P2 (MEDIUM)  
**Time Estimate:** 3-4 hours  
**Dependencies:** Task 2.2

**Objective:** Resolve 63 property access errors.

**Steps:**

1. Run `tsc --noEmit | grep TS2339` to get full list
2. Split by domain:
   - **Devi:** API response types, database types (estimate: ~30 errors)
   - **Frontend Dev:** Component props, UI state types (estimate: ~33 errors)
3. Fix by adding missing properties to type definitions
4. Add runtime null checks where needed

**Acceptance Criteria:**

- TS2339 error count reduced to 0
- Type definitions updated
- No runtime safety regressions

**Expected Outcome:** ~63 errors resolved → ~181 errors remaining

---

#### Task 2.4: Fix TS7006 (Implicit Any)

**Owner:** Devi  
**Priority:** P2 (MEDIUM)  
**Time Estimate:** 2-3 hours  
**Dependencies:** Task 2.3

**Objective:** Resolve 50 implicit any errors.

**Steps:**

1. Run `tsc --noEmit | grep TS7006` to get full list
2. Add explicit type annotations
3. Focus on function parameters and variables
4. Use proper types (avoid casting to `any`)

**Acceptance Criteria:**

- TS7006 error count reduced to 0
- All parameters and variables properly typed

**Expected Outcome:** ~50 errors resolved → ~131 errors remaining

---

#### Task 2.5: Fix TS18048 (Possibly Undefined)

**Owner:** Frontend Dev  
**Priority:** P2 (MEDIUM)  
**Time Estimate:** 2 hours  
**Dependencies:** Task 2.4

**Objective:** Resolve 32 possibly undefined errors.

**Steps:**

1. Run `tsc --noEmit | grep TS18048` to get full list
2. Add null checks or optional chaining where appropriate
3. Use TypeScript non-null assertions only when truly safe
4. Prefer runtime checks for safety

**Acceptance Criteria:**

- TS18048 error count reduced to 0
- All undefined access properly guarded
- No runtime errors introduced

**Expected Outcome:** ~32 errors resolved → ~99 errors remaining

---

#### Task 2.6: Fix Remaining Type Errors (~99)

**Owner:** Devi + Frontend Dev (split by domain)  
**Priority:** P2 (MEDIUM)  
**Time Estimate:** 3-4 hours  
**Dependencies:** Task 2.5

**Objective:** Resolve remaining ~99 miscellaneous type errors.

**Steps:**

1. Run `tsc --noEmit` to get final error list
2. Group by error code
3. Split by domain expertise
4. Fix systematically

**Acceptance Criteria:**

- All type errors resolved
- `tsc --noEmit` exits with 0 errors
- Type check CI passes

**Expected Outcome:** All 1,863 type errors resolved ✅

---

### **Phase 3: Test Fixes (Day 3-4 — 8-10 hours)**

#### Task 3.1: Fix Type-Blocked Tests

**Owner:** Nina  
**Priority:** P1 (HIGH)  
**Time Estimate:** 2-3 hours  
**Dependencies:** Task 2.6 (all type errors fixed)

**Objective:** Fix tests that were failing due to type errors.

**Steps:**

1. Re-run full test suite after type fixes
2. Identify tests that now pass
3. Fix remaining type-related test issues
4. Update test type annotations as needed

**Acceptance Criteria:**

- All type-related test failures resolved
- Tests compile without errors

---

#### Task 3.2: Fix E2E Tests (4 failing)

**Owner:** Nina  
**Priority:** P1 (HIGH)  
**Time Estimate:** 3-4 hours  
**Dependencies:** Task 3.1

**Objective:** Fix failing E2E tests.

**Tests:**

- `auth.spec.ts`
- `dashboard.spec.ts`
- `cohort-detail.spec.ts`
- `mission-creation.spec.ts`

**Steps:**

1. Run each test individuagent to isolate failures
2. Fix test setup/environment issues
3. Update selectors if UI changed
4. Fix test logic if API contracts changed
5. Ensure tests are not flaky

**Acceptance Criteria:**

- All 4 E2E tests pass consistently
- No flaky test behavior
- Tests run in CI environment

---

#### Task 3.3: Fix Integration Tests (4 failing)

**Owner:** Nina  
**Priority:** P1 (HIGH)  
**Time Estimate:** 2-3 hours  
**Dependencies:** Task 3.1

**Objective:** Fix failing integration tests.

**Tests:**

- API patterns test
- Cohorts API test
- Database test
- Supabase test

**Steps:**

1. Verify test database setup
2. Check API endpoint contracts
3. Update test fixtures if needed
4. Fix any race conditions
5. Ensure proper cleanup

**Acceptance Criteria:**

- All 4 integration tests pass
- Tests don't interfere with each other
- Proper setup/teardown

---

#### Task 3.4: Fix Component Tests (4 failing)

**Owner:** Nina  
**Priority:** P2 (MEDIUM)  
**Time Estimate:** 2 hours  
**Dependencies:** Task 3.1

**Objective:** Fix failing component tests.

**Tests:**

- `status-chip` test
- `activity-log` test
- `batch-members` test
- `cohorts-table` test

**Steps:**

1. Update component test mocks if types changed
2. Fix prop passing issues
3. Update assertions if UI behavior changed
4. Ensure proper component mounting

**Acceptance Criteria:**

- All 4 component tests pass
- Tests cover critical component behavior

---

#### Task 3.5: Fix Unit Tests (2 failing)

**Owner:** Nina  
**Priority:** P2 (MEDIUM)  
**Time Estimate:** 1 hour  
**Dependencies:** Task 3.1

**Objective:** Fix failing unit tests.

**Tests:**

- `logger` test
- `supabase client` test

**Steps:**

1. Update test mocks
2. Fix any type-related issues
3. Ensure proper isolation

**Acceptance Criteria:**

- Both unit tests pass
- Full test suite passes (23/23)

---

### **Phase 4: Lint & Final Verification (Day 4-5 — 2 hours)**

#### Task 4.1: Fix Lint Errors (5 total)

**Owner:** Frontend Dev  
**Priority:** P3 (LOW — trivial)  
**Time Estimate:** 30 minutes  
**Dependencies:** None (can run in parallel)

**Objective:** Fix 5 lint errors.

**Steps:**

1. Run `npm run lint` or `pnpm lint`
2. Fix reported errors (likely simple formatting/unused vars)
3. Verify with `npm run lint`

**Acceptance Criteria:**

- Lint check passes with 0 errors
- Lint CI check passes

---

#### Task 4.2: Full CI Verification

**Owner:** Nina (orchestrates, Devi + Frontend Dev support)  
**Priority:** P0 (CRITICAL)  
**Time Estimate:** 1.5 hours  
**Dependencies:** All previous tasks

**Objective:** Verify all 17 CI checks pass.

**Steps:**

1. Push `fix/ci-pipeline-failures` branch
2. Monitor all CI checks:
   - Type check
   - Lint
   - Test (unit)
   - Test (integration)
   - Test (component)
   - Test (E2E)
   - Build
   - Any other checks
3. If any fail:
   - Identify root cause
   - Fix immediately
   - Re-run CI
4. Once all green:
   - Create PR to `dev`
   - Get approval
   - Merge

**Acceptance Criteria:**

- All 17 CI checks pass on `fix/ci-pipeline-failures`
- PR approved and merged to `dev`
- All checks pass on `dev`
- Merge `dev` to `main` (if needed)
- All checks pass on `main`

**Success Criteria Met:** ✅ All CI checks green on `main` and `dev`

---

## 📊 Task Summary

| Phase                      | Tasks  | Owner(s)           | Total Time      | Priority     |
| -------------------------- | ------ | ------------------ | --------------- | ------------ |
| **Phase 1: Investigation** | 2      | Devi, Nina         | 4 hours         | P0-P1        |
| **Phase 2: Type Fixes**    | 6      | Devi, Frontend Dev | 16-20 hours     | P0-P2        |
| **Phase 3: Test Fixes**    | 5      | Nina               | 8-10 hours      | P1-P2        |
| **Phase 4: Lint & Verify** | 2      | Frontend Dev, Nina | 2 hours         | P0, P3       |
| **TOTAL**                  | **15** | **3 agents**       | **30-36 hours** | **3-5 days** |

---

## 🔄 Task Dependencies (Critical Path)

```
Task 1.1 (Investigate TS17004) → Task 2.1 (Fix TS17004)
                                    ↓
Task 1.2 (Audit Tests)          Task 2.2 (Fix TS2307)
        ↓                           ↓
    (informs)                   Task 2.3 (Fix TS2339)
        ↓                           ↓
    Task 3.1                    Task 2.4 (Fix TS7006)
    (Type-blocked tests)            ↓
        ↓                       Task 2.5 (Fix TS18048)
    Task 3.2 (E2E)                  ↓
        ↓                       Task 2.6 (Remaining)
    Task 3.3 (Integration)          ↓
        ↓                       Task 3.1 (Type-blocked tests)
    Task 3.4 (Component)            ↓
        ↓                       Task 4.2 (Full Verification)
    Task 3.5 (Unit)
        ↓
    Task 4.2 (Full Verification)

Task 4.1 (Lint) can run in parallel, joins at Task 4.2
```

**Critical Path:** 1.1 → 2.1 → 2.2 → 2.3 → 2.4 → 2.5 → 2.6 → 3.1 → 4.2 (est.
24-30 hours)

---

## 🎯 Success Criteria

### Sprint Complete When:

- ✅ All 1,863 type errors resolved
- ✅ All 14 failing tests fixed (23/23 passing)
- ✅ All 5 lint errors fixed
- ✅ All 17 CI checks pass on `fix/ci-pipeline-failures`
- ✅ PR merged to `dev` with all checks green
- ✅ `dev` merged to `main` with all checks green
- ✅ `feature/operations-redesign` can safely continue

### Definition of Done:

1. `tsc --noEmit` returns 0 errors
2. `npm run test` passes all tests
3. `npm run lint` passes with 0 errors
4. CI pipeline shows all green checks on `main` and `dev`
5. Sprint retrospective completed
6. Learnings documented

---

## 📝 Notes

- **DO NOT TOUCH:** `feature/operations-redesign` branch during this sprint
- **Working Branch:** `fix/ci-pipeline-failures` (branch from `dev`)
- **Priority:** This sprint BLOCKS all feature work until complete
- **Communication:** Daily standup required — report blockers immediately
- **Escalation:** Any task taking >2x estimated time → escalate to August (PM)

---

## 🚀 Getting Started

1. **Devi:** Start Task 1.1 (Investigate TS17004) immediately
2. **Nina:** Start Task 1.2 (Audit Tests) in parallel
3. **Frontend Dev:** Standby for Phase 2 assignments (will be notified)
4. **All:** Check into Discord #dev-general for daily standup

---

**Sprint Start:** 2026-02-14  
**Sprint End (Target):** 2026-02-19  
**Sprint PM:** August  
**Sprint Lead:** Nina (QA orchestration)  
**Tech Lead:** Devi (Type resolution)

---

_This sprint plan is the execution blueprint. Agents should work from this
document and update task status daily._
