# AGENTS.md — Cohortix Development Standards

**Project:** Cohortix  
**Version:** 1.0.0  
**Codex Compliance:** v1.2 §1.2.1  
**Last Updated:** February 11, 2026

---

## Quick Reference

**Location:** `~/Projects/cohortix/` (NEVER ~/clawd/cohortix/)  
**Context:** Read PROJECT_BRIEF.md (quick overview), CLAUDE.md (detailed context)  
**Compliance:** Follow `docs/CODEX-COMPLIANCE-PLAN.md` for current priorities

---

## Commands

```bash
# Development
pnpm dev                        # Start dev server (localhost:3000)
pnpm build                      # Build all packages
pnpm type-check                 # TypeScript validation
pnpm lint                       # ESLint check
pnpm lint:fix                   # Auto-fix linting

# Testing
pnpm test                       # Run unit + integration tests
pnpm test:watch                 # Watch mode
pnpm test:coverage              # Coverage report (target: 70%+ lines)
pnpm test:e2e                   # E2E tests (Playwright)

# Database
pnpm db:push                    # Push schema changes (dev only)
pnpm db:generate                # Generate migration files
pnpm db:studio                  # Open Drizzle Studio GUI
pnpm db:seed                    # Seed test data

# Code quality
pnpm format                     # Prettier formatting
pnpm clean                      # Clean build artifacts
```

---

## Testing Rules

### When to Write Tests (MANDATORY)

✅ **Always test:**
- Authentication flows (sign-in, sign-up, password reset)
- Multi-tenant isolation (RLS policies)
- API route handlers (all CRUD operations)
- Form validations (Zod schemas)
- Database mutations (create, update, delete)
- Service layer business logic

✅ **Test before merging:**
- New features require tests (70% coverage minimum)
- Bug fixes require regression test
- Refactors maintain existing test coverage

### Coverage Targets

```json
{
  "lines": 70,
  "functions": 70,
  "branches": 65,
  "statements": 70
}
```

**Critical paths (auth, payments, multi-tenant) require 80%+ coverage**

### Testing Pyramid (Codex §4.1)

- **70% Unit Tests** — Fast, isolated, test single functions/components
- **20% Integration Tests** — API routes, database queries, service interactions
- **10% E2E Tests** — Critical user journeys only (sign-in, create mission, assign action)

---

## Project Structure

```
cohortix/
├── apps/web/                   # Main Next.js app
│   ├── src/
│   │   ├── app/                # Next.js App Router (routes)
│   │   ├── components/         # React components
│   │   ├── lib/                # Client utilities, hooks, stores
│   │   └── server/             # Server Actions, DB queries
│   └── tests/                  # Test files
│
├── packages/
│   ├── database/               # Drizzle schema + client
│   ├── types/                  # Shared TypeScript types
│   └── ui/                     # Shared components
│
├── docs/                       # ALL documentation here
│   ├── architecture/adr-NNN-*.md   # Architecture Decision Records
│   ├── decisions/ddr-NNN-*.md      # Design Decision Records
│   ├── specs/*.md                  # Feature Specifications
│   └── test-plans/*.md             # Test Plans
│
└── tooling/                    # ESLint, TypeScript, Tailwind configs
```

**Import Aliases:**
```typescript
import { Button } from '@/components/ui/button';
import { db } from '@repo/database';
import type { Mission } from '@repo/types';
```

---

## Code Style

### TypeScript
- **Strict mode:** Enabled (no `any` types, explicit return types)
- **Validation:** Use Zod schemas for all external input (API, forms)
- **Naming:** camelCase (functions, variables), PascalCase (components, types)

### React
- **Default to Server Components** — Use `"use client"` only when needed (state, effects, browser APIs)
- **File naming:** kebab-case (`project-card.tsx`)
- **Max component length:** 300 lines (split into smaller components)

### Functions
- **Max length:** 50 lines
- **Max parameters:** 5 (use object destructuring for more)
- **Naming:** Descriptive (`getUserById`, not `get`)

---

## Git Workflow

### Branch Naming
```
<type>/<ticket-id>-<short-description>

Examples:
feature/ACC-123-user-authentication
bugfix/ACC-200-login-redirect
chore/update-dependencies
```

### Commit Messages (Conventional Commits)
```
<type>(<scope>): <subject>

Examples:
feat(auth): implement login form
fix(api): resolve tenant isolation bug
docs(readme): update setup instructions
```

**Types:** feat, fix, docs, style, refactor, test, chore, perf, ci

### Before Opening PR
```bash
pnpm lint              # Must pass
pnpm type-check        # Must pass
pnpm test              # Must pass
pnpm build             # Must succeed
```

---

## Permissions Matrix

### ✅ Always Allowed (No Confirmation)

- Read any file, search codebase
- Run tests, linting, type-checking
- Start dev server, view database in Drizzle Studio
- Generate code suggestions, analyze patterns

### ⚠️ Confirm First (Show Changes, Wait for Approval)

- Create/modify source files
- Add/remove dependencies (`pnpm install/remove`)
- Generate database migrations (`pnpm db:generate`)
- Push schema changes (`pnpm db:push`)
- Commit and push to git

### 🚨 Requires Explicit Permission

- Delete files or directories
- Drop database tables (`pnpm db:drop`)
- Force push (`git push --force`)
- Modify CI/CD workflows (.github/workflows/)
- Change production environment variables
- Deploy to production

---

## Spec-Driven Development (MANDATORY starting Week 2)

**Workflow:**
1. **Discovery** — Ask 5 question categories (Intent, Scope, Tech, Edge Cases, Acceptance)
2. **Spec** — Create `docs/specs/NNN-feature-name.md` using template
3. **Approval** — Wait for human approval
4. **Implementation** — Build per spec
5. **Tests** — Write tests matching acceptance criteria
6. **PR** — Link to spec in PR description

**No code without approved spec** (except bug fixes with clear repro steps)

---

## Decision Records

### When to Create ADR (Architecture Decision Record)
- New tech stack choices
- Database schema changes
- Authentication/authorization patterns
- Multi-tenant isolation strategies

**Template:** `docs/architecture/adr-000-template.md`

### When to Create DDR (Design Decision Record)
- Design system changes (colors, typography, components)
- UX/terminology decisions
- API naming conventions

**Template:** `docs/decisions/ddr-000-template.md`

---

## Expertise & Learning

**As you work, document:**
- What patterns work well for this project
- Common gotchas and how to avoid them
- Lessons learned from debugging
- Performance optimizations discovered

**Update:** Add learnings to CLAUDE.md or create new docs/ entries

---

## Emergency Contacts

**Blocked?** Post in Discord #dev-questions (channel: 1470709521402822802)  
**Bug in production?** Notify Ahmad immediately  
**Unclear requirement?** Ask PM agent via Discord or spawn session
