# Test Plan: Authentication Flow

**Feature ID:** `AUTH-001`  
**Test Plan Author:** Guardian (Hafiz)  
**Created:** 2026-02-11  
**Status:** Draft  
**Related Spec:** `docs/specs/auth-flow.md`

---

## 1. Overview

### 1.1 Feature Summary

Complete authentication flow including sign-up, sign-in, password reset, and
session management using Supabase Auth. Supports email/password authentication
with optional MFA (TOTP).

**Related Specification:**  
`docs/SECURITY.md` (§ Authentication Architecture)

**Acceptance Criteria:**

- Users can sign up with email/password
- Users can sign in with valid credentials
- Invalid credentials display appropriate error messages
- Password reset flow sends email and allows password change
- Sessions persist across page refreshes (7-day duration)
- MFA enrollment and challenge work correctly
- Protected routes redirect unauthenticated users to sign-in

---

## 2. Testing Strategy

### 2.1 Testing Pyramid Distribution (Codex §4.1)

| Test Type             | Target % | Estimated Count | Actual Count |
| --------------------- | -------- | --------------- | ------------ |
| **Unit Tests**        | 70%      | 14              | TBD          |
| **Integration Tests** | 20%      | 4               | TBD          |
| **E2E Tests**         | 10%      | 2               | TBD          |

**Total Test Count:** Estimated: 20, Actual: TBD

### 2.2 Testing Tools

- **Unit Testing:** Vitest + React Testing Library
- **Integration Testing:** Supertest (API) + Supabase test client
- **E2E Testing:** Playwright (critical sign-in/sign-up paths)
- **Security Testing:** SAST (Semgrep), TruffleHog (secrets)
- **Accessibility Testing:** axe-core (WCAG 2.2 AA)

---

## 3. Unit Tests (70% of Test Suite)

### 3.1 Test Scope

**Units to Test:**

| Unit (Function/Class/Component) | Responsibility               | Test Count |
| ------------------------------- | ---------------------------- | ---------- |
| `validateEmail()`               | Email format validation      | 3          |
| `validatePassword()`            | Password strength validation | 4          |
| `SignInForm` component          | Sign-in UI and validation    | 4          |
| `SignUpForm` component          | Sign-up UI and validation    | 3          |

### 3.2 Test Cases

#### Test Suite: Email Validation

**File:** `tests/unit/lib/validation.test.ts`

| Test Case                          | Input                | Expected Output                            | Status     |
| ---------------------------------- | -------------------- | ------------------------------------------ | ---------- |
| Should accept valid email          | `"user@example.com"` | `{ valid: true }`                          | ⏳ Pending |
| Should reject email without @      | `"userexample.com"`  | `{ valid: false, error: "Invalid email" }` | ⏳ Pending |
| Should reject email without domain | `"user@"`            | `{ valid: false, error: "Invalid email" }` | ⏳ Pending |

---

#### Test Suite: Password Validation

**File:** `tests/unit/lib/validation.test.ts`

| Test Case                            | Input             | Expected Output                               | Status     |
| ------------------------------------ | ----------------- | --------------------------------------------- | ---------- |
| Should accept strong password        | `"MyP@ssw0rd123"` | `{ valid: true, strength: "strong" }`         | ⏳ Pending |
| Should reject password <8 characters | `"short"`         | `{ valid: false, error: "Min 8 characters" }` | ⏳ Pending |
| Should require at least 1 uppercase  | `"password123"`   | `{ valid: false, error: "Needs uppercase" }`  | ⏳ Pending |
| Should require at least 1 number     | `"Password"`      | `{ valid: false, error: "Needs number" }`     | ⏳ Pending |

---

#### Test Suite: SignInForm Component

**File:** `tests/unit/components/SignInForm.test.tsx`

| Test Case                                   | Input                       | Expected Output                          | Status     |
| ------------------------------------------- | --------------------------- | ---------------------------------------- | ---------- |
| Should render email and password fields     | N/A                         | Form visible with 2 inputs, 1 button     | ⏳ Pending |
| Should display error for invalid email      | Enter invalid email, submit | Error message displayed                  | ⏳ Pending |
| Should call signIn() on valid submission    | Valid email/password        | `signIn()` called with correct args      | ⏳ Pending |
| Should disable submit button during loading | Submit form                 | Button disabled, loading indicator shown | ⏳ Pending |

---

#### Test Suite: SignUpForm Component

**File:** `tests/unit/components/SignUpForm.test.tsx`

