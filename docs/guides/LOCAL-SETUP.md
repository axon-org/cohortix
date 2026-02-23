# Local Development Setup — Cohortix

> **Audience:** Any developer joining the project for the first time.  
> **Updated:** 2026-02-18

---

## Prerequisites

| Tool         | Version | Install                                              |
| ------------ | ------- | ---------------------------------------------------- |
| Node.js      | ≥ 20    | [nodejs.org](https://nodejs.org) or `nvm install 20` |
| pnpm         | ≥ 9     | `npm install -g pnpm@9` or `corepack enable`         |
| Git          | any     | [git-scm.com](https://git-scm.com)                   |
| Supabase CLI | latest  | `brew install supabase/tap/supabase`                 |

---

## Quick Start (automated)

```bash
git clone https://github.com/ahmadashfq/cohortix.git
cd cohortix
git checkout dev
bash scripts/setup-local.sh
```

The script installs dependencies, copies the env template, and runs a
type-check. Then follow the manual steps below to fill in credentials.

---

## Step-by-Step (manual)

### 1 — Clone & branch

```bash
git clone https://github.com/ahmadashfq/cohortix.git
cd cohortix
git checkout dev              # always develop against dev, not main
```

### 2 — Install dependencies

```bash
pnpm install
```

> Uses the lockfile (`pnpm-lock.yaml`). Never use `npm install` or `yarn`.

### 3 — Set up environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in the following:

#### Supabase (shared dev project)

Ahmad owns the shared dev Supabase project. Ask him for: | Variable | Where to
find it | |----------|-----------------| | `NEXT_PUBLIC_SUPABASE_URL` | Supabase
Dashboard → Project → Settings → API | | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same
page, "anon public" key | | `SUPABASE_SERVICE_ROLE_KEY` | Same page,
"service_role secret" key | | `DATABASE_URL` | Settings → Database → Connection
Pooling → Transaction Mode (port 6543) | | `DIRECT_URL` | Settings → Database →
Connection String → Direct (port 5432) |

#### Clerk (shared dev instance)

Ahmad owns the dev Clerk app (`cohortix-dev`). Ask him for: | Variable | Where
to find it | |----------|-----------------| |
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → cohortix-dev → API Keys
| | `CLERK_SECRET_KEY` | Same page |

> ✅ Dev keys start with `pk_test_` and `sk_test_`. Never use `pk_live_`
> locagent.

### 4 — Run database migrations

```bash
pnpm db:migrate
```

This runs Drizzle migrations against your `DIRECT_URL`. Only needed first time
or after pulling new migration files.

### 5 — Seed test data (optional)

```bash
pnpm db:seed
```

### 6 — Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs the Next.js
app at `apps/web/`.

---

## Project Structure

```
cohortix/
├── apps/
│   └── web/                 ← Next.js 15 app (main frontend + API routes)
├── packages/
│   ├── database/            ← Drizzle ORM schema + migrations
│   ├── ui/                  ← Shared Radix/Tailwind components
│   └── types/               ← Shared TypeScript types
├── scripts/                 ← Dev utility scripts
├── supabase/
│   └── migrations/          ← Supabase SQL migration files
├── .env.local               ← Your local secrets (gitignored)
└── pnpm-workspace.yaml      ← Turborepo workspace config
```

---

## Common Commands

| Command           | What it does                           |
| ----------------- | -------------------------------------- |
| `pnpm dev`        | Start all apps in dev mode (Turborepo) |
| `pnpm build`      | Production build                       |
| `pnpm lint`       | ESLint across all packages             |
| `pnpm type-check` | TypeScript check across all packages   |
| `pnpm test:unit`  | Vitest unit tests                      |
| `pnpm test:e2e`   | Playwright E2E tests                   |
| `pnpm db:migrate` | Run pending Drizzle migrations         |
| `pnpm db:seed`    | Seed the database with test data       |
| `pnpm db:studio`  | Open Drizzle Studio (DB browser)       |
| `pnpm format`     | Prettier format all files              |

---

## Git Workflow

```
main   ← production (never commit directly)
  └── dev    ← staging integration branch
        └── feature/your-feature ← your work
```

1. `git checkout dev && git pull`
2. `git checkout -b feature/your-feature-name`
3. Commit with [Conventional Commits](https://www.conventionalcommits.org/):
   `feat:`, `fix:`, `chore:`, etc.
4. Push and open a PR against `dev`
5. CI must pass before merge

See `docs/guides/DEVELOPER-WORKFLOW.md` for the full branching policy.

---

## Troubleshooting

### `pnpm: command not found`

```bash
npm install -g pnpm@9
# or
corepack enable && corepack prepare pnpm@9 --activate
```

### `Cannot find module '@repo/database'`

Run `pnpm install` from the project root (not inside `apps/web`).

### Supabase connection refused

- Check `DATABASE_URL` in `.env.local` — make sure the password and project-ref
  are correct.
- Use the pooler URL (port 6543) for `DATABASE_URL` and direct URL (port 5432)
  for `DIRECT_URL`.

### Clerk auth loop / invalid key

- Ensure you're using `pk_test_` keys (not `pk_live_`) for local dev.
- Make sure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` match the
  same Clerk instance.

### Port 3000 already in use

```bash
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

---

## Need Help?

Ping `@Ahmad` on Discord or open an issue on GitHub.
