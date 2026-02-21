# Agent Command Center — Folder Structure

> Enterprise-grade monorepo organization for scalable SaaS development

_Version: 1.0.0 | Last Updated: 2026-02-05_

---

## Overview

Agent Command Center uses a **Turborepo monorepo** structure. This enables:

- Shared code between apps (types, UI, database)
- Incremental builds with caching
- Single source of truth for configuration
- Consistent development experience

---

## Root Structure

```
agent-command-center/
├── .github/                    # GitHub configuration
│   ├── workflows/              # CI/CD pipelines
│   │   ├── ci.yml             # Lint, test, type-check
│   │   ├── preview.yml        # Deploy preview environments
│   │   └── release.yml        # Production deployment
│   ├── CODEOWNERS             # Code ownership rules
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
│
├── apps/                       # Deployable applications
│   ├── web/                   # Main Next.js application
│   └── docs/                  # Documentation site (future)
│
├── packages/                   # Shared packages
│   ├── ui/                    # Shared UI components
│   ├── database/              # Database schema + client
│   ├── types/                 # Shared TypeScript types
│   ├── config/                # Shared configurations
│   ├── utils/                 # Shared utility functions
│   └── api-client/            # API client for external use
│
├── tooling/                    # Development tooling
│   ├── eslint/                # ESLint configurations
│   ├── typescript/            # TypeScript configurations
│   └── tailwind/              # Tailwind configurations
│
├── docs/                       # Project documentation
│   ├── ARCHITECTURE.md
│   ├── TECH_STACK.md
│   ├── FOLDER_STRUCTURE.md    # This file
│   ├── DATABASE_SCHEMA.md
│   ├── API_DESIGN.md
│   ├── GIT_WORKFLOW.md
│   └── SECURITY.md
│
├── scripts/                    # Development scripts
│   ├── setup.sh               # Initial project setup
│   ├── seed-db.ts             # Database seeding
│   └── generate-types.ts      # Type generation
│
├── .env.example               # Environment variables template
├── .gitignore
├── .npmrc                     # pnpm configuration
├── package.json               # Root package.json
├── pnpm-workspace.yaml        # Workspace configuration
├── turbo.json                 # Turborepo configuration
└── README.md
```

---

## Apps Directory

### `apps/web/` — Main Application

The primary Next.js 15 application with App Router.

