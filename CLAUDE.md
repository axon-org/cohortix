<!--
This file provides guidelines for AI coding agents working on the Cohortix project.
-->

# Cohortix — Agent command center for everyday people

<!-- Purpose: Agent instructions for AI coding agents working on Cohortix -->
<!-- Owner: Team -->
<!-- Last Reviewed: 2026-03-20 -->
<!-- Read After: PROJECT_BRIEF.md -->

## Tech Stack
- Next.js 16 (App Router)
- SQLite (better-sqlite3)
- React 19
- TypeScript
- Tailwind CSS
- pnpm
- Zod
- Zustand

## Key Commands
- `pnpm dev`       – start development server
- `pnpm build`     – build production assets
- `pnpm test`      – run unit tests
- `pnpm typecheck` – run TypeScript type checks
- `pnpm lint`      – run linting

## Project Structure
This is a single Next.js application (not a monorepo):

- `src/app`         – App Router pages, API routes, layouts
- `src/components`  – React UI components
- `src/lib`         – Business logic, utilities, data access

## Coding Conventions
- Follow existing code patterns throughout the codebase
- Enable TypeScript **strict** mode for all modules
- Use Tailwind CSS for styling
- Use Zod for runtime data validation and schema definitions

## Testing
- Unit tests: Vitest
- End-to-end tests: Playwright

## Database
- SQLite via better-sqlite3
- Migrations and schema defined in:
  - `src/lib/schema.sql`
  - `src/lib/migrations.ts`

## i18n
- Internationalization with **next-intl**
- Message files in `messages/*.json` (supports 10 languages)

## Important
This project was forked from **Mission Control** (builderz-labs). The upstream remote remains configured for pulling future updates.

## Terminology
See `docs/guides/TERMINOLOGY.md` for Cohortix-specific naming conventions (PPV hierarchy).
