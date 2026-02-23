# Axon Codex v1.2 Rollout Plan

## Cohortix Project Implementation

**Date:** February 11, 2026  
**PM Lead:** Agent PM  
**CEO Sponsor:** Alim  
**Project:** Cohortix (First Implementation)

---

## Executive Summary

This document outlines the complete rollout strategy for adopting the Axon Codex
v1.2 as our organizational operating protocol, starting with Cohortix as the
pilot project. The Codex provides **authoritative technical standards** for AI
agent teams, covering Foundation & Architecture, Backend & AI/ML Development,
Frontend & Design, Quality Assurance & DevOps, and Governance & Operations.

**Rollout Approach:** Phased adoption with Cohortix as proving ground, then
expand to all projects.

**Timeline:** 3-week initial rollout, then ongoing enforcement.

**Success Metric:** 100% compliance with Tier 1 documentation requirements and
Requirements Discovery Protocol adoption by all agents.

---

## Why the Codex Matters

### The Problem We're Solving

Without formalized standards, AI agent teams face:

- **Inconsistent Decisions:** Agents make conflicting architectural choices
  across services
- **Quality Degradation:** Code quality declines as agents optimize locagent
  without global context
- **Security Gaps:** Vulnerabilities emerge from gaps in agent knowledge (OWASP
  Agentic Top 10)
- **Technical Debt Accumulation:** Debt grows faster than human teams can
  remediate
- **"Stewnami" Incidents:** Agents simultaneously edit files, causing merge
  conflicts and instability

### The Solution: Executable Standards

The Codex provides **machine-readable, enforceable standards** that:

- Define the minimum acceptable quality bar
- Prevent common agent failure modes
- Enable autonomous development with safety guardrails
- Ensure consistency across projects and agents
- Reduce rework through Requirements Discovery Protocol

---

## Rollout Strategy

### Phase-Based Approach

**Phase 1: Foundation (Week 1)**  
Focus: Reading, understanding, and validating comprehension

**Phase 2: Documentation (Week 2)**  
Focus: Creating required Tier 1 documents for Cohortix

**Phase 3: Practice (Week 3+)**  
Focus: Applying Codex standards in daily development work

---

## Section Assignments by Specialist

### 🌐 Section 1: Foundation & Architecture

**Assigned to:** ALL AGENTS (Universal Foundation)

**Why:** Every agent needs to understand:

- Project structure standards
- Spec-Driven Development workflow
- Requirements Discovery Protocol (the "Step 0" before any work)
- Multi-agent coordination to prevent "Stewnami"
- Context engineering (AGENTS.md vs CLAUDE.md)

**Reading Time:** ~45 minutes  
**Practice Time:** Applied in every task

**Key Takeaway:** Before writing code, agents MUST follow Requirements Discovery
Protocol to extract context, then create specs.

---

### 🔧 Section 2: Backend & AI/ML Development

**Assigned to:** Devi (ai-developer)

**Why Devi:** Backend API development and AI/ML integration specialist

**Topics:**

- **Part A: Backend Standards**
  - API Design (REST conventions, versioning, RFC 7807 errors)
  - Database Architecture (UUID keys, zero-downtime migrations)
  - Auth & Authorization (JWT, RBAC)
  - Resilience Engineering (Circuit breakers, retries, exponential backoff)
  - Security (OWASP Top 10 + input validation)
  - Observability (Structured logging, RED metrics)

- **Part B: AI/ML Standards**
  - LLM Integration (Provider abstraction, fallbacks)
  - Prompt Engineering (Versioning, regression testing)
  - RAG Systems (Chunking strategies, vector DBs, retrieval)
  - Agent Orchestration (Tool calling, state management)
  - AI Security (OWASP Agentic Top 10: Prompt injection, excessive agency)
  - Cost Optimization (Token budgets, caching)

**Reading Time:** ~90 minutes  
**Application:** Every backend API, database change, and AI integration

**Key Takeaway:** All external API calls MUST have circuit breakers. All prompts
MUST be versioned. All databases MUST use UUIDs.

---

