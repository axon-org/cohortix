# Agent Command Center — Git Workflow & CI/CD

> Branch strategy, PR process, and environment promotion pipeline

*Version: 1.0.0 | Last Updated: 2026-02-05*

---

## Overview

This document defines the Git workflow and CI/CD pipeline for Agent Command Center. The strategy is designed for:

- **Safety**: Code reviewed before production
- **Velocity**: Fast iteration with preview deployments
- **Quality**: Automated testing at every stage
- **Traceability**: Clear audit trail of changes

---

## Branch Strategy

### Branch Types

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BRANCH STRATEGY                               │
└─────────────────────────────────────────────────────────────────────┘

  main (production)
    │
    │  ← Merge only from staging
    │  ← Tagged releases
    │
    ├──────────────────────────────────────────────────────────────────
    │
  staging (pre-production)
    │
    │  ← Merge from dev (promoted)
    │  ← Final testing before production
    │
    ├──────────────────────────────────────────────────────────────────
    │
  dev (development)
    │
    │  ← Merge from feature branches
    │  ← Integration testing
    │
    ├─── feature/ACC-123-user-auth ──────────────────┐
    │                                                 │
    ├─── feature/ACC-124-task-kanban ────────────────┤  Feature
    │                                                 │  Branches
    ├─── feature/ACC-125-agent-dashboard ────────────┘
    │
    ├─── bugfix/ACC-200-login-redirect ──────────────── Bugfix
    │
    ├─── hotfix/ACC-300-security-patch ──────────────── Hotfix (→ main)
    │
    └─── chore/update-dependencies ──────────────────── Chore
```

### Branch Naming Convention

```
<type>/<ticket-id>-<short-description>
```

| Type | Purpose | Example |
|------|---------|---------|
| `feature/` | New feature | `feature/ACC-123-user-authentication` |
| `bugfix/` | Bug fix | `bugfix/ACC-200-login-redirect` |
| `hotfix/` | Urgent production fix | `hotfix/ACC-300-security-patch` |
| `chore/` | Maintenance | `chore/update-dependencies` |
| `refactor/` | Code refactoring | `refactor/ACC-150-api-cleanup` |
| `docs/` | Documentation | `docs/api-documentation` |

### Branch Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                       FEATURE BRANCH LIFECYCLE                       │
└─────────────────────────────────────────────────────────────────────┘

  1. Create branch from dev
     │
     │  git checkout dev
     │  git pull origin dev
     │  git checkout -b feature/ACC-123-user-auth
     │
     ▼
  2. Develop & commit
     │
     │  git add .
     │  git commit -m "feat(auth): implement login form"
     │
     ▼
  3. Push & create PR
     │
     │  git push origin feature/ACC-123-user-auth
     │  # Create PR to dev
     │
     ▼
  4. CI runs automatically
     │
     │  • Lint
     │  • Type check
     │  • Unit tests
     │  • Build
     │  • Preview deployment
     │
     ▼
  5. Code review
     │
     │  • At least 1 approval required
     │  • All CI checks must pass
     │
     ▼
  6. Merge to dev
     │
     │  • Squash merge preferred
     │  • Delete branch after merge
     │
     ▼
  7. Dev deployment (automatic)
     │
     │  • Deploy to dev.agentcommandcenter.com
     │  • Integration tests run
     │
     └─── Complete
```

---

## Protected Branches

### Branch Protection Rules

#### `main` (Production)

```yaml
protection_rules:
  - require_pull_request_reviews:
      required_approving_review_count: 2
      dismiss_stale_reviews: true
      require_review_from_code_owners: true
  - require_status_checks:
      strict: true
      contexts:
        - "ci / lint"
        - "ci / type-check"
        - "ci / test"
        - "ci / build"
        - "e2e / test"
  - require_branches_to_be_up_to_date: true
  - enforce_admins: true
  - allow_force_pushes: false
  - allow_deletions: false
  - require_linear_history: true
```

#### `staging` (Pre-production)

```yaml
protection_rules:
  - require_pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
  - require_status_checks:
      strict: true
      contexts:
        - "ci / lint"
        - "ci / type-check"
        - "ci / test"
        - "ci / build"
  - allow_force_pushes: false
```

#### `dev` (Development)

```yaml
protection_rules:
  - require_pull_request_reviews:
      required_approving_review_count: 1
  - require_status_checks:
      contexts:
        - "ci / lint"
        - "ci / type-check"
        - "ci / test"
```

---

## Commit Conventions

### Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add OAuth login` |
| `fix` | Bug fix | `fix(tasks): resolve drag-drop issue` |
| `docs` | Documentation | `docs(api): update endpoint docs` |
| `style` | Formatting | `style: format with prettier` |
| `refactor` | Code refactoring | `refactor(db): optimize queries` |
| `test` | Tests | `test(api): add project tests` |
| `chore` | Maintenance | `chore(deps): update dependencies` |
| `perf` | Performance | `perf(search): optimize vector search` |
| `ci` | CI/CD | `ci: add e2e workflow` |

