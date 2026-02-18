# CI/CD Pipeline Guide — Cohortix

> **Updated:** 2026-02-18  
> **Stack:** GitHub Actions + Vercel + Supabase + Turborepo

---

## Pipeline Overview

```
Pull Request (to dev)
  └── ci.yml: lint + type-check + unit tests + security scans

Merge to dev
  └── deploy-staging.yml: build → deploy to staging → smoke test

Merge to main (via PR from dev)
  └── deploy-production.yml: CI + [MANUAL APPROVAL] → deploy → smoke test

Manual trigger
  └── db-migrate.yml: run migrations against selected environment
```

---

## Workflow Files

| File | Trigger | Purpose |
|------|---------|---------|
| `ci.yml` | PR to `dev` or `main` | Lint, type-check, unit tests, security |
| `preview.yml` | PR to `main` | Vercel preview deploy + E2E tests |
| `deploy-staging.yml` | Push to `dev` | Auto-deploy to staging |
| `deploy-production.yml` | Push to `main` | Manual-approval production deploy |
| `db-migrate.yml` | Manual (`workflow_dispatch`) | Run migrations on any environment |
| `release.yml` | Push to `main` | Tag release + generate changelog |

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

| Secret | Purpose |
|--------|---------|
| `TURBO_TOKEN` | Turborepo remote cache (speeds up builds) |
| `TURBO_TEAM` | Turborepo team name |
| `NEXT_PUBLIC_APP_URL` | Used at build time |
| `NEXT_PUBLIC_SUPABASE_URL` | Build-time env |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build-time env |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Build-time env |
| `CLERK_SECRET_KEY` | Build-time env |
| `DATABASE_URL` | Build-time env |
| `DIRECT_URL` | Build-time env |
| `SNYK_TOKEN` | Snyk scan (optional — non-blocking) |
| `CODECOV_TOKEN` | Coverage upload (optional) |

---

## Staging Deploy (`deploy-staging.yml`)

**Trigger:** push to `dev` branch  
**Result:** auto-deploys to `staging.cohortix.app`

### Flow

```
push to dev
  ├── Install + lint + type-check
  ├── Build with Turborepo (staging env vars)
  ├── vercel build
  ├── vercel deploy → staging alias
  └── Smoke test: GET staging.cohortix.app/api/health
```

### Required Secrets (staging)

| Secret | Value source |
|--------|-------------|
| `STAGING_DATABASE_URL` | Supabase cohortix-staging pooler |
| `STAGING_DIRECT_URL` | Supabase cohortix-staging direct |
| `STAGING_NEXT_PUBLIC_SUPABASE_URL` | Supabase staging URL |
| `STAGING_NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase staging anon key |
| `STAGING_SUPABASE_SERVICE_ROLE_KEY` | Supabase staging service role |
| `STAGING_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk staging pk_test_ key |
| `STAGING_CLERK_SECRET_KEY` | Clerk staging sk_test_ key |
| `STAGING_CLERK_WEBHOOK_SECRET` | Clerk staging webhook secret |
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | Vercel org ID |
| `VERCEL_PROJECT_ID` | `prj_vKO7YaKzW39eGKtqCLrlaaIFoDO9` |

---

## Production Deploy (`deploy-production.yml`)

**Trigger:** push to `main`  
**Gate:** Manual approval by Ahmad (GitHub Environment: `production`)

### Flow

```
push to main
  ├── lint + type-check + tests
  ├── [WAITS for Ahmad's approval]
  ├── Build with production env vars
  ├── vercel build --prod
  ├── vercel deploy --prod
  ├── Smoke test: GET cohortix.app/api/health
  └── Create GitHub Release tag
```

### How Ahmad approves

1. GitHub Actions → `deploy-production` workflow → "Review deployments" banner
2. Select `production` environment → click **Approve and deploy**

### Required Secrets (production environment)

Same as staging but using production values — stored in the `production` GitHub environment (not repository-level secrets).

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
4. Add it to the relevant GitHub Actions workflow `env:` block
5. Tell Ahmad to add the actual value in:
   - GitHub → Secrets (for CI use)
   - Vercel → Environment Variables (for runtime use)

---

## Turborepo Remote Cache

The build uses Turborepo remote cache to speed up repeat builds. Ahmad needs to:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → **Remote Cache**
2. Create a team and generate a token
3. Add to GitHub Secrets: `TURBO_TOKEN` and `TURBO_TEAM`

Without these, builds still work — just slower (no cache sharing between CI runs).

---

## Monitoring Build Performance

- Vercel → cohortix → Analytics → Build times
- GitHub Actions → workflow runs → timing per job
- Turborepo cache hit rate: visible in CI logs (`cache HIT`, `cache MISS`)
