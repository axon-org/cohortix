# CLAUDE.md — Cohortix Development Context

**Mission:** Cohortix  
**Version:** 1.0.0  
**Last Updated:** 2026-02-22

## ⚠️ MANDATORY: Format Before Committing

**ALWAYS run `npx prettier --write <files>` on every file you modify before
committing.** This project uses Prettier for code formatting. CI lint checks
will fail if files aren't formatted. This applies to ALL file types: `.ts`,
`.tsx`, `.js`, `.yml`, `.yaml`, `.css`, `.md`, `.json`.

**Axon Codex Compliance:** v1.1 §2.2.1

---

## 🚦 BUILD PROGRESS (Resume From Here)

### Current Status: Dashboard Wired + Terminology Alignment In Progress

### What's Done ✅

1. **UI Mockups** — 8 screens designed (v1 + v3) in
   `/Users/alimai/clawd/cohortix-mockups/v3/`
2. **Mission Control Dashboard** — Built with sidebar, header, KPI cards,
   sparklines, engagement chart, activity feed, alerts
3. **Auth Screens** — Sign-in, sign-up, forgot-password with Supabase Auth
   (email/password + GitHub/Google OAuth)
4. **Database Schema** — 16 tables, 14 enums, RLS policies pushed to Supabase
5. **Data Seeding** — Axon HQ org, 4 AI allies (Devi, Lubna, Zara, Khalid),
   missions, actions
6. **Dashboard Wiring** — Real Supabase data flowing to all dashboard components
7. **Terminology Alignment** — IN PROGRESS (subagent running)

### What's Next 🔜

1. ~~Complete terminology alignment~~ ✅ Done (2026-02-13) — see
   `docs/guides/TERMINOLOGY.md`
2. Mobile responsive fixes for dashboard
3. Fix Next.js warnings (bottom-left corner)
4. Build Cohort Grid screen
5. Build Cohort Detail screen
6. Build Ally Profile screen
7. Build Goal Builder screen (may rename/rethink given terminology changes)
8. Replace hand-rolled SVG chart with Recharts/Tremor
9. Add cohort performance table (missing from dashboard mockup)

### Key Decisions Made

- **Clerk** for authentication, **Supabase** for database (migrated from
  Supabase Auth to Clerk as of 2026-02-14)
- **Tailwind v3** (codebase uses v3 syntax, was accidentally installed as v4)
- **Terminology hierarchy:** Domain → Vision → Mission → Operation/Rhythm → Task
  (PPV Pro by August Bradley, rebranded for Cohortix)
- **⚠️ MANDATORY: Read `docs/guides/TERMINOLOGY.md` before any work** — this is
  the authoritative terminology reference. Use ONLY these terms in code, UI,
  docs, and communications.
