# Test Plan: [Feature Name]

**Feature ID:** `FEAT-XXX`  
**Test Plan Author:** Hafiz (QA Specialist)  
**Created:** YYYY-MM-DD  
**Status:** Draft | Approved | In Progress | Complete  
**Related Spec:** `docs/specs/[feature-id].md`

---

## 1. Overview

### 1.1 Feature Summary

[Brief description of the feature being tested. 1-2 sentences.]

**Related Specification:**  
`docs/specs/[feature-id].md`

**Acceptance Criteria:**  
[Copy acceptance criteria from the spec, or link to spec section]

---

## 2. Testing Strategy

### 2.1 Testing Pyramid Distribution (Codex §4.1)

| Test Type             | Target % | Estimated Count | Actual Count |
| --------------------- | -------- | --------------- | ------------ |
| **Unit Tests**        | 70%      | [number]        | [number]     |
| **Integration Tests** | 20%      | [number]        | [number]     |
| **E2E Tests**         | 10%      | [number]        | [number]     |

**Total Test Count:** [Estimated: X, Actual: Y]

### 2.2 Testing Tools

- **Unit Testing:** Vitest, Jest, or language-specific framework
- **Integration Testing:** Supertest (API), React Testing Library (Frontend)
- **E2E Testing:** Playwright (if critical user journey)
- **Performance Testing:** k6 (if applicable)
- **Accessibility Testing:** axe-core, Pa11y
- **Security Testing:** SAST (SonarQube, Semgrep), DAST, TruffleHog

---

## 3. Unit Tests (70% of Test Suite)

### 3.1 Test Scope

**Units to Test:**

| Unit (Function/Class/Component) | Responsibility | Test Count |
| ------------------------------- | -------------- | ---------- |
| [Unit 1 name]                   | [What it does] | [number]   |
| [Unit 2 name]                   | [What it does] | [number]   |
| [Unit 3 name]                   | [What it does] | [number]   |

### 3.2 Test Cases

#### Test Suite: [Unit 1 Name]

**File:** `tests/unit/[unit-name].test.ts`

| Test Case                                   | Input            | Expected Output          | Status                         |
| ------------------------------------------- | ---------------- | ------------------------ | ------------------------------ |
| Should [behavior] when [condition]          | [Input data]     | [Expected result]        | ⏳ Pending / ✅ Pass / ❌ Fail |
| Should throw error when [invalid condition] | [Invalid input]  | Error with message "..." | ⏳ Pending                     |
| Should handle edge case: [scenario]         | [Edge case data] | [Expected result]        | ⏳ Pending                     |

**Example:**

| Test Case                                 | Input         | Expected Output             | Status  |
| ----------------------------------------- | ------------- | --------------------------- | ------- |
| Should hash password correctly            | `password123` | Bcrypt hash (60 chars)      | ✅ Pass |
| Should throw error when password is empty | `""`          | Error: "Password required"  | ✅ Pass |
| Should reject password <8 characters      | `short`       | Error: "Password too short" | ✅ Pass |

---

#### Test Suite: [Unit 2 Name]

**File:** `tests/unit/[unit-name].test.ts`

[Repeat table structure for each unit]

---

### 3.3 Mocking Strategy

**External Dependencies to Mock:**

| Dependency   | Mocking Method                          | Reason                          |
| ------------ | --------------------------------------- | ------------------------------- |
| Database     | In-memory DB (e.g., SQLite) or mock ORM | Isolate unit from external DB   |
| External API | Mock HTTP client (e.g., MSW, Nock)      | Prevent real API calls in tests |
| File system  | Mock `fs` module                        | Avoid side effects on disk      |

---

## 4. Integration Tests (20% of Test Suite)

### 4.1 Test Scope

**Integration Points to Test:**

| Integration                            | Components Involved                   | Test Count |
| -------------------------------------- | ------------------------------------- | ---------- |
| [Integration 1: API + Database]        | API endpoint → ORM → PostgreSQL       | [number]   |
| [Integration 2: Frontend + API]        | React component → API call → Backend  | [number]   |
| [Integration 3: Service A + Service B] | Service A → Message queue → Service B | [number]   |

