# Technical Debt Log — Cohortix Platform

**Reference:** Axon Codex v1.2 §5.4 (Technical Debt Management)  
**Owner:** Platform Team + Tech Lead  
**Last Updated:** 2026-02-11  
**Status:** Active Tracking

---

## Purpose

This document catalogs known technical debt items in the Cohortix platform, prioritizes them, and tracks remediation progress. Technical debt is not inherently bad—it represents conscious trade-offs made for speed or pragmatism. However, **untracked debt compounds** and becomes a systemic risk.

**Philosophy:** "Debt you track is debt you can manage. Debt you ignore is technical bankruptcy."

---

## Debt Classification System

| Category | Description | Risk Level |
|----------|-------------|------------|
| **🔴 Critical Debt** | Blocks production readiness, security risk, or causes frequent incidents | **High** — Must fix before launch |
| **🟡 High-Priority Debt** | Impacts developer velocity, causes moderate pain, or limits scalability | **Medium** — Fix within 2 sprints |
| **🟢 Medium-Priority Debt** | Code smells, minor refactoring opportunities, or future scalability concerns | **Low** — Schedule when capacity allows |
| **⚪ Low-Priority Debt** | "Nice to have" improvements, speculative refactoring, or aesthetic issues | **Very Low** — Track for future consideration |

---

## Current Debt Inventory

### 🔴 Critical Debt (Must Fix Before Launch)

#### TD-001: Missing Rate Limiting on API Endpoints
**Created:** 2026-02-11  
**Category:** Security  
**Impact:** Potential DoS vulnerability, OWASP API Security Top 10 violation  
**Root Cause:** Initial MVP focused on functionality over security hardening  
**Estimated Effort:** 3 days  
**Owner:** Backend Team  
**Target Resolution:** Sprint 4 (Week of 2026-02-18)

**Description:**
API endpoints in `apps/web/app/api/*` do not implement rate limiting. This exposes the platform to:
- Brute-force attacks on auth endpoints
- Resource exhaustion from malicious or misbehaving clients
- Cost overruns from LLM API abuse

**Remediation Plan:**
- [ ] Implement Redis-based rate limiter (Upstash)
- [ ] Add per-user rate limits (100 req/min authenticated, 10 req/min unauthenticated)
- [ ] Add IP-based rate limits for public endpoints
- [ ] Add cost-based rate limits for LLM endpoints (token budgets)
- [ ] Add monitoring and alerting for rate limit hits
- [ ] Document rate limits in API specs

**References:**
- Codex §2.5.5 (Security Standards)
- Codex §2.8.4 (Token Budget Management)

---

#### TD-002: No Production Observability (Logs, Metrics, Traces)
**Created:** 2026-02-11  
**Category:** DevOps / Observability  
**Impact:** Cannot diagnose production issues, no SLA monitoring, blind to user experience  
**Root Cause:** Development phase prioritized feature development over operational readiness  
**Estimated Effort:** 5 days  
**Owner:** DevOps / Guardian  
**Target Resolution:** Sprint 5 (Week of 2026-02-25)

**Description:**
Platform currently lacks structured logging, metrics, and distributed tracing:
- No centralized log aggregation (using console.log, not structured)
- No RED metrics (Rate, Errors, Duration) for API endpoints
- No distributed tracing for multi-service requests
- No real-time alerting for errors or performance degradation

**Remediation Plan:**
- [ ] Implement structured logging (Winston + JSON format, correlation IDs)
- [ ] Add OpenTelemetry instrumentation for traces
- [ ] Set up metrics collection (Prometheus-compatible)
- [ ] Configure dashboards (Grafana or Vercel Analytics)
- [ ] Define alert thresholds (error rate >1%, p95 latency >500ms)
- [ ] Document observability standards in `docs/OBSERVABILITY.md`

**References:**
- Codex §2.7 (Observability)
- Codex §4.12 (Monitoring & Observability)

---

#### TD-003: Test Coverage Below 80% Threshold
**Created:** 2026-02-11  
**Category:** Testing / Quality  
**Impact:** High risk of regressions, violates Codex quality standards  
**Root Cause:** Fast-paced feature development without TDD discipline  
**Estimated Effort:** 8 days (distributed across features)  
**Owner:** QA + Original Developers  
**Target Resolution:** Sprint 6 (Week of 2026-03-04)

**Description:**
Current test coverage is approximately **65%** (estimated), below the Codex-mandated **80% minimum**:
- Many components lack unit tests
- API endpoints missing integration tests
- No E2E tests for critical user journeys (signup, agent creation, workspace navigation)

**Remediation Plan:**
- [ ] Audit all untested code paths
- [ ] Write unit tests for core business logic (70% of test suite)
- [ ] Write integration tests for API routes (20% of test suite)
- [ ] Write E2E tests for critical flows (10% of test suite)
- [ ] Add mutation testing (Stryker) for critical modules
- [ ] Enforce coverage gates in CI (fail PR if coverage <80%)