- **Supabase server client** lives in `apps/web/src/lib/supabase/` (NOT in
  shared packages — Next.js `cookies()` can't run from packages)

### Credentials & Environment Architecture (Updated 2026-02-19)

**Domains:**

- `cohortix.ai` → Marketing/landing page
- `app.cohortix.ai` → SaaS app for logged-in users
- `staging.cohortix.ai` → Staging environment

**Supabase (Branching 2.0 — single project with branches):**

- **Production:** `qobvewyakovekbuvwjkt` (main branch)
- **Staging:** `cclsfxrnlgjfididtzym` (persistent branch off production)
- **Local:** `supabase start` (local Docker) or dev project
- Config: `supabase/config.toml` with `[remotes.staging]`
- CLI linked to production project

**Clerk (single app: `cohortix-production`):**

- **Production instance** → `pk_live_*` / `sk_live_*` → used by Vercel
  Production
- **Development instance** → `pk_test_*` / `sk_test_*` → used by Vercel Staging,
  Preview, Development, and local
- Webhook endpoints: `staging.cohortix.ai/api/webhooks/clerk` (Dev),
  `app.cohortix.ai/api/webhooks/clerk` (Prod)
- `authorizedParties` in middleware: `localhost:3000`, `staging.cohortix.ai`,
  `cohortix.ai`, `app.cohortix.ai`

**Vercel (4 environments, all fully configured):**

- **Production** → `main` branch → `cohortix.ai` → Clerk Prod + Supabase Prod
- **Staging** (custom) → `dev` branch → `staging.cohortix.ai` → Clerk Dev +
  Supabase staging branch
- **Preview** → PR branches → Clerk Dev + Supabase staging branch
- **Development** → `vercel dev` → Clerk Dev + Supabase staging branch

**GitHub Actions:**

- `deploy-production.yml` → push to `main` → Vercel Production
- `deploy-staging.yml` → push to `dev` → Vercel Staging
  (`--environment=staging`)
- `preview.yml` → PRs to `main` → Vercel Preview

**Env files:** `apps/web/.env.local` has local dev keys (Clerk Dev instance +
Supabase staging branch)

### Branching & Deployment Flow

```
feature/* ──PR──▶ dev ──PR──▶ main
  (work)        (staging)   (production)
```

- **Local:** `pnpm dev` on feature branch → uses staging Supabase + Clerk Dev
- **Preview:** Every push to a PR branch → Vercel auto-generates preview URL
- **Staging:** Merge to `dev` → auto-deploys to `staging.cohortix.ai`
- **Production:** PR `dev` → `main` → auto-deploys to `cohortix.ai`
- **Hotfixes:** Branch off `main`, fix, PR → `main`, then merge `main` back to
  `dev`
- See `CONTRIBUTING.md` for full details

**⚠️ OLD PROJECTS (do NOT use, scheduled for deletion):**

- Supabase: `Cohortix` (rfwscvklcokzuofyzqwx), `cohortix-staging`
  (lrgjattslacqfhmqexoe)
- Clerk: `cohortix-staging`, `Cohortix`

### Known Issues

- Port 3000 often occupied by orphaned processes — kill before starting dev
  server
- Dashboard queries had `status` column filter that doesn't exist in schema —
  removed
- Activity feed empty until audit logs are seeded
- Mobile layout not responsive yet

---

## What is Cohortix?

Cohortix is an **Allies-as-a-Service (AaaS)** platform that enables humans to
manage a high-performing organization of AI allies. It's a multi-tenant SaaS
built with Next.js 15, React 19, and PostgreSQL, designed to bridge the gap
between human strategic direction and autonomous AI execution.

**Core Concept:** While traditional mission management tools (ClickUp, Linear)
focus on human-to-human collaboration, Cohortix is built from the ground up for
human-to-AI team orchestration through a unified interface called **Mission
Control**.

**Domain:** cohortix.ai  
**Tagline:** "Your AI crew, ready for action."

### Key Differentiators

1. **Bidirectional Goal Setting**: Both humans AND allies can propose goals.
   Allies proactively suggest improvements based on observations (e.g., "test
   coverage dropped, proposing goal to fix it"), subject to human approval.

2. **Living Knowledge Base**: Not just logs — a continuously evolving knowledge
   system with:
   - Graph relationships between concepts (depends-on, related-to, supersedes,
     contradicts)
   - Knowledge versioning and evolution over time
   - Cross-ally knowledge sharing (one ally's learning benefits others)
   - Context-aware knowledge suggestions during missions

3. **Agent Evolution System**: Allies systematically improve through:
   - Daily learning sessions (course/material ingestion)
   - Expertise growth tracking (measurable skill improvements)
   - Structured learning paths (beginner → intermediate → expert)
   - Self-improvement protocols (allies identify gaps and seek knowledge)

---

## 1. Commands

### Setup & Development

```bash
# Initial setup
git clone <repository-url>
cd cohortix
pnpm install                    # Install all dependencies

# Environment setup
cp .env.example .env.local      # Create local environment file
# Edit .env.local with your credentials (see §9 Environment Setup)

# Database setup
pnpm db:generate                # Generate Drizzle schema
pnpm db:push                    # Push schema to database (development)
pnpm db:migrate                 # Run migrations (production)
pnpm db:studio                  # Open Drizzle Studio (database GUI)

# Development
pnpm dev                        # Start Next.js dev server (localhost:3000)
pnpm dev --turbo                # Start with Turbo mode

# Building
pnpm build                      # Build all packages
pnpm build --filter=web         # Build specific app
pnpm type-check                 # TypeScript type checking
pnpm lint                       # Run ESLint
pnpm lint:fix                   # Auto-fix linting issues

# Testing
pnpm test                       # Run all tests (Vitest)
pnpm test:watch                 # Watch mode
pnpm test:coverage              # Generate coverage report
pnpm test:e2e                   # Run E2E tests (Playwright)
pnpm test:e2e:ui                # E2E tests with UI

# Code quality
pnpm format                     # Format with Prettier
pnpm format:check               # Check formatting
pnpm clean                      # Clean build artifacts

# Turborepo
pnpm turbo run build            # Build with caching
pnpm turbo run build --force    # Rebuild without cache
```

### Database Commands

```bash
# Schema management
pnpm db:generate                # Generate migration files
pnpm db:migrate                 # Apply pending migrations
pnpm db:push                    # Push schema changes (dev only - skips migrations)
pnpm db:pull                    # Pull schema from database
pnpm db:drop                    # Drop database (⚠️ destructive)

# Data management
pnpm db:seed                    # Seed database with test data
pnpm db:studio                  # Open Drizzle Studio

# Testing
pnpm db:reset                   # Drop, recreate, migrate, seed
```

### Production Deployment

```bash
# Via Vercel (automatic on push to main)
git push origin main

# Manual deployment
vercel --prod

# Rollback
vercel rollback <deployment-url>
```

---

## 2. Testing

### Framework & Tools

- **Unit/Integration:** Vitest (fast, Vite-powered, Jest-compatible)
- **E2E:** Playwright (cross-browser, auto-wait, tracing)
- **Component Testing:** Playwright Component Testing (future)
- **Coverage:** Istanbul via Vitest

### Coverage Thresholds

```json
{
  "coverage": {
    "lines": 70,
    "functions": 70,
    "branches": 65,
    "statements": 70
  }
}
```

**Critical paths require 80%+ coverage:**

- Authentication flows
- Multi-tenant isolation
- Payment processing
- Data mutations (CRUD operations)

### Testing Patterns

**Unit Tests (Vitest):**

```typescript
// tests/unit/services/mission-service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { projectService } from '@/lib/services/mission-service';

describe('ProjectService', () => {
  beforeEach(() => {
    // Setup mock database
  });

  it('should create mission with valid data', async () => {
    const mission = await projectService.create({
      name: 'Test Mission',
      organizationId: 'org_123',
    });

    expect(mission.id).toBeDefined();
    expect(mission.name).toBe('Test Mission');
  });

  it('should enforce tenant isolation', async () => {
    await expect(
      projectService.getById('proj_from_other_org', 'org_123')
    ).rejects.toThrow('Mission not found');
  });
});
```

**E2E Tests (Playwright):**

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can sign in and access dashboard', async ({ page }) => {
  await page.goto('/sign-in');

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

### Test Organization

```
tests/
├── unit/                       # Unit tests (co-located with source also OK)
│   ├── services/
│   ├── utils/
│   └── validations/
├── integration/                # Integration tests (API, database)
│   └── api/
└── e2e/                        # End-to-end tests
    ├── auth.spec.ts
    ├── missions.spec.ts
    └── actions.spec.ts
```

### Running Tests

```bash
# All tests
pnpm test

# Specific test file
pnpm test mission-service

# Watch mode (re-run on changes)
pnpm test:watch

# Coverage report
pnpm test:coverage

# E2E tests
pnpm test:e2e

# E2E with UI (debugging)
pnpm test:e2e:ui
```

### Test Guidelines

1. **Arrange-Act-Assert:** Structure tests clearly
2. **One assertion per test:** Keep tests focused
3. **Meaningful names:** `should reject invalid email format`
4. **Mock external services:** Don't hit real APIs
5. **Test behavior, not implementation:** Avoid testing internals
6. **Avoid flaky tests:** Use proper waits, not timeouts

---

## 3. Mission Structure

### Monorepo Architecture (Turborepo)

```
cohortix/
├── apps/
│   ├── web/                    # Main Next.js application
│   └── docs/                   # Documentation site (future)
│
├── packages/
│   ├── database/               # Drizzle ORM schema + client
│   ├── types/                  # Shared TypeScript types
│   ├── ui/                     # Shared UI components
│   ├── config/                 # Shared configurations
│   └── utils/                  # Shared utility functions
│
├── tooling/
│   ├── eslint/                 # ESLint configurations
│   ├── typescript/             # TypeScript configurations
│   └── tailwind/               # Tailwind configurations
│
├── docs/                       # Mission documentation
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── TECH_STACK.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_DESIGN.md
│   ├── SECURITY.md
│   ├── FOLDER_STRUCTURE.md
│   ├── GIT_WORKFLOW.md
│   ├── BRAND_GUIDELINES.md
│   └── DESIGN_SPECS.md
│
├── scripts/                    # Development scripts
│   └── seed-db.ts
│
├── .github/
│   └── workflows/              # CI/CD pipelines
│       ├── ci.yml
│       ├── preview.yml
│       └── release.yml
│
├── turbo.json                  # Turborepo configuration
├── pnpm-workspace.yaml         # pnpm workspace config
└── package.json                # Root package.json
```

### Next.js App Structure (`apps/web/`)

```
apps/web/
├── public/                     # Static assets
│   ├── images/
│   └── fonts/
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes (sign-in, sign-up)
│   │   ├── (marketing)/        # Public pages (landing, pricing)
│   │   ├── (dashboard)/        # Protected routes (main app)
│   │   │   ├── missions/
│   │   │   ├── agents/
│   │   │   ├── knowledge/
│   │   │   ├── goals/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   │
│   │   ├── api/                # API Route Handlers
│   │   │   └── v1/
│   │   │       ├── missions/
│   │   │       ├── actions/
│   │   │       ├── agents/
│   │   │       ├── knowledge/
│   │   │       └── webhooks/
│   │   │
│   │   ├── layout.tsx          # Root layout
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   └── globals.css
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   ├── features/           # Feature-specific components
│   │   │   ├── missions/
│   │   │   ├── actions/
│   │   │   ├── agents/
│   │   │   └── knowledge/
│   │   ├── layouts/            # Layout components
│   │   └── shared/             # Cross-feature components
│   │
│   ├── lib/                    # Core utilities
│   │   ├── api/                # API client utilities
│   │   ├── auth/               # Auth utilities
│   │   ├── db/                 # Database utilities
│   │   ├── hooks/              # Custom React hooks
│   │   ├── stores/             # Zustand stores
│   │   ├── services/           # Business logic services
│   │   ├── validations/        # Zod schemas
│   │   └── utils/              # General utilities
│   │
│   ├── server/                 # Server-only code
│   │   ├── actions/            # Server Actions
│   │   ├── db/                 # Server-side DB access
│   │   │   ├── queries/
│   │   │   └── mutations/
│   │   └── integrations/       # External service integrations
│   │
│   └── types/                  # App-specific types
│
├── tests/                      # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.local                  # Local environment variables
├── .env.example                # Environment template
├── components.json             # shadcn/ui configuration
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

### Database Package Structure (`packages/database/`)

```
packages/database/
├── src/
│   ├── schema/                 # Drizzle schema definitions
│   │   ├── organizations.ts
│   │   ├── users.ts
│   │   ├── missions.ts
│   │   ├── actions.ts
│   │   ├── agents.ts
│   │   ├── knowledge.ts
│   │   ├── comments.ts
│   │   ├── audit-logs.ts
│   │   └── index.ts
│   │
│   ├── migrations/             # SQL migrations
│   │   ├── 0000_initial.sql
│   │   └── meta/
│   │
│   ├── client.ts               # Database client export
│   ├── types.ts                # Inferred types from schema
│   └── index.ts
│
├── drizzle.config.ts
├── tsconfig.json
└── package.json
```

### Import Aliases

```typescript
// Use these aliases for cleaner imports

// App-level
import { Button } from '@/components/ui/button'; // apps/web/src/components/ui/button
import { useProjects } from '@/lib/hooks/use-missions'; // apps/web/src/lib/hooks/use-missions
import { projectService } from '@/lib/services/mission-service';
import { ProjectCard } from '@/components/features/missions/mission-card';

// Package-level
import { db } from '@repo/database'; // packages/database/src
import type { Mission } from '@repo/types'; // packages/types/src
import { Button } from '@repo/ui/button'; // packages/ui/src/button
import { formatDate } from '@repo/utils/dates'; // packages/utils/src/dates
```

---

## 4. Code Style

### TypeScript Configuration

**Strict mode enabled** — no exceptions.

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### General TypeScript Rules

```typescript
// ✅ GOOD: Explicit types for function parameters and return
export async function getProject(id: string): Promise<Mission | null> {
  return await db.query.projects.findFirst({
    where: eq(missions.id, id),
  });
}

// ❌ BAD: Implicit any types
export async function getProject(id) {
  return await db.query.projects.findFirst({ where: eq(projects.id, id) });
}

// ✅ GOOD: Zod schema for validation
const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  organizationId: z.string().uuid(),
});

// ❌ BAD: Unvalidated input
function createProject(data: any) {
  // No validation!
}

// ✅ GOOD: Handle array access safely
const firstProject = missions[0]; // Type: Mission | undefined
if (firstProject) {
  console.log(firstProject.name); // Safe access
}

// ❌ BAD: Assume array has items
const firstProject = missions[0]; // With noUncheckedIndexedAccess: false
console.log(firstProject.name); // Runtime error if array is empty
```

### React Component Patterns

**Default to Server Components** — use `"use client"` only when needed.

```typescript
// ✅ GOOD: Server Component (default)
// app/(dashboard)/missions/page.tsx
import { db } from '@repo/database';

export default async function ProjectsPage() {
  const projects = await db.query.projects.findMany();

  return (
    <div>
      {missions.map(mission => (
        <ProjectCard key={mission.id} mission={mission} />
      ))}
    </div>
  );
}

// ✅ GOOD: Client Component (when needed)
// components/features/missions/mission-form.tsx
'use client';

import { useState } from 'react';

interface ProjectFormProps {
  onSubmit: (data: ProjectData) => void;
}

export function ProjectForm({ onSubmit }: ProjectFormProps) {
  const [name, setName] = useState('');
  // ... client-side state management
}

// ❌ BAD: Client Component without directive
export function ProjectForm({ onSubmit }: ProjectFormProps) {
  const [name, setName] = useState(''); // Error: useState in Server Component
}
```

**Component Structure:**

```typescript
// ✅ GOOD: Explicit interface, named export
interface UserCardProps {
  user: User;
  onEdit: (id: string) => void;
  className?: string;
}

export function UserCard({ user, onEdit, className }: UserCardProps) {
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user.id)}>Edit</button>
    </div>
  );
}

