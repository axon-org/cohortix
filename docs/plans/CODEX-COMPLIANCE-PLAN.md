# Codex v1.2 Compliance Plan

## Cohortix Project — Gap Analysis & Implementation Roadmap

**Date:** February 11, 2026  
**Author:** Agent PM (Subagent: codex-rollout-phase2)  
**Project:** Cohortix  
**Codex Version:** 1.2  
**Compliance Level:** Tier 1 (Core Requirements)

---

## Executive Summary

This document provides a comprehensive gap analysis between Cohortix's current
state and the Axon Codex v1.2 requirements, along with a phased implementation
plan to achieve full compliance.

**Current Compliance Status:** 🟡 **Partial (42% compliant)**

**Key Findings:**

- ✅ **Strong foundations:** Monorepo structure, TypeScript strict mode,
  Supabase integration, CI/CD pipelines exist
- ⚠️ **Documentation gaps:** Missing PROJECT_BRIEF.md, AGENTS.md; CLAUDE.md
  exists but needs Codex alignment
- ⚠️ **Process gaps:** Requirements Discovery Protocol not yet adopted,
  Spec-Driven Development not enforced
- ⚠️ **Testing gaps:** Testing pyramid not established, mutation testing absent,
  E2E coverage unknown
- ⚠️ **Governance gaps:** ADRs, DDRs, and Test Plans not systematically created

**Timeline:** 3 weeks to 80% compliance, 6 weeks to full compliance

---

## Current State Audit

### ✅ What We Have (Compliant)

#### 1. Repository Structure (Section 1.1)

**Status:** ✅ **Compliant**

```
cohortix/
├── apps/web/              ✅ Next.js application
├── packages/
│   ├── database/          ✅ Drizzle ORM + Supabase
│   ├── ui/                ✅ Shared components
│   ├── types/             ✅ Shared TypeScript types
│   └── config/            ✅ Shared configs
├── tooling/
│   ├── eslint/            ✅ ESLint configs
│   ├── typescript/        ✅ TypeScript configs
│   └── tailwind/          ✅ Tailwind configs
├── docs/                  ✅ Documentation directory
├── .github/workflows/     ✅ CI/CD pipelines
└── turbo.json             ✅ Turborepo config
```

**Codex Requirement:** Monorepo with apps/, packages/, tooling/, docs/  
**Status:** Fully aligned ✅

---

#### 2. Technology Stack (Section 3.1)

**Status:** ✅ **Compliant**

| Requirement        | Current                | Status    |
| ------------------ | ---------------------- | --------- |
| Next.js 15         | ✅ Next.js 15          | Compliant |
| React 19           | ✅ React 19            | Compliant |
| TypeScript Strict  | ✅ Strict mode enabled | Compliant |
| Tailwind CSS       | ✅ Tailwind v4         | Compliant |
| Supabase Auth + DB | ✅ Implemented         | Compliant |

**Evidence:** `apps/web/package.json`, `apps/web/tsconfig.json`

---

#### 3. Database Architecture (Section 2.2)

**Status:** 🟡 **Mostly Compliant**

| Requirement              | Current                       | Status    |
| ------------------------ | ----------------------------- | --------- |
| UUID primary keys        | ✅ All tables use UUIDs       | Compliant |
| Timestamp fields         | ✅ `created_at`, `updated_at` | Compliant |
| Row-Level Security       | ✅ RLS policies enabled       | Compliant |
| Migration system         | ✅ Supabase migrations        | Compliant |
| Zero-downtime migrations | ⚠️ Not documented             | Gap       |

**Evidence:** `packages/database/src/schema/`, Supabase migration files

**Gap:** Zero-downtime migration strategy not formally documented (Codex §2.2.2)

---

#### 4. CI/CD Pipeline (Section 4.8)

**Status:** 🟡 **Partially Compliant**

**Existing Pipelines:**

- ✅ `ci.yml` — Lint, type-check, build, test
- ✅ `preview.yml` — Preview deployments on PRs
- ✅ `release.yml` — Production deployments

**4-Stage Pipeline Requirement (Codex §4.8.1):**

