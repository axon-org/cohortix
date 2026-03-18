# Architecture Overview

## Tech Stack

Cohortix is built on:
- **Next.js 16** (App Router + React 19 + TypeScript)
- **SQLite** (via better-sqlite3) for simple, zero-ops data storage
- **Built-in auth** (session + API-key, role-based: viewer/operator/admin)
- **Tailwind CSS** for styling
- **Zustand** for client-side state management
- **Zod** for runtime validation
- **next-intl** for internationalization (10 languages)

## Architecture

Single Next.js application (not a monorepo):

```
src/
├── app/           # App Router pages, API routes (~100+ endpoints), layouts
├── components/    # React UI components (panels, dashboard, chat, onboarding)
├── lib/           # Business logic, DB access, auth, scheduling, adapters
├── store/         # Zustand state management
├── styles/        # Design tokens
└── i18n/          # Internationalization config
```

## Database

SQLite database stored locally (`.data/` directory). Schema defined in `src/lib/schema.sql` with auto-migrations in `src/lib/migrations.ts`.

## Key Features (inherited from Mission Control)

- 32 dashboard panels (tasks, agents, skills, logs, tokens, memory, security, etc.)
- Kanban task board with quality gates (Aegis review system)
- Agent lifecycle management with SOUL system
- Multi-gateway support (OpenClaw + more)
- Real-time updates via WebSocket + SSE
- Skills Hub with security scanning
- Natural language recurring task scheduling
- GitHub issue sync
- Docker deployment support

## Origin

Forked from [Mission Control](https://github.com/builderz-labs/mission-control) (MIT licensed).
Upstream remote configured for pulling future updates: `git fetch upstream && git merge upstream/main`.