### 🎨 Section 3: Frontend & Design

**Assigned to:** Lubna (ui-designer)

**Why Lubna:** Frontend architecture and user experience specialist

**Topics:**

- Framework Standards (Next.js 15, React 19, TypeScript strict mode)
- Component Architecture (Server Components by default, client boundaries
  explicit)
- State Management Hierarchy (URL > Server > Form > Client)
- Accessibility (WCAG 2.2 AA mandatory)
- Performance (Core Web Vitals: LCP <2.5s, INP <200ms, CLS <0.1)
- Styling (Tailwind CSS, design tokens)
- Design Systems (shadcn/ui, Figma-to-code workflows)
- Forms & Validation (React Hook Form + Zod)
- Testing (Component, Visual Regression, E2E with Playwright)

**Reading Time:** ~60 minutes  
**Application:** Every UI component, page, and user interaction

**Key Takeaway:** Default to Server Components. Accessibility is not optional.
Core Web Vitals are hard requirements, not goals.

---

### ⚙️ Section 4 & 5: QA, DevOps, Governance

**Assigned to:** Hafiz (guardian)

**Why Hafiz:** Quality assurance, infrastructure, and compliance specialist

**Topics:**

- **Section 4: QA & DevOps**
  - Testing Philosophy (70% unit, 20% integration, 10% E2E)
  - Unit Testing (FIRST principles, mocking, coverage standards)
  - Integration Testing (Contract testing with Pact, DB testing)
  - E2E Testing (Playwright, critical paths only)
  - Mutation Testing (Min score 60% for critical code)
  - Security Testing (SAST with SonarQube, DAST, dependency scanning)
  - CI/CD Pipeline (4 stages: Commit, PR, Pre-Deploy, Production)
  - Security Gates (Secret scanning with TruffleHog, dependency scans)
  - Deployment Strategies (Canary, Blue-Green, rollback procedures)
  - Infrastructure as Code (Terraform, Docker standards)
  - Monitoring (RED metrics, distributed tracing, alert thresholds)

- **Section 5: Governance**
  - Change Management (RFC process, ADR standards, DDR standards)
  - Error Recovery ("Stewnami" prevention, rollback vs fix-forward)
  - Drift Prevention (Dependency, Configuration, Architectural)
  - Technical Debt Management
  - Agent Coordination Patterns
  - Production Readiness Checklists

**Reading Time:** ~120 minutes  
**Application:** Every deployment, test suite, and production change

**Key Takeaway:** 70/20/10 testing pyramid is mandatory. Security gates cannot
be bypassed. All changes require ADRs or DDRs.

---

## Tier 1 Document Requirements for Cohortix

Per Codex Section 1, every project MUST have these core documents:

### 📄 1. PROJECT_BRIEF.md

**Owner:** PM (with CEO input)  
**Status:** 🔴 To Be Created  
**Deadline:** Week 2, Day 1

**Purpose:** Single-page "quick start" context (max 500 words). Any agent can
read this in 2 minutes and understand:

- What is Cohortix?
- Why does it exist? (Problem it solves)
- For whom? (Target users)
- Tech Stack
- Current Status
- Key Decisions
- Next Milestone

**Template:** See Codex §1.4 Feature Specification Template

---

### 📄 2. AGENTS.md

**Owner:** PM  
**Status:** 🔴 To Be Created  
**Deadline:** Week 2, Day 2

**Purpose:** Actionable instructions for agents — the "how to work" guide.

**Contents:**

- Commands to run (npm start, test, lint)
- Testing rules (when to write tests, coverage targets)
- Project Structure (where things go)
- Code Style (linting, formatting, naming conventions)
- Git Workflow (branch naming, commit messages)
- Permissions Matrix:
  - **Always Allowed:** Reading code, running tests, creating branches
  - **Ask First:** Deploying to production, database migrations, deleting files
  - **Never Allowed:** Sharing secrets, bypassing tests, force-pushing

**Constraint:** Keep under 150 lines (readable in 5 minutes)

---

### 📄 3. CLAUDE.md

