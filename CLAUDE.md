# CLAUDE.md — Cohortix Development Context

**Project:** Cohortix  
**Version:** 1.0.0  
**Last Updated:** 2026-02-10  
**Axon Codex Compliance:** v1.1 §2.2.1

---

## What is Cohortix?

Cohortix is an **Allies-as-a-Service (AaaS)** platform that enables humans to manage a high-performing organization of AI allies. It's a multi-tenant SaaS built with Next.js 15, React 19, and PostgreSQL, designed to bridge the gap between human strategic direction and autonomous AI execution.

**Core Concept:** While traditional project management tools (ClickUp, Linear) focus on human-to-human collaboration, Cohortix is built from the ground up for human-to-AI team orchestration through a unified interface called **Mission Control**.

**Domain:** cohortix.ai  
**Tagline:** "Your AI crew, ready for action."

### Key Differentiators

1. **Bidirectional Goal Setting**: Both humans AND allies can propose goals. Allies proactively suggest improvements based on observations (e.g., "test coverage dropped, proposing goal to fix it"), subject to human approval.

2. **Living Knowledge Base**: Not just logs — a continuously evolving knowledge system with:
   - Graph relationships between concepts (depends-on, related-to, supersedes, contradicts)
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
// tests/unit/services/project-service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { projectService } from '@/lib/services/project-service';

