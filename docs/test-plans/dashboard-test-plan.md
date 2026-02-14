# Test Plan: Dashboard Overview

**Feature ID:** `DASH-001`  
**Test Plan Author:** Guardian (Hafiz)  
**Created:** 2026-02-11  
**Status:** Draft  
**Related Spec:** `docs/specs/dashboard-overview.md`

---

## 1. Overview

### 1.1 Feature Summary

Main dashboard displays real-time cohort analytics, key metrics (total cohorts,
active users, growth trends), and quick actions. Includes sparkline charts for
visualization and responsive design for mobile/tablet.

**Related Specification:**  
`docs/PRD.md` (§ Dashboard UI)

**Acceptance Criteria:**

- Dashboard loads with user's organization data
- Displays accurate cohort count, member count, growth percentage
- Sparkline charts render correctly
- Quick action buttons navigate to correct pages
- Data refreshes on user action (e.g., creating a cohort)
- Performance: LCP <2.5s, INP <200ms

---

## 2. Testing Strategy

### 2.1 Testing Pyramid Distribution (Codex §4.1)

| Test Type             | Target % | Estimated Count | Actual Count |
| --------------------- | -------- | --------------- | ------------ |
| **Unit Tests**        | 70%      | 12              | TBD          |
| **Integration Tests** | 20%      | 3               | TBD          |
| **E2E Tests**         | 10%      | 2               | TBD          |

**Total Test Count:** Estimated: 17, Actual: TBD

### 2.2 Testing Tools

- **Unit Testing:** Vitest + React Testing Library
- **Integration Testing:** Vitest + Mock Supabase client
- **E2E Testing:** Playwright (dashboard critical path)
- **Performance Testing:** Lighthouse CI
- **Accessibility Testing:** axe-core (WCAG 2.2 AA)

---

## 3. Unit Tests (70% of Test Suite)

### 3.1 Test Scope

**Units to Test:**

| Unit (Function/Class/Component) | Responsibility                             | Test Count |
| ------------------------------- | ------------------------------------------ | ---------- |
| `StatsCard` component           | Display metric with title, value, change % | 3          |
| `Sparkline` component           | Render SVG sparkline chart from data       | 3          |
| `calculateGrowth()` util        | Calculate percentage change                | 3          |
| `formatNumber()` util           | Format large numbers (1000 → 1K)           | 3          |

### 3.2 Test Cases

#### Test Suite: StatsCard Component

**File:** `tests/unit/components/dashboard/StatsCard.test.tsx`

| Test Case                                       | Input                                   | Expected Output                        | Status     |
| ----------------------------------------------- | --------------------------------------- | -------------------------------------- | ---------- |
| Should render metric title and value            | `{ title: "Total Cohorts", value: 12 }` | Card displays "Total Cohorts" and "12" | ⏳ Pending |
| Should display positive growth with green badge | `{ value: 12, change: 8.5 }`            | Badge shows "+8.5%" in green           | ⏳ Pending |
| Should display negative growth with red badge   | `{ value: 12, change: -3.2 }`           | Badge shows "-3.2%" in red             | ⏳ Pending |

---

#### Test Suite: Sparkline Component

**File:** `tests/unit/components/ui/Sparkline.test.tsx`

| Test Case                                  | Input                    | Expected Output                 | Status     |
| ------------------------------------------ | ------------------------ | ------------------------------- | ---------- |
| Should render SVG path with correct points | `data: [10, 20, 15, 30]` | SVG path with 4 points          | ⏳ Pending |
| Should handle empty data gracefully        | `data: []`               | Renders empty SVG (no crash)    | ⏳ Pending |
| Should scale data to fit container         | `data: [1000, 2000]`     | Path fits within 100x40 viewBox | ⏳ Pending |

---

#### Test Suite: calculateGrowth() Utility

**File:** `tests/unit/lib/utils.test.ts`

| Test Case                         | Input                         | Expected Output                       | Status     |
| --------------------------------- | ----------------------------- | ------------------------------------- | ---------- |
| Should calculate positive growth  | `current: 120, previous: 100` | `20` (20% growth)                     | ⏳ Pending |
| Should calculate negative growth  | `current: 80, previous: 100`  | `-20` (20% decline)                   | ⏳ Pending |
| Should handle zero previous value | `current: 50, previous: 0`    | `100` (or Infinity, handle edge case) | ⏳ Pending |

---

#### Test Suite: formatNumber() Utility

**File:** `tests/unit/lib/utils.test.ts`

| Test Case                       | Input     | Expected Output | Status     |
| ------------------------------- | --------- | --------------- | ---------- |
| Should format thousands         | `1500`    | `"1.5K"`        | ⏳ Pending |
| Should format millions          | `2500000` | `"2.5M"`        | ⏳ Pending |
| Should not format small numbers | `999`     | `"999"`         | ⏳ Pending |

---

### 3.3 Mocking Strategy

**External Dependencies to Mock:**

| Dependency             | Mocking Method               | Reason                         |
| ---------------------- | ---------------------------- | ------------------------------ |
| Supabase client        | Mock `@/lib/supabase/server` | Prevent real DB calls          |
| Next.js Server Actions | Mock server actions          | Isolate from server logic      |
| Date utilities         | Mock `Date.now()`            | Ensure consistent test results |

