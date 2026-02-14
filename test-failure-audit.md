# Test Failure Audit — CI Stabilization Sprint

**Date:** 2026-02-14
**Audited by:** Nina (QA Engineer)
**Total Failing:** 14 test files (14 individual failures)

---

## Summary by Category

| Category | Failing | Root Cause |
|----------|---------|------------|
| **E2E Tests** | 4 | Vitest trying to run Playwright tests (config issue) |
| **Integration Tests** | 4 | Path alias resolution + env var test logic |
| **Component Tests** | 5 | Path alias resolution + missing React import |
| **Unit Tests** | 1 | Cannot modify process.env in Vitest |

---

## 🔴 E2E Tests (4 failing)

### Common Root Cause
**Error:** `Playwright Test did not expect test.describe() to be called here`

**Why:** Vitest is trying to run Playwright E2E tests. The `vitest.config.ts` excludes `'e2e'` but tests are in `apps/web/e2e/` and Vitest is still picking them up.

**Fix:** Update `vitest.config.ts` exclude pattern to properly exclude E2E tests:
```typescript
exclude: ['node_modules', '.next', 'e2e', '**/e2e/**']
```

**Files affected:**
1. `apps/web/e2e/auth.spec.ts`
2. `apps/web/e2e/dashboard.spec.ts`
3. `apps/web/e2e/cohort-detail.spec.ts`
4. `apps/web/e2e/mission-creation.spec.ts`

**Dependencies:** None
**Blocked by type fixes:** No

---

## 🔴 Integration Tests (4 failing)

### 1. `api-patterns.integration.test.ts`
**Error:** `Cannot find package '@/lib/errors'`

**Why:** Path alias `@/` not resolving properly for this specific import

**Fix:** Verify import path and vitest resolve alias configuration

**Dependencies:** None
**Blocked by type fixes:** No

---

### 2. `cohorts-api.integration.test.ts`
**Error:** `Cannot find package '@/app/api/cohorts/route'`

**Why:** Path alias not resolving for API route imports

**Fix:** Check if API route file exists and update import or vitest config

**Dependencies:** None
**Blocked by type fixes:** No

---

### 3. `database.integration.test.ts` (2 failures)

**Failure 1:** `should require DATABASE_URL environment variable`
**Error:** `expected undefined to be defined`

**Why:** Test expects process.env.DATABASE_URL to be undefined (to test error handling), but setup.ts sets it

**Fix:** Either:
- Test should check the value instead of existence
- Or test setup should not set DATABASE_URL for this specific test

**Failure 2:** `should use correct connection string format`
**Error:** `Invalid URL`

**Why:** Test tries to parse DATABASE_URL with `new URL()` but the test value from setup.ts causes error

**Fix:** Update test to handle the mock DATABASE_URL or change mock value

**Dependencies:** None
**Blocked by type fixes:** No

---

### 4. `supabase.integration.test.ts` (3 failures)

**Failure 1:** `should create browser client with correct configuration`
**Error:** `expected "vi.fn()" to be called with arguments: [ 'https://test.supabase.co', 'test-anon-key' ] Received: [ undefined, undefined ]`

**Why:** The mock isn't being set up properly, createBrowserClient is being called with undefined values

**Fix:** Fix the mock setup in the test file

**Failure 2:** `should have required environment variables`
**Error:** `expected undefined to be defined`

**Why:** Test expects env vars to be set, but something is overriding the setup.ts values

**Fix:** Check test isolation and ensure env vars are properly set

**Failure 3:** `should use HTTPS for Supabase URL`
**Error:** `.toMatch() expects to receive a string, but got undefined`

**Why:** Same as above - env var is undefined

**Fix:** Same as above

**Dependencies:** None
**Blocked by type fixes:** No

---

## 🔴 Component Tests (5 failing)

### 1-3. `status-chip.test.tsx`, `activity-log.test.tsx`, `batch-members.test.tsx`
**Error:** `Cannot find package '@/lib/utils'`

**Why:** Path alias resolution issue

**Fix:** Verify vitest resolve alias config includes `@/lib/*` pattern

**Dependencies:** None
**Blocked by type fixes:** No

---

### 4. `cohorts-table.test.tsx`
**Error:** `Cannot find package '@/components/ui/data-table'`

**Why:** Path alias resolution issue

**Fix:** Verify file exists and path alias is configured

**Dependencies:** None
**Blocked by type fixes:** No

---

### 5. `engagement-timeline.test.tsx` (8 failures)
**Error:** `ReferenceError: React is not defined`

**Why:** Test file doesn't import React but JSX is being used

**Fix:** Add `import React from 'react'` or update Vitest config to auto-import React

**Dependencies:** None
**Blocked by type fixes:** No

---

## 🔴 Unit Tests (1 failing)

### 1. `logger.test.ts`
**Test:** `should only log debug in development mode`
**Error:** `TypeError: 'process.env' only accepts a configurable, writable, and enumerable data descriptor`

**Why:** Test tries to modify process.env.NODE_ENV directly with `Object.defineProperty()`, but Vitest doesn't allow this

**Fix:** Use `vi.stubEnv()` instead:
```typescript
vi.stubEnv('NODE_ENV', 'production')
// test code
vi.unstubAllEnvs()
```

**Dependencies:** None
**Blocked by type fixes:** No

---

## 📊 Fix Priority

### P0 (Immediate - blocks all tests)
1. **E2E exclusion** (fixes 4 tests) - Update vitest.config.ts

### P1 (High - independent fixes)
2. **Logger test** (fixes 1 test) - Use vi.stubEnv
3. **engagement-timeline React import** (fixes 8 test failures) - Add React import
4. **Path alias resolution** (fixes 7 tests) - Fix vitest resolve config

### P2 (Medium - require investigation)
5. **Supabase integration test** (fixes 3 tests) - Fix mock setup
6. **Database integration test** (fixes 2 tests) - Fix test logic
7. **API integration tests** (fixes 2 tests) - Verify imports

---

## 🎯 Independent vs Blocked

**All 14 test failures can be fixed independently** - None are blocked by Devi's type fixes.

**Estimated fix time:** 2-3 hours

---

## ✅ Fix Plan

1. **Update vitest.config.ts** to exclude E2E tests properly
2. **Fix logger.test.ts** to use vi.stubEnv
3. **Add React import** to engagement-timeline.test.tsx
4. **Investigate and fix path alias** resolution issues
5. **Fix supabase test** mock setup
6. **Fix database test** logic for env vars
7. **Verify and fix** API route imports
8. Run `npx vitest run` to verify all fixes
9. Commit and push

**Goal:** 204/204 tests passing (currently 190/204)
