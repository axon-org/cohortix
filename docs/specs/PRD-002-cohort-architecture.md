# PRD-002: Cohort Architecture

**Version:** 1.0 **Author:** Alim (CEO Agent) with Ahmad Ashfaq (Founder)
**Date:** 2026-02-27 **Status:** Draft **Technical Companion:**
[ADR-002: Multi-Instance Architecture](/docs/architecture/ADR-002-MULTI-INSTANCE-ARCHITECTURE.md)

---

## 1. Problem Statement

**Who has this problem?** Professionals, entrepreneurs, and teams who want AI
agents to help them achieve their life and work goals — but lack the technical
knowledge to set up, manage, and orchestrate AI agents themselves.

**What's the problem?** Today, using AI agents requires:

- Installing and configuring tools like OpenClaw via CLI
- Writing config files (SOUL.md, AGENTS.md, openclaw.json)
- Managing infrastructure (Docker containers, API keys, memory systems)
- Understanding agent orchestration patterns

This limits AI agents to technical users. Non-technical professionals — product
managers, founders, coaches, marketers — can't access the power of persistent,
evolving AI agents.

**Why does it matter?** The PPV (Purpose → Vision → Mission → Operation → Task)
framework helps humans articulate and pursue life aspirations. AI agents can
dramatically accelerate progress on these goals — but only if they're accessible
without technical setup. The first platform to make AI agents usable by
everyone, within a life-and-work operating system, captures a massive market.

**Current state of Cohortix:**

- PPV hierarchy exists (Visions, Missions, Operations, Tasks)
- Basic task management works (CRUD, Kanban, status tracking)
- No AI agent integration
- No multi-user isolation
- Single-org architecture

---

## 2. Goals & Success Metrics

### Goals

| #   | Goal                                | Description                                                             |
| --- | ----------------------------------- | ----------------------------------------------------------------------- |
| G1  | **Agent-Powered Task Execution**    | Users assign tasks to AI agents that execute autonomously               |
| G2  | **Zero-Config AI Setup**            | Non-technical users get working AI agents without touching a terminal   |
| G3  | **Secure Multi-Tenancy**            | Multiple users and orgs with complete data isolation                    |
| G4  | **AI Clone for Every User**         | Each user's first agent is a personal AI clone that learns who they are |
| G5  | **Living Knowledge System**         | Agents continuously learn and evolve, visible to users                  |
| G6  | **Operational Systems Marketplace** | Creators sell complete AI workflows (frameworks + agents + skills)      |

### Success Metrics

| Metric                                      | Target                   | Measurement                                        |
| ------------------------------------------- | ------------------------ | -------------------------------------------------- |
| Time from signup to first agent task        | < 5 minutes              | Analytics: onboarding funnel                       |
| Tasks completed by agents per user/week     | ≥ 3                      | Database: task completion with agent assignee      |
| Agent correction rate (month 1 vs month 3)  | 50% decrease             | Evolution events: corrections / total interactions |
| Multi-org users with zero data leaks        | 100% (zero incidents)    | Security audit + RLS test suite                    |
| Marketplace listings (6 months post-launch) | ≥ 10 operational systems | Marketplace table count                            |
| User retention (30-day)                     | ≥ 40%                    | Clerk auth + activity tracking                     |

---

## 3. User Stories

### Solo User (Personal Productivity)

- **US-1:** As a solo user, I want to sign up and get a personal AI workspace
  (Cohort) immediately, so I can start using AI agents without creating an
  organization.
- **US-2:** As a solo user, I want to create my AI Clone during onboarding, so
  the AI understands who I am and what I care about.
- **US-3:** As a solo user, I want to define a Vision and have my Clone suggest
  Missions and Operations, so I get a structured path toward my goals.
- **US-4:** As a solo user, I want to assign tasks to agents and see their
  progress in comments, so I can collaborate with AI like I would with a human
  teammate.
- **US-5:** As a solo user, I want to see what my agents have learned over time
  (Knowledge Hub), so I trust they're getting better.

### Team Member (Multi-User)

- **US-6:** As a team member, I want to keep my personal Cohort separate from my
  org's shared Cohorts, so my personal visions and agents stay private.