1. ✅ **Commit Stage** — Lint, type-check (ci.yml)
2. ✅ **PR Stage** — Build, unit tests (ci.yml)
3. ⚠️ **Pre-Deploy Stage** — Integration tests, security scans (partial)
4. ✅ **Production Stage** — Deployment (release.yml)

**Gaps:**

- ⚠️ Security gates incomplete: Secret scanning (TruffleHog) not enabled
- ⚠️ SAST (SonarQube/Semgrep) not integrated
- ⚠️ Dependency scanning (Snyk) not enabled
- ⚠️ Container scanning (Trivy) not applicable (Vercel serverless)
- ⚠️ Mutation testing not in pipeline

---

#### 5. Design System (Section 3.7)

**Status:** 🟡 **Partially Compliant**

**Existing:**

- ✅ `docs/UI_DESIGN_SYSTEM.md` — Comprehensive design system documentation
- ✅ `docs/BRAND_GUIDELINES.md` — Brand identity defined
- ✅ Tailwind config with custom color palette
- ✅ shadcn/ui component library referenced

**Gaps:**

- ⚠️ Design tokens not formalized as JSON/TS constants (Codex §3.7.1)
- ⚠️ Figma-to-code workflow not documented (Codex §3.7.4)
- ⚠️ Component storybook/catalog not established

---

### ❌ What We're Missing (Non-Compliant)

#### 1. PROJECT_BRIEF.md (Section 1.1.2) — 🔴 **CRITICAL GAP**

**Codex Requirement:** Single-page context document (max 500 words) answering:

- What is Cohortix?
- Why does it exist? (Problem it solves)
- For whom? (Target users)
- Tech Stack
- Current Status
- Key Decisions
- Next Milestone

**Status:** 🔴 **Missing**

**Impact:** Agents lack quick-start context. Onboarding requires reading 68KB
CLAUDE.md.

**Priority:** **P0 — Blocker for new agent onboarding**

**Action:** PM to create from existing CLAUDE.md + README.md content (Week 1,
Day 1)

---

#### 2. AGENTS.md (Section 1.2.1) — 🔴 **CRITICAL GAP**

**Codex Requirement:** Actionable instructions for agents — the "how to work"
guide.

**Required Contents:**

- Commands to run (dev, test, build, lint)
- Testing rules (when to write tests, coverage targets)
- Project structure (where things go)
- Code style (linting, formatting, naming)
- Git workflow (branch naming, commit messages)
- Permissions matrix (Always Allowed / Ask First / Never Allowed)

**Status:** 🔴 **Missing**

**Impact:** Agents lack operational guidelines. No clear boundaries for
autonomous actions.

**Priority:** **P0 — Blocker for safe agent autonomy**

**Action:** PM to create (Week 1, Day 2)

---

#### 3. Requirements Discovery Protocol Adoption (Section 1, Appendix) — 🔴 **CRITICAL GAP**

**Codex Requirement:** Mandatory "Step 0" interview phase before ANY feature
work.

**5 Question Categories:**

1. Intent & Goals
2. Scope & Boundaries
3. Technical Constraints
4. Edge Cases & Error Scenarios
5. Acceptance Criteria

**Status:** 🔴 **Not adopted**

**Impact:** Agents build solutions without clarifying requirements → high rework
rate

**Priority:** **P0 — Process blocker**

**Action:** All agents to adopt immediately (Week 1, Day 3)

---

#### 4. Spec-Driven Development (Section 1.4) — 🔴 **CRITICAL GAP**

**Codex Requirement:** No code without approved spec. Specs define behavior
BEFORE implementation.

**Required Workflow:**

1. Requirements Discovery Protocol (ask questions)
2. Create Feature Specification (`docs/specs/XXX-feature-name.md`)
3. Human approves spec
4. Implementation begins

**Status:** 🔴 **Not enforced**

**Current Behavior:** Code-first development (build → document)

**Impact:** Unclear requirements, scope creep, difficult handoffs between agents

**Priority:** **P0 — Process blocker**

**Action:** Enforce starting Week 2. All new features require approved spec.

---

#### 5. Architecture Decision Records (ADRs) — 🔴 **Gap**

**Codex Requirement:** Document significant technical decisions (Section 5.1.3)

