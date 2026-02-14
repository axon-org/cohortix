# Test Plan: Cohort CRUD Operations

**Feature ID:** `COHORT-001`  
**Test Plan Author:** Guardian (Hafiz)  
**Created:** 2026-02-11  
**Status:** Draft  
**Related Spec:** `docs/specs/cohort-crud.md`

---

## 1. Overview

### 1.1 Feature Summary

Complete CRUD (Create, Read, Update, Delete) operations for cohorts. Users can
create cohorts with name, description, and criteria; view cohort details; edit
cohort properties; and soft-delete cohorts with 30-day recovery window.

**Related Specification:**  
`docs/DATABASE_SCHEMA.md` (§ Cohorts Table)

**Acceptance Criteria:**

- Users can create a new cohort with name (required) and description (optional)
- Cohort list displays all cohorts for user's organization
- Users can view cohort details (name, description, member count, created date)
- Users can edit cohort name and description
- Users can delete cohort (soft delete with `deleted_at` timestamp)
- Deleted cohorts are hidden from list but recoverable within 30 days
- Data validation prevents empty cohort names
- Multi-tenant isolation: Users only see their org's cohorts

---

## 2. Testing Strategy

### 2.1 Testing Pyramid Distribution (Codex §4.1)

| Test Type             | Target % | Estimated Count | Actual Count |
| --------------------- | -------- | --------------- | ------------ |
| **Unit Tests**        | 70%      | 18              | TBD          |
| **Integration Tests** | 20%      | 5               | TBD          |
| **E2E Tests**         | 10%      | 3               | TBD          |

**Total Test Count:** Estimated: 26, Actual: TBD

### 2.2 Testing Tools

- **Unit Testing:** Vitest + React Testing Library
- **Integration Testing:** Vitest + Supabase test client
- **E2E Testing:** Playwright (critical CRUD paths)
- **Security Testing:** SAST (Semgrep), RLS policy validation
- **Accessibility Testing:** axe-core (WCAG 2.2 AA)

---

## 3. Unit Tests (70% of Test Suite)

### 3.1 Test Scope

**Units to Test:**

| Unit (Function/Class/Component) | Responsibility                      | Test Count |
| ------------------------------- | ----------------------------------- | ---------- |
| `CreateCohortForm` component    | Render form, validate input, submit | 5          |
| `CohortList` component          | Display cohorts, handle empty state | 3          |
| `CohortCard` component          | Display cohort summary with actions | 3          |
| `EditCohortDialog` component    | Edit cohort in modal                | 3          |
| `validateCohortName()` util     | Validate cohort name (1-100 chars)  | 4          |

### 3.2 Test Cases

#### Test Suite: CreateCohortForm Component

**File:** `tests/unit/components/cohorts/CreateCohortForm.test.tsx`

| Test Case                                           | Input                            | Expected Output                             | Status     |
| --------------------------------------------------- | -------------------------------- | ------------------------------------------- | ---------- |
| Should render form with name and description fields | N/A                              | Form visible with 2 inputs, 1 submit button | ⏳ Pending |
| Should show error when name is empty                | Submit with empty name           | Error: "Cohort name required"               | ⏳ Pending |
| Should call createCohort() on valid submission      | Valid name, optional description | `createCohort()` called with correct data   | ⏳ Pending |
| Should disable submit button during loading         | Submit form                      | Button disabled, loading indicator shown    | ⏳ Pending |
| Should reset form after successful submission       | Successful submission            | Form fields cleared                         | ⏳ Pending |

---

#### Test Suite: CohortList Component

**File:** `tests/unit/components/cohorts/CohortList.test.tsx`

| Test Case                               | Input                                     | Expected Output                              | Status     |
| --------------------------------------- | ----------------------------------------- | -------------------------------------------- | ---------- |
| Should render list of cohorts           | `cohorts: [{ id: "1", name: "Team A" }]`  | List displays "Team A"                       | ⏳ Pending |
| Should show empty state when no cohorts | `cohorts: []`                             | Empty state message + "Create Cohort" button | ⏳ Pending |
| Should filter out deleted cohorts       | `cohorts: [{ deleted_at: "2026-01-01" }]` | Deleted cohort not displayed                 | ⏳ Pending |

---

#### Test Suite: CohortCard Component

**File:** `tests/unit/components/cohorts/CohortCard.test.tsx`