**Owner:** PM + Alim (CEO provides business context)  
**Status:** 🔴 To Be Created  
**Deadline:** Week 2, Day 3

**Purpose:** Domain context — the "what we're building" guide.

**Contents:**

- User Personas (Who uses Cohortix? What are their goals?)
- Ubiquitous Language (Domain terms and definitions)
- Design Principles (What makes Cohortix unique?)
- Business Context (Market, competitors, strategy)

**Constraint:** Focus on concepts, not commands. Complements AGENTS.md.

---

### 📁 4. docs/specs/\*.md

**Owner:** All Agents (created before feature implementation)  
**Status:** 🔴 To Be Created  
**Deadline:** As needed per feature

**Purpose:** Feature Specifications define behavior BEFORE implementation.

**Template Fields:**

1. Overview & Problem Statement
2. Requirements (Functional & Non-Functional)
3. Architecture / API Contracts / Data Models
4. Agent Dependencies
5. Acceptance Criteria (Binary pass/fail checklist)

**Example:** `docs/specs/001-user-authentication.md`

**Rule:** No code without an approved spec. Specs are the source of truth.

---

### 📁 5. docs/architecture/adr-\*.md

**Owner:** Devi (Backend), Hafiz (DevOps)  
**Status:** 🔴 To Be Created  
**Deadline:** When making significant technical decisions

**Purpose:** Architecture Decision Records capture "why we chose X over Y."

**Template:**

- **Context:** What problem are we solving?
- **Decision:** What did we decide?
- **Consequences:** What are the trade-offs?

**Example:** `docs/architecture/adr-001-use-postgresql-over-mongodb.md`

**Rule:** Major architectural choices MUST have an ADR.

---

### 📁 6. docs/decisions/ddr-\*.md

**Owner:** Lubna (Design), All Agents (API contracts)  
**Status:** 🔴 To Be Created  
**Deadline:** When making design/UX/API decisions

**Purpose:** Design Decision Records capture UX, API contract, and design system
choices.

**Template:** (Same as ADR: Context, Decision, Consequences)

**Example:** `docs/decisions/ddr-001-color-palette-accessibility.md`

**Rule:** Significant design choices MUST have a DDR.

---

### 📁 7. docs/test-plans/\*.md

**Owner:** Hafiz (QA), All Agents (contribute)  
**Status:** 🔴 To Be Created  
**Deadline:** Matches feature spec creation

**Purpose:** QA strategy for each feature.

**Contents:**

- Unit Test Strategy
- Integration Test Strategy
- E2E Test Strategy (if applicable)
- Edge Cases to Cover
- Performance Benchmarks (if applicable)

**Example:** `docs/test-plans/001-user-authentication-tests.md`

**Rule:** Every spec MUST have a matching test plan.

---

## Requirements Discovery Protocol: The Critical "Step 0"

### What It Is

The Requirements Discovery Protocol (Codex §1, Appendix) is a **mandatory
interview phase** where agents ask clarifying questions BEFORE writing specs or
code.

**The Maximum Extraction Principle:**

> Every question asked upfront saves an order of magnitude in rework. The goal:
> Extract maximum context before implementation begins.

### Why It Matters

**Cost-Benefit Analysis:**

- Time to ask 5 clarifying questions: ~3 minutes
- Time to build wrong solution: ~2 hours
- Time to realize it's wrong: ~1 day
- Time to rebuild correctly: ~2 hours
- **Total waste of NOT asking: 2,820% time penalty**

### The Five Mandatory Question Categories

Before ANY feature work, agents MUST ask:

1. **Intent & Goals**
   - What problem does this solve?
   - Who is this for? (User persona)
   - What does success look like?
   - Why now? (Priority/urgency)

2. **Scope & Boundaries**
   - What is IN scope for this iteration?
   - What is explicitly OUT of scope?
   - Are there existing solutions or patterns to follow/avoid?
   - What is the MVP vs. full vision?

3. **Technical Constraints**
   - Any specific tech requirements or restrictions?
   - What systems does this integrate with?
   - Any performance or scale requirements?
   - Data sensitivity or compliance concerns?

