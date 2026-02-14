# ADR-001: Modern Full-Stack Tech Stack Selection

**Status:** Accepted  
**Date:** 2026-02-11  
**Author:** PM (Codex Compliance Initiative)  
**Reviewers:** Ahmad Ashfaq, Devi (ai-developer), Lubna (ui-designer)  
**Related ADRs:** ADR-002 (Monorepo), ADR-003 (Auth)

---

## Context

**What is the problem or situation that requires a decision?**

Cohortix is a greenfield SaaS application for managing AI agent organizations.
We need to select a modern, production-ready tech stack that supports:

- Rapid iteration and MVP development
- Type-safe full-stack development
- Real-time updates (agent status, action progress)
- Multi-tenant architecture with strong data isolation
- AI/ML integration (embeddings, RAG systems)
- Modern UX expectations (fast page loads, smooth interactions)

**Constraints:**

- Must support multi-tenancy with strong security isolation
- Must integrate with AI/ML services (LLM APIs, vector databases)
- Development team consists primarily of AI agents (need excellent TypeScript
  support + clear documentation)
- Budget-conscious (prefer managed services over self-hosted infrastructure)
- Must achieve Core Web Vitals targets (LCP <2.5s, INP <200ms, CLS <0.1)

**Assumptions:**

- Team has strong TypeScript expertise
- Serverless deployment preferred over containerized infrastructure
- PostgreSQL is sufficient for relational data (no NoSQL requirements
  identified)
- Real-time updates are core UX requirement (not nice-to-have)

---

## Decision

**We will use the following tech stack:**

| Layer                  | Technology               | Version              |
| ---------------------- | ------------------------ | -------------------- |
| **Frontend Framework** | Next.js                  | 15 (App Router)      |
| **UI Library**         | React                    | 19                   |
| **Language**           | TypeScript               | Latest (strict mode) |
| **Styling**            | Tailwind CSS             | 3.x                  |
| **Database**           | PostgreSQL               | 16 + pgvector        |
| **Database Provider**  | Supabase                 | Latest               |
| **Auth**               | Supabase Auth            | Latest               |
| **Realtime**           | Supabase Realtime        | Latest               |
| **ORM**                | Drizzle ORM              | Latest               |
| **State Management**   | TanStack Query + Zustand | Latest               |
| **Form Handling**      | React Hook Form + Zod    | Latest               |
| **Deployment**         | Vercel                   | Latest               |

**Rationale:**

1. **Next.js 15 + React 19:** Industry-standard full-stack React framework with
   excellent TypeScript support, built-in optimizations (Server Components,
   streaming), and seamless Vercel deployment. App Router provides modern
   patterns (Server Components by default, co-located data fetching).

2. **Supabase (Database + Auth + Realtime):** Unified platform provides
   PostgreSQL database, authentication, and real-time subscriptions in one
   service. Reduces integration complexity vs. Clerk (auth) + Neon (database) +
   separate realtime solution. Built-in Row-Level Security (RLS) is ideal for
   multi-tenant architecture.

3. **Drizzle ORM:** Type-safe, lightweight ORM with excellent PostgreSQL
   support. Better type inference than Prisma, zero runtime overhead, and
   migration system that generates SQL (easier to review and debug).

4. **Tailwind CSS v3:** Utility-first CSS framework with excellent design system
   support. v3 is production-stable (v4 is alpha as of Feb 2026).

5. **Vercel Deployment:** Zero-config deployment for Next.js, automatic preview
   URLs, edge network, and built-in observability. Serverless architecture
   reduces operational overhead.

---

## Options Considered

### Option 1: Next.js + Clerk + Neon + Prisma

**Pros:**

- Clerk has polished auth UI components
- Neon offers excellent PostgreSQL performance
- Prisma is widely adopted

**Cons:**

- Three separate services to integrate (Clerk, Neon, plus realtime solution)
- Prisma's type inference is less powerful than Drizzle
- No built-in realtime (would need to add Pusher/Ably)
- Higher monthly cost ($20 Clerk + $19 Neon + $10 Pusher = $49/mo minimum)

**Why not chosen:**  
Integration complexity outweighs benefits. Supabase provides auth + database +
realtime in one platform for $25/mo.

---

### Option 2: Next.js + Supabase + Prisma

**Pros:**

- Supabase unifies auth + database + realtime
- Prisma is familiar to many developers

**Cons:**

- Prisma's type inference weaker than Drizzle
- Prisma migrations generate client code (slower, larger bundle)
- Prisma's PostgreSQL support less comprehensive than Drizzle

**Why not chosen:**  
Drizzle provides better DX for PostgreSQL-specific features (RLS, enums,
generated columns).

---

### Option 3: Next.js + Supabase + Drizzle ✅ **SELECTED**