- **US-7:** As a team member invited to an org, I want to access shared Cohorts
  without losing my personal Cohort, even if I belong to multiple orgs.
- **US-8:** As a team member, I want to @mention agents in task comments and get
  responses, so agent collaboration feels natural.
- **US-9:** As a team member, I want to see all my tasks across personal and
  shared Cohorts in one "My Tasks" view.

### Org Admin

- **US-10:** As an org admin, I want to create shared Cohorts and assign team
  members to them, so teams have their own AI workspace.
- **US-11:** As an org admin, I want to configure which AI models and tools
  agents can use per Cohort, so I control costs and security.
- **US-12:** As an org admin, I want to view agent activity logs for shared
  Cohorts (but NOT personal Cohorts), so I can audit AI actions without
  violating privacy.
- **US-13:** As an org admin, I want to install operational systems from the
  marketplace into shared Cohorts, so my team gets pre-built AI workflows.

### Power User (BYOH — Bring Your Own Hardware)

- **US-14:** As a power user, I want to connect my own hardware (Mac/Linux) as
  my Cohort engine, so my data stays on my machine.
- **US-15:** As a BYOH user, I want Cohortix to check compatibility and
  auto-install required tools, so setup is painless.
- **US-16:** As a BYOH user, I want to manage my Cohort entirely through the
  Cohortix UI, without ever touching the CLI.

### Marketplace Creator

- **US-17:** As a creator, I want to package my framework + agents + skills +
  evolution loops as an operational system and sell it on the marketplace.
- **US-18:** As a creator, I want to include sanitized agent learnings (without
  private data) so buyers get experienced agents.
- **US-19:** As a creator, I want to offer my operational system as a
  subscription so I earn recurring revenue as it evolves.

### Marketplace Buyer

- **US-20:** As a buyer, I want to browse operational systems, see ratings and
  reviews, and install with one click.
- **US-21:** As a buyer, I want installed agents to start working immediately
  with the framework's methodology.
- **US-22:** As a buyer, I want to receive updates when the creator improves the
  operational system.

---

## 4. Requirements

### Must Have (P0) — Phase 1: Foundation

- [ ] **Personal Cohort provisioning** — auto-created on signup, tied to user
      (not org)
- [ ] **Clone Foundation** — onboarding flow creates user's first AI clone agent
- [ ] **Agent creation UI** — create, configure, and manage agents visually
- [ ] **Task → Agent assignment** — assign tasks to agents, agents execute and
      respond in comments
- [ ] **@mention system** — mention agents in comments, agent responds in thread
- [ ] **Cohort dashboard** — health status, agent activity, start/stop
- [ ] **AI Models settings** — add API keys, assign models to agents (BYOK)
- [ ] **RLS enforcement** — personal scope, cohort scope, org scope with zero
      cross-contamination
- [ ] **Session management** — isolated sessions per task, no context bleed
- [ ] **`cohorts` and `cohort_members` database tables** with scope columns on
      all PPV tables

### Should Have (P1) — Phase 2: Multi-User & Knowledge

- [ ] **Shared Cohort provisioning** — org admin creates, assigns members
- [ ] **Organization creation** — explicit action (not required at signup)
- [ ] **Knowledge Hub** — unified search across 4 memory layers (built-in
      memory, Mem0, Cognee, QMD)
- [ ] **Agent Evolution Dashboard** — timeline of learnings, correction rate,
      expertise growth
- [ ] **My Tasks aggregation** — cross-Cohort task view
- [ ] **Agent permissions** — configurable read/write/admin per action type
- [ ] **Cron/scheduled tasks UI** — recurring agent jobs
- [ ] **Skills management** — browse, install, toggle skills per agent
- [ ] **Activity feed** — all agent actions in a Cohort, auditable

### Nice to Have (P2) — Phase 3: BYOH & Marketplace

- [ ] **BYOH connection flow** — token-based pairing, health monitoring, offline
      handling
- [ ] **Bootstrap Package** — auto-install required tools on BYOH instances
      (Mem0, Cognee, QMD)
- [ ] **Marketplace: publish operational systems** — framework + agents +
      skills + evolution
- [ ] **Marketplace: browse and install** — one-click install with permission
      approval
- [ ] **Sanitized knowledge export** — strip private data, keep generic
      learnings for marketplace agents