4. **Edge Cases & Error Scenarios**
   - What happens when X fails?
   - What are the edge cases you're worried about?
   - How should errors be communicated to users?
   - Any known gotchas from past attempts?

5. **Acceptance Criteria**
   - How will we know this is done?
   - What does "good enough" look like vs. "perfect"?
   - Who needs to approve or review this?
   - Any deadline or timeline constraints?

### Discovery Depth Rules

| Task Complexity                         | Discovery Depth | Questions                            |
| --------------------------------------- | --------------- | ------------------------------------ |
| **Low** (Bug fix, config change)        | LIGHT           | 1-2 questions                        |
| **Medium** (New API, UI component)      | STANDARD        | 3-5 questions                        |
| **High** (Greenfield feature, security) | DEEP            | 5+ questions across all 5 categories |

**Rule:** When uncertain, default to STANDARD discovery. 5-10 minutes of
questions prevents hours of rework.

---

## Rollout Timeline & Milestones

### Week 1: Reading & Understanding (Feb 11-17)

**Day 1-2: Reading Assignments**

- ✅ PM reads full Codex v1.2
- 🔵 Devi reads Section 1 (Foundation) + Section 2 (Backend & AI/ML)
- 🔵 Lubna reads Section 1 (Foundation) + Section 3 (Frontend & Design)
- 🔵 Hafiz reads Section 1 (Foundation) + Section 4 & 5 (QA, DevOps, Governance)

**Day 3-4: Comprehension Validation**

- PM conducts async quiz/discussion with each agent
- Agents ask clarification questions
- PM updates tracker with "Reading Complete" status

**Day 5: Readiness Check**

- All agents confirm understanding
- PM identifies any gaps or blockers
- Proceed to Phase 2

**Milestone:** All agents report "Reading Complete" status by EOW.

---

### Week 2: Documentation Setup (Feb 18-24)

**Day 1: PROJECT_BRIEF.md**

- PM interviews CEO (Alim) to understand Cohortix vision
- PM drafts PROJECT_BRIEF.md (max 500 words)
- All agents review and provide feedback
- PM finalizes and commits

**Day 2: AGENTS.md**

- PM creates AGENTS.md (actionable instructions)
- PM defines permissions matrix (Always/Ask/Never)
- All agents review for completeness
- PM finalizes and commits

**Day 3: CLAUDE.md**

- PM collaborates with Alim on domain context
- PM drafts CLAUDE.md (user personas, business context)
- All agents review
- PM finalizes and commits

**Day 4-5: Templates & Structure**

- PM creates spec template in `docs/specs/TEMPLATE.md`
- PM creates ADR template in `docs/architecture/adr-000-template.md`
- PM creates DDR template in `docs/decisions/ddr-000-template.md`
- PM creates test plan template in `docs/test-plans/TEMPLATE.md`
- All agents familiarize themselves with templates

**Milestone:** All Tier 1 documents exist and are approved by EOW.

---

### Week 3+: Adoption in Practice (Feb 25 onwards)

**Ongoing Activities:**

**For ALL Agents:**

- Follow Requirements Discovery Protocol before ANY feature work
- Create specs before implementation (Spec-Driven Development)
- Update CODEX-ROLLOUT-TRACKER.md as adoption progresses
- No code without approved spec

**For Devi (Backend + AI/ML):**

- Create ADRs for all architectural decisions (database schema, API design, LLM
  provider choice)
- Apply circuit breaker pattern to all external API calls
- Version all prompts
- Use UUID primary keys for all new tables
- Implement RED metrics (Rate, Errors, Duration) for observability

**For Lubna (Frontend + Design):**

- Create DDRs for all design decisions (color palette, component library,
  responsive breakpoints)
- Default to Server Components; justify Client Components
- Ensure WCAG 2.2 AA compliance on all UI
- Measure and meet Core Web Vitals targets (LCP <2.5s, INP <200ms, CLS <0.1)
- Use Tailwind CSS + shadcn/ui

**For Hafiz (DevOps + QA):**