// ❌ BAD: Inline types, default export
export default function UserCard({ user, onEdit }: { user: any; onEdit: any }) {
  return <div>{user.name}</div>;
}
```

### File Naming

| Type             | Convention | Example                     |
| ---------------- | ---------- | --------------------------- |
| React Components | kebab-case | `project-card.tsx`          |
| Utilities        | kebab-case | `dates.ts`                  |
| Types            | kebab-case | `project.ts`                |
| Routes           | kebab-case | `api/v1/project-templates/` |
| CSS/Styles       | kebab-case | `globals.css`               |

### Function Naming

```typescript
// ✅ GOOD: Clear, descriptive names
function getUserById(id: string): Promise<User | null> {}
async function createProject(data: ProjectInput): Promise<Mission> {}
function isValidEmail(email: string): boolean {}

// ❌ BAD: Vague, abbreviated names
function get(id: string) {}
function create(d: any) {}
function check(e: string) {}
```

### Max Lengths

- **Function:** 50 lines
- **File:** 500 lines
- **Line length:** 100 characters (soft limit)
- **Component props:** 10 props max (use composition instead)

### Code Organization

**Service Layer Pattern:**

```typescript
// ✅ GOOD: Separate concerns cleanly

// Route Handler (API layer)
// app/api/v1/missions/route.ts
import { projectService } from '@/lib/services/mission-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');

  const missions = await projectService.list(organizationId);

  return Response.json({ data: missions });
}