### 4.2 Test Cases

#### Integration Test Suite: [Integration 1 Name]

**File:** `tests/integration/[integration-name].test.ts`

| Test Case                                    | Setup             | Action                             | Expected Result         | Status     |
| -------------------------------------------- | ----------------- | ---------------------------------- | ----------------------- | ---------- |
| Should create user via API and persist in DB | Empty DB          | POST /api/users with valid data    | 201 Created, user in DB | ⏳ Pending |
| Should return 400 when email is invalid      | Empty DB          | POST /api/users with invalid email | 400 Bad Request         | ⏳ Pending |
| Should handle duplicate email gracefully     | User exists in DB | POST /api/users with same email    | 409 Conflict            | ⏳ Pending |

---

#### Integration Test Suite: [Integration 2 Name]

[Repeat table structure for each integration point]

---

### 4.3 Test Data Management

**Database Setup:**

- [ ] Use test database (separate from dev/prod)
- [ ] Seed database with test fixtures before each test
- [ ] Clean database after each test (rollback or truncate)

**Test Fixtures:**

- `fixtures/users.json` — Sample user data
- `fixtures/products.json` — Sample product data

**Test Database:**

- **Technology:** PostgreSQL, MySQL, or in-memory SQLite
- **Connection:** `DATABASE_URL_TEST` environment variable

---

## 5. E2E Tests (10% of Test Suite — Critical Paths Only)

### 5.1 Test Scope

**Critical User Journeys:**

| Journey                        | Steps                                                                                 | Priority |
| ------------------------------ | ------------------------------------------------------------------------------------- | -------- |
| [Journey 1: User sign-up flow] | 1. Navigate to sign-up<br>2. Fill form<br>3. Submit<br>4. Verify email                | P0       |
| [Journey 2: Checkout flow]     | 1. Add item to cart<br>2. Proceed to checkout<br>3. Enter payment<br>4. Confirm order | P0       |

**Tool:** Playwright

**Target Browsers:**

- [ ] Chromium
- [ ] Firefox
- [ ] WebKit (Safari)

### 5.2 Test Cases

#### E2E Test Suite: [Journey 1 Name]

**File:** `tests/e2e/[journey-name].spec.ts`

| Test Case                      | User Actions                                                                   | Expected Outcome                                       | Status     |
| ------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------ | ---------- |
| Happy path: Successful sign-up | 1. Navigate to /sign-up<br>2. Enter valid email/password<br>3. Click "Sign Up" | Redirected to /dashboard, success message shown        | ⏳ Pending |
| Error path: Invalid email      | 1. Navigate to /sign-up<br>2. Enter invalid email<br>3. Click "Sign Up"        | Error message "Invalid email" shown, stays on /sign-up | ⏳ Pending |
| Error path: Weak password      | 1. Navigate to /sign-up<br>2. Enter weak password<br>3. Click "Sign Up"        | Error message "Password too weak" shown                | ⏳ Pending |

---

### 5.3 Flakiness Prevention

**Strategies to Reduce Flaky Tests:**

- [ ] Use `waitForSelector` instead of `sleep` or fixed delays
- [ ] Disable animations in test environment (`prefers-reduced-motion`)
- [ ] Mock external API calls (use network interception)
- [ ] Use stable locators (data-testid attributes, not brittle CSS selectors)
- [ ] Run tests in headless mode for consistency

**Retry Strategy:**

- Flaky tests: Retry up to 3 times
- If test fails 3 times, mark as genuine failure

---

## 6. Performance Testing (If Applicable)

### 6.1 Performance Requirements

**From Spec (Non-Functional Requirements):**

| Metric                                   | Target   | Measurement Tool        |
| ---------------------------------------- | -------- | ----------------------- |
| API response time (p95)                  | <500ms   | k6 load testing         |
| Frontend LCP (Largest Contentful Paint)  | <2.5s    | Lighthouse, WebPageTest |
| Frontend INP (Interaction to Next Paint) | <200ms   | Lighthouse              |
| Frontend CLS (Cumulative Layout Shift)   | <0.1     | Lighthouse              |
| Concurrent users supported               | [number] | k6 load testing         |