### Scopes

| Scope | Description |
|-------|-------------|
| `auth` | Authentication |
| `api` | API routes |
| `db` | Database |
| `ui` | UI components |
| `tasks` | Task management |
| `projects` | Project management |
| `agents` | Agent features |
| `knowledge` | Knowledge base |
| `search` | Search functionality |
| `deps` | Dependencies |

### Examples

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

---

## Pull Request Process

### PR Template

```markdown
## Description

Brief description of changes.

## Type of Change

- [ ] 🚀 Feature (new functionality)
- [ ] 🐛 Bug fix (non-breaking fix)
- [ ] 💥 Breaking change (fix/feature that breaks existing functionality)
- [ ] 📚 Documentation
- [ ] 🧹 Chore (maintenance)

## Related Issues

Closes #123

## Changes Made

- Change 1
- Change 2
- Change 3

## Screenshots (if applicable)

| Before | After |
|--------|-------|
| img    | img   |

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code where necessary
- [ ] I have updated documentation
- [ ] My changes generate no new warnings
- [ ] New and existing unit tests pass locally
- [ ] I have checked for security implications

## Deployment Notes

Any special deployment considerations.
```

### Review Guidelines

#### For Authors

1. Keep PRs small (< 400 lines preferred)
2. Write descriptive commit messages
3. Add tests for new functionality
4. Update documentation
5. Respond to review comments promptly
6. Rebase before merge if needed

#### For Reviewers

1. Review within 24 hours
2. Be constructive and specific
3. Check for:
   - Code quality and readability
   - Test coverage
   - Security implications
   - Performance impact
   - Documentation updates
4. Approve or request changes clearly

---

## CI/CD Pipeline

### Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CI/CD PIPELINE                               │
└─────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │  PULL REQUEST                                                    │
  │                                                                  │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
  │  │   Lint   │─▶│Type Check│─▶│  Tests   │─▶│  Build   │        │
  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
  │        │                                          │              │
  │        └──────────────────────────────────────────┼──────────────┤
  │                                                   ▼              │
  │                                           ┌──────────────┐       │
  │                                           │   Preview    │       │
  │                                           │  Deployment  │       │
  │                                           │  (Vercel)    │       │
  │                                           └──────────────┘       │
  └─────────────────────────────────────────────────────────────────┘
                                │
                                │ Merge to dev
                                ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  DEV BRANCH                                                      │
  │                                                                  │
  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐                   │
  │  │   All    │─▶│  Deploy  │─▶│ Integration  │                   │
  │  │  Checks  │  │  to Dev  │  │    Tests     │                   │
  │  └──────────┘  └──────────┘  └──────────────┘                   │
  │                     │                                            │
  │                     ▼                                            │
  │              dev.agentcommandcenter.com                          │
  └─────────────────────────────────────────────────────────────────┘
                                │
                                │ Promote to staging
                                ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  STAGING BRANCH                                                  │
  │                                                                  │
  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌────────────┐  │
  │  │   All    │─▶│  Deploy  │─▶│    E2E       │─▶│  Security  │  │
  │  │  Checks  │  │to Staging│  │   Tests      │  │   Scan     │  │
  │  └──────────┘  └──────────┘  └──────────────┘  └────────────┘  │
  │                     │                                            │
  │                     ▼                                            │
  │           staging.agentcommandcenter.com                         │
  └─────────────────────────────────────────────────────────────────┘
                                │
                                │ Promote to production (manual)
                                ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  MAIN BRANCH (PRODUCTION)                                        │
  │                                                                  │
  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌────────────┐  │
  │  │   All    │─▶│  Deploy  │─▶│   Smoke      │─▶│  Release   │  │
  │  │  Checks  │  │ to Prod  │  │   Tests      │  │   Tag      │  │
  │  └──────────┘  └──────────┘  └──────────────┘  └────────────┘  │
  │                     │                                            │
  │                     ▼                                            │
  │             app.agentcommandcenter.com                           │
  └─────────────────────────────────────────────────────────────────┘
```

### GitHub Actions Workflows

#### CI Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  pull_request:
    branches: [dev, staging, main]
  push:
    branches: [dev]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run linter
        run: pnpm lint

  type-check:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run type check
        run: pnpm type-check

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run tests
        run: pnpm test -- --coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, type-check, test]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - name: Setup Turborepo cache
        uses: actions/cache@v4
        with:
          path: .turbo
          key: ${{ runner.os }}-turbo-${{ github.sha }}
          restore-keys: |
            ${{ runner.os }}-turbo-
            
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
```

#### E2E Tests Workflow (`.github/workflows/e2e.yml`)