- Create test plans matching all feature specs
- Enforce 70/20/10 testing pyramid
- Implement 4-stage CI/CD pipeline (Commit, PR, Pre-Deploy, Production)
- Enable security gates (TruffleHog for secrets, Snyk for dependencies,
  SonarQube for SAST)
- Run mutation testing on critical code paths (min 60% score)
- Monitor for drift (dependency, configuration, architectural)

**For PM (Coordination Lead):**

- Review all specs, ADRs, DDRs, test plans for Codex compliance
- Monitor CODEX-ROLLOUT-TRACKER.md weekly
- Flag violations and coach agents on standards
- Prevent "Stewnami" incidents through coordination
- Report adoption metrics to CEO

**Milestone:** First feature shipped following full Codex compliance by end of
Week 3.

---

## Success Criteria

The Codex v1.2 rollout is considered **successful** when:

### Documentation Criteria

1. ✅ `PROJECT_BRIEF.md` exists and is under 500 words
2. ✅ `AGENTS.md` exists and is under 150 lines
3. ✅ `CLAUDE.md` exists with user personas and business context
4. ✅ Spec, ADR, DDR, and Test Plan templates exist

### Process Criteria

5. ✅ All agents follow Requirements Discovery Protocol before feature work
   (100% compliance)
6. ✅ All agents create specs before implementation (100% compliance)
7. ✅ Devi creates ADRs for all architectural decisions
8. ✅ Lubna creates DDRs for all design decisions
9. ✅ Hafiz creates test plans matching all specs

### Quality Criteria

10. ✅ Testing pyramid maintained: 70% unit, 20% integration, 10% E2E
11. ✅ All new APIs use UUID primary keys
12. ✅ All external API calls have circuit breakers
13. ✅ All prompts are versioned
14. ✅ All UI components meet WCAG 2.2 AA
15. ✅ All pages meet Core Web Vitals targets

### Coordination Criteria

16. ✅ Zero "Stewnami" incidents (no merge conflicts from simultaneous edits)
17. ✅ All agents use git worktrees or branch-per-agent patterns
18. ✅ All handoffs documented in specs (Dev → QA → DevOps)

### Audit Criteria

19. ✅ PM validates compliance through weekly reviews
20. ✅ All new work passes Codex compliance checklists (Appendix D)

---

## Risk Mitigation

### Risk: Agents Don't Read Assigned Sections

**Mitigation:** PM conducts comprehension quiz on Day 3. Agents cannot proceed
to Phase 2 without passing.

### Risk: Agents Ignore Requirements Discovery Protocol

**Mitigation:** PM reviews all PRs. Reject any PR without linked spec. Enforce
in code review.

### Risk: "Stewnami" Incidents (Agents Overwrite Each Other)

**Mitigation:**

- Use git worktrees (each agent gets isolated directory)
- Branch-per-agent naming convention
- PM coordinates work distribution via CODEX-ROLLOUT-TRACKER.md

### Risk: Documentation Becomes Stale

**Mitigation:**

- Quarterly review cycle for AGENTS.md and CLAUDE.md
- ADRs and DDRs updated when decisions change
- PM monitors drift with automated tools

### Risk: Agents Bypass Standards Under Time Pressure

**Mitigation:**

- Hard requirement: No merges without passing Codex compliance checklists
- CI/CD gates enforce linting, testing, security standards
- PM escalates repeated violations to CEO

---

## Metrics & Monitoring

### Leading Indicators (Process Adoption)

- **Discovery Compliance Rate:** % of tasks with Requirements Discovery Protocol
  followed
- **Spec-Before-Code Rate:** % of features with approved specs before
  implementation
- **ADR/DDR Coverage:** # of ADRs and DDRs created per sprint
- **Template Usage:** % of specs using official templates

**Target:** 100% compliance by end of Week 3

### Lagging Indicators (Quality Outcomes)

- **"Stewnami" Incidents:** # of merge conflicts per week
- **Rework Rate:** % of PRs requiring major changes post-review
- **Test Coverage:** Maintain 70/20/10 pyramid distribution
- **Production Incidents:** # of bugs shipped to production
- **Core Web Vitals:** LCP, INP, CLS scores

