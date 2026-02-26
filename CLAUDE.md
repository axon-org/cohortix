# CLAUDE.md — Cohortix

**Agents-as-a-Service (AaaS) platform** — humans manage AI agent organizations.
Domain: cohortix.ai | Tagline: "Your AI crew, ready for action."

---

## ⚠️ Before Any Work

1. Run `npx prettier --write <files>` on ALL modified files before committing
2. Read `docs/guides/TERMINOLOGY.md` — the authoritative terminology reference
3. Never commit directly to `main` or `dev` — use feature branches + PRs

---

## Tech Stack

Next.js 15 (App Router) · React 19 · Tailwind 3 · shadcn/ui · Drizzle ORM ·
Supabase (PostgreSQL + RLS) · Clerk auth · TanStack Query · Zustand ·
Turborepo + pnpm · Vercel Pro · Vitest + Playwright

---

## Commands

```bash
pnpm dev              # Dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint
pnpm type-check       # TypeScript
pnpm test             # Vitest
pnpm test:e2e         # Playwright
pnpm db:push          # Push schema to Supabase (dev only)
pnpm db:generate      # Generate Drizzle migrations
pnpm db:studio        # Drizzle Studio GUI
pnpm format           # Prettier
```

---

## Project Structure

```
apps/web/src/
  app/[orgSlug]/        # Org-scoped pages (primary routes)
  app/api/v1/           # API routes
  components/           # UI components (shadcn/ui in ui/)
  hooks/                # React Query hooks
  lib/                  # Utils, validations, API client
  server/db/queries/    # Server-side DB queries
  middleware.ts         # Clerk auth
packages/database/src/schema/  # Drizzle schemas (25 tables)
supabase/migrations/           # SQL migrations
docs/                          # All documentation
```

**Key docs:** `docs/guides/TERMINOLOGY.md` · `docs/specs/PRD.md` ·
`docs/architecture/ARCHITECTURE.md` · `docs/specs/API_DESIGN.md` ·
`docs/design/BRAND_GUIDELINES.md` · `docs/sprints/cohortix-sprint-backlog.md`

---

## Terminology (PPV Hierarchy)

```
Domain → Vision → Mission → Operation / Rhythm → Task
```

Use **Agent** (not bot), **Cohort** (group of agents), **Operation** (not
project), **Mission** (not goal), **Task** (not action), **Mission Control**
(not dashboard), **Recruit** (not create), **Deploy** (not run). Full reference:
`docs/guides/TERMINOLOGY.md`

---

## Environments

| Env        | Branch     | URL                 | Supabase                        | Clerk         |
| ---------- | ---------- | ------------------- | ------------------------------- | ------------- |
| Production | `main`     | cohortix.ai         | `qobvewyakovekbuvwjkt` (main)   | Prod instance |
| Staging    | `dev`      | staging.cohortix.ai | `cclsfxrnlgjfididtzym` (branch) | Dev instance  |
| Local      | feature/\* | localhost:3000      | staging branch                  | Dev instance  |

Flow: `feature/* → PR → dev (staging) → PR → main (production)`

Never manually `db push` to production — GitHub Integration auto-applies on
merge to `main`. Details: `docs/guides/ENVIRONMENT-STRATEGY.md` ·
`docs/guides/STAGING-SETUP.md`

---

## Current State

**Built:** Mission Control dashboard, Visions, Missions, Operations (table +
kanban), Cohorts, Agents, Settings, Onboarding, Clerk auth, org-scoped routing
(`[orgSlug]/*`), 25 DB schemas with RLS

**Not built:** Operations redesign (card grid, 5-tab detail), My Tasks
(placeholder), Inbox, AI integration, Knowledge Base UI, Domains page, Rhythms
UI, real-time updates, mobile responsive, global search

**Last completed:** Sprint 4 (Mission Control + stabilization), terminology
migration `allies` → `agents` (PR #31)

**Known issues:** Port 3000 often occupied (kill orphans), legacy `/dashboard/*`
routes redirect to `/${orgSlug}/*` routes coexist with `/[orgSlug]/*`, test API
routes need cleanup before prod

---

## Code Conventions

- **Server Components by default** — `"use client"` only when needed
- **Named exports**, explicit interfaces, no `any`
- **kebab-case** filenames: `operation-card.tsx`, `use-operations.ts`
- **API pattern:** Route Handler → Zod validation → Service layer → Drizzle →
  JSON
- **Response format:** `{ data, meta, pagination? }` success,
  `{ error: { code, message, details } }` error
- **DB rules:** UUID PKs, `TIMESTAMPTZ`, `organization_id` + RLS on tenant
  tables, `IF NOT EXISTS` in migrations
- **Commits:** `feat(operations): add grid view` · `fix(auth): session expiry` —
  scopes: auth, api, db, ui, operations, missions, agents, tasks
- **Max:** 50 lines/function, 500 lines/file, 10 props/component

---

## Decisions Made

- DDR-001: Color palette + accessibility
- DDR-002: Terminology (PPV hierarchy)
- DDR-003: Responsive breakpoints
- DDR-004: Component library (shadcn/ui)

Full records: `docs/decisions/`

---

## Dev Standards (Axon Codex v1.8.2)

The Axon Dev Codex is installed as **7 auto-loading skills**. No local copy
needed — skills are globally installed and symlinked to the source repo.

### Skills (auto-loaded by agents)

| Skill                 | When It Loads                                  |
| --------------------- | ---------------------------------------------- |
| `codex-core`          | Always — architecture, conventions, operations |
| `codex-backend`       | Backend work — API, DB, auth, security         |
| `codex-frontend`      | Frontend work — Next.js, React, Tailwind, a11y |
| `codex-qa`            | Testing — pyramid, validation protocol, E2E    |
| `codex-devops`        | CI/CD, deployment, infra, observability        |
| `codex-design-system` | Design tokens, components, responsive          |
| `codex-ai-ml`         | LLM integration, RAG, prompt engineering       |

### Key standards (v1.8.2)

- **Multi-stage security prompting** — agents MUST self-review for
  vulnerabilities
- **MCP integration standards** — tool interop patterns
- **Agent self-validation protocol** — Plan → Implement → Validate loop with
  dual-layer verification (UI + DB), severity-based auto-fix boundaries
- **codex-init.sh** — bootstrap CLAUDE.md/AGENTS.md from project scan

### Direct reference (source repo)

- Playbooks: `~/Projects/axon/dev-codex/playbooks/`
- Templates: `~/Projects/axon/dev-codex/templates/`
- Routing guide: `~/Projects/axon/dev-codex/ROUTING.md`
- Source: [axon-org/axon-dev-codex](https://github.com/axon-org/axon-dev-codex)

---

_Living document. Update when significant changes land._