```
apps/web/
├── public/                     # Static assets
│   ├── images/
│   │   ├── logo.svg
│   │   └── icons/
│   └── fonts/
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Auth route group (public)
│   │   │   ├── sign-in/
│   │   │   │   └── [[...sign-in]]/
│   │   │   │       └── page.tsx
│   │   │   ├── sign-up/
│   │   │   │   └── [[...sign-up]]/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx     # Auth layout (centered, minimal)
│   │   │
│   │   ├── (marketing)/       # Marketing route group (public)
│   │   │   ├── page.tsx       # Landing page
│   │   │   ├── pricing/
│   │   │   ├── features/
│   │   │   └── layout.tsx     # Marketing layout (header/footer)
│   │   │
│   │   ├── (dashboard)/       # Dashboard route group (protected)
│   │   │   ├── layout.tsx     # Dashboard shell (sidebar, header)
│   │   │   ├── page.tsx       # Dashboard home (redirect or overview)
│   │   │   │
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx               # Project list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx           # Create project
│   │   │   │   └── [projectId]/
│   │   │   │       ├── page.tsx           # Project overview
│   │   │   │       ├── layout.tsx         # Project-specific layout
│   │   │   │       ├── board/
│   │   │   │       │   └── page.tsx       # Kanban board
│   │   │   │       ├── list/
│   │   │   │       │   └── page.tsx       # List view
│   │   │   │       ├── timeline/
│   │   │   │       │   └── page.tsx       # Gantt/Timeline view
│   │   │   │       ├── tasks/
│   │   │   │       │   └── [taskId]/
│   │   │   │       │       └── page.tsx   # Task detail (modal or page)
│   │   │   │       └── settings/
│   │   │   │           └── page.tsx       # Project settings
│   │   │   │
│   │   │   ├── agents/
│   │   │   │   ├── page.tsx               # Agent directory
│   │   │   │   └── [agentId]/
│   │   │   │       ├── page.tsx           # Agent profile
│   │   │   │       ├── tasks/
│   │   │   │       │   └── page.tsx       # Agent's tasks
│   │   │   │       └── knowledge/
│   │   │   │           └── page.tsx       # Agent's knowledge
│   │   │   │
│   │   │   ├── knowledge/
│   │   │   │   ├── page.tsx               # Knowledge base search
│   │   │   │   └── [entryId]/
│   │   │   │       └── page.tsx           # Knowledge entry detail
│   │   │   │
│   │   │   ├── missions/  # TODO: Rename from 'goals/' to align with terminology
│   │   │   │   ├── page.tsx               # Missions overview (strategic outcomes)
│   │   │   │   └── [missionId]/
│   │   │   │       └── page.tsx           # Mission detail
│   │   │   │
│   │   │   ├── analytics/
│   │   │   │   ├── page.tsx               # Analytics dashboard
│   │   │   │   ├── agents/
│   │   │   │   │   └── page.tsx           # Agent performance
│   │   │   │   └── projects/
│   │   │   │       └── page.tsx           # Project metrics
│   │   │   │
│   │   │   └── settings/
│   │   │       ├── page.tsx               # Settings overview
│   │   │       ├── organization/
│   │   │       │   └── page.tsx           # Org settings
│   │   │       ├── members/
│   │   │       │   └── page.tsx           # Team members
│   │   │       ├── integrations/
│   │   │       │   └── page.tsx           # Connected services
│   │   │       ├── api-keys/
│   │   │       │   └── page.tsx           # API key management
│   │   │       └── billing/
│   │   │           └── page.tsx           # Billing & subscription
│   │   │
│   │   ├── api/                # API Route Handlers
│   │   │   └── v1/
│   │   │       ├── projects/
│   │   │       │   ├── route.ts           # GET (list), POST (create)
│   │   │       │   └── [projectId]/
│   │   │       │       ├── route.ts       # GET, PATCH, DELETE
│   │   │       │       └── tasks/
│   │   │       │           └── route.ts   # Project tasks
│   │   │       ├── tasks/
│   │   │       │   ├── route.ts
│   │   │       │   └── [taskId]/
│   │   │       │       ├── route.ts
│   │   │       │       └── comments/
│   │   │       │           └── route.ts
│   │   │       ├── agents/
│   │   │       │   ├── route.ts
│   │   │       │   └── [agentId]/
│   │   │       │       └── route.ts
│   │   │       ├── knowledge/
│   │   │       │   ├── route.ts
│   │   │       │   └── search/
│   │   │       │       └── route.ts       # Semantic search
│   │   │       ├── webhooks/
│   │   │       │   ├── clawdbot/
│   │   │       │   │   └── route.ts       # Clawdbot events
│   │   │       │   ├── github/
│   │   │       │   │   └── route.ts
│   │   │       │   └── stripe/
│   │   │       │       └── route.ts
│   │   │       └── health/
│   │   │           └── route.ts           # Health check
│   │   │
│   │   ├── layout.tsx         # Root layout
│   │   ├── not-found.tsx      # 404 page
│   │   ├── error.tsx          # Error boundary
│   │   ├── loading.tsx        # Root loading state
│   │   └── globals.css        # Global styles
│   │
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   └── index.ts       # Barrel export
│   │   │
│   │   ├── features/          # Feature-specific components
│   │   │   ├── projects/
│   │   │   │   ├── project-card.tsx
│   │   │   │   ├── project-form.tsx
│   │   │   │   ├── project-list.tsx
│   │   │   │   └── project-header.tsx
│   │   │   ├── tasks/
│   │   │   │   ├── task-card.tsx
│   │   │   │   ├── task-form.tsx
│   │   │   │   ├── task-detail.tsx
│   │   │   │   ├── kanban-board.tsx
│   │   │   │   ├── kanban-column.tsx
│   │   │   │   └── task-comments.tsx
│   │   │   ├── agents/
│   │   │   │   ├── agent-card.tsx
│   │   │   │   ├── agent-profile.tsx
│   │   │   │   ├── agent-status.tsx
│   │   │   │   └── agent-assignment.tsx
│   │   │   ├── knowledge/
│   │   │   │   ├── knowledge-card.tsx
│   │   │   │   ├── knowledge-search.tsx
│   │   │   │   └── knowledge-timeline.tsx
│   │   │   └── comments/
│   │   │       ├── comment-thread.tsx
│   │   │       ├── comment-input.tsx
│   │   │       └── mention-input.tsx
│   │   │
│   │   ├── layouts/           # Layout components
│   │   │   ├── dashboard-shell.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   └── mobile-nav.tsx
│   │   │
│   │   └── shared/            # Cross-feature components
│   │       ├── empty-state.tsx
│   │       ├── loading-spinner.tsx
│   │       ├── error-boundary.tsx
│   │       ├── avatar.tsx
│   │       ├── badge.tsx
│   │       ├── date-picker.tsx
│   │       ├── file-upload.tsx
│   │       └── rich-text-editor.tsx
│   │
│   ├── lib/                   # Core utilities
│   │   ├── api/               # API client utilities
│   │   │   ├── client.ts      # Fetch wrapper
│   │   │   ├── projects.ts    # Project API functions
│   │   │   ├── tasks.ts       # Task API functions
│   │   │   ├── agents.ts      # Agent API functions
│   │   │   └── knowledge.ts   # Knowledge API functions
│   │   │
│   │   ├── auth/              # Auth utilities
│   │   │   ├── middleware.ts
│   │   │   └── utils.ts
│   │   │
│   │   ├── db/                # Database utilities
│   │   │   ├── client.ts      # Database client instance
│   │   │   └── utils.ts       # Query helpers
│   │   │
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── use-projects.ts
│   │   │   ├── use-tasks.ts
│   │   │   ├── use-agents.ts
│   │   │   ├── use-debounce.ts
│   │   │   ├── use-media-query.ts
│   │   │   └── use-local-storage.ts
│   │   │
│   │   ├── stores/            # Zustand stores
│   │   │   ├── sidebar-store.ts
│   │   │   ├── task-filter-store.ts
│   │   │   └── notification-store.ts
│   │   │
│   │   ├── services/          # Business logic services
│   │   │   ├── project-service.ts
│   │   │   ├── task-service.ts
│   │   │   ├── agent-service.ts
│   │   │   ├── knowledge-service.ts
│   │   │   └── notification-service.ts
│   │   │
│   │   ├── validations/       # Zod schemas
│   │   │   ├── project.ts
│   │   │   ├── task.ts
│   │   │   ├── agent.ts
│   │   │   └── common.ts
│   │   │
│   │   └── utils/             # General utilities
│   │       ├── cn.ts          # classNames utility
│   │       ├── dates.ts       # Date formatting
│   │       ├── strings.ts     # String helpers
│   │       └── constants.ts   # App constants
│   │
│   ├── server/                # Server-only code
│   │   ├── actions/           # Server Actions
│   │   │   ├── projects.ts
│   │   │   ├── tasks.ts
│   │   │   ├── agents.ts
│   │   │   └── knowledge.ts
│   │   │
│   │   ├── db/                # Server-side DB access
│   │   │   ├── queries/       # Read queries
│   │   │   │   ├── projects.ts
│   │   │   │   ├── tasks.ts
│   │   │   │   └── agents.ts
│   │   │   └── mutations/     # Write mutations
│   │   │       ├── projects.ts
│   │   │       ├── tasks.ts
│   │   │       └── agents.ts
│   │   │
│   │   └── integrations/      # External service integrations
│   │       ├── clawdbot/
│   │       │   ├── client.ts
│   │       │   └── types.ts
│   │       ├── github/
│   │       ├── slack/
│   │       └── openai/        # Embeddings
│   │
│   ├── styles/                # Additional styles
│   │   └── themes/
│   │       ├── light.css
│   │       └── dark.css
│   │
│   └── types/                 # App-specific types
│       ├── api.ts
│       └── components.ts
│
├── tests/                     # Test files
│   ├── unit/                  # Unit tests (Vitest)
│   │   ├── services/
│   │   └── utils/
│   ├── integration/           # Integration tests
│   │   └── api/
│   └── e2e/                   # E2E tests (Playwright)
│       ├── auth.spec.ts
│       ├── projects.spec.ts
│       └── tasks.spec.ts
│
├── .env.local                 # Local environment variables
├── .env.example               # Environment template
├── components.json            # shadcn/ui configuration
├── next.config.ts             # Next.js configuration
├── tailwind.config.ts         # Tailwind configuration
├── tsconfig.json              # TypeScript configuration
├── vitest.config.ts           # Vitest configuration
├── playwright.config.ts       # Playwright configuration
└── package.json
```