| Test Case                                   | Input                                 | Expected Output                     | Status     |
| ------------------------------------------- | ------------------------------------- | ----------------------------------- | ---------- |
| Should display cohort name and member count | `{ name: "Team A", member_count: 5 }` | Card shows "Team A" and "5 members" | ⏳ Pending |
| Should show Edit and Delete buttons         | N/A                                   | Two action buttons visible          | ⏳ Pending |
| Should call onDelete() when delete clicked  | Click delete button                   | `onDelete()` called with cohort ID  | ⏳ Pending |

---

#### Test Suite: EditCohortDialog Component

**File:** `tests/unit/components/cohorts/EditCohortDialog.test.tsx`

| Test Case                                      | Input                                            | Expected Output                          | Status     |
| ---------------------------------------------- | ------------------------------------------------ | ---------------------------------------- | ---------- |
| Should pre-fill form with cohort data          | `cohort: { name: "Team A", description: "..." }` | Form fields populated with existing data | ⏳ Pending |
| Should validate name before submission         | Submit with empty name                           | Error: "Cohort name required"            | ⏳ Pending |
| Should call updateCohort() on valid submission | Valid name                                       | `updateCohort()` called with new data    | ⏳ Pending |

---

#### Test Suite: validateCohortName() Utility

**File:** `tests/unit/lib/validation.test.ts`

| Test Case                          | Input              | Expected Output                            | Status     |
| ---------------------------------- | ------------------ | ------------------------------------------ | ---------- |
| Should accept valid name           | `"Marketing Team"` | `{ valid: true }`                          | ⏳ Pending |
| Should reject empty name           | `""`               | `{ valid: false, error: "Required" }`      | ⏳ Pending |
| Should reject name >100 characters | `"A".repeat(101)`  | `{ valid: false, error: "Max 100 chars" }` | ⏳ Pending |
| Should trim whitespace             | `"  Team A  "`     | `{ valid: true, value: "Team A" }`         | ⏳ Pending |

---

### 3.3 Mocking Strategy

**External Dependencies to Mock:**

| Dependency      | Mocking Method                                            | Reason                    |
| --------------- | --------------------------------------------------------- | ------------------------- |
| Supabase client | Mock `@/lib/supabase/server`                              | Prevent real DB calls     |
| Server Actions  | Mock `createCohort()`, `updateCohort()`, `deleteCohort()` | Isolate from server logic |
| Next.js Router  | Mock `useRouter()`                                        | Prevent actual navigation |

---

## 4. Integration Tests (20% of Test Suite)

### 4.1 Test Scope

**Integration Points to Test:**

| Integration                 | Components Involved                                      | Test Count |
| --------------------------- | -------------------------------------------------------- | ---------- |
| Create cohort               | Form → Server action → Supabase → Database               | 1          |
| Read cohorts                | Page load → Server action → Supabase → Database → UI     | 1          |
| Update cohort               | Form → Server action → Supabase → Database               | 1          |
| Delete cohort (soft delete) | Button click → Server action → Supabase (set deleted_at) | 1          |
| Multi-tenant isolation      | User A → Supabase RLS → Only org A cohorts               | 1          |

### 4.2 Test Cases

#### Integration Test Suite: Create Cohort

**File:** `tests/integration/cohorts/create.test.ts`

| Test Case                              | Setup          | Action                            | Expected Result                               | Status     |
| -------------------------------------- | -------------- | --------------------------------- | --------------------------------------------- | ---------- |
| Should create cohort and persist in DB | User logged in | POST /api/cohorts with valid data | 201 Created, cohort in DB with correct org_id | ⏳ Pending |
| Should reject empty cohort name        | User logged in | POST /api/cohorts with empty name | 400 Bad Request, error: "Name required"       | ⏳ Pending |
| Should auto-assign organization_id     | User logged in | POST /api/cohorts                 | Cohort created with user's org_id             | ⏳ Pending |

---

#### Integration Test Suite: Read Cohorts

**File:** `tests/integration/cohorts/read.test.ts`

| Test Case                       | Setup                                    | Action                             | Expected Result                   | Status     |
| ------------------------------- | ---------------------------------------- | ---------------------------------- | --------------------------------- | ---------- |
| Should fetch only org's cohorts | Org A has 3 cohorts, Org B has 2 cohorts | GET /api/cohorts (user from Org A) | Returns 3 cohorts from Org A only | ⏳ Pending |
| Should exclude deleted cohorts  | Org has 2 active, 1 deleted cohort       | GET /api/cohorts                   | Returns only 2 active cohorts     | ⏳ Pending |

