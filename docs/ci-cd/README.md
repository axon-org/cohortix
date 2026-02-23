# CI/CD Pipeline Documentation

## Overview

Cohortix uses **GitHub Actions for CI checks** and **Vercel Git Integration for
all deployments**. The self-hosted macOS ARM64 runner powers CI workflows while
Vercel handles production, staging, and preview deployments automaticagent.

## Runner Setup

- **Runner name:** mac-mini-runner
- **Location:** Ahmad's Mac mini (always-on)
- **Labels:** self-hosted, macOS, ARM64
- **Service:** Runs as a macOS LaunchAgent (auto-starts on boot)

## Deployment Flow (Vercel Git Integration)

| Git Event / Branch | Environment | Hostname            | Deployment Owner |
| ------------------ | ----------- | ------------------- | ---------------- |
| Push to `main`     | Production  | app.cohortix.ai     | Vercel           |
| Push to `dev`      | Staging     | staging.cohortix.ai | Vercel           |
| Pull Request       | Preview     | Vercel preview URL  | Vercel           |

**Branch protection gates merges** to `main`/`dev` via required GitHub Actions
checks.

```
Developer Push/PR
        │
        ├── GitHub Actions (CI checks)
        │
        └── Vercel Git Integration
             ├── Production (main)
             ├── Staging (dev)
             └── Preview (PRs)
```

## Workflows (CI Only)

### Core CI

| Workflow    | File                               | Trigger                                  | Purpose                                    |
| ----------- | ---------------------------------- | ---------------------------------------- | ------------------------------------------ |
| CI Pipeline | `.github/workflows/ci.yml`         | Push/PR to `main`/`dev`, weekly schedule | Lint, type-check, unit tests, build, scans |
| DB Migrate  | `.github/workflows/db-migrate.yml` | Manual (`workflow_dispatch`)             | Run DB migrations in staging/production    |

### Security & Compliance

| Workflow          | File                                      | Trigger                  | Purpose                                   |
| ----------------- | ----------------------------------------- | ------------------------ | ----------------------------------------- |
| Security Baseline | `.github/workflows/security-baseline.yml` | Push/PR `main`, manual   | Gitleaks + high severity dependency audit |
| DB Policy Guard   | `.github/workflows/db-policy-guard.yml`   | Push/PR `main`, manual   | Enforce RLS policies on migrations        |
| SBOM Generation   | `.github/workflows/sbom.yml`              | Release, weekly schedule | Generate and publish SBOM                 |

### Quality Gates

| Workflow             | File                                    | Trigger                       | Purpose                                      |
| -------------------- | --------------------------------------- | ----------------------------- | -------------------------------------------- |
| E2E Tests            | `.github/workflows/e2e.yml`             | PRs to `main`/`dev`           | Playwright E2E on preview/staging/production |
| Bundle Size Analysis | `.github/workflows/bundle-analysis.yml` | PRs to `main`/`dev`           | Report bundle size + enforce limit           |
| Lighthouse CI        | `.github/workflows/lighthouse.yml`      | PRs to `main` (apps/packages) | Performance audits                           |

### Automation

| Workflow         | File                          | Trigger         | Purpose                         |
| ---------------- | ----------------------------- | --------------- | ------------------------------- |
| Stale PR Cleanup | `.github/workflows/stale.yml` | Weekly schedule | Mark/close stale PRs            |
| Dependabot       | `.github/dependabot.yml`      | Weekly schedule | Automated dependency update PRs |

## Adding a New Workflow

1. Create `.github/workflows/<name>.yml`
2. Always use `runs-on: self-hosted`
3. Add `concurrency` group to prevent redundant runs
4. Add `paths-ignore` for docs-only changes where appropriate
5. Document in this README

## Secrets Required

| Secret                              | Used By                  | Description                             |
| ----------------------------------- | ------------------------ | --------------------------------------- |
| `VERCEL_AUTOMATION_BYPASS_SECRET`   | db-migrate               | Bypass Vercel protection for automation |
| `TURBO_TOKEN`                       | ci                       | Turborepo remote cache token            |
| `TURBO_TEAM`                        | ci                       | Turborepo remote cache team             |
| `DATABASE_URL`                      | ci, db-migrate           | Production database URL                 |
| `DIRECT_URL`                        | ci, db-migrate           | Direct database URL                     |
| `STAGING_DATABASE_URL`              | db-migrate               | Staging database URL                    |
| `STAGING_DIRECT_URL`                | db-migrate               | Staging direct DB URL                   |
| `NEXT_PUBLIC_SUPABASE_URL`          | ci, bundle-analysis      | Supabase project URL                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | ci, bundle-analysis      | Supabase anon key                       |
| `SUPABASE_SERVICE_ROLE_KEY`         | ci                       | Supabase service role key               |
| `STAGING_NEXT_PUBLIC_SUPABASE_URL`  | db-migrate               | Staging Supabase URL                    |
| `STAGING_SUPABASE_SERVICE_ROLE_KEY` | db-migrate               | Staging Supabase service role key       |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ci, bundle-analysis, e2e | Clerk publishable key                   |
| `CLERK_SECRET_KEY`                  | ci, bundle-analysis, e2e | Clerk secret key                        |
| `CLERK_WEBHOOK_SECRET`              | ci, bundle-analysis      | Clerk webhook secret                    |
| `E2E_BYPASS_SECRET`                 | e2e                      | E2E bypass header/secret                |
| `CODECOV_TOKEN`                     | ci                       | Codecov upload token                    |
| `SNYK_TOKEN`                        | ci                       | Snyk auth token                         |
| `GITLEAKS_LICENSE`                  | security-baseline        | Gitleaks license key                    |
| `GITHUB_TOKEN`                      | sbom                     | GitHub Actions token (auto-provided)    |

## Troubleshooting

- If runner is offline: `cd ~/github-runner && ./svc.sh status`
- Restart runner: `cd ~/github-runner && ./svc.sh stop && ./svc.sh start`
- View runner logs: `tail -f ~/Library/Logs/actions.runner.*/Runner_*.log`