---

## 4. Integration Tests (20% of Test Suite)

### 4.1 Test Scope

**Integration Points to Test:**

| Integration              | Components Involved                                   | Test Count |
| ------------------------ | ----------------------------------------------------- | ---------- |
| Dashboard data fetching  | Dashboard page → Server action → Supabase → Database  | 1          |
| Dashboard error handling | Dashboard page → Server action (fails) → Error UI     | 1          |
| Dashboard data refresh   | User action → Optimistic update → Server revalidation | 1          |

### 4.2 Test Cases

#### Integration Test Suite: Dashboard Data Fetching

**File:** `tests/integration/dashboard/data-fetching.test.ts`

| Test Case                               | Setup                             | Action              | Expected Result                      | Status     |
| --------------------------------------- | --------------------------------- | ------------------- | ------------------------------------ | ---------- |
| Should fetch and display dashboard data | User logged in, org has 3 cohorts | Load dashboard page | Displays "3" in Total Cohorts card   | ⏳ Pending |
| Should show zero state for new org      | User logged in, org has 0 cohorts | Load dashboard page | Displays "0" and empty state message | ⏳ Pending |

---

#### Integration Test Suite: Dashboard Error Handling

**File:** `tests/integration/dashboard/error-handling.test.ts`

| Test Case                                     | Setup                       | Action              | Expected Result                             | Status     |
| --------------------------------------------- | --------------------------- | ------------------- | ------------------------------------------- | ---------- |
| Should display error UI when data fetch fails | Mock Supabase returns error | Load dashboard page | Error message displayed, retry button shown | ⏳ Pending |
| Should retry data fetch on button click       | Error state                 | Click retry button  | Data fetch attempted again                  | ⏳ Pending |

---

#### Integration Test Suite: Dashboard Data Refresh

**File:** `tests/integration/dashboard/data-refresh.test.ts`

| Test Case                                 | Setup            | Action                                         | Expected Result                 | Status     |
| ----------------------------------------- | ---------------- | ---------------------------------------------- | ------------------------------- | ---------- |
| Should refresh data after creating cohort | Dashboard loaded | User creates new cohort → Returns to dashboard | Total Cohorts count incremented | ⏳ Pending |

---

### 4.3 Test Data Management

**Database Setup:**

- [ ] Use Supabase test project
- [ ] Seed database with test organization and cohorts
- [ ] Clean database after each test

**Test Fixtures:**

- `fixtures/dashboard-data.json` — Sample dashboard metrics

---

## 5. E2E Tests (10% of Test Suite — Critical Paths Only)

### 5.1 Test Scope

**Critical User Journeys:**

| Journey                                  | Steps                                                                        | Priority |
| ---------------------------------------- | ---------------------------------------------------------------------------- | -------- |
| Load dashboard as authenticated user     | 1. Sign in<br>2. Navigate to /dashboard<br>3. Verify data loads              | P0       |
| Navigate from dashboard to create cohort | 1. Load dashboard<br>2. Click "Create Cohort"<br>3. Verify cohort form loads | P0       |

**Tool:** Playwright

**Target Browsers:**

- [x] Chromium
- [ ] Firefox (future)
- [ ] WebKit (future)

### 5.2 Test Cases

#### E2E Test Suite: Dashboard Load

**File:** `tests/e2e/dashboard/load.spec.ts`

| Test Case                             | User Actions                                                | Expected Outcome                                    | Status     |
| ------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------- | ---------- |
| Happy path: Dashboard loads with data | 1. Navigate to /sign-in<br>2. Sign in<br>3. Dashboard loads | Displays cohort count, sparklines render, no errors | ⏳ Pending |
| Empty state: New organization         | 1. Sign in as new org user<br>2. Dashboard loads            | Displays "0" cohorts, empty state message shown     | ⏳ Pending |

---

#### E2E Test Suite: Dashboard Navigation

**File:** `tests/e2e/dashboard/navigation.spec.ts`

| Test Case                    | User Actions                                  | Expected Outcome                         | Status     |
| ---------------------------- | --------------------------------------------- | ---------------------------------------- | ---------- |
| Click "Create Cohort" button | 1. Load dashboard<br>2. Click "Create Cohort" | Redirected to /cohorts/new, form visible | ⏳ Pending |

---

### 5.3 Flakiness Prevention

**Strategies to Reduce Flaky Tests:**

- [x] Use `waitForSelector` for async data loading
- [x] Disable animations in test environment
- [x] Use `data-testid` attributes for stable locators
- [x] Mock time-dependent data (e.g., "Today" date)

---

## 6. Performance Testing

### 6.1 Performance Requirements

**From Spec (Non-Functional Requirements):**

| Metric                          | Target | Measurement Tool |
| ------------------------------- | ------ | ---------------- |
| Largest Contentful Paint (LCP)  | <2.5s  | Lighthouse       |
| Interaction to Next Paint (INP) | <200ms | Lighthouse       |
| Cumulative Layout Shift (CLS)   | <0.1   | Lighthouse       |
| Time to Interactive (TTI)       | <3.5s  | Lighthouse       |