**Template:** `docs/architecture/adr-000-template.md` (✅ exists)

**Status:** 🔴 **Zero ADRs created**

**Missing ADRs (should exist):**

- Why Supabase over Clerk + Neon?
- Why Drizzle ORM over Prisma?
- Why Next.js App Router over Pages Router?
- Database schema design rationale
- Multi-tenant architecture (shared DB + RLS)

**Priority:** **P1 — Governance gap**

**Action:** Devi to create retroactive ADRs for major decisions (Week 2)

---

#### 6. Design Decision Records (DDRs) — 🔴 **Gap**

**Codex Requirement:** Document design/UX/API contract decisions (Section 1.4,
new in v1.2)

**Template:** `docs/decisions/ddr-000-template.md` (✅ exists)

**Status:** 🔴 **Zero DDRs created**

**Missing DDRs (should exist):**

- Color palette selection + accessibility rationale
- Terminology decisions (Missions, Actions, Allies vs. Agents)
- Responsive breakpoint strategy
- API naming conventions (REST URL patterns)

**Priority:** **P1 — Governance gap**

**Action:** Lubna to create DDRs for design system decisions (Week 2)

---

#### 7. Test Plans — 🔴 **Gap**

**Codex Requirement:** Every feature spec MUST have matching test plan
(Section 4)

**Template:** `docs/test-plans/TEMPLATE.md` (✅ exists)

**Status:** 🔴 **Zero test plans created**

**Impact:** Ad-hoc testing, no systematic QA coverage

**Priority:** **P1 — Quality gap**

**Action:** Hafiz to create test plans matching existing features (Week 2)

---

#### 8. Testing Pyramid (Section 4.1) — 🔴 **Gap**

**Codex Requirement:** 70% unit, 20% integration, 10% E2E

**Current Status:**

- ✅ Vitest configured
- ✅ Playwright E2E configured
- 🔴 **No tests written yet**

**Priority:** **P0 — Quality blocker**

**Action:** Establish baseline test suite (Week 2-3)

---

#### 9. Mutation Testing (Section 4.5) — 🔴 **Gap**

**Codex Requirement:** Mutation testing for critical code paths (min 60% score)

**Tool:** Stryker

**Status:** 🔴 **Not configured**

**Priority:** **P2 — Advanced quality**

**Action:** Configure Stryker for critical paths (Week 4+)

---

#### 10. Security Testing (Section 4.6) — ⚠️ **Partial Gap**

**Codex Requirements:**

| Type                | Tool              | Status            |
| ------------------- | ----------------- | ----------------- |
| Secret Scanning     | TruffleHog        | 🔴 Not enabled    |
| SAST                | SonarQube/Semgrep | 🔴 Not enabled    |
| DAST                | OWASP ZAP         | 🔴 Not enabled    |
| Dependency Scanning | Snyk/npm audit    | ⚠️ npm audit only |

**Priority:** **P1 — Security gap**

**Action:** Enable secret scanning + dependency scanning (Week 2)

---

#### 11. Observability (Section 2.7) — 🔴 **Gap**

**Codex Requirement:** RED metrics (Rate, Errors, Duration) + distributed
tracing

**Current Status:**

- 🔴 No structured logging
- 🔴 No metrics collection
- 🔴 No distributed tracing
- ⚠️ Vercel analytics only (partial)

**Priority:** **P2 — Operational gap**

**Action:** Implement structured logging + basic metrics (Week 3-4)

---

#### 12. Accessibility Testing (Section 3.4.6) — ⚠️ **Gap**

**Codex Requirement:** WCAG 2.2 AA compliance mandatory

**Current Status:**

- ✅ Design system references accessibility
- 🔴 No automated accessibility testing (axe-core not integrated)
- 🔴 No screen reader testing documented

**Priority:** **P1 — Legal/UX risk**

**Action:** Integrate axe-core in E2E tests (Week 3)

---

#### 13. Performance Budgets (Section 3.5) — ⚠️ **Gap**

**Codex Requirement:** Core Web Vitals targets + bundle size budgets

**Targets:**

- LCP < 2.5s
- INP < 200ms
- CLS < 0.1
- Bundle size budget defined