---

## Packages Directory

### `packages/database/` — Database Package

Shared Drizzle schema and database client.

```
packages/database/
├── src/
│   ├── schema/                # Drizzle schema definitions
│   │   ├── organizations.ts
│   │   ├── users.ts
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   ├── agents.ts
│   │   ├── knowledge.ts
│   │   ├── comments.ts
│   │   ├── audit-logs.ts
│   │   └── index.ts           # Schema exports
│   │
│   ├── migrations/            # SQL migrations
│   │   ├── 0000_initial.sql
│   │   └── meta/
│   │
│   ├── client.ts              # Database client export
│   ├── types.ts               # Inferred types from schema
│   └── index.ts               # Main exports
│
├── drizzle.config.ts          # Drizzle configuration
├── tsconfig.json
└── package.json
```

### `packages/ui/` — Shared UI Package

Shared UI components (for potential future apps).

```
packages/ui/
├── src/
│   ├── components/            # Shared components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   │
│   ├── styles/               # Shared styles
│   │   └── base.css
│   │
│   └── index.ts              # Exports
│
├── tsconfig.json
└── package.json
```

### `packages/types/` — Shared Types

TypeScript types shared across packages.

```
packages/types/
├── src/
│   ├── api/                   # API request/response types
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   └── agents.ts
│   │
│   ├── domain/                # Domain model types
│   │   ├── project.ts
│   │   ├── task.ts
│   │   ├── agent.ts
│   │   └── user.ts
│   │
│   ├── events/                # Event types (webhooks, SSE)
│   │   └── agent-events.ts
│   │
│   └── index.ts               # Exports
│
├── tsconfig.json
└── package.json
```

