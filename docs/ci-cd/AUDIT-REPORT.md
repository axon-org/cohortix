# CI/CD Audit Report — Cohortix

Date: 2026-02-23 Branch: `dev`

## Summary

This audit reviewed all workflows in `.github/workflows/`, Vercel config,
Dependabot, branch protections, and environment protections. Below are the
issues found, their severity, and fix status.

**Update:** Duplicate deploys are resolved by removing custom deploy workflows
and enabling Vercel Git Integration for all deployments.

---

## Issues & Fixes

1. **🔴 Critical — Duplicate production deploy workflows on `main`**

- **Where:** `deploy-production.yml` and `release.yml` both trigger on `push` to
  `main` and both deploy to Vercel.
- **Impact:** Double production deploys, conflicting migration paths, and
  multiple smoke-test runs.
- **Fix:** Removed custom deploy workflows entirely; Vercel Git Integration now
  handles all deployments.
- **Status:** ✅ Fixed.

2. **🔴 Critical — Production migrations without approval gate**

- **Where:** `release.yml` (`deploy-production` job runs `pnpm db:migrate`
  without environment protection).
- **Impact:** Production DB migrations can run automaticagent on any push to
  `main` with no manual approval.
- **Fix:** **Manual action required.** Remove migration from `release.yml` or
  add an approval gate via `environment: production` with required reviewers.
- **Status:** Not fixed.

3. **🔴 Critical — Production environment has no required reviewers**

- **Where:** GitHub Environment `production`.
- **Impact:** `await-approval` gates in `deploy-production.yml` and
  `db-migrate.yml` auto-approve, making the gate ineffective.
- **Fix:** **Manual action required.** Add required reviewers in **Settings →
  Environments → production**.
- **Status:** Not fixed.

4. **🟡 Medium — Branch protection required check `ci` does not exist**

- **Where:** Branch protection for `main` and `dev` requires status check `ci`.
- **Impact:** Required check likely never passes because actual checks are
  `CI Pipeline / CI Success` and job names like `Lint & Type Check`.
- **Fix:** **Manual action required.** Update required checks to match real
  workflow checks (recommend `CI Pipeline / CI Success`).
- **Status:** Not fixed.

5. **🟡 Medium — Secret Scan misconfigured on push**

- **Where:** `ci.yml` → `secret-scan` uses PR-only SHAs for `base`/`head`.
- **Impact:** On `push` events, TruffleHog receives empty SHAs and may fail or
  scan incorrectly.
- **Fix:** Updated to use `github.event.before` and `github.sha` fallback.
- **Status:** ✅ Fixed in `ci.yml`.

6. **🟡 Medium — `ci-success` references `full-test-suite` without `needs`**

- **Where:** `ci.yml` → `ci-success` job.
- **Impact:** On PRs, `needs.full-test-suite` was undefined and would cause
  false failure.
- **Fix:** Added `full-test-suite` to the `needs` list.
- **Status:** ✅ Fixed in `ci.yml`.

7. **🟡 Medium — Missing permissions for SARIF uploads**

- **Where:** `ci.yml` → `sast-scan` and `snyk-scan`.
- **Impact:** `security-events: write` is required for SARIF uploads
  (Semgrep/Snyk).
- **Fix:** Added job-level permissions (`contents: read`,
  `security-events: write`).
- **Status:** ✅ Fixed in `ci.yml`.

8. **🟡 Medium — Dependabot targets `main` by default**

- **Where:** `.github/dependabot.yml`.
- **Impact:** Dependabot PRs target `main` instead of `dev` (preferred for
  staging validation).
- **Fix:** Added `target-branch: "dev"`.
- **Status:** ✅ Fixed.

9. **🟡 Medium — Missing secrets referenced in workflows**

- **Where:**
  - `ci.yml`: `CODECOV_TOKEN` (private repo likely needs this).
  - `preview.yml`: `SUPABASE_BRANCH_DB_URL` or `PREVIEW_DATABASE_URL`.
  - `security-baseline.yml`: `GITLEAKS_LICENSE` (optional but referenced).
  - `release.yml`: `SLACK_WEBHOOK_URL` (optional; step uses
    `continue-on-error`).
- **Impact:** Steps may fail or use empty values.
- **Fix:** **Manual action required.** Add missing secrets or remove unused
  references.
- **Status:** Not fixed.

10. **🟢 Low — Duplicate CI runs on PR branches**

- **Where:** `ci.yml` (triggers on both `push` and `pull_request`),
  `db-policy-guard.yml` (push + PR on `main`).
- **Impact:** Double runs for the same commit when a PR is open; extra CI usage.
- **Fix:** Optional — restrict push triggers to `main` only or use
  `if: github.event_name == 'pull_request'` to avoid duplicates.
- **Status:** Not fixed (optional).

11. **🟢 Low — Vercel Git Integration needs confirmation**

- **Where:** Vercel project settings (not in repo).
- **Impact:** If Git Integration is enabled alongside GitHub Actions deploys,
  deployments will be duplicated.
- **Fix:** Remove repo-level Git deploy block and rely on Vercel Git
  Integration. Confirm branch→environment mapping in Vercel.
- **Status:** ✅ Repo fixed; dashboard mapping still requires verification.

---

## Files Changed

- `.github/workflows/deploy-production.yml` (removed)
- `.github/workflows/deploy-staging.yml` (removed)
- `.github/workflows/preview.yml` (removed)
- `.github/workflows/release.yml` (removed)
- `.github/workflows/rollback.yml` (removed)
- `.github/workflows/health-check.yml` (removed)
- `vercel.json`
- `docs/ci-cd/README.md`
- `docs/ci-cd/AUDIT-REPORT.md`

## Notes

- Vercel project settings file `.vercel/project.json` is valid.
- `vercel.json` no longer disables Git auto-deploy.