| Test Case                                  | Input               | Expected Output                                  | Status     |
| ------------------------------------------ | ------------------- | ------------------------------------------------ | ---------- |
| Should render sign-up form                 | N/A                 | Email, password, confirm password fields visible | ⏳ Pending |
| Should show error if passwords don't match | Different passwords | Error: "Passwords must match"                    | ⏳ Pending |
| Should call signUp() on valid submission   | Valid credentials   | `signUp()` called with correct args              | ⏳ Pending |

---

### 3.3 Mocking Strategy

**External Dependencies to Mock:**

| Dependency     | Mocking Method         | Reason                                |
| -------------- | ---------------------- | ------------------------------------- |
| Supabase Auth  | Mock `@supabase/ssr`   | Prevent real auth calls in unit tests |
| Next.js Router | Mock `next/navigation` | Isolate from routing logic            |
| Cookies        | Mock `next/headers`    | Isolate from cookie management        |

**Mock Example:**

```typescript
// __mocks__/@supabase/ssr.ts
export const createServerClient = jest.fn(() => ({
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
  },
}));
```

---

## 4. Integration Tests (20% of Test Suite)

### 4.1 Test Scope

**Integration Points to Test:**

| Integration         | Components Involved                          | Test Count |
| ------------------- | -------------------------------------------- | ---------- |
| Sign-up flow        | API route → Supabase Auth → Database         | 1          |
| Sign-in flow        | API route → Supabase Auth → Session          | 1          |
| Password reset flow | API route → Supabase Auth → Email            | 1          |
| Session validation  | Middleware → Supabase Auth → Protected route | 1          |

### 4.2 Test Cases

#### Integration Test Suite: Sign-Up Flow

**File:** `tests/integration/auth/sign-up.test.ts`

| Test Case                     | Setup             | Action                                    | Expected Result                                    | Status     |
| ----------------------------- | ----------------- | ----------------------------------------- | -------------------------------------------------- | ---------- |
| Should create user account    | Empty DB          | POST to sign-up with valid email/password | 201 Created, user in DB, confirmation email sent   | ⏳ Pending |
| Should reject duplicate email | User exists in DB | POST to sign-up with existing email       | 400 Bad Request, error: "Email already registered" | ⏳ Pending |
| Should reject weak password   | Empty DB          | POST to sign-up with weak password        | 400 Bad Request, error: "Password too weak"        | ⏳ Pending |

---

#### Integration Test Suite: Sign-In Flow

**File:** `tests/integration/auth/sign-in.test.ts`

| Test Case                        | Setup             | Action                                   | Expected Result                                | Status     |
| -------------------------------- | ----------------- | ---------------------------------------- | ---------------------------------------------- | ---------- |
| Should authenticate valid user   | User exists in DB | POST to sign-in with correct credentials | 200 OK, JWT token returned, session cookie set | ⏳ Pending |
| Should reject invalid password   | User exists in DB | POST to sign-in with wrong password      | 401 Unauthorized, error: "Invalid credentials" | ⏳ Pending |
| Should reject non-existent email | Empty DB          | POST to sign-in with non-existent email  | 401 Unauthorized, error: "Invalid credentials" | ⏳ Pending |

---

#### Integration Test Suite: Password Reset Flow

**File:** `tests/integration/auth/password-reset.test.ts`

| Test Case                                     | Setup             | Action                                            | Expected Result                    | Status     |
| --------------------------------------------- | ----------------- | ------------------------------------------------- | ---------------------------------- | ---------- |
| Should send reset email                       | User exists in DB | POST to /forgot-password with valid email         | 200 OK, email sent with reset link | ⏳ Pending |
| Should accept reset token and update password | Reset token valid | POST to /reset-password with token + new password | 200 OK, password updated           | ⏳ Pending |

---

#### Integration Test Suite: Session Validation

**File:** `tests/integration/auth/session-validation.test.ts`

| Test Case                                                 | Setup                                | Action         | Expected Result            | Status     |
| --------------------------------------------------------- | ------------------------------------ | -------------- | -------------------------- | ---------- |
| Should allow authenticated user to access protected route | Valid session cookie                 | GET /dashboard | 200 OK, dashboard rendered | ⏳ Pending |
| Should redirect unauthenticated user to sign-in           | No session cookie                    | GET /dashboard | 302 Redirect to /sign-in   | ⏳ Pending |
| Should refresh expired token                              | Expired session, valid refresh token | GET /dashboard | Session refreshed, 200 OK  | ⏳ Pending |

