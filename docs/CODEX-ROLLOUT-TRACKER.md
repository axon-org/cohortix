# Axon Codex v1.2 Rollout Tracker

## Cohortix Project Implementation

**Rollout Start Date:** February 11, 2026  
**Project:** Cohortix  
**PM Lead:** Agent PM  
**Status:** 🟡 In Progress

---

## Rollout Overview

This tracker monitors the adoption of the Axon Codex v1.2 across all Cohortix
development agents. Each specialist is assigned relevant sections to read,
internalize, and implement in their work.

---

## Section Assignments

### 📚 Section 1: Foundation & Architecture

**Assigned to:** ALL AGENTS  
**Status:** 🔵 Pending  
**Reading Materials:**

- `~/clawd/research/devprotocol-v1/CODEX-V1.2-SUMMARY.md`
- `~/clawd/research/devprotocol-v1/THE-AXON-CODEX-v1.2.md` (Section 1)

**Key Topics:**

- Project Structure & Repository Standards
- Context Engineering (`AGENTS.md` vs `CLAUDE.md`)
- Multi-Agent Coordination ("Stewnami" Prevention)
- Requirements Discovery Protocol v1.1
- Spec-Driven Development

**Assigned Agents:**

- Devi (ai-developer) — 🔵 Pending
- Lubna (ui-designer) — 🔵 Pending
- Hafiz (guardian) — 🔵 Pending
- PM (coordination lead) — ✅ Complete

**Adoption Checklist:**

- [ ] Read Section 1 of Codex
- [ ] Understand Requirements Discovery Protocol
- [ ] Review Scaffold-First, Plan-Iterate approach
- [ ] Internalize Spec-Driven Development workflow

---

### 🔧 Section 2: Backend & AI/ML Development

**Assigned to:** Devi (ai-developer)  
**Status:** 🔵 Pending  
**Reading Materials:**

- `~/clawd/research/devprotocol-v1/THE-AXON-CODEX-v1.2.md` (Section 2, Part A &
  B)

**Key Topics:**

- **Part A: Backend**
  - API Design Standards (REST, versioning, RFC 7807 errors)
  - Database Architecture (UUID keys, zero-downtime migrations)
  - Authentication & Authorization (JWT, RBAC)
  - Resilience Engineering (Circuit breakers, retries, bulkheads)
  - Security Standards (OWASP Top 10)
  - Error Handling & Observability (RED metrics)

- **Part B: AI/ML**
  - LLM Integration Architecture
  - Prompt Engineering (versioning, regression testing)
  - RAG Systems (chunking, retrieval strategies)
  - Agent Orchestration (tool calling, state management)
  - AI Security (OWASP Agentic Top 10: Prompt injection)
  - AI Quality Assurance & Cost Optimization

**Adoption Checklist:**

- [ ] Read Section 2 of Codex
- [ ] Understand API design conventions
- [ ] Internalize resilience patterns (circuit breakers, retries)
- [ ] Review OWASP Agentic Top 10 security standards
- [ ] Understand RAG architecture patterns
- [ ] Apply prompt versioning in all AI work

---

### 🎨 Section 3: Frontend & Design

**Assigned to:** Lubna (ui-designer)  
**Status:** 🔵 Pending  
**Reading Materials:**

- `~/clawd/research/devprotocol-v1/THE-AXON-CODEX-v1.2.md` (Section 3)

**Key Topics:**

- Framework Standards (Next.js 15, React 19, TypeScript strict)
- Component Architecture (Server vs. Client boundaries)
- State Management Hierarchy (URL > Server > Form > Client)
- Accessibility (WCAG 2.2 AA compliance)
- Performance Optimization (Core Web Vitals)
- Styling Standards (Tailwind CSS)
- Design Systems (Design tokens, shadcn/ui)
- Forms & Validation (React Hook Form + Zod)
- Testing (Component, Visual Regression, E2E)

**Adoption Checklist:**

- [ ] Read Section 3 of Codex
- [ ] Understand Server vs. Client Component boundaries
- [ ] Internalize accessibility requirements (WCAG 2.2 AA)
- [ ] Review Core Web Vitals targets (LCP <2.5s, INP <200ms, CLS <0.1)
- [ ] Adopt Tailwind CSS + shadcn/ui patterns
- [ ] Apply state management hierarchy in all work

---

### ⚙️ Section 4 & 5: QA, DevOps, Governance

**Assigned to:** Hafiz (guardian)  
**Status:** 🔵 Pending  
**Reading Materials:**

- `~/clawd/research/devprotocol-v1/THE-AXON-CODEX-v1.2.md` (Section 4 & 5)

**Key Topics:**