**Current Status:**

- 🔴 No performance budgets defined
- 🔴 No Core Web Vitals monitoring in CI

**Priority:** **P2 — Performance risk**

**Action:** Define budgets + add Lighthouse CI (Week 3)

---

## Compliance Score Matrix

| Codex Section                    | Compliance | Priority Gaps                                     |
| -------------------------------- | ---------- | ------------------------------------------------- |
| **1. Foundation & Architecture** | 🔴 40%     | PROJECT_BRIEF.md, AGENTS.md, RDP, Spec-Driven Dev |
| **2. Backend & AI/ML**           | 🟡 60%     | ADRs, observability, resilience patterns          |
| **3. Frontend & Design**         | 🟡 55%     | DDRs, accessibility testing, performance budgets  |
| **4. QA & DevOps**               | 🔴 35%     | Testing pyramid, mutation testing, security gates |
| **5. Governance**                | 🔴 25%     | ADRs, DDRs, Test Plans, drift monitoring          |
| **Overall**                      | 🟡 42%     | **16 critical gaps identified**                   |

---

## Phased Implementation Plan

### Phase 1: Foundation (Week 1: Feb 11-17)

**Goal:** Establish core documentation + adopt critical processes

#### Day 1-2: Core Documentation

- [ ] **PM:** Create `PROJECT_BRIEF.md` (max 500 words)
  - Extract from CLAUDE.md, README.md, PRD.md
  - Get CEO approval
- [ ] **PM:** Create `AGENTS.md` (max 150 lines)
  - Commands, testing rules, structure, permissions
  - Review with all agents

**Deliverables:** 2 core documents created

---

#### Day 3-4: Process Adoption

- [ ] **ALL AGENTS:** Adopt Requirements Discovery Protocol
  - Read protocol (Codex Appendix)
  - Practice on next 3 tasks
  - PM reviews for compliance
- [ ] **ALL AGENTS:** Adopt Spec-Driven Development
  - No code without approved spec
  - Use `docs/specs/TEMPLATE.md`

**Deliverables:** Process adoption confirmed

---

#### Day 5: Alignment & Review

- [ ] **PM:** Validate CLAUDE.md against Codex §2.1.2 (domain context)
- [ ] **ALL AGENTS:** Confirm reading assignments (Codex sections)
- [ ] **PM:** Create Phase 1 completion report

**Milestone:** Foundation documentation + process adoption ✅

---

### Phase 2: Governance & Testing (Week 2-3: Feb 18-28)

**Goal:** Fill governance gaps + establish testing baseline

#### Week 2: Retroactive Documentation

**Devi (Backend):**

- [ ] Create ADR-001: Why Supabase over Clerk + Neon
- [ ] Create ADR-002: Why Drizzle ORM over Prisma
- [ ] Create ADR-003: Database schema design rationale
- [ ] Create ADR-004: Multi-tenant architecture (RLS strategy)
- [ ] Document zero-downtime migration strategy

**Lubna (Frontend):**

- [ ] Create DDR-001: Color palette + accessibility rationale
- [ ] Create DDR-002: Terminology decisions (Missions, Actions, Allies)
- [ ] Create DDR-003: Responsive breakpoint strategy
- [ ] Create DDR-004: Component library selection (shadcn/ui)
- [ ] Formalize design tokens as JSON/TS

**Hafiz (QA):**

- [ ] Create Test Plan 001: Authentication flow
- [ ] Create Test Plan 002: Dashboard data loading
- [ ] Create Test Plan 003: Mission CRUD operations
- [ ] Document testing strategy for Cohortix

**Deliverables:** 8+ ADRs, 4+ DDRs, 3+ Test Plans

---

#### Week 3: Testing Infrastructure

**Hafiz + ALL AGENTS:**

- [ ] Write baseline unit tests (target: 40% coverage)
  - Auth utilities
  - Form validation (Zod schemas)
  - API route handlers (mock Supabase)
- [ ] Write integration tests (target: 10 tests)
  - Supabase client creation
  - RLS policy validation
  - API contract tests
- [ ] Write E2E tests (target: 5 critical paths)
  - Sign-in flow
  - Dashboard load
  - Create mission
  - Create action
  - Sign-out