---

#### Integration Test Suite: Update Cohort

**File:** `tests/integration/cohorts/update.test.ts`

| Test Case                                       | Setup               | Action                                 | Expected Result                   | Status     |
| ----------------------------------------------- | ------------------- | -------------------------------------- | --------------------------------- | ---------- |
| Should update cohort name                       | Cohort exists in DB | PUT /api/cohorts/:id with new name     | 200 OK, name updated in DB        | ⏳ Pending |
| Should prevent updating cohort from another org | Cohort from Org B   | PUT /api/cohorts/:id (user from Org A) | 403 Forbidden (RLS blocks update) | ⏳ Pending |

---

#### Integration Test Suite: Delete Cohort (Soft Delete)

**File:** `tests/integration/cohorts/delete.test.ts`

| Test Case                                       | Setup               | Action                                    | Expected Result                                            | Status     |
| ----------------------------------------------- | ------------------- | ----------------------------------------- | ---------------------------------------------------------- | ---------- |
| Should soft delete cohort                       | Cohort exists in DB | DELETE /api/cohorts/:id                   | 200 OK, `deleted_at` timestamp set, not physically deleted | ⏳ Pending |
| Should prevent deleting cohort from another org | Cohort from Org B   | DELETE /api/cohorts/:id (user from Org A) | 403 Forbidden (RLS blocks delete)                          | ⏳ Pending |

---

#### Integration Test Suite: Multi-Tenant Isolation

**File:** `tests/integration/cohorts/multi-tenant.test.ts`

| Test Case                               | Setup             | Action                                 | Expected Result                 | Status     |
| --------------------------------------- | ----------------- | -------------------------------------- | ------------------------------- | ---------- |
| Should enforce RLS for cross-org access | Cohort from Org B | GET /api/cohorts/:id (user from Org A) | 404 Not Found (RLS blocks read) | ⏳ Pending |

---

### 4.3 Test Data Management

**Database Setup:**

- [ ] Use Supabase test project
- [ ] Seed database with 2 test organizations and 5 cohorts
- [ ] Clean database after each test

**Test Fixtures:**

- `fixtures/cohorts.json` — Sample cohort data
- `fixtures/organizations.json` — Test organizations

---

## 5. E2E Tests (10% of Test Suite — Critical Paths Only)

### 5.1 Test Scope

**Critical User Journeys:**

| Journey                  | Steps                                                                                                                | Priority |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- | -------- |
| Create cohort end-to-end | 1. Navigate to /cohorts<br>2. Click "Create Cohort"<br>3. Fill form<br>4. Submit<br>5. Verify cohort appears in list | P0       |
| Edit cohort end-to-end   | 1. Navigate to /cohorts<br>2. Click "Edit" on cohort<br>3. Change name<br>4. Submit<br>5. Verify name updated        | P0       |
| Delete cohort end-to-end | 1. Navigate to /cohorts<br>2. Click "Delete" on cohort<br>3. Confirm deletion<br>4. Verify cohort removed from list  | P0       |

**Tool:** Playwright

**Target Browsers:**

- [x] Chromium
- [ ] Firefox (future)
- [ ] WebKit (future)

### 5.2 Test Cases

#### E2E Test Suite: Create Cohort Flow

**File:** `tests/e2e/cohorts/create.spec.ts`

| Test Case                 | User Actions                                                                                        | Expected Outcome                                        | Status     |
| ------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ---------- |
| Happy path: Create cohort | 1. Navigate to /cohorts<br>2. Click "Create Cohort"<br>3. Enter name "QA Team"<br>4. Click "Create" | Redirected to /cohorts, "QA Team" visible in list       | ⏳ Pending |
| Error path: Empty name    | 1. Open create form<br>2. Leave name empty<br>3. Click "Create"                                     | Error message "Name required" shown, form not submitted | ⏳ Pending |

---

#### E2E Test Suite: Edit Cohort Flow

**File:** `tests/e2e/cohorts/edit.spec.ts`

