# PR31 Review — refactor: rename allies/ally terminology to agents/agent

**Status:** ⚠️ Merge with caution

## Summary

Large-scale terminology rename plus CI/CD workflow changes. No breaking DB
schema changes detected (schema diffs are comments only). API endpoints are
renamed from `/api/v1/allies` to `/api/v1/agents`, which is a breaking change
for any external consumers still using the old paths.

## Checks Performed

- **Schema/DB:** Reviewed `packages/database/src/schema/*.ts` diffs —
  comment-only changes; no migrations, column renames, or table changes.
  `ally_id` column remains in `insights` schema; index name unchanged (variable
  renamed only).
- **API routes:** `/api/v1/allies` and `/api/v1/allies/[id]` renamed to
  `/api/v1/agents` and `/api/v1/agents/[id]` with internal variable name
  updates. No backward-compatible routes retained.
- **Frontend:** `rg "\bally\b|\ballies\b" apps/web/src` returned no matches
  (code references updated).
- **Tests run:**
  - `pnpm type-check` ✅
  - `pnpm lint` ✅ (warnings about `next/image` usage; pre-existing pattern)
- **Config/CI:**
  - `vercel.json` + `apps/web/vercel.json`: `git.deploymentEnabled: true`
    (re-enables Vercel Git deploys).
  - `e2e.yml`: now `workflow_run` after Preview/Deploy; PRs default to staging
    URL (not preview URL).
  - `bundle-analysis.yml`: bundle limit increased 500KB → 2500KB.
  - `ci.yml`: SAST runs on `ubuntu-latest`.

## Risks / Potential Breaks

1. **Breaking API route change**: existing clients using `/api/v1/allies` will
   fail without redirects/compat endpoints. (High if external clients exist.)
2. **E2E workflow behavior shift**: PRs now test against **staging** instead of
   preview URLs. This can mask PR-specific regressions when staging is
   ahead/behind. (Medium risk.)
3. **Vercel Git auto-deploy re-enabled**: could cause unexpected auto-deploys if
   workflows assume manual control. (Medium.)
4. **Pending checks**: Full Test Suite + CI Success pending at review time.
   (Medium until resolved.)

## Blocking Issues

- None found in schema or code integrity, **but API endpoint change is
  breaking** without explicit compatibility/redirects.

## Recommendations

- Add temporary backward-compatible routes or redirects from `/api/v1/allies` →
  `/api/v1/agents` if any external clients depend on old path.
- Confirm E2E strategy: if PR-specific verification is required, restore preview
  URL targeting or run E2E per PR deploy.
- Wait for **Full Test Suite** and **CI Success** before merging.

## CI Status Snapshot

From `gh pr checks 31` at review time:

- **Pending:** Full Test Suite, CI Success, Cursor Bugbot
- **Passing:** Build, Unit Tests, Lint & Type Check, SAST, Snyk, etc.