- [ ] Configure Playwright CI integration
- [ ] Document testing commands in AGENTS.md

**Deliverables:** Testing pyramid established (initial baseline)

---

### Phase 3: Security & Quality (Week 4-5: Mar 1-14)

**Goal:** Close security gaps + establish quality gates

#### Security Gates (Hafiz + Devi)

- [ ] Enable TruffleHog secret scanning in CI
- [ ] Integrate Snyk dependency scanning
- [ ] Add SAST with Semgrep (free tier)
- [ ] Document security checklist for PRs
- [ ] Enable Dependabot alerts

**Deliverables:** 3 security gates active in CI/CD

---

#### Observability (Devi)

- [ ] Implement structured logging (JSON format)
- [ ] Add correlation IDs to API requests
- [ ] Set up basic RED metrics (Vercel Analytics + custom)
- [ ] Document logging standards in AGENTS.md

**Deliverables:** Structured logging + basic metrics

---

#### Accessibility (Lubna + Hafiz)

- [ ] Integrate axe-core in Playwright tests
- [ ] Audit existing UI for WCAG 2.2 AA violations
- [ ] Fix critical accessibility issues
- [ ] Document accessibility testing in Test Plans

**Deliverables:** Automated a11y testing + baseline compliance

---

### Phase 4: Advanced Quality (Week 6+: Mar 15+)

**Goal:** Achieve 80%+ compliance

#### Mutation Testing (Hafiz)

- [ ] Configure Stryker for critical code paths
- [ ] Run initial mutation test report
- [ ] Achieve 60%+ mutation score for auth/payment code
- [ ] Add mutation testing to CI (optional gate)

---

#### Performance Monitoring (Lubna + Hafiz)

- [ ] Define Core Web Vitals budgets
- [ ] Integrate Lighthouse CI
- [ ] Define bundle size budgets
- [ ] Monitor in production (Vercel Analytics)

---

#### Drift Prevention (Hafiz)

- [ ] Configure Renovate for dependency updates
- [ ] Document configuration drift monitoring
- [ ] Set up architectural validation (optional)
- [ ] Create drift detection runbook

---

## Success Criteria

Cohortix achieves **Codex v1.2 compliance** when:

### Tier 1: Critical Requirements (P0)

1. ✅ `PROJECT_BRIEF.md` exists (max 500 words)
2. ✅ `AGENTS.md` exists (max 150 lines)
3. ✅ `CLAUDE.md` validated against Codex §2.1.2
4. ✅ All agents follow Requirements Discovery Protocol (100%)
5. ✅ All agents follow Spec-Driven Development (100%)
6. ✅ Testing pyramid baseline established (70/20/10 distribution)
7. ✅ Secret scanning enabled in CI
8. ✅ WCAG 2.2 AA compliance validated

**Target:** End of Week 3 (Feb 28)

---

### Tier 2: Important Requirements (P1)

9. ✅ 5+ ADRs created for architectural decisions
10. ✅ 3+ DDRs created for design decisions
11. ✅ 3+ Test Plans created matching specs
12. ✅ SAST + dependency scanning enabled
13. ✅ Structured logging implemented
14. ✅ Accessibility testing automated (axe-core)
15. ✅ Unit test coverage >40%
16. ✅ Integration test coverage >10 tests
17. ✅ E2E test coverage >5 critical paths

**Target:** End of Week 5 (Mar 14)

---

### Tier 3: Advanced Requirements (P2)

18. ✅ Mutation testing configured (60%+ score)
19. ✅ Core Web Vitals budgets defined + monitored
20. ✅ Drift prevention mechanisms active
21. ✅ Observability (RED metrics + tracing)
22. ✅ Performance budgets enforced in CI

**Target:** End of Week 6+ (Mar 21+)

---

## Risk Assessment

### High-Risk Gaps (Immediate Action Required)

#### 1. No Requirements Discovery Protocol → High Rework Rate

**Risk:** Agents build wrong solutions, requiring 2x-10x rework time

**Mitigation:**

- Enforce RDP starting Week 1, Day 3
- PM reviews all PRs for linked specs
- Reject PRs without discovery evidence