**Target:** Zero Stewnami incidents, <10% rework rate, zero critical bugs in
production

### Tracking Mechanism

- **Weekly:** PM reviews CODEX-ROLLOUT-TRACKER.md and updates agent status
- **Biweekly:** PM reports metrics to CEO
- **Monthly:** PM conducts compliance audit using Codex Appendix D checklists

---

## Communication Plan

### Internal (Agent-to-Agent)

- **Primary Channel:** `sessions_send` for direct agent notifications
- **Secondary Channel:** Shared context files in `docs/` (Specs, ADRs, DDRs)
- **Escalation:** PM via `docs/progress/<task-id>.md` logs

### External (Agent-to-Human)

- **Discord #general:** Major announcements (rollout plan, milestones)
- **Discord #dev-updates:** Daily progress updates
- **Weekly Sync:** PM → CEO status report

### Documentation

- **CODEX-ROLLOUT-TRACKER.md:** Single source of truth for rollout status
- **This Document (ROLLOUT-PLAN.md):** Reference guide for rollout strategy

---

## FAQ

### Q: Do we need to read the entire Codex (16,000+ lines)?

**A:** No. Each agent reads their assigned sections only. PM has read the full
Codex. Use the SUMMARY.md for quick reference.

### Q: What if a Codex standard conflicts with our current approach?

**A:** Codex takes precedence. If the conflict is significant, create an RFC
(Request for Comments) proposing a Codex amendment. Discuss with CEO.

### Q: Can we skip Requirements Discovery for small tasks?

**A:** Use LIGHT discovery (1-2 questions) for trivial tasks like bug fixes. But
never skip entirely. Even "small" tasks benefit from clarifying intent.

### Q: What if we don't have time to write specs?

**A:** Codex Rule: No code without spec. Specs save time by preventing rework. A
10-minute spec prevents a 2-hour rebuild. If truly urgent, write a minimal spec
and mark as "Draft" — but update before merging.

### Q: Who approves specs, ADRs, and DDRs?

**A:**

- **Specs:** PM approves
- **ADRs (Architectural):** Devi (Backend) or Hafiz (DevOps) authors, PM
  approves
- **DDRs (Design):** Lubna authors, PM approves
- **Test Plans:** Hafiz authors, PM approves

### Q: What happens if an agent violates the Codex?

**A:**

1. First violation: PM provides coaching and links to relevant Codex section
2. Repeat violations: PM escalates to CEO
3. Persistent violations: Agent autonomy level reduced, requires human oversight

---

## Appendix: Quick Reference Links

### Codex Documents

- **Summary:** `~/clawd/research/devprotocol-v1/CODEX-V1.2-SUMMARY.md`
- **Full Codex:** `~/clawd/research/devprotocol-v1/THE-AXON-CODEX-v1.2.md`

### Cohortix Documents

- **Rollout Tracker:** `~/clawd/cohortix/CODEX-ROLLOUT-TRACKER.md`
- **Rollout Plan (this doc):** `~/clawd/cohortix/CODEX-V1.2-ROLLOUT-PLAN.md`

### Templates (To Be Created Week 2)

- `~/clawd/cohortix/PROJECT_BRIEF.md`
- `~/clawd/cohortix/AGENTS.md`
- `~/clawd/cohortix/CLAUDE.md`
- `~/clawd/cohortix/docs/specs/TEMPLATE.md`
- `~/clawd/cohortix/docs/architecture/adr-000-template.md`
- `~/clawd/cohortix/docs/decisions/ddr-000-template.md`
- `~/clawd/cohortix/docs/test-plans/TEMPLATE.md`

---

## Sign-Off

**Prepared by:** Agent PM  
**Date:** February 11, 2026  
**Approved by:** _Pending CEO Review_

**Next Review:** February 18, 2026 (End of Week 1)

---

_This rollout plan is a living document. Updates will be tracked in
CODEX-ROLLOUT-TRACKER.md._