### 6.2 Load Testing Scenarios

**Tool:** k6

**Scenario 1: Normal Load**

- **Virtual Users (VUs):** [number]
- **Duration:** 5 minutes
- **Expected:** All requests <500ms, error rate <1%

**Scenario 2: Peak Load**

- **Virtual Users (VUs):** [2x normal]
- **Duration:** 10 minutes
- **Expected:** p95 <1s, error rate <5%

**Scenario 3: Stress Test**

- **Virtual Users (VUs):** [10x normal]
- **Duration:** 5 minutes
- **Expected:** System gracefully degrades, no crashes

**Test Script:** `tests/performance/load-test.js`

---

## 7. Security Testing

### 7.1 Security Requirements

**From Spec (Security Checklist):**

- [ ] Input validation prevents SQL injection
- [ ] XSS prevention (output encoding)
- [ ] CSRF protection (if applicable)
- [ ] Authentication required (if applicable)
- [ ] Authorization enforced (RBAC)
- [ ] Secrets not hardcoded
- [ ] Sensitive data encrypted (if applicable)

### 7.2 Security Test Cases

**SAST (Static Application Security Testing):**

- **Tool:** SonarQube, Semgrep
- **Scan Target:** All new code in PR
- **Threshold:** Zero high/critical vulnerabilities

**DAST (Dynamic Application Security Testing):**

- **Tool:** OWASP ZAP (if applicable)
- **Scan Target:** Staging environment
- **Threshold:** Zero high/critical vulnerabilities

**Dependency Scanning:**

- **Tool:** Snyk, npm audit
- **Scan Target:** `package.json`, `requirements.txt`, etc.
- **Threshold:** Zero high/critical vulnerabilities

**Secret Scanning:**

- **Tool:** TruffleHog, GitGuardian
- **Scan Target:** All commits in PR
- **Threshold:** Zero secrets exposed

---

## 8. Accessibility Testing

### 8.1 Accessibility Requirements (WCAG 2.2 AA)

**From Spec:**

- [ ] WCAG 2.2 AA compliance required
- [ ] Screen reader tested
- [ ] Keyboard navigation works

### 8.2 Accessibility Test Cases

**Automated Testing:**

- **Tool:** axe-core (via Playwright or Vitest)
- **Scan Target:** All pages/components
- **Threshold:** Zero violations

**Manual Testing:**

- [ ] Test with VoiceOver (macOS/iOS)
- [ ] Test with NVDA (Windows)
- [ ] Test with TalkBack (Android)
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Verify color contrast (4.5:1 for body text, 3:1 for large text)

---

## 9. Mutation Testing (Critical Paths Only)

### 9.1 Mutation Testing Strategy

**Purpose:** Validate that tests actually catch bugs (not just code coverage).

**Tool:** Stryker (JavaScript/TypeScript), mutmut (Python)

**Target Code:**

- [ ] [Critical function 1]
- [ ] [Critical function 2]
- [ ] [Critical function 3]

**Minimum Mutation Score:** 60% (Codex §4.5)

**Example:**

| Function        | Mutation Score | Status              |
| --------------- | -------------- | ------------------- |
| `hashPassword`  | 80%            | ✅ Pass             |
| `validateEmail` | 55%            | ❌ Fail (Below 60%) |

**Action if Below 60%:** Add more unit tests to kill remaining mutants.

---

## 10. Test Execution Plan

### 10.1 Test Execution Order

1. **Pre-commit:** Linting (ESLint), Formatting (Prettier), Unit Tests (fast
   subset)
2. **PR Stage (CI/CD):**
   - Run all unit tests
   - Run integration tests
   - Run SAST (SonarQube)
   - Run secret scanning (TruffleHog)
   - Run dependency scanning (Snyk)