**References:**
- Codex §4.1 (Testing Pyramid)
- Codex §4.2.3 (Coverage Standards)

---

### 🟡 High-Priority Debt (Fix Within 2 Sprints)

#### TD-004: Hardcoded Configuration Values in Components
**Created:** 2026-02-11  
**Category:** Configuration / Maintainability  
**Impact:** Difficult to change behavior, environment-specific logic scattered  
**Root Cause:** Rapid prototyping without proper config abstraction  
**Estimated Effort:** 2 days  
**Owner:** Frontend Team  
**Target Resolution:** Sprint 5

**Description:**
Configuration values (API URLs, feature flags, timeouts) are hardcoded in multiple components instead of centralized:
```tsx
// Bad (current)
const API_URL = "https://api.cohortix.com"; // hardcoded

// Good (desired)
const API_URL = env.NEXT_PUBLIC_API_URL;
```

**Remediation Plan:**
- [ ] Centralize config in `packages/config/src/index.ts`
- [ ] Use environment variables for runtime config
- [ ] Add validation using Zod schemas
- [ ] Migrate all hardcoded values to config system

**References:**
- Codex §1.3.1 (Environment Configuration)

---

#### TD-005: Missing API OpenAPI/Swagger Documentation
**Created:** 2026-02-11  
**Category:** Documentation  
**Impact:** Difficult for frontend developers to consume APIs, violates Codex standards  
**Root Cause:** APIs built before documentation standards established  
**Estimated Effort:** 3 days  
**Owner:** Backend Team  
**Target Resolution:** Sprint 5

**Description:**
API endpoints are documented in `docs/API_DESIGN.md` but lack OpenAPI spec generation:
- No interactive API explorer (Swagger UI)
- No auto-generated TypeScript types from API schemas
- Manual documentation prone to drift

**Remediation Plan:**
- [ ] Add OpenAPI generator (e.g., `@asteasolutions/zod-to-openapi`)
- [ ] Generate schemas from Zod validation
- [ ] Set up Swagger UI at `/api-docs`
- [ ] Automate schema generation in CI

**References:**
- Codex §2.1.5 (OpenAPI Documentation)

---

#### TD-006: No Backup/Restore Strategy for Supabase Data
**Created:** 2026-02-11  
**Category:** DevOps / Data Integrity  
**Impact:** Risk of data loss, no disaster recovery plan  
**Root Cause:** Development environment does not require backups  
**Estimated Effort:** 2 days  
**Owner:** DevOps  
**Target Resolution:** Sprint 5

**Description:**
No automated backup strategy for production Supabase database:
- No scheduled backups configured
- No tested restore procedure
- No point-in-time recovery plan

**Remediation Plan:**
- [ ] Enable Supabase automated daily backups (7-day retention)
- [ ] Document manual backup/restore procedure
- [ ] Test restore process in staging
- [ ] Add backup monitoring (alert if backup fails)

---

### 🟢 Medium-Priority Debt (Schedule When Capacity Allows)

#### TD-007: Inconsistent Error Handling Patterns
**Created:** 2026-02-11  
**Category:** Code Quality  
**Impact:** Harder to debug, inconsistent user experience  
**Root Cause:** Multiple developers, no enforced error handling pattern  
**Estimated Effort:** 4 days  
**Owner:** Tech Lead  
**Target Resolution:** Sprint 7

**Description:**
Error handling varies across codebase:
- Some routes use `try/catch` with console.error
- Some use error boundaries
- Some return generic "Something went wrong" messages
- No structured error types

**Remediation Plan:**
- [ ] Define standard error types (e.g., `AuthError`, `ValidationError`, `ExternalAPIError`)
- [ ] Implement global error handler
- [ ] Add error serialization utilities
- [ ] Update all error handling to use standard pattern

**References:**
- Codex §2.6 (Error Handling)

---

#### TD-008: Client Components Over-Used (Should Be Server Components)
**Created:** 2026-02-11  
**Category:** Performance / Architecture  
**Impact:** Larger bundle size, slower page loads, violates Codex defaults  
**Root Cause:** Developers defaulting to client components due to familiarity  
**Estimated Effort:** 3 days  
**Owner:** Frontend Team  
**Target Resolution:** Sprint 7

**Description:**
Many components have `"use client"` directive when they could be Server Components:
- Static content rendered client-side
- Data fetching done client-side instead of server-side
- Unnecessary client JavaScript shipped to browser

**Remediation Plan:**
- [ ] Audit all components with `"use client"`
- [ ] Refactor static components to Server Components
- [ ] Move data fetching to server where possible
- [ ] Measure bundle size reduction

**References:**
- Codex §3.2.1 (Server vs Client Boundaries)

---