| Test Case                    | User Actions                                                                                                      | Expected Outcome                          | Status     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ---------- |
| Happy path: Edit cohort name | 1. Navigate to /cohorts<br>2. Click "Edit" on first cohort<br>3. Change name to "Updated Name"<br>4. Click "Save" | Modal closes, cohort name updated in list | ⏳ Pending |

---

#### E2E Test Suite: Delete Cohort Flow

**File:** `tests/e2e/cohorts/delete.spec.ts`

| Test Case                 | User Actions                                                                   | Expected Outcome                                | Status     |
| ------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------- | ---------- |
| Happy path: Delete cohort | 1. Navigate to /cohorts<br>2. Click "Delete" on cohort<br>3. Confirm in dialog | Cohort removed from list, success message shown | ⏳ Pending |

---

### 5.3 Flakiness Prevention

**Strategies to Reduce Flaky Tests:**

- [x] Use `waitForSelector` for async list updates
- [x] Disable animations in test environment
- [x] Use `data-testid` attributes for stable locators
- [x] Wait for API responses before asserting UI changes

---

## 6. Security Testing

### 6.1 Security Requirements

**From Spec (Security Checklist):**

- [x] Multi-tenant isolation via Supabase RLS
- [x] Input validation (cohort name 1-100 chars)
- [x] Authorization checks (only org members can CRUD cohorts)
- [x] SQL injection prevention (parameterized queries)
- [x] XSS prevention (output encoding)

### 6.2 Security Test Cases

**RLS Policy Validation:**

```sql
-- Test RLS policy manually in Supabase SQL editor
-- Ensure users can only access their org's cohorts

-- As User A (Org A)
SELECT * FROM cohorts WHERE id = 'cohort_from_org_b';
-- Expected: 0 rows (RLS blocks)

-- Try to insert cohort for Org B
INSERT INTO cohorts (organization_id, name) VALUES ('org_b_id', 'Hacked');
-- Expected: Error (RLS blocks)
```

**SAST (Static Application Security Testing):**

- **Tool:** Semgrep
- **Scan Target:** Cohort API routes, components
- **Threshold:** Zero high/critical vulnerabilities

**Input Validation Tests:**

- [ ] Test XSS: Input `<script>alert('xss')</script>` as cohort name
  - Expected: String escaped, script not executed
- [ ] Test SQL injection: Input `'; DROP TABLE cohorts; --` as cohort name
  - Expected: Treated as string, no SQL execution

---

## 7. Accessibility Testing

### 7.1 Accessibility Requirements (WCAG 2.2 AA)

**From Spec:**

- [x] WCAG 2.2 AA compliance required
- [x] Screen reader support for cohort list
- [x] Keyboard navigation for forms and buttons
- [x] Color contrast 4.5:1 minimum

### 7.2 Accessibility Test Cases

**Automated Testing:**

- **Tool:** axe-core (via Playwright)
- **Scan Target:** Cohort list, create form, edit dialog
- **Threshold:** Zero violations

**Manual Testing:**

- [ ] Test with VoiceOver: Cohort list and forms fully navigable
- [ ] Test keyboard navigation: Tab through form, Enter to submit, Escape to
      close dialog
- [ ] Verify color contrast: All text meets 4.5:1 ratio

---

## 8. Performance Testing

### 8.1 Performance Requirements

**From Spec (Non-Functional Requirements):**

| Metric                                | Target | Measurement Tool |
| ------------------------------------- | ------ | ---------------- |
| Cohort list load time (p95)           | <500ms | k6 load testing  |
| Create cohort API response time (p95) | <300ms | k6 load testing  |
| UI responsiveness (INP)               | <200ms | Lighthouse       |

### 8.2 Load Testing Scenarios

**Tool:** k6

**Scenario: Concurrent Cohort Creation**

- **Virtual Users (VUs):** 50
- **Duration:** 2 minutes
- **Expected:** All requests <500ms, error rate <1%

**Test Script:** `tests/performance/cohort-load-test.js`

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 50,
  duration: '2m',
};