3. **Pre-deploy Stage (Staging):**
   - Run E2E tests (Playwright)
   - Run accessibility tests (axe-core)
   - Run performance tests (k6)
   - Run DAST (OWASP ZAP, if applicable)
4. **Production:**
   - Smoke tests only (sanity check)

### 10.2 Test Environment Setup

**Local Development:**

- [ ] Install test dependencies: `npm install --save-dev vitest playwright`
- [ ] Set up test database: `docker-compose up test-db`
- [ ] Run tests: `npm test`

**CI/CD Pipeline:**

- [ ] GitHub Actions or GitLab CI configured
- [ ] Test database seeded automatically
- [ ] Test results published to dashboard

---

## 11. Test Coverage Targets

### 11.1 Code Coverage

**Target:** ≥80% for new code

**Coverage Tool:** Istanbul (nyc), c8

**Coverage Report:** Generated in CI/CD, published to dashboard

**Measurement:**

- Line coverage: [X%]
- Branch coverage: [X%]
- Function coverage: [X%]

### 11.2 Acceptance Criteria Coverage

**From Spec:**

| Acceptance Criterion | Test Type   | Test Case(s)      | Status     |
| -------------------- | ----------- | ----------------- | ---------- |
| [Criterion 1]        | Unit        | [Test case names] | ✅ Pass    |
| [Criterion 2]        | Integration | [Test case names] | ⏳ Pending |
| [Criterion 3]        | E2E         | [Test case names] | ⏳ Pending |

---

## 12. Known Issues & Risks

### 12.1 Known Test Gaps

- [ ] [Gap 1: e.g., No test for concurrent user scenario]
- [ ] [Gap 2: e.g., Performance test not automated yet]

**Mitigation:**

- [Mitigation plan for Gap 1]
- [Mitigation plan for Gap 2]

### 12.2 Risks

| Risk                                | Impact | Likelihood | Mitigation                                |
| ----------------------------------- | ------ | ---------- | ----------------------------------------- |
| [Risk 1: e.g., Flaky E2E tests]     | High   | Medium     | Implement retry logic, improve locators   |
| [Risk 2: e.g., Test data conflicts] | Medium | Low        | Use isolated test DB, clean between tests |

---

## 13. Test Results

### 13.1 Test Execution Summary

**Run Date:** YYYY-MM-DD  
**Environment:** [Local, Staging, Production]

| Test Type         | Total | Pass | Fail | Skip | Pass Rate |
| ----------------- | ----- | ---- | ---- | ---- | --------- |
| Unit Tests        | [X]   | [X]  | [X]  | [X]  | [X%]      |
| Integration Tests | [X]   | [X]  | [X]  | [X]  | [X%]      |
| E2E Tests         | [X]   | [X]  | [X]  | [X]  | [X%]      |
| **Total**         | [X]   | [X]  | [X]  | [X]  | [X%]      |

**Status:** ✅ All tests pass | ⚠️ Some tests failing | ❌ Critical failures

### 13.2 Failed Tests (If Any)

| Test Name | Failure Reason | Assigned To | Status                       |
| --------- | -------------- | ----------- | ---------------------------- |
| [Test 1]  | [Reason]       | [Agent]     | ⏳ Investigating / 🔧 Fixing |

---

## 14. Sign-Off

**Test Plan Author:** Hafiz (QA Specialist)  
**Reviewed By:**

- [ ] Devi (Backend Developer)
- [ ] Lubna (Frontend Developer)
- [ ] PM (Project Manager)

**Approval Date:** YYYY-MM-DD  
**Approved By:** [PM Name]

**Deployment Ready:** ✅ Yes | ❌ No

---

## 15. Changelog

| Date       | Author | Change                       |
| ---------- | ------ | ---------------------------- |
| YYYY-MM-DD | Hafiz  | Initial draft                |
| YYYY-MM-DD | Hafiz  | Added integration test cases |
| YYYY-MM-DD | PM     | Approved                     |

---

_This template follows the Axon Codex v1.2 Testing Standards (§4)._
