# CI/CD Pipeline Guide — Cohortix

> **Updated:** 2026-02-18  
> **Stack:** GitHub Actions + Vercel + Supabase + Turborepo

---

## Pipeline Overview

```
Pull Request (to dev or main)
  └── ci.yml: lint + type-check + unit tests + security scans

Merge to dev
  └── Vercel Git Integration: auto-deploy to staging

Merge to main (via PR from dev)
  └── Vercel Git Integration: auto-deploy to production

Manual trigger
  └── db-migrate.yml: run migrations against selected environment
```

---

## Workflow Files

| File             | Trigger                      | Purpose                                |
| ---------------- | ---------------------------- | -------------------------------------- |
| `ci.yml`         | PR to `dev` or `main`        | Lint, type-check, unit tests, security |
| `db-migrate.yml` | Manual (`workflow_dispatch`) | Run migrations on any environment      |
| `release.yml`    | Push to `main`               | Tag release + generate changelog       |

---

## CI Workflow (`ci.yml`)

Runs on every PR to `dev` or `main`. All jobs must pass before merge is allowed.

### Jobs (in order)

1. **lint** — ESLint + Prettier format check (~2 min)
2. **type-check** — TypeScript compilation check (~2 min)
3. **unit-test** — Vitest unit tests with coverage upload (~5 min)
4. **secret-scan** — TruffleHog secret detection (PRs only)
5. **build** — Turborepo production build (~5 min)
6. **sast-scan** — Semgrep static analysis security scan (PRs only)
7. **snyk-scan** — Snyk dependency vulnerability scan
8. **dependency-audit** — pnpm audit
9. **ci-success** — Meta gate: passes only if all required jobs pass

### Required Secrets for CI

| Secret                              | Purpose                                   |
| ----------------------------------- | ----------------------------------------- |
| `TURBO_TOKEN`                       | Turborepo remote cache (speeds up builds) |
| `TURBO_TEAM`                        | Turborepo team name                       |
| `NEXT_PUBLIC_APP_URL`               | Used at build time                        |
| `NEXT_PUBLIC_SUPABASE_URL`          | Build-time env                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | Build-time env                            |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Build-time env                            |
| `CLERK_SECRET_KEY`                  | Build-time env                            |
| `DATABASE_URL`                      | Build-time env                            |
| `DIRECT_URL`                        | Build-time env                            |
| `SNYK_TOKEN`                        | Snyk scan (optional — non-blocking)       |
| `CODECOV_TOKEN`                     | Coverage upload (optional)                |

---

## Deployments (Vercel Git Integration)

All application deployments are handled by **Vercel Git Integration** — no
custom GitHub Actions deploy workflows are used.

- **Staging:** push/merge to `dev` → auto-deploys to `staging.cohortix.ai`
- **Production:** merge to `main` → auto-deploys to `app.cohortix.ai`

GitHub Actions is used for **CI only** (lint, tests, security, checks).

---

## Database Migration Runner (`db-migrate.yml`)

**Trigger:** Manual via GitHub Actions UI  
**Inputs:**

- `environment` — select `staging` or `production`

### How to run

1. GitHub repo → **Actions** → **Database Migration** → **Run workflow**
2. Select branch (`dev` for staging, `main` for production)
3. Select environment: `staging` or `production`
4. Click **Run workflow**

For production, an additional approval gate is required.

---

## Branch Protection Rules **[AHMAD TO CONFIGURE]**

Go to GitHub → Settings → Branches → Add rule for each branch:

### `main` branch

- ✅ Require pull request before merging
- ✅ Require approvals: 1
- ✅ Require status checks: `ci-success`
- ✅ Require branches to be up to date
- ✅ Restrict who can push: Ahmad only
- ✅ Require linear history

### `dev` branch

- ✅ Require pull request before merging
- ✅ Require status checks: `ci-success`
- ✅ Require branches to be up to date

---

## Adding New Environment Variables

When adding a new env var to the codebase:

1. Add it to `.env.local.example` (with a comment)
2. Add it to `.env.staging.example`
3. Add it to `.env.production.example`
4. Tell Ahmad to add the actual value in:
   - GitHub → Secrets (only if CI needs it)
   - Vercel → Environment Variables (for runtime use)

---

## Turborepo Remote Cache

The build uses Turborepo remote cache to speed up repeat builds. Ahmad needs to:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → **Remote Cache**
2. Create a team and generate a token
3. Add to GitHub Secrets: `TURBO_TOKEN` and `TURBO_TEAM`

Without these, builds still work — just slower (no cache sharing between CI
runs).

---

## Monitoring Build Performance

- Vercel → cohortix → Analytics → Build times
- GitHub Actions → workflow runs → timing per job
- Turborepo cache hit rate: visible in CI logs (`cache HIT`, `cache MISS`)