### `packages/config/` — Shared Configurations

```
packages/config/
├── eslint/
│   ├── base.js
│   ├── next.js
│   └── react.js
│
├── typescript/
│   ├── base.json
│   ├── nextjs.json
│   └── react-library.json
│
├── tailwind/
│   └── base.js
│
└── package.json
```

### `packages/utils/` — Shared Utilities

```
packages/utils/
├── src/
│   ├── dates.ts               # Date utilities
│   ├── strings.ts             # String utilities
│   ├── numbers.ts             # Number utilities
│   ├── arrays.ts              # Array utilities
│   ├── objects.ts             # Object utilities
│   ├── validation.ts          # Validation helpers
│   └── index.ts
│
├── tsconfig.json
└── package.json
```

---

## Tooling Directory

```
tooling/
├── eslint/
│   ├── base.js                # Base ESLint config
│   ├── nextjs.js              # Next.js specific rules
│   └── package.json
│
├── typescript/
│   ├── base.json              # Base tsconfig
│   ├── nextjs.json            # Next.js tsconfig
│   └── package.json
│
└── tailwind/
    ├── base.ts                # Base Tailwind config
    ├── preset.ts              # Design tokens
    └── package.json
```

---

## Configuration Files

### Root `package.json`

```json
{
  "name": "agent-command-center",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test",
    "test:e2e": "turbo test:e2e",
    "type-check": "turbo type-check",
    "db:generate": "turbo db:generate",
    "db:migrate": "turbo db:migrate",
    "db:push": "turbo db:push",
    "db:studio": "turbo db:studio",
    "clean": "turbo clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.5.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### Root `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tooling/*'
```

### Root `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "globalEnv": ["NODE_ENV", "NEXT_PUBLIC_*"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "outputs": ["playwright-report/**"]
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "db:studio": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

---

## Naming Conventions

### Files

| Type             | Convention      | Example                                                  |
| ---------------- | --------------- | -------------------------------------------------------- |
| React Components | PascalCase      | `ProjectCard.tsx` → `project-card.tsx` (kebab preferred) |
| Utilities        | camelCase       | `formatDate.ts` → `dates.ts`                             |
| Types            | camelCase       | `project.ts`                                             |
| Constants        | SCREAMING_SNAKE | `API_URL` (inside files)                                 |
| Routes           | kebab-case      | `api/v1/project-templates/`                              |
| CSS/Styles       | kebab-case      | `button-primary.css`                                     |

### Components

```typescript
// Component file: project-card.tsx
export function ProjectCard({ project }: ProjectCardProps) { ... }

// Named export, not default export
// PascalCase function name
```

### Types

```typescript
// Types file: types/project.ts
export interface Project { ... }
export type ProjectStatus = 'active' | 'archived' | 'completed';
export type ProjectWithTasks = Project & { tasks: Task[] };
```

---

## Import Aliases

### `tsconfig.json` Paths

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/server/*": ["./src/server/*"],
      "@/types/*": ["./src/types/*"],
      "@repo/database": ["../../packages/database/src"],
      "@repo/types": ["../../packages/types/src"],
      "@repo/ui": ["../../packages/ui/src"],
      "@repo/utils": ["../../packages/utils/src"]
    }
  }
}
```

### Usage Examples

```typescript
// Instead of: import { Button } from '../../../components/ui/button'
import { Button } from '@/components/ui/button';

// Instead of: import { db } from '../../../../packages/database'
import { db } from '@repo/database';

// Instead of: import { Project } from '../../../../packages/types'
import type { Project } from '@repo/types';
```

---

## Colocation Principles

### 1. Feature Colocation

Keep feature-related files together:

```
src/components/features/tasks/
├── task-card.tsx
├── task-card.test.tsx          # Tests next to component
├── task-card.stories.tsx       # Storybook stories (if used)
└── use-task-card.ts            # Hook specific to this component
```

### 2. Route Colocation

Keep route-specific components with their route:

```
app/(dashboard)/projects/[projectId]/
├── page.tsx                    # Route page
├── loading.tsx                 # Route loading state
├── error.tsx                   # Route error boundary
├── layout.tsx                  # Route layout (if needed)
└── _components/                # Route-specific components (private)
    ├── project-header.tsx
    └── project-tabs.tsx
```

### 3. Server/Client Separation

```
src/
├── lib/                        # Can be used anywhere
├── server/                     # Server-only (never imported by client)
│   ├── actions/               # Server Actions
│   └── db/                    # Database access
└── components/                # React components
    ├── feature/
    │   ├── server-component.tsx   # 'use server' or default
    │   └── client-component.tsx   # 'use client'
```

---

## What Goes Where

| Type of Code             | Location                         | Example                                   |
| ------------------------ | -------------------------------- | ----------------------------------------- |
| Page/Route               | `app/(group)/route/page.tsx`     | `app/(dashboard)/projects/page.tsx`       |
| API Route                | `app/api/v1/resource/route.ts`   | `app/api/v1/projects/route.ts`            |
| UI Component             | `components/ui/`                 | `components/ui/button.tsx`                |
| Feature Component        | `components/features/[feature]/` | `components/features/tasks/task-card.tsx` |
| Layout Component         | `components/layouts/`            | `components/layouts/sidebar.tsx`          |
| Shared Component         | `components/shared/`             | `components/shared/avatar.tsx`            |
| Custom Hook              | `lib/hooks/`                     | `lib/hooks/use-projects.ts`               |
| Zustand Store            | `lib/stores/`                    | `lib/stores/sidebar-store.ts`             |
| API Client               | `lib/api/`                       | `lib/api/projects.ts`                     |
| Service (business logic) | `lib/services/`                  | `lib/services/project-service.ts`         |
| Validation Schema        | `lib/validations/`               | `lib/validations/project.ts`              |
| Utility Function         | `lib/utils/`                     | `lib/utils/dates.ts`                      |
| Server Action            | `server/actions/`                | `server/actions/projects.ts`              |
| DB Query                 | `server/db/queries/`             | `server/db/queries/projects.ts`           |
| DB Mutation              | `server/db/mutations/`           | `server/db/mutations/projects.ts`         |
| External Integration     | `server/integrations/`           | `server/integrations/github/`             |
| Type Definition          | `types/` or `packages/types/`    | `types/api.ts`                            |
| Database Schema          | `packages/database/schema/`      | `packages/database/schema/projects.ts`    |

---

_Document maintained by: Architecture Team_ _Next review: 2026-03-01_