#### TD-009: No Accessibility (a11y) Testing
**Created:** 2026-02-11  
**Category:** Accessibility / Compliance  
**Impact:** WCAG 2.2 AA non-compliance, potential legal risk  
**Root Cause:** Accessibility not prioritized in early development  
**Estimated Effort:** 5 days (ongoing)  
**Owner:** Frontend Team + QA  
**Target Resolution:** Sprint 8

**Description:**
No automated accessibility testing:
- No axe-core integration
- No screen reader testing
- Many components missing ARIA attributes
- Color contrast not validated

**Remediation Plan:**
- [ ] Add `@axe-core/react` to dev dependencies
- [ ] Integrate axe into Vitest component tests
- [ ] Run Lighthouse accessibility audits in CI
- [ ] Conduct manual screen reader testing
- [ ] Fix identified violations

**References:**
- Codex §3.4 (Accessibility — WCAG 2.2 AA)
- Codex §4.6.3 (Accessibility Testing)

---

### ⚪ Low-Priority Debt (Track for Future)

#### TD-010: Monorepo Turborepo Configuration Could Be Optimized
**Created:** 2026-02-11  
**Category:** Developer Experience  
**Impact:** Slower CI builds, minor developer friction  
**Root Cause:** Default Turborepo config, not tuned for our workload  
**Estimated Effort:** 1 day  
**Owner:** DevOps  
**Target Resolution:** Backlog

**Description:**
Turborepo caching and task dependencies could be more aggressive:
- Some tasks run sequentially that could be parallel
- Remote cache not fully utilized
- Some outputs not cached

**Remediation Plan:**
- [ ] Profile current build times
- [ ] Optimize task dependencies in `turbo.json`
- [ ] Enable remote cache for all tasks
- [ ] Measure improvement

---

#### TD-011: Design System Tokens Not Fully Atomic
**Created:** 2026-02-11  
**Category:** Design System  
**Impact:** Harder to maintain consistent design, manual CSS updates  
**Root Cause:** Design system evolved organically  
**Estimated Effort:** 3 days  
**Owner:** Design + Frontend  
**Target Resolution:** Backlog

**Description:**
Design tokens (colors, spacing, typography) are partially defined in Tailwind config but not fully atomic:
- Some components use hardcoded values
- No semantic color tokens (e.g., `brand-primary`, `error-dark`)
- Spacing scale not consistently applied

**Remediation Plan:**
- [ ] Define semantic color tokens
- [ ] Extract all hardcoded values to tokens
- [ ] Document token usage guidelines
- [ ] Add linting rules to prevent hardcoded values

**References:**
- Codex §3.7.1 (Design Tokens)

---

## Debt Metrics & Trends

### Current Snapshot (as of 2026-02-11)

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Critical Debt Items** | 3 | 0 | 🔴 Action Required |
| **High-Priority Debt Items** | 3 | <2 | 🟡 Needs Attention |
| **Medium-Priority Debt Items** | 3 | <5 | 🟢 Acceptable |
| **Total Estimated Remediation Days** | 39 days | N/A | — |
| **Test Coverage** | ~65% | 80%+ | 🔴 Below Target |
| **Avg Debt Age** | <1 month | N/A | 🟢 Fresh Tracking |

### Monthly Trend (Goal)

Track these metrics monthly:
- New debt added vs. debt resolved
- Average age of open debt items
- Percentage of sprints with debt remediation work
- Debt by category (Security, Performance, Testing, etc.)

**Target:** Reduce critical debt to 0 before launch, maintain <5 high-priority items.

---

## Debt Prevention Strategies

### 1. Definition of Done (DoD) Enforcement
Every PR must meet:
- [ ] Unit tests written (or justified exception)
- [ ] Integration tests for API changes
- [ ] Documentation updated
- [ ] No new hardcoded config values
- [ ] Accessibility checked (if UI change)
- [ ] Security scan passed (Snyk + Semgrep)

### 2. Quarterly Debt Review
- Review this log in sprint planning
- Allocate 10-20% of sprint capacity to debt remediation
- Archive resolved debt items

### 3. Debt Budget
- No more than **3 critical debt items** at any time (current: 3 ⚠️)
- No more than **5 high-priority items** at any time (current: 3 ✅)
- Track in sprint retrospectives

### 4. Root Cause Analysis
When new debt is added, ask:
- Why did this happen?
- How can we prevent similar debt in the future?
- Should we update the Codex or our processes?

---

## Escalation Path

| Debt Severity | Escalate To | Timeline |
|---------------|-------------|----------|
| **Critical** | CEO + Tech Lead | Immediate (same day) |
| **High** | Tech Lead | Next sprint planning |
| **Medium** | Team Lead | Quarterly review |
| **Low** | Track only | As capacity allows |

---

## Resolved Debt Archive

Moved to `docs/tech-debt-archive/YYYY-MM.md` when resolved.

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-02-11 | Initial debt log created | Guardian (Hafiz) |

---

*Next Review: 2026-03-11 (Monthly debt review)*