```yaml
name: E2E Tests

on:
  push:
    branches: [staging]
  pull_request:
    branches: [main]

jobs:
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps
        
      - name: Build application
        run: pnpm build
        
      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          
      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

#### Release Workflow (`.github/workflows/release.yml`)

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    name: Create Release
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Generate changelog
        id: changelog
        uses: TriPSs/conventional-changelog-action@v5
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          version-file: './package.json'
          skip-version-file: false
          skip-commit: false
          skip-tag: false
          
      - name: Create GitHub Release
        uses: ncipollo/release-action@v1
        if: ${{ steps.changelog.outputs.skipped == 'false' }}
        with:
          tag: ${{ steps.changelog.outputs.tag }}
          name: ${{ steps.changelog.outputs.tag }}
          body: ${{ steps.changelog.outputs.clean_changelog }}

  notify:
    name: Notify
    runs-on: ubuntu-latest
    needs: release
    steps:
      - name: Send deployment notification
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚀 New release deployed to production!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "🚀 *Agent Command Center* deployed to production\n\nVersion: ${{ github.ref_name }}\nCommit: ${{ github.sha }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Environment Promotion

### Promotion Process

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ENVIRONMENT PROMOTION                             │
└─────────────────────────────────────────────────────────────────────┘

  ┌─────────────┐                         ┌─────────────┐
  │   Feature   │                         │     Dev     │
  │   Branch    │─────── PR + Merge ─────▶│Environment  │
  └─────────────┘                         └──────┬──────┘
                                                 │
                   Automatic after CI passes     │
                                                 ▼
                                          ┌─────────────┐
                                          │  Staging    │
                                          │ Environment │
                                          └──────┬──────┘
                                                 │
                     Manual promotion after      │
                     - QA sign-off               │
                     - Product review            │
                     - 24-48h soak time          │
                                                 ▼
                                          ┌─────────────┐
                                          │ Production  │
                                          │ Environment │
                                          └─────────────┘
```

### Promotion Checklist

#### Dev → Staging

- [ ] All CI checks pass
- [ ] No known blockers
- [ ] Feature complete for release scope
- [ ] Integration tests pass

#### Staging → Production

- [ ] E2E tests pass
- [ ] Security scan clear
- [ ] Performance acceptable
- [ ] QA sign-off
- [ ] Product manager approval
- [ ] 24-48h soak time on staging
- [ ] Rollback plan documented
- [ ] On-call team notified

---

## Hotfix Process

For urgent production issues:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HOTFIX PROCESS                                │
└─────────────────────────────────────────────────────────────────────┘

  1. Create hotfix branch from main
     │
     │  git checkout main
     │  git pull origin main
     │  git checkout -b hotfix/ACC-300-security-patch
     │
     ▼
  2. Implement fix
     │
     │  # Minimal, focused change
     │
     ▼
  3. Create PR to main (expedited review)
     │
     │  # Tag as hotfix
     │  # Single reviewer can approve
     │
     ▼
  4. Merge to main
     │
     │  # Deploy immediately
     │
     ▼
  5. Backport to staging and dev
     │
     │  git checkout staging
     │  git cherry-pick <hotfix-commit>
     │  git push origin staging
     │
     │  git checkout dev
     │  git cherry-pick <hotfix-commit>
     │  git push origin dev
```

---

## Database Migrations

### Migration Workflow

```yaml
# In CI for dev branch
db-migrate:
  name: Run Migrations
  runs-on: ubuntu-latest
  needs: build
  steps:
    - name: Run migrations
      run: pnpm db:migrate
      env:
        DATABASE_URL: ${{ secrets.DEV_DATABASE_URL }}
```

### Migration Guidelines

1. **Forward-only**: No down migrations in production
2. **Atomic**: Each migration is a single transaction
3. **Reversible**: Design changes to be undoable
4. **Tested**: Test migrations on staging first
5. **Reviewed**: All migrations require review

---

## Rollback Procedures

### Application Rollback

```bash
# Via Vercel Dashboard
# Navigate to Deployments → Select previous deployment → Promote to Production

# Via Vercel CLI
vercel rollback <deployment-url>
```

### Database Rollback

1. **Stop traffic**: Enable maintenance mode
2. **Restore backup**: Point-in-time recovery
3. **Verify data**: Run integrity checks
4. **Deploy old code**: Match database state
5. **Resume traffic**: Disable maintenance mode

---

## Monitoring & Alerts

### Deployment Alerts

| Event | Channel | Recipients |
|-------|---------|------------|
| Deploy to staging | Slack #deploys | Team |
| Deploy to production | Slack #deploys | Team + On-call |
| Deploy failed | Slack #alerts | On-call |
| Rollback triggered | Slack #alerts | Team + On-call |

### Health Checks

```typescript
// /api/v1/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    external: await checkExternalServices(),
  };
  
  const healthy = Object.values(checks).every(c => c.status === 'ok');
  
  return Response.json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    version: process.env.VERCEL_GIT_COMMIT_SHA,
    timestamp: new Date().toISOString(),
  }, {
    status: healthy ? 200 : 503
  });
}
```

---

*Document maintained by: Architecture Team*
*Next review: 2026-03-01*