---

### 4.3 Test Data Management

**Database Setup:**

- [ ] Use Supabase test project (separate from dev/prod)
- [ ] Seed database with test users before each test
- [ ] Clean database after each test (delete test users)

**Test Fixtures:**

- `fixtures/test-users.json` — Sample user credentials

**Test Database:**

- **Technology:** Supabase (PostgreSQL)
- **Connection:** `SUPABASE_TEST_URL` environment variable

---

## 5. E2E Tests (10% of Test Suite — Critical Paths Only)

### 5.1 Test Scope

**Critical User Journeys:**

| Journey                             | Steps                                                                                                | Priority |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------- | -------- |
| Happy path: Sign-up and first login | 1. Navigate to /sign-up<br>2. Enter email/password<br>3. Submit<br>4. Verify redirected to dashboard | P0       |
| Happy path: Sign-in existing user   | 1. Navigate to /sign-in<br>2. Enter credentials<br>3. Submit<br>4. Verify dashboard loads            | P0       |

**Tool:** Playwright

**Target Browsers:**

- [x] Chromium
- [ ] Firefox (future)
- [ ] WebKit (future)

### 5.2 Test Cases

#### E2E Test Suite: Sign-Up Flow

**File:** `tests/e2e/auth/sign-up.spec.ts`

| Test Case                      | User Actions                                                                                 | Expected Outcome                                           | Status     |
| ------------------------------ | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------- |
| Happy path: Successful sign-up | 1. Navigate to /sign-up<br>2. Enter `test@example.com` / `P@ssw0rd123`<br>3. Click "Sign Up" | Redirected to /dashboard, welcome message shown            | ⏳ Pending |
| Error path: Weak password      | 1. Navigate to /sign-up<br>2. Enter valid email / `weak`<br>3. Click "Sign Up"               | Error message "Password too weak" shown, stays on /sign-up | ⏳ Pending |

---

#### E2E Test Suite: Sign-In Flow

**File:** `tests/e2e/auth/sign-in.spec.ts`

| Test Case                       | User Actions                                                                        | Expected Outcome                              | Status     |
| ------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------- | ---------- |
| Happy path: Successful sign-in  | 1. Navigate to /sign-in<br>2. Enter existing user credentials<br>3. Click "Sign In" | Redirected to /dashboard, user name displayed | ⏳ Pending |
| Error path: Invalid credentials | 1. Navigate to /sign-in<br>2. Enter wrong password<br>3. Click "Sign In"            | Error message "Invalid credentials" shown     | ⏳ Pending |

---

### 5.3 Flakiness Prevention

**Strategies to Reduce Flaky Tests:**

- [x] Use `waitForSelector` for async elements (dashboard content)
- [x] Disable animations in test environment (`prefers-reduced-motion`)
- [x] Mock email sending (use Supabase test mode)
- [x] Use `data-testid` attributes for stable locators
- [x] Run tests in headless mode for consistency

**Retry Strategy:**

- Flaky tests: Retry up to 2 times
- If test fails 2 times, mark as genuine failure

---

## 6. Security Testing

### 6.1 Security Requirements

**From Spec (Security Checklist):**

- [x] Passwords stored as bcrypt hashes (Supabase handles)
- [x] JWT tokens signed and verified
- [x] CSRF protection (Supabase + Next.js middleware)
- [x] Rate limiting on auth endpoints (5 attempts per minute)
- [x] Secrets not hardcoded (env variables)
- [x] Session tokens httpOnly cookies
- [ ] MFA support (TOTP) — Future enhancement

### 6.2 Security Test Cases

**SAST (Static Application Security Testing):**

- **Tool:** Semgrep
- **Scan Target:** Auth components, middleware, API routes
- **Threshold:** Zero high/critical vulnerabilities

**Secret Scanning:**

- **Tool:** TruffleHog
- **Scan Target:** All auth-related commits
- **Threshold:** Zero secrets exposed

**Manual Security Checks:**

- [ ] Verify JWT tokens expire after 7 days
- [ ] Verify refresh tokens rotate on use
- [ ] Verify password reset tokens expire after 1 hour
- [ ] Verify rate limiting blocks brute-force attempts

---

## 7. Accessibility Testing

### 7.1 Accessibility Requirements (WCAG 2.2 AA)

**From Spec:**

- [x] WCAG 2.2 AA compliance required
- [x] Screen reader tested
- [x] Keyboard navigation works

### 7.2 Accessibility Test Cases