- [ ] **Marketplace: ratings, reviews, and revenue sharing**
- [ ] **Nodes/device management UI**
- [ ] **Plugin/integration management**
- [ ] **Sandbox configuration for agent isolation**

---

## 5. Non-Requirements (Explicit Exclusions)

These are NOT being built in this initiative:

- **Mobile app** — Cohortix is web-first. Mobile comes later.
- **Real-time voice/video with agents** — Text-based interaction only.
- **Custom LLM training/fine-tuning** — We use existing models via API (BYOK).
  No training infrastructure.
- **Notion RAG / external tool integrations** — Future MCP server integration,
  not now.
- **n8n or workflow automation UI** — Users install themselves if needed.
- **Billing & subscriptions** — Separate PRD (pending Malik's financial
  modeling).
- **White-label / custom branding** — Single Cohortix brand for now.
- **Agent-to-agent cross-Cohort communication** — Agents stay within their
  Cohort boundary.
- **Admin access to personal Cohorts** — Never. This is a hard security
  boundary.

---

## 6. Technical Considerations

- **Engine:** OpenClaw (internal only — never mentioned in UI, branded as
  "Cohort")
- **Architecture:** See
  [ADR-002: Multi-Instance Architecture](/docs/architecture/ADR-002-MULTI-INSTANCE-ARCHITECTURE.md)
  (1,400+ lines)
- **Stack:** Next.js 14, Supabase (PostgreSQL + RLS + Storage), Clerk (auth +
  orgs), Drizzle ORM
- **Hosting:** Fly.io Machines for managed Cohorts (auto-sleep when idle)
- **Memory Stack:** 4 layers — built-in markdown memory, Mem0, Cognee, QMD
- **Estimated Complexity:** XL (16+ weeks across 4 phases)

**Key Technical Risks:**

1. **Cohort provisioning latency** — spinning up Docker containers takes time.
   Target: < 30 seconds for managed Cohorts.
2. **Memory isolation** — ensuring Mem0/Cognee/QMD scoping by Cohort ID works
   without cross-contamination.
3. **BYOH reliability** — self-hosted instances go offline (sleep, power loss).
   Need graceful degradation.
4. **Context window management** — preventing agent context bloat across
   long-running tasks.
5. **OpenClaw Gateway API coverage** — not all 21 engine features have RPC
   endpoints yet. May need upstream contributions.

---

## 7. Design

- **Reference app:** <https://v0-project-workspace.vercel.app/> (PM tool UI
  patterns)
- **Design system:** Linear-style minimalist, keyboard-first, dark theme
- **Wireframes:** ADR-002 contains ASCII wireframes for Knowledge Hub, Agent
  Evolution Dashboard, and Cohort Dashboard
- **Key screens to design:**
  - Onboarding (Clone creation flow)
  - Cohort Dashboard (health, agents, activity)
  - Agent Profile (evolution timeline, knowledge, settings)
  - Knowledge Hub (search, browse, contribute)
  - Marketplace (browse, detail, install)
  - Settings (models, skills, permissions, BYOH connection)

---

## 8. Open Questions

- [ ] **Naming:** Is "Cohort" the right user-facing term? Alternatives:
      "Workspace", "Hub", "Pod"
- [ ] **Free tier limits:** How many agents and task executions per month?
- [ ] **Revenue model:** Subscription tiers, marketplace commission %. Needs
      Malik's financial modeling.
- [ ] **Marketplace review process:** Manual review? Automated scanning?
      Community-driven?
- [ ] **BYOH minimum specs:** What hardware is required? (Estimated: 2GB RAM, 2
      cores, Docker)
- [ ] **Operational system versioning:** When a creator updates their system,
      how do buyers get updates? Auto-update? Opt-in?
- [ ] **Clone foundation questions:** How many onboarding questions? How deep
      should the initial quiz go?

---

## 9. Approval

- [ ] PM (August) reviewed
- [ ] Architect (Idris) reviewed
- [x] CEO Agent (Alim) drafted
- [ ] **Ahmad approved**

---

_This PRD is linked to
[ADR-002](/docs/architecture/ADR-002-MULTI-INSTANCE-ARCHITECTURE.md) for full
technical architecture details._