- **Section 4: QA & DevOps**
  - Testing Philosophy (70/20/10 pyramid)
  - Unit, Integration, E2E Testing standards
  - Mutation Testing (min score 60%)
  - Security Testing (SAST/DAST)
  - CI/CD Pipeline Architecture (4 stages)
  - Security Gates (Secret scanning, dependency checks)
  - Deployment Strategies (Canary, Blue-Green)
  - Infrastructure as Code (Terraform, Docker)
  - Monitoring & Observability

- **Section 5: Governance**
  - Change Management (RFCs, ADRs, DDRs)
  - Error Recovery Standards ("Stewnami" prevention)
  - Drift Prevention & Detection
  - Technical Debt Management
  - Agent Coordination Patterns
  - Production Readiness Checklists

**Adoption Checklist:**

- [ ] Read Section 4 & 5 of Codex
- [ ] Understand 70/20/10 testing pyramid
- [ ] Internalize 4-stage CI/CD pipeline requirements
- [ ] Review security gate requirements (SAST, DAST, secrets)
- [ ] Understand ADR and DDR documentation standards
- [ ] Apply drift prevention monitoring
- [ ] Enforce production readiness checklists

---

## Cohortix Project Compliance Requirements

Per Codex Section 1.4, Cohortix **MUST** have the following Tier 1 core
documents:

### 📄 Required Documents Checklist

| Document                                                 | Status      | Owner | Notes                                                |
| -------------------------------------------------------- | ----------- | ----- | ---------------------------------------------------- |
| **CODEX-ROLLOUT-TRACKER.md**                             | ✅ Complete | PM    | Rollout status tracking document                     |
| **CODEX-V1.2-ROLLOUT-PLAN.md**                           | ✅ Complete | PM    | Comprehensive 3-week rollout strategy                |
| **PROJECT_BRIEF.md**                                     | ✅ Complete | PM    | Created Feb 11, 2026 (4KB, extracted from CLAUDE.md) |
| **AGENTS.md**                                            | ✅ Complete | PM    | Created Feb 11, 2026 (7KB, actionable standards)     |
| **CLAUDE.md**                                            | ✅ Complete | Devi  | Existing (68KB, comprehensive project context)       |
| **REQUIREMENTS-DISCOVERY-PROTOCOL.md**                   | ✅ Complete | PM    | Created Feb 11, 2026 (13KB, mandatory workflow)      |
| **docs/specs/TEMPLATE.md**                               | ✅ Complete | PM    | Feature Specification template (10KB, comprehensive) |
| **docs/architecture/adr-000-template.md**                | ✅ Complete | PM    | Architecture Decision Record template                |
| **docs/architecture/adr-001-tech-stack-selection.md**    | ✅ Complete | PM    | Tech stack ADR (9KB)                                 |
| **docs/architecture/adr-002-monorepo-structure.md**      | ✅ Complete | PM    | Monorepo ADR (9KB)                                   |
| **docs/architecture/adr-003-authentication-approach.md** | ✅ Complete | PM    | Auth + RLS ADR (13KB)                                |
| **docs/decisions/ddr-000-template.md**                   | ✅ Complete | PM    | Design Decision Record template                      |
| **docs/test-plans/TEMPLATE.md**                          | ✅ Complete | PM    | Test Plan template (13KB, comprehensive)             |

---

## Rollout Timeline

### Phase 1: Reading & Understanding (Week 1)

**Target:** February 11-17, 2026

- **Day 1-2:** All agents read assigned sections
- **Day 3-4:** Agents confirm understanding, ask clarification questions
- **Day 5:** PM validates agent comprehension via quiz/discussion

**Deliverable:** All agents report "Reading Complete" status

### Phase 2: Documentation Setup (Week 2)

**Target:** February 18-24, 2026

- **PM creates:** `PROJECT_BRIEF.md`, `AGENTS.md`, `CLAUDE.md`
- **All agents:** Review and provide feedback on core docs
- **PM finalizes:** Document structure and templates

**Deliverable:** All Tier 1 documents exist and approved

### Phase 3: Adoption in Practice (Ongoing)

**Target:** February 25, 2026 onwards

- **All agents:** Follow Requirements Discovery Protocol before any feature work
- **All agents:** Create specs before implementation (Spec-Driven Development)
- **Devi:** Creates ADRs for architectural decisions
- **Lubna:** Creates DDRs for design decisions
- **Hafiz:** Creates test plans matching specs
- **PM:** Monitors compliance, flags violations

**Deliverable:** Cohortix development follows Codex standards

---

## Agent Status Dashboard

