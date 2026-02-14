# GitHub Configuration for Cohortix

This directory contains GitHub-specific configuration files for the Cohortix
project, implementing the CI/CD pipeline architecture defined in **Axon Codex
v1.1 §4.8**.

## 📋 Contents

```
.github/
├── workflows/
│   ├── ci.yml           # Main CI pipeline (commit + PR stages)
│   ├── preview.yml      # Preview deployment + E2E tests
│   └── release.yml      # Production deployment + release
├── ISSUE_TEMPLATE/
│   ├── bug_report.md    # Bug report template
│   └── feature_request.md  # Feature request template
├── CODEOWNERS           # Code ownership rules
├── PULL_REQUEST_TEMPLATE.md  # PR template
└── README.md            # This file
```

---

## 🚀 CI/CD Pipeline Overview

The pipeline follows a **two-stage approach** optimized for fast feedback and
thorough validation:

### Stage 1: Commit Stage (2-5 min target)

**Triggered:** Every push to `main`, every PR **Purpose:** Fast feedback on
basic quality checks

- ✅ **Lint** - Code style and quality
- ✅ **Type Check** - TypeScript compilation
- ✅ **Unit Tests** - Fast unit tests with Vitest
- ✅ **Secret Scan** - TruffleHog for credential detection
- ✅ **Build** - Verify code compiles

### Stage 2: PR Stage (5-15 min target)

**Triggered:** Only on pull requests **Purpose:** Comprehensive validation
before merge

- ✅ **Full Test Suite** - All tests with coverage
- ✅ **Coverage Check** - Enforce 80% threshold
- ✅ **SAST Scan** - Semgrep security analysis
- ✅ **Dependency Audit** - Check for vulnerable dependencies

### Stage 3: Preview Deployment

**Triggered:** Pull requests to `main` **Purpose:** Deploy preview environment
for testing

- 🚀 **Deploy to Vercel Preview** - Preview environment
- 🧪 **E2E Tests** - Playwright tests against preview URL
- 💬 **PR Comment** - Post preview URL and test results

### Stage 4: Production Release

**Triggered:** Push to `main` (after PR merge) **Purpose:** Deploy to production
with safety checks

- ✅ **Pre-deployment Checks** - Full test suite + security
- 🗄️ **Database Migration Check** - Verify migrations are safe
- 🏗️ **Build Production** - Optimized production build
- 🚀 **Deploy to Vercel Production** - Production deployment
- 🧪 **Smoke Tests** - Critical path validation
- 🏷️ **Create Release Tag** - Semantic versioning + changelog
- 📢 **Notify Team** - Slack notification

---

## 🔧 Setup Instructions

### 1. Required GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables →
Actions):

#### Vercel Deployment

```bash
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-vercel-org-id>
VERCEL_PROJECT_ID=<your-vercel-project-id>
```

**How to get these:**

1. Install Vercel CLI: `pnpm add -g vercel`
2. Login: `vercel login`
3. Link project: `vercel link`
4. Get token: Vercel Dashboard → Settings → Tokens
5. Get IDs: Check `.vercel/project.json` after linking

#### Database

```bash
DATABASE_URL=<production-database-url>
PREVIEW_DATABASE_URL=<preview-database-url>
```

#### Build Environment

```bash
NEXT_PUBLIC_APP_URL=<your-production-url>
```

#### Turborepo (Optional - for remote caching)

```bash
TURBO_TOKEN=<your-turbo-token>
TURBO_TEAM=<your-turbo-team>
```

**How to get these:**

1. Sign up at https://vercel.com/docs/concepts/monorepos/remote-caching
2. Login: `pnpm turbo login`
3. Link: `pnpm turbo link`

#### Codecov (Optional - for coverage reports)

```bash
CODECOV_TOKEN=<your-codecov-token>
```

**How to get this:**

1. Sign up at https://codecov.io
2. Add your repository
3. Copy the token from Settings

#### Slack Notifications (Optional)

```bash
SLACK_WEBHOOK_URL=<your-slack-webhook-url>
```

**How to get this:**

1. Create a Slack app: https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Create a webhook for your channel

---

### 2. Required npm Scripts

Add these scripts to your root `package.json`:

```json
{
  "scripts": {
    "lint": "turbo run lint",
    "format:check": "prettier --check .",
    "type-check": "turbo run type-check",
    "test": "turbo run test",
    "test:unit": "turbo run test:unit",
    "test:coverage": "turbo run test --coverage",
    "test:e2e": "playwright test",
    "build": "turbo run build"
  }
}
```

---

### 3. Branch Protection Rules

Configure branch protection for `main`:

**Settings → Branches → Add rule**

```yaml
Branch name pattern: main

Protect matching branches:
  ✅ Require pull request reviews before merging
     - Required approving reviews: 1
     - Dismiss stale reviews: Yes
     - Require review from Code Owners: Yes

  ✅ Require status checks to pass before merging
     - Require branches to be up to date: Yes
     - Status checks:
       - ci / lint
       - ci / type-check
       - ci / unit-test
       - ci / secret-scan
       - ci / build
       - preview / deploy-preview
       - preview / e2e-tests

  ✅ Require conversation resolution before merging
  ✅ Do not allow bypassing the above settings
  ✅ Restrict who can push to matching branches
```