### 6.2 Performance Testing Strategy

**Lighthouse CI:**

```yaml
# .github/workflows/lighthouse-ci.yml
- name: Run Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    urls: |
      https://staging.cohortix.com/dashboard
    runs: 3
    budgetPath: ./lighthouse-budget.json
```

**Budget Thresholds (`lighthouse-budget.json`):**

```json
[
  {
    "path": "/dashboard",
    "resourceSizes": [
      {
        "resourceType": "script",
        "budget": 250
      },
      {
        "resourceType": "total",
        "budget": 500
      }
    ],
    "timings": [
      {
        "metric": "interactive",
        "budget": 3500
      },
      {
        "metric": "first-contentful-paint",
        "budget": 1800
      }
    ]
  }
]
```

---

## 7. Accessibility Testing

### 7.1 Accessibility Requirements (WCAG 2.2 AA)

**From Spec:**

- [x] WCAG 2.2 AA compliance required
- [x] Screen reader support for metrics
- [x] Keyboard navigation works
- [x] Color contrast 4.5:1 minimum

### 7.2 Accessibility Test Cases

**Automated Testing:**

- **Tool:** axe-core (via Playwright)
- **Scan Target:** Dashboard page
- **Threshold:** Zero violations

**Manual Testing:**

- [ ] Test with VoiceOver: All metrics announced correctly
- [ ] Test keyboard navigation: Tab to quick action buttons
- [ ] Verify color contrast: Green/red growth badges meet 4.5:1 ratio

---

## 8. Test Execution Plan

### 8.1 Test Execution Order

1. **Pre-commit:** Unit tests (fast subset)
2. **PR Stage (CI/CD):**
   - Run all unit tests
   - Run integration tests
   - Run Lighthouse CI (performance budget)
3. **Pre-deploy Stage (Staging):**
   - Run E2E tests (Playwright)
   - Run accessibility tests (axe-core)
4. **Production:**
   - Smoke test (verify dashboard loads)

### 8.2 Test Environment Setup

**Local Development:**

- [ ] Install test dependencies:
      `pnpm add -D vitest @testing-library/react playwright`
- [ ] Set up Supabase test project
- [ ] Run tests: `pnpm test:dashboard`

**CI/CD Pipeline:**

- [ ] GitHub Actions configured
- [ ] Lighthouse CI budget enforced

---

## 9. Test Coverage Targets

### 9.1 Code Coverage

**Target:** ≥80% for dashboard components

**Coverage Tool:** Vitest (c8)

### 9.2 Acceptance Criteria Coverage

| Acceptance Criterion                    | Test Type          | Test Case(s)                                  | Status     |
| --------------------------------------- | ------------------ | --------------------------------------------- | ---------- |
| Dashboard loads with user's org data    | Integration + E2E  | `data-fetching.test.ts`, `load.spec.ts`       | ⏳ Pending |
| Displays accurate cohort count          | Integration + Unit | `data-fetching.test.ts`, `StatsCard.test.tsx` | ⏳ Pending |
| Sparkline charts render correctly       | Unit               | `Sparkline.test.tsx`                          | ⏳ Pending |
| Quick action buttons navigate correctly | E2E                | `navigation.spec.ts`                          | ⏳ Pending |
| Data refreshes on user action           | Integration        | `data-refresh.test.ts`                        | ⏳ Pending |
| Performance: LCP <2.5s                  | Performance        | Lighthouse CI                                 | ⏳ Pending |

---

## 10. Known Issues & Risks

### 10.1 Known Test Gaps

- [ ] Real-time data updates not tested (future WebSocket feature)
- [ ] Dashboard filters not tested (not yet implemented)
- [ ] Mobile layout not E2E tested (future)

**Mitigation:**

- Add real-time tests when WebSocket is implemented
- Add filter tests when feature is built
- Add mobile E2E tests in Week 4

### 10.2 Risks

| Risk                             | Impact | Likelihood | Mitigation                                |
| -------------------------------- | ------ | ---------- | ----------------------------------------- |
| Slow data fetching affects LCP   | High   | Medium     | Optimize database queries, add caching    |
| Layout shift from loading states | Medium | Medium     | Use skeleton loaders with fixed heights   |
| Flaky Lighthouse scores          | Low    | High       | Run Lighthouse 3 times, take median score |

---

## 11. Test Results

### 11.1 Test Execution Summary

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

## 12. Sign-Off

**Test Plan Author:** Guardian (Hafiz)  
**Reviewed By:**

- [ ] Lubna (Frontend Developer)
- [ ] Devi (Backend Developer)
- [ ] PM (Alim)

**Approval Date:** TBD  
**Approved By:** TBD

**Deployment Ready:** ❌ No (Tests not implemented)

---

## 13. Changelog

| Date       | Author | Change        |
| ---------- | ------ | ------------- |
| 2026-02-11 | Hafiz  | Initial draft |

---

_This test plan follows the Axon Codex v1.2 Testing Standards (§4)._