export default function () {
  const payload = JSON.stringify({
    name: `Test Cohort ${Date.now()}`,
    description: 'Load test cohort',
  });

  const res = http.post('https://app.cohortix.com/api/cohorts', payload, {
    headers: {
      'Content-Type': 'application/json',
      Cookie: `supabase-auth-token=${__ENV.AUTH_TOKEN}`,
    },
  });

  check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## 9. Test Execution Plan

### 9.1 Test Execution Order

1. **Pre-commit:** Unit tests (fast subset)
2. **PR Stage (CI/CD):**
   - Run all unit tests
   - Run integration tests
   - Run SAST (Semgrep)
3. **Pre-deploy Stage (Staging):**
   - Run E2E tests (Playwright)
   - Run accessibility tests (axe-core)
   - Run performance tests (k6)
4. **Production:**
   - Smoke test (verify cohort creation works)

### 9.2 Test Environment Setup

**Local Development:**

- [ ] Install test dependencies:
      `pnpm add -D vitest @testing-library/react playwright`
- [ ] Set up Supabase test project
- [ ] Run tests: `pnpm test:cohorts`

**CI/CD Pipeline:**

- [ ] GitHub Actions configured
- [ ] Supabase test project seeded with fixtures

---

## 10. Test Coverage Targets

### 10.1 Code Coverage

**Target:** ≥80% for cohort-related code

**Coverage Tool:** Vitest (c8)

### 10.2 Acceptance Criteria Coverage

| Acceptance Criterion                 | Test Type          | Test Case(s)                                   | Status     |
| ------------------------------------ | ------------------ | ---------------------------------------------- | ---------- |
| Users can create cohort              | Integration + E2E  | `create.test.ts`, `create.spec.ts`             | ⏳ Pending |
| Cohort list displays all org cohorts | Integration + E2E  | `read.test.ts`, `create.spec.ts`               | ⏳ Pending |
| Users can view cohort details        | Unit + Integration | `CohortCard.test.tsx`, `read.test.ts`          | ⏳ Pending |
| Users can edit cohort                | Integration + E2E  | `update.test.ts`, `edit.spec.ts`               | ⏳ Pending |
| Users can delete cohort              | Integration + E2E  | `delete.test.ts`, `delete.spec.ts`             | ⏳ Pending |
| Deleted cohorts hidden from list     | Integration + Unit | `read.test.ts`, `CohortList.test.tsx`          | ⏳ Pending |
| Data validation prevents empty names | Unit + Integration | `validateCohortName.test.ts`, `create.test.ts` | ⏳ Pending |
| Multi-tenant isolation enforced      | Integration        | `multi-tenant.test.ts`                         | ⏳ Pending |

---

## 11. Known Issues & Risks

### 11.1 Known Test Gaps

- [ ] Cohort search/filter not tested (not yet implemented)
- [ ] Cohort member management not tested (separate feature)
- [ ] Undo delete (restore within 30 days) not tested

**Mitigation:**

- Add search tests when feature is implemented
- Add member management tests in separate test plan
- Add restore tests in Week 3

### 11.2 Risks

| Risk                                        | Impact   | Likelihood | Mitigation                          |
| ------------------------------------------- | -------- | ---------- | ----------------------------------- |
| RLS policy misconfiguration                 | Critical | Low        | Test RLS manually before deployment |
| Concurrent edits cause conflicts            | Medium   | Low        | Add optimistic locking (future)     |
| Large cohort lists cause performance issues | Medium   | Medium     | Implement pagination (future)       |

---

## 12. Test Results

### 12.1 Test Execution Summary

**Run Date:** TBD  
**Environment:** Local

| Test Type         | Total | Pass | Fail | Skip | Pass Rate |
| ----------------- | ----- | ---- | ---- | ---- | --------- |
| Unit Tests        | TBD   | TBD  | TBD  | TBD  | TBD%      |
| Integration Tests | TBD   | TBD  | TBD  | TBD  | TBD%      |
| E2E Tests         | TBD   | TBD  | TBD  | TBD  | TBD%      |
| **Total**         | TBD   | TBD  | TBD  | TBD  | TBD%      |

**Status:** ⏳ Tests Not Yet Implemented

---

## 13. Sign-Off

**Test Plan Author:** Guardian (Hafiz)  
**Reviewed By:**

- [ ] Devi (Backend Developer)
- [ ] Lubna (Frontend Developer)
- [ ] PM (Alim)

**Approval Date:** TBD  
**Approved By:** TBD

**Deployment Ready:** ❌ No (Tests not implemented)

---

## 14. Changelog

| Date       | Author | Change        |
| ---------- | ------ | ------------- |
| 2026-02-11 | Hafiz  | Initial draft |

---

_This test plan follows the Axon Codex v1.2 Testing Standards (§4)._