**Automated Testing:**

- **Tool:** axe-core (via Playwright)
- **Scan Target:** Sign-in page, sign-up page, password reset page
- **Threshold:** Zero violations

**Manual Testing:**

- [ ] Test with VoiceOver (macOS): Sign-in form fully announced
- [ ] Test keyboard navigation: Tab through form, Enter to submit
- [ ] Verify error messages announced to screen readers
- [ ] Verify color contrast (4.5:1 for text)

---

## 8. Performance Testing

### 8.1 Performance Requirements

**From Spec (Non-Functional Requirements):**

| Metric                          | Target    | Measurement Tool |
| ------------------------------- | --------- | ---------------- |
| Sign-in API response time (p95) | <300ms    | k6 load testing  |
| Page load (sign-in page)        | <2s (LCP) | Lighthouse       |
| Time to Interactive (TTI)       | <3.5s     | Lighthouse       |

### 8.2 Load Testing Scenarios

**Tool:** k6

**Scenario: Concurrent Sign-Ins**

- **Virtual Users (VUs):** 50
- **Duration:** 2 minutes
- **Expected:** All requests <500ms, error rate <1%

**Test Script:** `tests/performance/auth-load-test.js`

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 50,
  duration: '2m',
};

export default function () {
  const payload = JSON.stringify({
    email: 'test@example.com',
    password: 'P@ssw0rd123',
  });

  const res = http.post('https://app.cohortix.com/api/auth/sign-in', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## 9. Test Execution Plan

### 9.1 Test Execution Order

1. **Pre-commit:** Linting (ESLint), Unit Tests (fast subset)
2. **PR Stage (CI/CD):**
   - Run all unit tests
   - Run integration tests
   - Run SAST (Semgrep)
   - Run secret scanning (TruffleHog)
3. **Pre-deploy Stage (Staging):**
   - Run E2E tests (Playwright)
   - Run accessibility tests (axe-core)
   - Run performance tests (k6)
4. **Production:**
   - Smoke tests only (verify sign-in works)

### 9.2 Test Environment Setup

**Local Development:**

- [ ] Install test dependencies:
      `pnpm add -D vitest @testing-library/react playwright`
- [ ] Set up Supabase test project
- [ ] Run tests: `pnpm test:auth`

**CI/CD Pipeline:**

- [ ] GitHub Actions configured
- [ ] Supabase test project seeded
- [ ] Test results published to dashboard

---

## 10. Test Coverage Targets

### 10.1 Code Coverage

**Target:** ≥80% for auth-related code

**Coverage Tool:** Vitest (c8)

**Coverage Report:** Generated in CI/CD

**Measurement:**

- Line coverage: TBD
- Branch coverage: TBD
- Function coverage: TBD

### 10.2 Acceptance Criteria Coverage

| Acceptance Criterion           | Test Type          | Test Case(s)                             | Status     |
| ------------------------------ | ------------------ | ---------------------------------------- | ---------- |
| Users can sign up              | Integration + E2E  | `sign-up.test.ts`, `sign-up.spec.ts`     | ⏳ Pending |
| Users can sign in              | Integration + E2E  | `sign-in.test.ts`, `sign-in.spec.ts`     | ⏳ Pending |
| Invalid credentials show error | Unit + Integration | `SignInForm.test.tsx`, `sign-in.test.ts` | ⏳ Pending |
| Password reset works           | Integration        | `password-reset.test.ts`                 | ⏳ Pending |
| Sessions persist               | Integration        | `session-validation.test.ts`             | ⏳ Pending |
| Protected routes redirect      | Integration + E2E  | `session-validation.test.ts`             | ⏳ Pending |

---

## 11. Known Issues & Risks

### 11.1 Known Test Gaps

- [ ] MFA flow not tested (feature not yet implemented)
- [ ] Social auth (OAuth) not tested (future feature)
- [ ] Session timeout behavior not tested (edge case)

**Mitigation:**

- Add MFA tests when feature is implemented
- Add OAuth tests when providers are configured
- Add session timeout tests in Week 3

### 11.2 Risks

| Risk                                | Impact | Likelihood | Mitigation                        |
| ----------------------------------- | ------ | ---------- | --------------------------------- |
| Supabase test project quota limits  | Medium | Low        | Use self-hosted Supabase for CI   |
| Email delivery flakiness in tests   | Low    | Medium     | Mock email service in tests       |
| Rate limiting interferes with tests | Medium | Low        | Disable rate limiting in test env |

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