// Service Layer (business logic)
// lib/services/mission-service.ts
import { db } from '@repo/database';

export const projectService = {
  async list(organizationId: string) {
    return await db.query.projects.findMany({
      where: eq(missions.organizationId, organizationId),
    });
  },

  async create(data: ProjectInput) {
    // Validation, business rules, etc.
  },
};

// ❌ BAD: Business logic in route handler
export async function GET(request: Request) {
  const projects = await db.query.projects.findMany(); // Direct DB access in route
  return Response.json({ data: missions });
}
```

### Error Handling

```typescript
// ✅ GOOD: Custom error classes
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public details: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Usage
if (!userId) {
  throw new UnauthorizedError('Authentication required');
}

// ❌ BAD: Generic error without context
throw new Error('Error');
```

---

## 5. Git Workflow

### Branch Strategy

```
main (production)
  ↑
  └── staging (pre-production)
        ↑
        └── dev (development)
              ↑
              ├── feature/ACC-123-user-auth
              ├── feature/ACC-124-action-kanban
              ├── bugfix/ACC-200-login-redirect
              └── hotfix/ACC-300-security-patch
```

### Branch Naming

```
<type>/<ticket-id>-<short-description>

Examples:
feature/ACC-123-user-authentication
bugfix/ACC-200-login-redirect
hotfix/ACC-300-security-patch
chore/update-dependencies
refactor/ACC-150-api-cleanup
docs/api-documentation
```

### Commit Message Format (Conventional Commits)

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Formatting (no code change)
- `refactor` — Code refactoring
- `test` — Add/update tests
- `chore` — Maintenance
- `perf` — Performance improvement
- `ci` — CI/CD changes

**Scopes:**

- `auth` — Authentication
- `api` — API routes
- `db` — Database
- `ui` — UI components
- `tasks` — Task management
- `projects` — Project management
- `agents` — Agent features
- `knowledge` — Knowledge base
- `search` — Search functionality

**Examples:**

```bash
# Feature
feat(actions): add subtask support

Implement subtask creation and display within action cards.

Closes ACC-123

# Bug fix
fix(auth): resolve session expiry redirect

Users were not being redirected to login on session expiry.

Fixes ACC-200

# Breaking change
feat(api)!: change mission response structure

BREAKING CHANGE: The `owner` field is now an object instead of string ID.

Migration: Update API consumers to use `project.owner.id` instead of `project.owner`.

Closes ACC-150
```

### Pull Request Process

1. **Create feature branch from `dev`:**

   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/ACC-123-user-auth
   ```

2. **Commit changes with conventional commits:**

   ```bash
   git add .
   git commit -m "feat(auth): implement login form"
   ```

3. **Push and create PR:**

   ```bash
   git push origin feature/ACC-123-user-auth
   # Create PR to dev via GitHub UI
   ```

4. **CI runs automatically:**
   - Lint
   - Type check
   - Unit tests
   - Build
   - Preview deployment (Vercel)

5. **Code review:**
   - At least 1 approval required
   - All CI checks must pass
   - Address review comments

6. **Merge:**
   - Squash merge preferred
   - Delete branch after merge

### Protected Branches

| Branch    | Approvals | Status Checks | Force Push |
| --------- | --------- | ------------- | ---------- |
| `main`    | 2         | All must pass | ❌         |
| `staging` | 1         | All must pass | ❌         |
| `dev`     | 1         | Required      | ❌         |

### Before Opening PR

```bash
# 1. Run all checks locally
pnpm lint                       # No lint errors
pnpm type-check                 # No type errors
pnpm test                       # All tests pass
pnpm build                      # Build succeeds

# 2. Update if dev has changed
git checkout dev
git pull origin dev
git checkout feature/ACC-123-user-auth
git rebase dev

# 3. Push and create PR
git push origin feature/ACC-123-user-auth
```

### Hotfix Process (Urgent Production Fixes)

```bash
# 1. Branch from main
git checkout main
git pull origin main
git checkout -b hotfix/ACC-300-security-patch

# 2. Implement minimal fix
# ... make changes ...

# 3. Create PR to main (expedited review)
git commit -m "fix(security): patch XSS vulnerability"
git push origin hotfix/ACC-300-security-patch

# 4. After merge to main, backport to staging and dev
git checkout staging
git cherry-pick <hotfix-commit>
git push origin staging

git checkout dev
git cherry-pick <hotfix-commit>
git push origin dev
```

---

## 6. Boundaries (Permissions)

**These boundaries define what AI development agents can do autonomously vs.
what requires human approval.**

### Tier 1 — Always Safe (No Confirmation Needed)

✅ **Read Operations:**

- Read any file in the repository
- Search codebase
- Check git status/log/diff
- View environment variables (not values)
- Read documentation

✅ **Non-Destructive Commands:**

- Run tests (`pnpm test`)
- Run linting (`pnpm lint`)
- Type checking (`pnpm type-check`)
- Build mission (`pnpm build`)
- Start dev server (`pnpm dev`)
- View database schema (`pnpm db:studio`)

✅ **Safe Analysis:**

- Generate code suggestions
- Analyze performance
- Review security patterns
- Check test coverage

### Tier 2 — Confirm First (Show Changes, Wait for Approval)

⚠️ **Code Modifications:**

- Create/modify source files
- Add/update components
- Modify API routes
- Update tests

⚠️ **Dependencies:**

- Install new packages (`pnpm install <package>`)
- Update dependencies (`pnpm update`)
- Remove dependencies

⚠️ **Configuration:**

- Modify `package.json` scripts
- Update TypeScript config
- Change ESLint rules
- Modify Tailwind config

⚠️ **Database:**

- Generate migrations (`pnpm db:generate`)
- Push schema changes (`pnpm db:push`)
- Seed database (`pnpm db:seed`)

⚠️ **Git Operations:**

- Commit changes
- Create branches
- Push to remote

### Tier 3 — Requires Explicit Human Permission

🚨 **Destructive Operations:**

- Delete files
- Drop database tables (`pnpm db:drop`)
- Force push (`git push --force`)
- Delete branches

🚨 **Production Changes:**

- Deploy to production
- Run migrations on production database
- Modify production environment variables
- Change access controls/permissions

🚨 **CI/CD Pipeline:**

- Modify GitHub Actions workflows
- Change branch protection rules
- Update deployment configuration

🚨 **Security-Sensitive:**

- Change authentication logic
- Modify RBAC permissions
- Update security headers
- Change encryption keys

🚨 **Billing/External Services:**