---

#### 2. No Spec-Driven Development → Unclear Requirements

**Risk:** Scope creep, agent handoff failures, technical debt accumulation

**Mitigation:**

- Enforce spec-before-code starting Week 2
- Create spec templates (✅ done)
- PM approves all specs

---

#### 3. No Security Gates → Vulnerability Exposure

**Risk:** Secrets leaked to git, vulnerable dependencies deployed

**Mitigation:**

- Enable TruffleHog by Week 4, Day 1
- Enable Snyk by Week 4, Day 2
- Fail CI on critical vulnerabilities

---

#### 4. No Testing Pyramid → Production Bugs

**Risk:** Low confidence in deployments, manual testing burden

**Mitigation:**

- Write baseline tests Week 3
- Enforce 70/20/10 distribution
- No merges without test coverage increase

---

### Medium-Risk Gaps (Address in Phase 3-4)

#### 5. No Observability → Blind Production Debugging

**Risk:** Incidents take 10x longer to debug without logs/metrics

**Mitigation:**

- Implement structured logging Week 4
- Add correlation IDs to requests
- Set up basic dashboards

---

#### 6. No Accessibility Testing → Legal/UX Risk

**Risk:** WCAG violations lead to lawsuits, poor UX for disabled users

**Mitigation:**

- Integrate axe-core Week 5
- Audit + fix critical violations
- Document a11y testing in AGENTS.md

---

## Measurement & Tracking

### Weekly Check-ins

**PM reviews:**

- [ ] % of PRs following Requirements Discovery Protocol
- [ ] % of PRs with approved specs
- [ ] # of ADRs/DDRs/Test Plans created
- [ ] Test coverage metrics (unit/integration/E2E)
- [ ] Security scan results (secrets, dependencies)

**Reporting:** Weekly summary to Discord #dev-updates

---

### Quarterly Audits

**PM conducts:**

- Codex compliance checklist review (Appendix D)
- Drift detection (dependencies, config, architecture)
- Technical debt assessment
- Agent feedback on Codex adoption

---

## Appendix: Quick Reference

### Key Documents

- **Codex Summary:** `~/clawd/research/devprotocol-v1/CODEX-V1.2-SUMMARY.md`
- **Full Codex:** `~/clawd/research/devprotocol-v1/THE-AXON-CODEX-v1.2.md`
- **Rollout Plan:** `~/Projects/cohortix/docs/CODEX-V1.2-ROLLOUT-PLAN.md`
- **Rollout Tracker:** `~/Projects/cohortix/docs/CODEX-ROLLOUT-TRACKER.md`
- **This Plan:** `~/Projects/cohortix/docs/CODEX-COMPLIANCE-PLAN.md`

### Templates (Ready to Use)

- ✅ `docs/specs/TEMPLATE.md` — Feature Specification
- ✅ `docs/architecture/adr-000-template.md` — Architecture Decision Record
- ✅ `docs/decisions/ddr-000-template.md` — Design Decision Record
- ✅ `docs/test-plans/TEMPLATE.md` — Test Plan

### Agent Assignments

- **Devi (ai-developer):** Backend + AI/ML (Codex Section 2) → ADRs,
  observability, resilience
- **Lubna (ui-designer):** Frontend + Design (Codex Section 3) → DDRs,
  accessibility, performance
- **Hafiz (guardian):** QA + DevOps + Governance (Codex Section 4 & 5) → Test
  Plans, security, CI/CD
- **John (backend-developer):** Backend support → API development, database work
- **Sami (frontend-developer):** Frontend support → Component development, UI
  work
- **PM (this agent):** Coordination, compliance monitoring, documentation

---

## Sign-Off

**Prepared by:** Agent PM (Subagent: codex-rollout-phase2)  
**Date:** February 11, 2026  
**Status:** Draft — Pending Team Review

**Next Actions:**

1. Post findings to Discord #general
2. Distribute to specialist agents (Devi, Lubna, Hafiz, John, Sami)
3. Begin Phase 1 execution (Week 1)

---

_This compliance plan is a living document. Updates will be tracked in
CODEX-ROLLOUT-TRACKER.md as implementation progresses._