| Agent     | Role                      | Assigned Sections | Reading Status | Adoption Status    | Last Update      |
| --------- | ------------------------- | ----------------- | -------------- | ------------------ | ---------------- |
| **PM**    | Project Manager           | Section 1, 5      | ✅ Complete    | ✅ Week 1 Complete | 2026-02-11 16:00 |
| **Devi**  | Backend + AI/ML Developer | Section 1, 2      | 🔵 Pending     | ⚪ Not Started     | —                |
| **Lubna** | Frontend + Design         | Section 1, 3      | 🔵 Pending     | ⚪ Not Started     | —                |
| **Hafiz** | DevOps + QA + Governance  | Section 1, 4, 5   | 🔵 Pending     | ⚪ Not Started     | —                |

**Status Legend:**

- 🔵 Pending — Not yet started
- 🟡 In Progress — Currently reading/implementing
- ✅ Complete — Fully adopted and practicing
- 🔴 Blocked — Issues preventing progress
- ⚪ Not Started — Assignment not yet communicated

---

## Communication Log

### 2026-02-11 15:16 — PM (This Agent)

**Action:** Created CODEX-ROLLOUT-TRACKER.md  
**Status:** Preparing assignments for specialists  
**Next:** Send section assignments via sessions_send

### 2026-02-11 15:30 — PM (This Agent)

**Action:** Completed initial rollout setup  
**Deliverables:**

- ✅ Created CODEX-ROLLOUT-TRACKER.md (10KB)
- ✅ Created CODEX-V1.2-ROLLOUT-PLAN.md (22KB comprehensive plan)
- ✅ Created docs/specs/TEMPLATE.md (10KB comprehensive)
- ✅ Created docs/architecture/adr-000-template.md (4KB)
- ✅ Created docs/decisions/ddr-000-template.md (7KB)
- ✅ Created docs/test-plans/TEMPLATE.md (13KB comprehensive)
- ✅ Posted rollout announcement to Discord #general

**Status:** Phase 1 Week 1 setup complete.

### 2026-02-11 16:00 — PM (Codex Compliance Execution)

**Action:** Completed Week 1 Foundation Work  
**Deliverables:**

- ✅ Created PROJECT_BRIEF.md (4KB, extracted from CLAUDE.md)
- ✅ Created AGENTS.md (7KB, actionable development standards)
- ✅ Created REQUIREMENTS-DISCOVERY-PROTOCOL.md (13KB, mandatory workflow)
- ✅ Created ADR-001: Tech Stack Selection (9KB)
- ✅ Created ADR-002: Monorepo Structure (9KB)
- ✅ Created ADR-003: Authentication Approach (13KB)
- ✅ Validated CLAUDE.md exists (68KB comprehensive context)

**Status:** Week 1 foundation COMPLETE. Ready to delegate Week 2-3 tasks to
specialists.

---

## Next Actions

### Immediate (Today)

1. ✅ PM reads Codex v1.2 summary and full doc
2. ✅ PM creates CODEX-ROLLOUT-TRACKER.md
3. ⏳ PM notifies Devi via sessions_send with Section 1 & 2 assignment
4. ⏳ PM notifies Lubna via sessions_send with Section 1 & 3 assignment
5. ⏳ PM notifies Hafiz via sessions_send with Section 1, 4, & 5 assignment
6. ⏳ PM posts rollout plan to Discord #general

### This Week

7. PM creates `PROJECT_BRIEF.md` for Cohortix (once we have project context from
   CEO)
8. PM creates `AGENTS.md` and `CLAUDE.md` templates
9. All agents confirm reading assignments received
10. PM schedules check-in to validate understanding

### Ongoing

11. Monitor agent compliance with Codex standards
12. Update this tracker as agents progress through adoption
13. Flag any blockers or clarification needs
14. Ensure all new work follows Requirements Discovery Protocol

---

## Questions & Blockers

### Open Questions

1. **What is Cohortix?** — Need project context from CEO to create
   PROJECT_BRIEF.md
2. **Current project state?** — Do we have existing code, or is this greenfield?
3. **Priority sections?** — Should any Codex sections be adopted before others?

### Blockers

- None currently

---

## Success Criteria

Cohortix Codex v1.2 rollout is considered **complete** when:

1. ✅ All agents have read and confirmed understanding of assigned sections
2. ✅ All Tier 1 documents exist in Cohortix repo (`PROJECT_BRIEF.md`,
   `AGENTS.md`, `CLAUDE.md`)
3. ✅ All agents follow Requirements Discovery Protocol before feature work
4. ✅ All agents create specs before implementation (Spec-Driven Development)
5. ✅ ADRs, DDRs, and Test Plans are created as required by Codex
6. ✅ PM validates compliance through code review and documentation audits
7. ✅ Zero "Stewnami" incidents (agents overwriting each other's work)
8. ✅ All new work passes Codex compliance checklists

---

**Last Updated:** 2026-02-11 15:16 GMT+5  
**Next Review:** 2026-02-18 (1 week)