---

### 4. GitHub Teams Setup

Create these teams in your GitHub organization and configure CODEOWNERS:

| Team             | Members              | Responsibilities          |
| ---------------- | -------------------- | ------------------------- |
| `@platform-team` | Platform engineers   | Infrastructure, CI/CD     |
| `@frontend-team` | Frontend developers  | React, Next.js, UI        |
| `@backend-team`  | Backend developers   | API, database             |
| `@ui-team`       | UI/UX designers      | Design system, components |
| `@qa-team`       | QA engineers         | Testing, quality          |
| `@devops-team`   | DevOps engineers     | Deployment, monitoring    |
| `@docs-team`     | Tech writers         | Documentation             |
| `@security-team` | Security specialists | Security reviews          |

---

## 📝 Using the Templates

### Pull Request Template

When creating a PR, the template will auto-populate. Fill in:

1. **Description** - What does this PR do?
2. **Related Issues** - Link issues (Closes #123)
3. **Type of Change** - Mark the relevant type
4. **Spec Reference** - Link to design/spec docs
5. **Changes Made** - List key changes
6. **Screenshots** - Add visual changes
7. **Testing** - Describe your testing
8. **Checklist** - Complete all items

### Bug Report Template

When reporting bugs:

1. **Clear description** of the bug
2. **Steps to reproduce** - Detailed steps
3. **Expected vs Actual** behavior
4. **Environment** - Browser, OS, device
5. **Screenshots** - Visual proof
6. **Impact** - Severity level

### Feature Request Template

When requesting features:

1. **Problem statement** - What problem does this solve?
2. **Proposed solution** - Your suggested approach
3. **User stories** - As a [role], I want...
4. **Impact assessment** - Who benefits?
5. **Technical considerations** - Implementation notes

---

## 🔍 Code Ownership

The `CODEOWNERS` file automatically requests reviews from the right teams:

| Path                  | Owners                       |
| --------------------- | ---------------------------- |
| `/docs/`              | @docs-team                   |
| `/apps/web/`          | @frontend-team               |
| `/packages/database/` | @backend-team                |
| `/.github/`           | @platform-team               |
| `**/auth*.*`          | @backend-team @security-team |
| `**/*.test.ts`        | @qa-team                     |

**How it works:**

- When a PR touches files in a path, GitHub auto-requests reviews from the
  owners
- Last matching rule wins (more specific rules override general ones)
- All owners must approve for the PR to be mergeable

---

## 🎯 Workflow Triggers

### ci.yml

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

### preview.yml

```yaml
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]
```

### release.yml

```yaml
on:
  push:
    branches: [main]
```

---

## 🚨 Troubleshooting

### CI Failing on Lint

**Problem:** ESLint errors **Solution:** Run `pnpm lint:fix` locally

### CI Failing on Type Check

**Problem:** TypeScript errors **Solution:** Run `pnpm type-check` locally and
fix errors

### CI Failing on Tests

**Problem:** Test failures **Solution:** Run `pnpm test` locally, fix failing
tests

### Preview Deployment Failing

**Problem:** Vercel deployment failed **Solution:**

1. Check Vercel secrets are set correctly
2. Verify `.env.example` is up to date
3. Check Vercel build logs

### E2E Tests Timing Out

**Problem:** Playwright tests timeout **Solution:**

1. Increase timeout in `playwright.config.ts`
2. Check if preview URL is accessible
3. Review Playwright report in artifacts

### Coverage Below Threshold

**Problem:** Test coverage < 80% **Solution:** Add more tests or adjust
threshold in `ci.yml` line 144

---

## 📊 Monitoring

### GitHub Actions Dashboard

- View all workflows: Actions tab
- See recent runs: Actions → All workflows
- Debug failures: Click on failed job → View logs

### Artifacts

- **Test Results:** Available for 7 days
- **Playwright Reports:** Available for 7 days
- **Build Artifacts:** Available for 1 day

### Notifications

- **Slack:** Deployment notifications to configured channel
- **GitHub:** PR comments for preview URLs and test results
- **Email:** GitHub sends emails for failed workflows

---

## 🔄 Maintenance

### Updating Workflows

1. Edit workflow files in `.github/workflows/`
2. Test changes on a feature branch first
3. Use `workflow_dispatch` for manual testing
4. Document changes in PR

### Updating Dependencies

1. Keep GitHub Actions up to date:
   - `actions/checkout@v4`
   - `actions/setup-node@v4`
   - `pnpm/action-setup@v3`

2. Update regularly for security patches

### Reviewing Templates

1. Review templates quarterly
2. Gather feedback from team
3. Update based on evolving needs

---

## 📚 References

- [Axon Codex v1.1](../docs/GIT_WORKFLOW.md) - CI/CD architecture
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [Playwright Docs](https://playwright.dev)
- [TruffleHog Docs](https://github.com/trufflesecurity/trufflehog)
- [Semgrep Docs](https://semgrep.dev/docs/)

---

## 🤝 Contributing

When contributing to CI/CD configuration:

1. Test changes on feature branches
2. Document changes in this README
3. Get review from @platform-team
4. Update related documentation

---

**Questions?** Contact the platform team or open a discussion in GitHub.

---

<sub>Last updated: 2026-02-10 | Maintained by: Platform Team</sub>
