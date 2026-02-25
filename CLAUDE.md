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

**Known issues:** Port 3000 often occupied (kill orphans), old `/dashboard/*`
routes coexist with `/[orgSlug]/*`, test API routes need cleanup before prod

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

## Dev Standards (Axon Codex)

Read these before writing any code:

1. **Core rules (always):** `docs/dev-codex/core/`
2. **Backend standards:** `docs/dev-codex/domains/backend/`
3. **Frontend standards:** `docs/dev-codex/domains/frontend/`
4. **QA standards:** `docs/dev-codex/domains/qa/`
5. **DevOps standards:** `docs/dev-codex/domains/devops/`
6. **Design system:** `docs/dev-codex/domains/design-system/`
7. **Playbooks:** `docs/dev-codex/playbooks/`
8. **Templates:** `docs/dev-codex/templates/`

Source: [axon-org/axon-dev-codex](https://github.com/axon-org/axon-dev-codex)
(git submodule)

---

_Living document. Update when significant changes land._