describe('ProjectService', () => {
  beforeEach(() => {
    // Setup mock database
  });

  it('should create project with valid data', async () => {
    const project = await projectService.create({
      name: 'Test Project',
      organizationId: 'org_123',
    });
    
    expect(project.id).toBeDefined();
    expect(project.name).toBe('Test Project');
  });

  it('should enforce tenant isolation', async () => {
    await expect(
      projectService.getById('proj_from_other_org', 'org_123')
    ).rejects.toThrow('Project not found');
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
    ├── projects.spec.ts
    └── tasks.spec.ts
```

### Running Tests

```bash
# All tests
pnpm test

# Specific test file
pnpm test project-service

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

## 3. Project Structure

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
├── docs/                       # Project documentation
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
│   │   │   ├── projects/
│   │   │   ├── agents/
│   │   │   ├── knowledge/
│   │   │   ├── goals/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   │
│   │   ├── api/                # API Route Handlers
│   │   │   └── v1/
│   │   │       ├── projects/
│   │   │       ├── tasks/
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
│   │   │   ├── projects/
│   │   │   ├── tasks/
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
│   │   ├── projects.ts
│   │   ├── tasks.ts
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
import { Button } from '@/components/ui/button';          // apps/web/src/components/ui/button
import { useProjects } from '@/lib/hooks/use-projects';   // apps/web/src/lib/hooks/use-projects
import { projectService } from '@/lib/services/project-service';
import { ProjectCard } from '@/components/features/projects/project-card';

// Package-level
import { db } from '@repo/database';                      // packages/database/src
import type { Project } from '@repo/types';               // packages/types/src
import { Button } from '@repo/ui/button';                 // packages/ui/src/button
import { formatDate } from '@repo/utils/dates';           // packages/utils/src/dates
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
export async function getProject(id: string): Promise<Project | null> {
  return await db.query.projects.findFirst({
    where: eq(projects.id, id),
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
const firstProject = projects[0];  // Type: Project | undefined
if (firstProject) {
  console.log(firstProject.name);  // Safe access
}

// ❌ BAD: Assume array has items
const firstProject = projects[0];  // With noUncheckedIndexedAccess: false
console.log(firstProject.name);    // Runtime error if array is empty
```

### React Component Patterns

**Default to Server Components** — use `"use client"` only when needed.

```typescript
// ✅ GOOD: Server Component (default)
// app/(dashboard)/projects/page.tsx
import { db } from '@repo/database';

export default async function ProjectsPage() {
  const projects = await db.query.projects.findMany();
  
  return (
    <div>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}

// ✅ GOOD: Client Component (when needed)
// components/features/projects/project-form.tsx
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

| Type | Convention | Example |
|------|------------|---------|
| React Components | kebab-case | `project-card.tsx` |
| Utilities | kebab-case | `dates.ts` |
| Types | kebab-case | `project.ts` |
| Routes | kebab-case | `api/v1/project-templates/` |
| CSS/Styles | kebab-case | `globals.css` |

### Function Naming

```typescript
// ✅ GOOD: Clear, descriptive names
function getUserById(id: string): Promise<User | null> { }
async function createProject(data: ProjectInput): Promise<Project> { }
function isValidEmail(email: string): boolean { }

// ❌ BAD: Vague, abbreviated names
function get(id: string) { }
function create(d: any) { }
function check(e: string) { }
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
// app/api/v1/projects/route.ts
import { projectService } from '@/lib/services/project-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  
  const projects = await projectService.list(organizationId);
  
  return Response.json({ data: projects });
}

// Service Layer (business logic)
// lib/services/project-service.ts
import { db } from '@repo/database';

export const projectService = {
  async list(organizationId: string) {
    return await db.query.projects.findMany({
      where: eq(projects.organizationId, organizationId),
    });
  },
  
  async create(data: ProjectInput) {
    // Validation, business rules, etc.
  },
};

// ❌ BAD: Business logic in route handler
export async function GET(request: Request) {
  const projects = await db.query.projects.findMany(); // Direct DB access in route
  return Response.json({ data: projects });
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
              ├── feature/ACC-124-task-kanban
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
feat(tasks): add subtask support

Implement subtask creation and display within task cards.

Closes ACC-123

# Bug fix
fix(auth): resolve session expiry redirect

Users were not being redirected to login on session expiry.

Fixes ACC-200

# Breaking change
feat(api)!: change project response structure

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

| Branch | Approvals | Status Checks | Force Push |
|--------|-----------|---------------|------------|
| `main` | 2 | All must pass | ❌ |
| `staging` | 1 | All must pass | ❌ |
| `dev` | 1 | Required | ❌ |

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

**These boundaries define what AI development agents can do autonomously vs. what requires human approval.**

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
- Build project (`pnpm build`)
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

Cohortix uses a **Backend-for-Frontend (BFF) monolithic pattern** within Next.js 15, designed for rapid iteration while maintaining clean separation of concerns.

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
│  │  • Relational data (users, orgs, projects, tasks)   │   │
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

Every table containing tenant data includes an `organization_id` column. PostgreSQL RLS policies automatically filter queries to the current tenant's data.

```sql
-- Example: RLS policy for tenant isolation
CREATE POLICY tenant_isolation ON projects
  USING (organization_id = current_setting('app.current_org_id')::uuid);

-- Application sets tenant context per request
SET app.current_org_id = 'org_xyz123';

-- All queries automatically filtered
SELECT * FROM projects; -- Only returns current org's projects
```

**Tenant Hierarchy:**

```
Platform
  └── Organization (Tenant) — Billing unit, isolated data
        └── Workspace (Optional) — Team-level grouping
              └── Project — Contains tasks, milestones
                    ├── Tasks
                    └── Agents (assigned)
```

### Agent Runtime Abstraction

**Critical Design:** Cohortix abstracts the agent runtime to avoid vendor lock-in.

```typescript
// Abstract interface for agent runtime
interface AgentRuntime {
  // Agent lifecycle
  createAgent(config: AgentConfig): Promise<Agent>;
  startAgent(agentId: string): Promise<void>;
  stopAgent(agentId: string): Promise<void>;
  
  // Task execution
  assignTask(agentId: string, task: Task): Promise<TaskExecution>;
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
2. **Simplified deployment:** Single Vercel project
3. **Fast iteration:** No API versioning headaches
4. **Optimized data fetching:** Server Components fetch exactly what UI needs
5. **Future extraction:** Can extract microservices later if needed

---

## 8. Key Patterns

### Drizzle ORM Usage

**Schema Definition:**

```typescript
// packages/database/src/schema/projects.ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  status: projectStatusEnum('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Inferred TypeScript type
export type Project = typeof projects.$inferSelect;
export type ProjectInsert = typeof projects.$inferInsert;
```

**Querying:**

```typescript
import { db } from '@repo/database';
import { eq, and, desc } from 'drizzle-orm';

// Select with relations
const projects = await db.query.projects.findMany({
  where: eq(projects.organizationId, orgId),
  orderBy: desc(projects.createdAt),
  with: {
    tasks: true,
    agents: true,
  },
});

// Insert
const newProject = await db.insert(projects).values({
  name: 'New Project',
  organizationId: orgId,
}).returning();

// Update
await db.update(projects)
  .set({ name: 'Updated Name' })
  .where(eq(projects.id, projectId));

// Delete
await db.delete(projects).where(eq(projects.id, projectId));
```

**Transactions:**

```typescript
await db.transaction(async (tx) => {
  const project = await tx.insert(projects).values({
    name: 'New Project',
    organizationId: orgId,
  }).returning();
  
  await tx.insert(tasks).values({
    projectId: project[0].id,
    title: 'First Task',
  });
});
```

### Clerk Authentication Integration

**Middleware Setup:**

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/(.*)',
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});
```

**Getting Current User:**

```typescript
// Server Component
import { auth, currentUser } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const { userId, orgId } = auth();
  const user = await currentUser();
  
  // Fetch data scoped to organization
  const projects = await db.query.projects.findMany({
    where: eq(projects.organizationId, orgId),
  });
  
  return <div>Welcome, {user?.firstName}</div>;
}

// API Route Handler
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  const { userId, orgId } = auth();
  
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... fetch data for orgId
}
```

**Organization Context:**

```typescript
// Get current organization
const { orgId, orgRole } = auth();

// Check permissions
if (orgRole !== 'admin') {
  throw new Error('Insufficient permissions');
}
```

### Server-Sent Events (SSE) for Real-Time

**Server Side (API Route):**

```typescript
// app/api/v1/events/subscribe/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
      
      // Subscribe to Redis pub/sub or database changes
      const subscription = redis.subscribe(`project:${projectId}:events`);
      
      subscription.on('message', (channel, message) => {
        controller.enqueue(`data: ${message}\n\n`);
      });
      
      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        subscription.unsubscribe();
        controller.close();
      });
    },
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

**Client Side:**

```typescript
'use client';

import { useEffect } from 'react';

export function useProjectEvents(projectId: string) {
  useEffect(() => {
    const eventSource = new EventSource(`/api/v1/events/subscribe?projectId=${projectId}`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Event:', data);
      
      // Update UI based on event type
      if (data.type === 'task.updated') {
        // Refetch tasks or update state
      }
    };
    
    eventSource.onerror = () => {
      eventSource.close();
      // Reconnect logic
    };
    
    return () => eventSource.close();
  }, [projectId]);
}
```

### Zod Validation Everywhere

**Define Schema Once, Use Everywhere:**

```typescript
// lib/validations/project.ts
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(10000).optional(),
  workspaceId: z.string().uuid().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  startDate: z.string().date().optional(),
  targetDate: z.string().date().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

**API Route Validation:**

```typescript
// app/api/v1/projects/route.ts
import { createProjectSchema } from '@/lib/validations/project';

export async function POST(request: Request) {
  const body = await request.json();
  
  const validated = createProjectSchema.safeParse(body);
  
  if (!validated.success) {
    return Response.json({
      error: {
        code: 'VALIDATION_ERROR',
        details: validated.error.issues,
      },
    }, { status: 400 });
  }
  
  // Use validated.data (typed and sanitized)
  const project = await projectService.create(validated.data);
  
  return Response.json({ data: project }, { status: 201 });
}
```

**React Hook Form Integration:**

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema } from '@/lib/validations/project';

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
    await fetch('/api/v1/projects', {
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
// lib/hooks/use-projects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useProjects(organizationId: string) {
  return useQuery({
    queryKey: ['projects', organizationId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/projects?organizationId=${organizationId}`);
      return res.json();
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate projects cache
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

**Usage in Component:**

```typescript
'use client';

import { useProjects, useCreateProject } from '@/lib/hooks/use-projects';

export function ProjectList({ organizationId }) {
  const { data: projects, isLoading } = useProjects(organizationId);
  const createProject = useCreateProject();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {projects?.data.map(project => (
        <div key={project.id}>{project.name}</div>
      ))}
      
      <button onClick={() => createProject.mutate({ name: 'New Project' })}>
        Create Project
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
# Database (Neon or Supabase)
DATABASE_URL="postgresql://user:password@host:5432/cohortix"

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxx"
CLERK_SECRET_KEY="sk_test_xxx"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxx"

# File Storage (Vercel Blob or S3)
BLOB_READ_WRITE_TOKEN="vercel_blob_xxx"

# AI/Embeddings (OpenAI)
OPENAI_API_KEY="sk-xxx"

# Background Jobs (Inngest)
INNGEST_EVENT_KEY="xxx"
INNGEST_SIGNING_KEY="xxx"

# External Integrations
CLAWDBOT_API_URL="https://api.clawdbot.io"
CLAWDBOT_API_KEY="xxx"
CLAWDBOT_WEBHOOK_SECRET="xxx"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Analytics (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="xxx"
SENTRY_DSN="xxx"
```

### Setting Up External Services

#### 1. Database (Neon - Recommended for Development)

```bash
# 1. Create account at neon.tech
# 2. Create new project: "cohortix"
# 3. Copy connection string to DATABASE_URL
# 4. Enable pgvector extension (in Neon console)

# 5. Push schema
pnpm db:push

# 6. Seed database (optional)
pnpm db:seed
```

#### 2. Authentication (Clerk)

```bash
# 1. Create account at clerk.com
# 2. Create new application: "Cohortix"
# 3. Copy keys to .env.local
# 4. Configure paths (sign-in, sign-up, after-sign-in)
# 5. Enable organizations in Clerk dashboard
```

#### 3. Redis (Upstash)

```bash
# 1. Create account at upstash.com
# 2. Create new Redis database: "cohortix"
# 3. Copy REST URL and token to .env.local
```

#### 4. File Storage (Vercel Blob)

```bash
# 1. Deploy to Vercel (or connect project)
# 2. Create Blob store in Vercel dashboard
# 3. Copy token to .env.local
```

### Development Setup Checklist

- [ ] Clone repository
- [ ] Install dependencies (`pnpm install`)
- [ ] Copy `.env.example` to `.env.local`
- [ ] Set up Neon database + get connection string
- [ ] Set up Clerk + get API keys
- [ ] Set up Upstash Redis + get credentials
- [ ] Set up OpenAI API key
- [ ] Push database schema (`pnpm db:push`)
- [ ] Seed database (`pnpm db:seed`)
- [ ] Start dev server (`pnpm dev`)
- [ ] Verify app loads at `localhost:3000`

---

## 10. Design System

### Brand Identity

**Name:** Cohortix  
**Tagline:** "Your AI crew, ready for action."  
**Domain:** cohortix.ai

### Terminology (Use Consistently)

| ❌ Avoid | ✅ Use | Context |
|----------|--------|---------|
| Agent | **Ally** | AI team member |
| Agents (group) | **Cohort** | Group of allies |
| Task | **Mission** | Work unit |
| Workflow | **Campaign** | Series of missions |
| Dashboard | **Mission Control** | Main UI |
| Intel Base | **Knowledge Base** | Organizational knowledge repository |
| Create agent | **Recruit** | Add new ally |
| Run/Execute | **Deploy** | Start work |
| Workspace | **HQ** or **Base** | User workspace |
| Training | **Evolution** | Ally learning/improvement |

### Colors

**Primary Palette:**

```css
/* Light mode */
--color-primary: 222.2 47.4% 11.2%;      /* Near black */
--color-secondary: 210 40% 96.1%;        /* Light gray */
--color-accent: 262 83% 58%;             /* Purple/Violet */

/* Dark mode */
--color-primary-dark: 210 40% 98%;       /* Near white */
--color-secondary-dark: 222.2 84% 4.9%;  /* Dark gray */
--color-accent-dark: 263 70% 50%;        /* Deeper purple */
```

**Semantic Colors:**

```css
--color-success: 142 76% 36%;            /* Green */
--color-warning: 38 92% 50%;             /* Amber */
--color-error: 0 84% 60%;                /* Red */
--color-info: 199 89% 48%;               /* Blue */
```

### Typography

**Font Family:**

```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'Fira Code', 'Courier New', monospace;
```

**Type Scale:**

```css
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
```

### Spacing (8px Base Unit)

```css
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
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

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{project.description}</p>
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
"Welcome to your new HQ! Let's recruit your first ally."
"Mission accomplished! 🎉 Your ally captured some great intel."

// ❌ BAD: Corporate, jargon-heavy
"Initialize your agent orchestration environment."
"Task execution completed successfully. Insights logged."
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
GET    /api/v1/projects           # List projects
POST   /api/v1/projects           # Create project
GET    /api/v1/projects/:id       # Get project
PATCH  /api/v1/projects/:id       # Update project
DELETE /api/v1/projects/:id       # Delete project

# Nested resources
GET    /api/v1/projects/:id/tasks         # List project tasks
POST   /api/v1/projects/:id/tasks         # Create task in project

# Actions (non-CRUD)
POST   /api/v1/tasks/:id/reorder          # Reorder task
POST   /api/v1/agents/:id/deploy          # Deploy agent
```

### Request/Response Format

**Success Response (Single Resource):**

```json
{
  "data": {
    "id": "proj_abc123",
    "name": "My Project",
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
    { "id": "proj_1", "name": "Project 1" },
    { "id": "proj_2", "name": "Project 2" }
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

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Permission denied |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (duplicate) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Pagination

**Query Parameters:**

```
GET /api/v1/projects?page=2&pageSize=20&sortBy=createdAt&sortOrder=desc
```

**Implementation:**

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  
  const offset = (page - 1) * pageSize;
  
  const [projects, totalCount] = await Promise.all([
    db.query.projects.findMany({
      limit: pageSize,
      offset,
      orderBy: sortOrder === 'desc' ? desc(projects[sortBy]) : asc(projects[sortBy]),
    }),
    db.select({ count: sql`count(*)` }).from(projects),
  ]);
  
  return Response.json({
    data: projects,
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
GET /api/v1/projects?status=active&workspaceId=ws_123&search=campaign
```

**Implementation:**

```typescript
const filters = [];

if (status) {
  filters.push(eq(projects.status, status));
}

if (workspaceId) {
  filters.push(eq(projects.workspaceId, workspaceId));
}

if (search) {
  filters.push(
    or(
      ilike(projects.name, `%${search}%`),
      ilike(projects.description, `%${search}%`)
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

| Type | Convention | Example |
|------|------------|---------|
| Tables | Plural, snake_case | `projects`, `task_dependencies` |
| Columns | snake_case | `created_at`, `organization_id` |
| Primary Keys | `id` (UUID) | `id UUID PRIMARY KEY` |
| Foreign Keys | `<table>_id` | `project_id`, `user_id` |
| Junction Tables | `<table1>_<table2>` | `agent_assignments` |
| Enums | snake_case | `task_status`, `agent_role` |

### Schema Standards

**Every table must have:**

```sql
CREATE TABLE projects (
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
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create isolation policy
CREATE POLICY tenant_isolation ON projects
  USING (organization_id = current_setting('app.current_org_id')::uuid)
  WITH CHECK (organization_id = current_setting('app.current_org_id')::uuid);

-- Create indexes
CREATE INDEX idx_projects_org ON projects(organization_id);
```

### UUID Primary Keys

**Always use UUIDs, never auto-incrementing integers:**

```sql
-- ✅ GOOD
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- ❌ BAD
id SERIAL PRIMARY KEY
```

**Why:** UUIDs prevent enumeration attacks, work in distributed systems, and avoid merge conflicts.

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

CREATE TABLE tasks (
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
CREATE UNIQUE INDEX idx_projects_org_slug ON projects(organization_id, slug);

-- Partial index (for specific queries)
CREATE INDEX idx_tasks_overdue ON tasks(due_date) WHERE status != 'done' AND due_date < NOW();
```

### Migrations

**Migration Guidelines:**

1. **One migration per change**
2. **Backward compatible when possible**
3. **Test on staging before production**
4. **Include rollback instructions**

**Migration Template:**

```sql
-- Migration: Add priority to tasks
-- Date: 2026-02-10
-- Author: Developer Name

-- Up Migration
ALTER TABLE tasks ADD COLUMN priority task_priority DEFAULT 'medium';
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- Down Migration (add to separate file if needed)
-- ALTER TABLE tasks DROP COLUMN priority;
-- DROP INDEX idx_tasks_priority;
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

PROJECT:     Cohortix
DOMAIN:      cohortix.ai
TAGLINE:     "Your AI crew, ready for action."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TECH STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend:    Next.js 15 (App Router) + React 19
Styling:     Tailwind CSS 4 + shadcn/ui
State:       Zustand + TanStack Query
Backend:     Next.js API Routes (BFF pattern)
Database:    PostgreSQL 16 + pgvector (Neon)
ORM:         Drizzle ORM
Auth:        Clerk
Cache:       Redis (Upstash)
Jobs:        Inngest
Hosting:     Vercel
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

❌ Agent       → ✅ Ally
❌ Agents      → ✅ Cohort
❌ Task        → ✅ Mission
❌ Workflow    → ✅ Campaign
❌ Dashboard   → ✅ Mission Control
❌ Create      → ✅ Recruit
❌ Run/Execute → ✅ Deploy
❌ Workspace   → ✅ HQ / Base

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 COMMIT MESSAGE FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

feat(scope): add new feature
fix(scope): resolve bug
docs(scope): update documentation
chore(scope): maintenance task

Examples:
feat(tasks): add subtask support
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

*This is a living document. Update as the project evolves.*

*For additional documentation, see `/docs/` directory.*