**Pros:**

- **Unified platform:** Auth, database, and realtime in one service (Supabase)
- **Type-safe ORM:** Drizzle provides excellent TypeScript inference
- **PostgreSQL-first:** Drizzle excels at PostgreSQL-specific features (RLS,
  enums)
- **Lightweight:** Zero runtime overhead (Drizzle is query builder, not heavy
  ORM)
- **Cost-effective:** $25/mo Supabase covers auth + DB + realtime
- **Row-Level Security:** Native PostgreSQL RLS for multi-tenant isolation

**Cons:**

- Drizzle is newer (less community content than Prisma)
- Supabase is vendor lock-in risk (though PostgreSQL export is straightforward)

**Why chosen:**  
Best balance of developer experience, performance, and cost. Drizzle's type
safety prevents entire classes of bugs. Supabase's unified platform reduces
integration complexity.

---

## Consequences

### Positive Consequences

- ✅ **Full-stack type safety:** TypeScript types flow from database schema →
  API → UI
- ✅ **Faster development:** Unified platform reduces context switching
- ✅ **Built-in security:** Supabase RLS enforces multi-tenant isolation at
  database level
- ✅ **Real-time UX:** Live updates for agent status, action progress, comments
- ✅ **Cost-effective:** ~$25/mo for auth + database + realtime (vs. $50+ for
  separate services)
- ✅ **Excellent DX:** Drizzle Studio for database GUI, Next.js Fast Refresh,
  Vercel preview URLs

### Negative Consequences

- ❌ **Vendor lock-in:** Supabase-specific features (auth, realtime) are harder
  to migrate
- ❌ **Learning curve:** Drizzle is newer, less Stack Overflow content than
  Prisma
- ❌ **Supabase limits:** Free tier has connection limits (need to monitor
  usage)

### Mitigation Strategies

- **Vendor lock-in:** Abstract Supabase auth behind interface (see ADR-003).
  PostgreSQL data is portable (pg_dump).
- **Learning curve:** Document Drizzle patterns in CLAUDE.md. Create example
  queries in codebase.
- **Connection limits:** Use Supabase connection pooling. Monitor with alerts.
  Upgrade to Pro ($25/mo) provides 500 connections.

---

## Implementation

### Action Items

- [x] Install dependencies (Next.js 15, React 19, Drizzle, Supabase)
- [x] Configure TypeScript strict mode
- [x] Set up Supabase project + enable extensions (uuid-ossp, pgvector, pg_trgm)
- [x] Configure Drizzle schema + migrations
- [x] Set up Vercel project + environment variables
- [x] Document setup in CLAUDE.md

**Owner:** Devi (ai-developer)  
**Completed:** February 10, 2026

### Validation Criteria

- [x] TypeScript strict mode enabled, zero `any` types in production code
- [x] Drizzle schema generates types matching database
- [x] Supabase RLS policies enforce tenant isolation (tested)
- [x] Dev server starts in <5 seconds
- [x] Production build succeeds with zero errors

**Review Date:** 2026-05-01 (After 3 months of production use)

---

## References

**Supporting Documents:**

- [Next.js 15 Release Notes](https://nextjs.org/blog/next-15)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Next.js Deployment Guide](https://vercel.com/docs/frameworks/nextjs)

**Related Work:**

- ADR-002: Monorepo structure (Turborepo)
- ADR-003: Authentication approach (Supabase Auth)
- `docs/TECH_STACK.md` — Detailed technology explanations

---

## Status History

| Date       | Status     | Notes                                                 |
| ---------- | ---------- | ----------------------------------------------------- |
| 2026-02-05 | Proposed   | Initial tech stack selection during project kickoff   |
| 2026-02-10 | Accepted   | Approved by Ahmad, implemented by Devi                |
| 2026-02-11 | Documented | Formalized as ADR-001 during Codex compliance rollout |

---

## Notes

**Why Not Remix?** Considered Remix as Next.js alternative. Rejected because:

- Smaller ecosystem than Next.js
- Less AI agent familiarity (most training data includes Next.js examples)
- Vercel optimizations are Next.js-specific

**Why Not tRPC?** Considered tRPC for type-safe API layer. Rejected because:

- Next.js Server Actions provide type safety without additional abstraction
- Simpler mental model (fewer concepts to learn)
- Server Components eliminate many API calls entirely

**Future Considerations:** If Supabase vendor lock-in becomes a concern, we can
migrate to:

- Database: Neon or self-hosted PostgreSQL
- Auth: Clerk or Auth.js
- Realtime: Pusher or Ably (Estimated migration effort: 2-3 weeks)

---

_This ADR follows the Axon Codex v1.2 ADR Standards (§5.1.3)._