- Add/remove external service integrations
- Modify payment processing
- Change subscription tiers

### Special Cases

**Multi-file Refactoring:**

- If changes affect >10 files: Show summary, get approval
- If changes affect critical paths (auth, payment): Always confirm

**Database Migrations:**

- Development: Tier 2 (confirm)
- Staging: Tier 3 (explicit permission)
- Production: Tier 3 + manual review + backup verification

**External API Calls:**

- Read-only APIs: Tier 1
- Write APIs (webhooks, etc.): Tier 2
- Payment/billing APIs: Tier 3

---

## 7. Architecture Overview

### System Architecture

Cohortix uses a **Backend-for-Frontend (BFF) monolithic pattern** within Next.js
15, designed for rapid iteration while maintaining clean separation of concerns.

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│  Web App (Next.js) · Mobile PWA · CLI (future) · Public API │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   API GATEWAY LAYER                          │
│  Vercel Edge Network · CDN · DDoS Protection · SSL/TLS      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                 APPLICATION LAYER                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         NEXT.JS APPLICATION (BFF PATTERN)            │   │
│  │                                                      │   │
│  │  React Components (Server + Client)                 │   │
│  │         ↓                                            │   │
│  │  Server Actions                                      │   │
│  │         ↓                                            │   │
│  │  API Route Handlers (/api/v1/*)                     │   │
│  │         ↓                                            │   │
│  │  Service Layer (Business Logic)                     │   │
│  │         ↓                                            │   │
│  │  Data Access Layer (Drizzle ORM)                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │       AGENT RUNTIME ABSTRACTION LAYER                │   │
│  │  Clawdbot Adapter (v1) · Custom Runtime (v2+)       │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     DATA LAYER                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL 16 + pgvector (Neon/Supabase)           │   │
│  │  • Relational data (users, orgs, missions, actions)   │   │
│  │  • Vector embeddings (knowledge base)               │   │
│  │  • Row-Level Security (multi-tenant isolation)      │   │
│  │  • Full-text search (pg_trgm)                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Redis (Upstash)  ·  Vercel Blob/S3  ·  Search (future)     │
└──────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Architecture

**Strategy:** Shared database, shared schema with Row-Level Security (RLS)

Every table containing tenant data includes an `organization_id` column.
PostgreSQL RLS policies automatically filter queries to the current tenant's
data.

```sql
-- Example: RLS policy for tenant isolation
CREATE POLICY tenant_isolation ON missions
  USING (organization_id = current_setting('app.current_org_id')::uuid);

-- Application sets tenant context per request
SET app.current_org_id = 'org_xyz123';

-- All queries automatically filtered
SELECT * FROM missions; -- Only returns current org's missions
```

**Tenant Hierarchy:**

```
Platform
  └── Organization (Tenant) — Billing unit, isolated data
        └── Workspace (Optional) — Team-level grouping
              └── Mission — Contains actions, milestones
                    ├── Actions
                    └── Agents (assigned)
```

### Agent Runtime Abstraction

**Critical Design:** Cohortix abstracts the agent runtime to avoid vendor
lock-in.

```typescript
// Abstract interface for agent runtime
interface AgentRuntime {
  // Agent lifecycle
  createAgent(config: AgentConfig): Promise<Agent>;
  startAgent(agentId: string): Promise<void>;
  stopAgent(agentId: string): Promise<void>;

  // Action execution
  assignTask(agentId: string, action: Action): Promise<TaskExecution>;
  getTaskStatus(executionId: string): Promise<TaskStatus>;

  // Communication
  sendMessage(agentId: string, message: Message): Promise<Response>;
  subscribeToEvents(agentId: string, callback: EventCallback): Subscription;

  // Knowledge
  addKnowledge(agentId: string, knowledge: Knowledge): Promise<void>;
  queryKnowledge(agentId: string, query: string): Promise<Knowledge[]>;
}

// Current implementation: Clawdbot adapter
class ClawdbotRuntime implements AgentRuntime {
  // Wraps Clawdbot API
}

// Future: Custom runtime
class CustomRuntime implements AgentRuntime {
  // Our own agent runtime
}
```

### BFF Pattern Benefits

1. **Full-stack type safety:** Share types between frontend and backend
2. **Simplified deployment:** Single Vercel mission
3. **Fast iteration:** No API versioning headaches
4. **Optimized data fetching:** Server Components fetch exactly what UI needs
5. **Future extraction:** Can extract microservices later if needed

---

## 8. Key Patterns

### Drizzle ORM Usage

**Schema Definition:**

```typescript
// packages/database/src/schema/missions.ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const missions = pgTable('missions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  status: projectStatusEnum('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Inferred TypeScript type
export type Mission = typeof missions.$inferSelect;
export type ProjectInsert = typeof missions.$inferInsert;
```

**Querying:**

```typescript
import { db } from '@repo/database';
import { eq, and, desc } from 'drizzle-orm';

// Select with relations
const projects = await db.query.projects.findMany({
  where: eq(missions.organizationId, orgId),
  orderBy: desc(missions.createdAt),
  with: {
    actions: true,
    agents: true,
  },
});

// Insert
const newProject = await db
  .insert(missions)
  .values({
    name: 'New Mission',
    organizationId: orgId,
  })
  .returning();

// Update
await db
  .update(missions)
  .set({ name: 'Updated Name' })
  .where(eq(missions.id, projectId));

// Delete
await db.delete(missions).where(eq(missions.id, projectId));
```

**Transactions:**

```typescript
await db.transaction(async (tx) => {
  const mission = await tx
    .insert(missions)
    .values({
      name: 'New Mission',
      organizationId: orgId,
    })
    .returning();

  await tx.insert(actions).values({
    projectId: mission[0].id,
    title: 'First Action',
  });
});
```

### Supabase Authentication Integration

**Middleware Setup:**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !session) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

**Getting Current User:**

```typescript
// Server Component
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookies().get(name)?.value;
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch data (RLS automatically filters by user's org)
  const { data: missions } = await supabase
    .from('missions')
    .select('*');

  return <div>Welcome, {user?.email}</div>;
}

// API Route Handler
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookies().get(name)?.value;
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // RLS automatically filters data by user's org
  const { data: missions } = await supabase.from('missions').select('*');
  return Response.json({ data: missions });
}
```

**Organization Context:**

```typescript
// Get user's organization membership
const { data: membership } = await supabase
  .from('organization_memberships')
  .select('organization_id, role')
  .eq('user_id', user.id)
  .single();

// Check permissions
if (membership.role !== 'admin' && membership.role !== 'owner') {
  throw new Error('Insufficient permissions');
}
```

### Supabase Realtime for Live Updates

**Client-Side Real-Time Subscriptions:**

```typescript
'use client';

import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export function useProjectRealtime(projectId: string) {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Subscribe to action changes in this mission
    const channel = supabase
      .channel(`project:${projectId}:tasks`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'actions',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('Action changed:', payload);
          // payload.eventType: INSERT | UPDATE | DELETE
          // payload.new: new row data
          // payload.old: old row data (for UPDATE/DELETE)

          // Optimistically update UI or refetch
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);
}

// Subscribe to comments
export function useCommentRealtime(taskId: string) {
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel(`task:${taskId}:comments`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          console.log('New comment:', payload.new);
          // Add to comments list
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [taskId]);
}
```

**Presence (Who's Online):**

```typescript
export function usePresence(roomId: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase.channel(`room:${roomId}`, {
      config: { presence: { key: userId } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setOnlineUsers(Object.keys(state));
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log(`User ${key} joined`);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log(`User ${key} left`);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return onlineUsers;
}
```

### Zod Validation Everywhere

**Define Schema Once, Use Everywhere:**

```typescript
// lib/validations/mission.ts
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(10000).optional(),
  workspaceId: z.string().uuid().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  startDate: z.string().date().optional(),
  targetDate: z.string().date().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

**API Route Validation:**

```typescript
// app/api/v1/missions/route.ts
import { createProjectSchema } from '@/lib/validations/mission';

export async function POST(request: Request) {
  const body = await request.json();

  const validated = createProjectSchema.safeParse(body);

  if (!validated.success) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          details: validated.error.issues,
        },
      },
      { status: 400 }
    );
  }

  // Use validated.data (typed and sanitized)
  const mission = await projectService.create(validated.data);

  return Response.json({ data: mission }, { status: 201 });
}
```

**React Hook Form Integration:**

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema } from '@/lib/validations/mission';

export function ProjectForm() {
  const form = useForm({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const onSubmit = async (data) => {
    // data is already validated and typed!
    await fetch('/api/v1/missions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('name')} />
      {form.formState.errors.name && <p>{form.formState.errors.name.message}</p>}
      {/* ... */}
    </form>
  );
}
```

### TanStack Query for Server State

```typescript
// lib/hooks/use-missions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useProjects(organizationId: string) {
  return useQuery({
    queryKey: ['missions', organizationId],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/projects?organizationId=${organizationId}`
      );
      return res.json();
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const res = await fetch('/api/v1/missions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate missions cache
      queryClient.invalidateQueries({ queryKey: ['missions'] });
    },
  });
}
```

**Usage in Component:**

```typescript
'use client';

import { useProjects, useCreateProject } from '@/lib/hooks/use-missions';

export function ProjectList({ organizationId }) {
  const { data: missions, isLoading } = useProjects(organizationId);
  const createProject = useCreateProject();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {missions?.data.map(mission => (
        <div key={mission.id}>{mission.name}</div>
      ))}

      <button onClick={() => createProject.mutate({ name: 'New Mission' })}>
        Create Mission
      </button>
    </div>
  );
}
```

---

## 9. Environment Setup

### Required Environment Variables

Create `.env.local` with these variables (see `.env.example` for template):

```bash
# Authentication (Clerk — Dev instance for local)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."  # Only needed if testing webhooks locally
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
DATABASE_URL="postgresql://postgres.xxx:[password]@aws-1-us-east-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.xxx:[password]@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
BYPASS_AUTH="false"  # Set to "true" to skip auth during testing

# Redis (Upstash) — optional for local dev
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxx"

# AI/Embeddings (OpenAI) — optional for local dev
OPENAI_API_KEY="sk-xxx"

# Analytics (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="xxx"
SENTRY_DSN="xxx"
```

### Setting Up External Services

#### 1. Database + Auth + Realtime (Supabase)

```bash
# 1. Create account at supabase.com
# 2. Create new mission: "cohortix"
# 3. Wait for mission to provision (~2 minutes)
# 4. Copy connection strings from mission settings:
#    - NEXT_PUBLIC_SUPABASE_URL (API URL)
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY (anon/public key)
#    - SUPABASE_SERVICE_ROLE_KEY (service role - keep secret!)
#    - DATABASE_URL (direct connection for migrations)

# 5. Enable required database extensions (SQL Editor in Supabase dashboard):
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For full-text search

# 6. Configure authentication providers (in Supabase dashboard):
#    - Email provider: Enable email/password + magic links
#    - Google OAuth: Add client ID and secret
#    - Configure redirect URLs: http://localhost:3000/auth/callback

# 7. Push schema
pnpm db:push

# 8. Seed database (optional)
pnpm db:seed
```

#### 2. Redis (Upstash)

```bash
# 1. Create account at upstash.com
# 2. Create new Redis database: "cohortix"
# 3. Copy REST URL and token to .env.local
```

### Development Setup Checklist

- [ ] Clone repository
- [ ] Install dependencies (`pnpm install`)
- [ ] Copy `.env.example` to `.env.local`
- [ ] Set up Supabase mission + get credentials
- [ ] Enable database extensions (uuid-ossp, pgcrypto, vector, pg_trgm)
- [ ] Configure auth providers (email, Google OAuth)
- [ ] Set up Upstash Redis + get credentials
- [ ] Set up OpenAI API key
- [ ] Push database schema (`pnpm db:push`)
- [ ] Seed database (`pnpm db:seed`)
- [ ] Start dev server (`pnpm dev`)
- [ ] Verify app loads at `localhost:3000`
- [ ] Test sign-in flow

---

## 10. Design System

### Brand Identity

**Name:** Cohortix  
**Tagline:** "Your AI crew, ready for action."  
**Domain:** cohortix.ai

### Terminology (Use Consistently)

| ❌ Avoid       | ✅ Use              | Context                             |
| -------------- | ------------------- | ----------------------------------- |
| Agent          | **Ally**            | AI team member                      |
| Agents (group) | **Cohort**          | Group of allies                     |
| Mission        | **Mission**         | Focused deliverable                 |
| Action         | **Action**          | Individual step an Ally executes    |
| Dashboard      | **Mission Control** | Main UI                             |
| Intel Base     | **Knowledge Base**  | Organizational knowledge repository |
| Create agent   | **Recruit**         | Add new ally                        |
| Run/Execute    | **Deploy**          | Start work                          |
| Workspace      | **Base**            | User workspace                      |
| Training       | **Growth**          | Ally learning/improvement           |

**Full Hierarchy:** Domain → Vision → Mission → Operation / Rhythm → Task

### Colors

**Primary Palette:**

```css
/* Light mode */
--color-primary: 222.2 47.4% 11.2%; /* Near black */
--color-secondary: 210 40% 96.1%; /* Light gray */
--color-accent: 262 83% 58%; /* Purple/Violet */

/* Dark mode */
--color-primary-dark: 210 40% 98%; /* Near white */
--color-secondary-dark: 222.2 84% 4.9%; /* Dark gray */
--color-accent-dark: 263 70% 50%; /* Deeper purple */
```

**Semantic Colors:**

```css
--color-success: 142 76% 36%; /* Green */
--color-warning: 38 92% 50%; /* Amber */
--color-error: 0 84% 60%; /* Red */
--color-info: 199 89% 48%; /* Blue */
```

### Typography

**Font Family:**

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'Fira Code', 'Courier New', monospace;
```

**Type Scale:**

```css
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
```

### Spacing (8px Base Unit)

```css
--spacing-1: 0.25rem; /* 4px */
--spacing-2: 0.5rem; /* 8px */
--spacing-3: 0.75rem; /* 12px */
--spacing-4: 1rem; /* 16px */
--spacing-5: 1.25rem; /* 20px */
--spacing-6: 1.5rem; /* 24px */
--spacing-8: 2rem; /* 32px */
--spacing-10: 2.5rem; /* 40px */
--spacing-12: 3rem; /* 48px */
--spacing-16: 4rem; /* 64px */
```

### Component Library (shadcn/ui)

**Installed Components:**

```bash
# Core components
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add table
pnpm dlx shadcn@latest add toast

# Form components
pnpm dlx shadcn@latest add form
pnpm dlx shadcn@latest add label
pnpm dlx shadcn@latest add checkbox
pnpm dlx shadcn@latest add radio-group
pnpm dlx shadcn@latest add textarea

# Advanced
pnpm dlx shadcn@latest add calendar
pnpm dlx shadcn@latest add popover
pnpm dlx shadcn@latest add tooltip
pnpm dlx shadcn@latest add avatar
pnpm dlx shadcn@latest add badge
```

**Component Usage:**

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function ProjectCard({ mission }: { mission: Mission }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{mission.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{mission.description}</p>
        <Button variant="outline">View Details</Button>
      </CardContent>
    </Card>
  );
}
```

### Voice & Tone

**Personality:**

- **Friendly** — Teammate, not corporate bot
- **Encouraging** — Celebrate wins
- **Clear** — No jargon
- **Playful** — Light, not silly

**Example Copy:**

```typescript
// ✅ GOOD: Friendly, clear
"Welcome to your new HQ! Let's recruit your first ally.";
'Mission accomplished! 🎉 Your ally captured some great intel.';

// ❌ BAD: Corporate, jargon-heavy
'Initialize your agent orchestration environment.';
'Action execution completed successfully. Insights logged.';
```

### UI Patterns

**Empty States:**

```typescript
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Usage
<EmptyState
  title="No allies yet!"
  description="Recruit your first ally to start tackling missions together."
  action={<Button>Recruit an Ally</Button>}
/>
```

**Loading States:**

```typescript
export function LoadingSpinner({ text = "Loading..." }) {
  return (
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-muted-foreground">{text}</span>
    </div>
  );
}

// Mission-themed alternatives
<LoadingSpinner text="Your allies are on it..." />
<LoadingSpinner text="Briefing your cohort..." />
```

---

## 11. API Conventions

### RESTful Patterns

**Resource Naming:**

```
GET    /api/v1/missions           # List missions
POST   /api/v1/missions           # Create mission
GET    /api/v1/missions/:id       # Get mission
PATCH  /api/v1/missions/:id       # Update mission
DELETE /api/v1/missions/:id       # Delete mission

# Nested resources
GET    /api/v1/missions/:id/actions         # List mission actions
POST   /api/v1/missions/:id/actions         # Create action in mission

# Actions (non-CRUD)
POST   /api/v1/actions/:id/reorder          # Reorder action
POST   /api/v1/agents/:id/deploy          # Deploy agent
```

### Request/Response Format

**Success Response (Single Resource):**

```json
{
  "data": {
    "id": "proj_abc123",
    "name": "My Mission",
    "status": "active",
    "createdAt": "2026-02-05T10:00:00.000Z"
  },
  "meta": {
    "requestId": "req_xyz789",
    "timestamp": "2026-02-05T10:00:00.000Z"
  }
}
```

**Success Response (Collection):**

```json
{
  "data": [
    { "id": "proj_1", "name": "Mission 1" },
    { "id": "proj_2", "name": "Mission 2" }
  ],
  "meta": {
    "requestId": "req_xyz789",
    "timestamp": "2026-02-05T10:00:00.000Z"
  },
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 50,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Error Response:**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      {
        "field": "name",
        "message": "Name is required"
      },
      {
        "field": "dueDate",
        "message": "Due date must be in the future"
      }
    ]
  },
  "meta": {
    "requestId": "req_xyz789",
    "timestamp": "2026-02-05T10:00:00.000Z"
  }
}
```

### Error Codes

| Code                  | HTTP Status | Description                   |
| --------------------- | ----------- | ----------------------------- |
| `VALIDATION_ERROR`    | 400         | Request validation failed     |
| `UNAUTHORIZED`        | 401         | Authentication required       |
| `FORBIDDEN`           | 403         | Permission denied             |
| `NOT_FOUND`           | 404         | Resource not found            |
| `CONFLICT`            | 409         | Resource conflict (duplicate) |
| `RATE_LIMIT_EXCEEDED` | 429         | Too many requests             |
| `INTERNAL_ERROR`      | 500         | Server error                  |

### Pagination

**Query Parameters:**

```
GET /api/v1/missions?page=2&pageSize=20&sortBy=createdAt&sortOrder=desc
```

**Implementation:**

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(
    parseInt(searchParams.get('pageSize') || '20'),
    100
  );
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const offset = (page - 1) * pageSize;

  const [missions, totalCount] = await Promise.all([
    db.query.projects.findMany({
      limit: pageSize,
      offset,
      orderBy:
        sortOrder === 'desc' ? desc(missions[sortBy]) : asc(missions[sortBy]),
    }),
    db.select({ count: sql`count(*)` }).from(missions),
  ]);

  return Response.json({
    data: missions,
    pagination: {
      page,
      pageSize,
      totalItems: totalCount[0].count,
      totalPages: Math.ceil(totalCount[0].count / pageSize),
      hasNextPage: page * pageSize < totalCount[0].count,
      hasPrevPage: page > 1,
    },
  });
}
```

### Filtering

```
GET /api/v1/missions?status=active&workspaceId=ws_123&search=goal
```

**Implementation:**

```typescript
const filters = [];

if (status) {
  filters.push(eq(missions.status, status));
}

if (workspaceId) {
  filters.push(eq(missions.workspaceId, workspaceId));
}

if (search) {
  filters.push(
    or(
      ilike(missions.name, `%${search}%`),
      ilike(missions.description, `%${search}%`)
    )
  );
}

const projects = await db.query.projects.findMany({
  where: and(...filters),
});
```

---

## 12. Database Conventions

### Naming Conventions

| Type            | Convention          | Example                         |
| --------------- | ------------------- | ------------------------------- |
| Tables          | Plural, snake_case  | `projects`, `task_dependencies` |
| Columns         | snake_case          | `created_at`, `organization_id` |
| Primary Keys    | `id` (UUID)         | `id UUID PRIMARY KEY`           |
| Foreign Keys    | `<table>_id`        | `project_id`, `user_id`         |
| Junction Tables | `<table1>_<table2>` | `agent_assignments`             |
| Enums           | snake_case          | `task_status`, `agent_role`     |

### Schema Standards

**Every table must have:**

```sql
CREATE TABLE missions (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant isolation (for multi-tenant tables)
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Soft deletes (optional)
  deleted_at TIMESTAMPTZ,

  -- Other columns...
  name VARCHAR(255) NOT NULL
);
```

### Multi-Tenant Isolation

**Every tenant-scoped table:**

1. **Has `organization_id` column**
2. **Enables Row-Level Security (RLS)**
3. **Has isolation policy**

```sql
-- Enable RLS
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

-- Create isolation policy
CREATE POLICY tenant_isolation ON missions
  USING (organization_id = current_setting('app.current_org_id')::uuid)
  WITH CHECK (organization_id = current_setting('app.current_org_id')::uuid);

-- Create indexes
CREATE INDEX idx_missions_org ON missions(organization_id);
```

### UUID Primary Keys

**Always use UUIDs, never auto-incrementing integers:**

```sql
-- ✅ GOOD
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- ❌ BAD
id SERIAL PRIMARY KEY
```

**Why:** UUIDs prevent enumeration attacks, work in distributed systems, and
avoid merge conflicts.

### Timestamps

**Use `TIMESTAMPTZ` (with timezone), not `TIMESTAMP`:**

```sql
-- ✅ GOOD
created_at TIMESTAMPTZ DEFAULT NOW()

-- ❌ BAD
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Enums

```sql
CREATE TYPE task_status AS ENUM (
  'backlog',
  'todo',
  'in_progress',
  'review',
  'done',
  'cancelled'
);

CREATE TABLE actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status task_status DEFAULT 'backlog' NOT NULL
);
```

### Foreign Keys & Cascades

```sql
-- Cascade on delete (child data should be deleted)
organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE

-- Set null on delete (preserve child data)
milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL

-- Restrict on delete (prevent deletion if referenced)
user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT
```

### Indexes

**Create indexes for:**

1. **Foreign keys** (for joins)
2. **Frequently queried columns** (status, dates)
3. **Unique constraints** (email, slug)
4. **Multi-tenant isolation** (organization_id)

```sql
-- Foreign key index
CREATE INDEX idx_tasks_project ON tasks(project_id);

-- Composite index (for common query)
CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);

-- Unique constraint
CREATE UNIQUE INDEX idx_missions_org_slug ON missions(organization_id, slug);

-- Partial index (for specific queries)
CREATE INDEX idx_actions_overdue ON actions(due_date) WHERE status != 'done' AND due_date < NOW();
```

### Migrations

**Migration Guidelines:**

1. **One migration per change**
2. **Backward compatible when possible**
3. **Test on staging before production**
4. **Include rollback instructions**

**Migration Template:**

```sql
-- Migration: Add priority to actions
-- Date: 2026-02-10
-- Author: Developer Name

-- Up Migration
ALTER TABLE actions ADD COLUMN priority task_priority DEFAULT 'medium';
CREATE INDEX idx_actions_priority ON actions(priority);

-- Down Migration (add to separate file if needed)
-- ALTER TABLE actions DROP COLUMN priority;
-- DROP INDEX idx_actions_priority;
```

### Vector Storage (pgvector)

```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Vector column (1536 dimensions for OpenAI ada-002)
CREATE TABLE knowledge_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES knowledge_entries(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast similarity search
CREATE INDEX idx_knowledge_embedding_hnsw ON knowledge_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

---

## Quick Reference Card

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 COHORTIX QUICK REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MISSION:     Cohortix
DOMAIN:      cohortix.ai
TAGLINE:     "Your AI crew, ready for action."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend:    Next.js 15 (App Router) + React 19
Styling:     Tailwind CSS 3 + shadcn/ui
State:       Zustand + TanStack Query
Backend:     Next.js API Routes (BFF pattern)
Database:    PostgreSQL 16 + pgvector (Supabase Branching 2.0)
ORM:         Drizzle ORM + Supabase Client (RLS-based)
Auth:        Clerk (single app: cohortix-production, Dev + Prod instances)
Cache:       Redis (Upstash)
Jobs:        Inngest
Hosting:     Vercel Pro (4 envs: Production, Staging, Preview, Development)
Testing:     Vitest + Playwright

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 COMMON COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

pnpm install         # Install dependencies
pnpm dev             # Start dev server
pnpm build           # Build for production
pnpm test            # Run all tests
pnpm lint            # Run linter
pnpm db:push         # Push schema to database
pnpm db:studio       # Open database GUI

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TERMINOLOGY (USE CONSISTENTLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HIERARCHY: Domain → Vision → Mission → Operation / Rhythm → Task

⚠️  READ docs/guides/TERMINOLOGY.md FOR FULL REFERENCE

❌ Agent       → ✅ Ally
❌ Agents      → ✅ Cohort
❌ Project     → ✅ Operation
❌ Routine     → ✅ Rhythm
❌ Goal        → ✅ Mission
❌ Action      → ✅ Task
❌ Dashboard   → ✅ Mission Control
❌ Create      → ✅ Recruit
❌ Run/Execute → ✅ Deploy
❌ Workspace   → ✅ Base
❌ Goal    → DROPPED (Goals cover this)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 COMMIT MESSAGE FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

feat(scope): add new feature
fix(scope): resolve bug
docs(scope): update documentation
chore(scope): maintenance action

Examples:
feat(actions): add subtask support
fix(auth): resolve session expiry
docs(api): update endpoint docs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 FILE LOCATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UI Components:       src/components/ui/
Feature Components:  src/components/features/
API Routes:          src/app/api/v1/
Pages:               src/app/(dashboard)/
Hooks:               src/lib/hooks/
Services:            src/lib/services/
Validations:         src/lib/validations/
Types:               src/types/ or packages/types/
Database Schema:     packages/database/src/schema/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 IMPORT ALIASES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@/components/*      — App components
@/lib/*             — App utilities
@/server/*          — Server-only code
@repo/database      — Database package
@repo/types         — Shared types
@repo/ui            — Shared UI components
@repo/utils         — Shared utilities

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

_This is a living document. Update as the mission evolves._

_For additional documentation, see `/docs/` directory._
