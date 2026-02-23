# CI/CD Pipeline Documentation

## Overview
Cohortix uses GitHub Actions with a self-hosted macOS ARM64 runner for all CI/CD workflows. This eliminates GitHub Actions billing costs while providing unlimited build minutes.

## Runner Setup
- **Runner name:** mac-mini-runner
- **Location:** Ahmad's Mac mini (always-on)
- **Labels:** self-hosted, macOS, ARM64
- **Service:** Runs as a macOS LaunchAgent (auto-starts on boot)

## Workflows

### Core CI/CD
| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| CI Pipeline | `.github/workflows/ci.yml` | Push/PR to `main`/`dev`, weekly schedule | Lint, type-check, unit tests, build, security scans |
| Preview Deployment | `.github/workflows/preview.yml` | PRs to `main` | Deploy preview on Vercel + run E2E tests |
| Deploy to Staging | `.github/workflows/deploy-staging.yml` | Push to `dev` | Build & deploy to staging, smoke tests, post-deploy health check |
| Deploy to Production | `.github/workflows/deploy-production.yml` | Push to `main` | CI gate, approval, production deploy, smoke tests, post-deploy health check |
| Production Release | `.github/workflows/release.yml` | Push to `main` | Full checks, build, deploy, tag release, notify team |
| Database Migration | `.github/workflows/db-migrate.yml` | Manual (`workflow_dispatch`) | Run DB migrations in staging/production |

### Security & Compliance
| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| Security Baseline | `.github/workflows/security-baseline.yml` | Push/PR `main`, manual | Gitleaks + high severity dependency audit |
| DB Policy Guard | `.github/workflows/db-policy-guard.yml` | Push/PR `main`, manual | Enforce RLS policies on migrations |
| SBOM Generation | `.github/workflows/sbom.yml` | Release, weekly schedule | Generate and publish SBOM |

### Quality Gates
| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| E2E Tests | `.github/workflows/e2e.yml` | PRs to `main`/`dev`, post-production deploy | Playwright E2E on preview/staging/production |
| Bundle Size Analysis | `.github/workflows/bundle-analysis.yml` | PRs to `main`/`dev` | Report bundle size + enforce limit |
| Lighthouse CI | `.github/workflows/lighthouse.yml` | PRs to `main` (apps/packages) | Performance audits |

### Automation
| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| Automated Rollback | `.github/workflows/rollback.yml` | Manual (`workflow_dispatch`) | Promote previous Vercel deployment (placeholder) |
| Stale PR Cleanup | `.github/workflows/stale.yml` | Weekly schedule | Mark/close stale PRs |
| Dependabot | `.github/dependabot.yml` | Weekly schedule | Automated dependency update PRs |

## Adding a New Workflow
1. Create `.github/workflows/<name>.yml`
2. Always use `runs-on: self-hosted`
3. Add `concurrency` group to prevent redundant runs
4. Add `paths-ignore` for docs-only changes where appropriate
5. Document in this README

## Secrets Required
| Secret | Used By | Description |
|--------|---------|-------------|
| `VERCEL_TOKEN` | deploy-production, deploy-staging, preview, rollback | Vercel API token |
| `VERCEL_ORG_ID` | deploy-production, deploy-staging, preview, release | Vercel org ID |
| `VERCEL_PROJECT_ID` | deploy-production, deploy-staging, preview, rollback | Vercel project ID |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | deploy-production, deploy-staging, preview, health-check | Bypass Vercel protection for automation |
| `TURBO_TOKEN` | ci, deploy-production, release | Turborepo remote cache token |
| `TURBO_TEAM` | ci, deploy-production, release | Turborepo remote cache team |
| `DATABASE_URL` | ci, deploy-production, release, db-migrate | Production database URL |
| `DIRECT_URL` | ci, deploy-production, release, db-migrate | Direct database URL |
| `STAGING_DATABASE_URL` | db-migrate | Staging database URL |
| `STAGING_DIRECT_URL` | db-migrate | Staging direct DB URL |
| `NEXT_PUBLIC_SUPABASE_URL` | ci, health-check, bundle-analysis | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ci, health-check, bundle-analysis | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | deploy-production, ci | Supabase service role key |
| `STAGING_NEXT_PUBLIC_SUPABASE_URL` | db-migrate | Staging Supabase URL |
| `STAGING_SUPABASE_SERVICE_ROLE_KEY` | db-migrate | Staging Supabase service role key |
| `SUPABASE_BRANCH_DB_URL` | preview | Supabase branch DB URL (preview) |
| `PREVIEW_DATABASE_URL` | preview | Fallback preview DB URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ci, preview, deploy-production, bundle-analysis, e2e | Clerk publishable key |
| `CLERK_SECRET_KEY` | ci, preview, deploy-production, bundle-analysis, e2e | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | ci, preview, deploy-production, bundle-analysis | Clerk webhook secret |
| `E2E_BYPASS_SECRET` | e2e, preview | E2E bypass header/secret |
| `CODECOV_TOKEN` | ci | Codecov upload token |
| `SNYK_TOKEN` | ci | Snyk auth token |
| `GITLEAKS_LICENSE` | security-baseline | Gitleaks license key |
| `SLACK_WEBHOOK_URL` | release | Slack notifications |
| `GITHUB_TOKEN` | sbom, release, health-check | GitHub Actions token (auto-provided) |

## Troubleshooting
- If runner is offline: `cd ~/github-runner && ./svc.sh status`
- Restart runner: `cd ~/github-runner && ./svc.sh stop && ./svc.sh start`
- View runner logs: `tail -f ~/Library/Logs/actions.runner.*/Runner_*.log`
