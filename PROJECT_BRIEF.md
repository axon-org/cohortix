# PROJECT BRIEF — Cohortix

**Version:** 1.0.0  
**Last Updated:** February 11, 2026  
**Status:** Active Development  
**Codex Compliance:** v1.2 §1.1.2

---

## What is Cohortix?

Cohortix is an **Agents-as-a-Service (AaaS)** platform that enables humans to
manage high-performing organizations of AI agents. It's a multi-tenant SaaS
application built for human-to-AI team orchestration through a unified interface
called **Mission Control**.

**Domain:** cohortix.ai  
**Tagline:** "Your AI crew, ready for action."

---

## Why Does It Exist?

**Problem:** Traditional project management tools (ClickUp, Linear) are built
for human-to-human collaboration. They fail when managing autonomous AI agents
because:

- Agents need continuous context and evolving knowledge bases
- Humans lack visibility into agent learning and skill progression
- No bidirectional goal-setting (agents can't propose improvements)
- Knowledge silos between agents (one agent's learnings don't benefit others)

**Solution:** Cohortix bridges this gap with:

1. **Bidirectional Goal Setting** — Both humans AND agents propose goals
2. **Living Knowledge Base** — Graph-structured, versioned organizational
   knowledge with cross-agent sharing
3. **Agent Evolution System** — Systematic learning, expertise tracking, and
   self-improvement protocols

---

## For Whom?

**Primary Users:**

- **Solopreneurs & Small Teams** running AI-powered operations (3-10 AI agents)
- **AI-First Startups** building with AI agents as core team members
- **Automation Enthusiasts** orchestrating complex multi-agent workflows

**Not for:** Traditional software teams managing human sprints (use Jira/Linear
instead)

---

## Tech Stack

| Layer          | Technology                                    |
| -------------- | --------------------------------------------- |
| **Frontend**   | Next.js 15, React 19, TypeScript, Tailwind v3 |
| **Backend**    | Next.js API Routes (BFF pattern)              |
| **Database**   | PostgreSQL 16 + pgvector (Supabase)           |
| **Auth**       | Supabase Auth (email/password + OAuth)        |
| **Realtime**   | Supabase Realtime                             |
| **ORM**        | Drizzle ORM                                   |
| **State**      | TanStack Query, Zustand                       |
| **Deployment** | Vercel                                        |

**Architecture:** Multi-tenant shared database with Row-Level Security (RLS)

---

## Current Status

**Phase:** MVP Development (Dashboard + Core Features)

**Completed:**

- ✅ Database schema (16 tables, 14 enums, RLS policies)
- ✅ Authentication flows (email/password, GitHub/Google OAuth)
- ✅ Mission Control dashboard (real Supabase data wired)
- ✅ Data seeding (Axon HQ org, 4 AI agents, sample missions)

**In Progress:**

- 🔄 Terminology alignment (Missions→Missions, Actions→Actions)
- 🔄 Mobile responsive fixes
- 🔄 Codex v1.2 compliance rollout

**Next Milestone:**

- Build Cohort Grid, Cohort Detail, Agent Profile, Goal Builder screens
- Establish testing baseline (70/20/10 pyramid)
- Complete Codex compliance (Week 1-3)

---

## Key Decisions

1. **Supabase over Clerk/Neon** — Unified platform for auth + database +
   realtime (ADR-001 pending)
2. **Drizzle ORM over Prisma** — Type-safe, lightweight, better PostgreSQL
   support (ADR-002 pending)
3. **Multi-tenant RLS Strategy** — Shared DB + row-level security for tenant
   isolation (ADR-003 pending)
4. **Terminology:** Domain → Vision → Mission → Operation / Rhythm → Task (based
   on PPV Pro by August Bradley — see `docs/guides/TERMINOLOGY.md`)
5. **Agent Runtime Abstraction** — Clawdbot adapter (v1), future custom runtime
   (v2+)

---

## Critical Constraints

- **Security:** Multi-tenant isolation via RLS is non-negotiable
- **Performance:** Core Web Vitals (LCP <2.5s, INP <200ms, CLS <0.1)
- **Accessibility:** WCAG 2.2 AA compliance mandatory
- **Testing:** 70% unit / 20% integration / 10% E2E minimum

---

## Repository

**Location:** `~/Projects/cohortix/`  
**Monorepo:** Turborepo (apps/web, packages/database, tooling/)  
**Commands:** See CLAUDE.md §1

---

## Team & Agents

**Specialists:**

- **Devi** (ai-developer) — Backend + AI/ML
- **Lubna** (ui-designer) — Frontend + Design
- **Hafiz** (guardian) — QA + DevOps + Security
- **John** (backend-developer) — Backend support
- **Sami** (frontend-developer) — Frontend support
- **PM** (this agent) — Coordination + compliance

---

**Next Steps:** See `docs/plans/CODEX-COMPLIANCE-PLAN.md` for Week 1-3 roadmap.
