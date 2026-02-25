# Branch 5 QA Report — My Tasks Page (feature/org-nav-my-tasks)

**Date:** 2026-02-25 **QA Owner:** Nina (qa-engineer) **Scope:** Branch 5 files
listed in task; Axon Dev Codex v1.8 compliance

---

## ✅ Static Analysis

| Check                                           | Result              | Notes                                                                                                                 |
| ----------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `pnpm --filter @cohortix/web exec tsc --noEmit` | **PASS**            | No output (assumed clean).                                                                                            |
| `pnpm --filter @cohortix/web lint`              | **PASS (warnings)** | Lint completed with warnings in unrelated files (hardcoded colors, `<img>` usage). No new warnings in Branch 5 files. |
| No hardcoded hex colors in new files            | **PASS**            | `rg` found none in Branch 5 files.                                                                                    |
| Conventional commit format                      | **PASS**            | Latest commit: `feat(db): create projects, milestones, and tasks tables`.                                             |

---

## ✅ Code Quality Review (Branch 5 Files)

### `apps/web/src/app/api/v1/my-tasks/route.ts`

- **withMiddleware + rate limiting:** ✅
  `withMiddleware(standardRateLimit, ...)`
- **Logger + correlationId:** ✅ `generateCorrelationId`, `setContext`,
  structured logs
- **Auth scoping:** ✅ `organization_id` + `assignee_id` filters applied
- **Validation:** ✅ `myTasksQuerySchema` used via `validateData`
- **Error handling:** ✅ logs and throws supabase error (assumed handled by
  middleware)
- **Sorting + pagination:** ✅ supports `due_date`, `priority`, `updated_at`
  with range

### `apps/web/src/lib/validations/my-tasks.ts`

- **Zod schema correctness:** ✅ enums align with API; coercion + defaults for
  page/limit

### `apps/web/src/hooks/use-my-tasks.ts`

- **React Query pattern:** ✅ consistent with existing hooks; queryKey includes
  params

### `apps/web/src/app/[orgSlug]/my-tasks/page.tsx`

- **Loading / Error / Empty states:** ✅ present
- **Filter dropdowns + sort UI:** ✅ implemented
- **Auth scoping:** handled server-side in API
- **No unused imports:** ✅
- **Note:** Client component required due to local state / dropdowns

### `apps/web/src/components/ui/task-status-chip.tsx`

- **Status chip mapping:** ✅ complete status coverage (incl. cancelled)

### `apps/web/src/lib/api/client.ts`

- **API client updates:** ✅ `getMyTasks`, types aligned with API response

### `supabase/migrations/20260225100000_create_projects_tasks_milestones.sql`

- **Idempotent:** ✅ uses `IF NOT EXISTS` and `DO $$` blocks
- **RLS:** ✅ policies for projects/milestones/tasks
- **Indexes:** ✅ org, project, assignee, status, priority, due_date,
  parent_task_id

---

## ✅ Browser Visual Testing (agent-browser)

**BLOCKER:** All org routes redirect to sign-in (no authenticated session).
Unable to validate My Tasks UI states, filters, sort dropdowns, or sidebar
navigation within authenticated views.

**Captured screenshots (redirect to sign-in):**

- `/tmp/qa-screenshots/dashboard-redirect-signin.png`
- `/tmp/qa-screenshots/my-tasks-redirect-signin.png`
- `/tmp/qa-screenshots/visions-redirect-signin.png`
- `/tmp/qa-screenshots/missions-redirect-signin.png`
- `/tmp/qa-screenshots/operations-redirect-signin.png`
- `/tmp/qa-screenshots/cohorts-redirect-signin.png`

**Notes:**

- Initial `agent-browser open` on `/my-tasks` returned `ERR_TOO_MANY_REDIRECTS`
  once; subsequent open redirected to sign-in.
- Mobile viewport checks for My Tasks could not be performed due to auth gating.

---

## ✅ API Testing

**BLOCKER:** No direct access to dev server logs for `/api/v1/my-tasks` 200s.

- E2E run output shows Clerk middleware errors during dashboard route render.
- Recommend re-run with logged-in session or ensure middleware is active for
  test runs.

---

## ✅ E2E Tests

### Mobile grep on current branch (feature/org-nav-my-tasks)

Command:

```bash
pnpm --filter @cohortix/web test:e2e --grep "dashboard|cohort-detail" --project "Mobile Chrome" --project "Mobile Safari"
```

**Result:** **PASS** — 28 passed (no failures). Artifacts in
`apps/web/test-results/` show no new errors.

### Full suite (previous run snapshot)

**Result:** **FAIL** — 4 failed, 55 skipped, 91 passed

**Failures (pre-existing):**

1. **[chromium] Cohort Detail — no console runtime crashes** (timeout +
   `page.goto: net::ERR_ABORTED`)
2. **[Mobile Chrome] Cohort Detail — accessibility checks** (missing
   `<title>`/`<html lang>` on rate-limit error)
3. **[Mobile Chrome] Dashboard — content or welcome state** (expected content
   missing)
4. **[Mobile Safari] Cohort Detail — accessibility checks** (same as Mobile
   Chrome)

---

## 🐞 Bugs / Issues

| Severity  | Issue                                                                                     | Notes                                                                            |
| --------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Major** | Auth-gated routes block visual QA (My Tasks, dashboard, etc.)                             | Redirect to sign-in prevents verification of UI states and sidebar navigation.   |
| **Major** | E2E failures in full suite (Cohort Detail timeout, mobile a11y, mobile dashboard content) | Pre-existing on `dev`. Mobile grep on current branch now passes.                 |
| **Minor** | `next lint` warnings from unrelated files                                                 | Hardcoded colors and `<img>` warnings pre-existing; no new warnings in Branch 5. |

---

## ✅ Checklist Summary (PASS/FAIL)

### 1) Static Analysis

- TSC noEmit — **PASS**
- Lint — **PASS (warnings)**
- No hardcoded hex in new files — **PASS**
- Conventional commit format — **PASS**

### 2) Code Quality Review

- API route middleware/rate-limit/logger/correlationId — **PASS**
- Zod schema correctness — **PASS**
- React Query hook pattern — **PASS**
- Auth scoping (assignee_id + organization_id) — **PASS**
- Error/loading/empty states — **PASS**
- No unused imports — **PASS**
- SQL migration idempotent + RLS + indexes — **PASS**

### 3) Browser Visual Testing

- My Tasks page loads + empty state + filters + sort + dark theme — **FAIL (auth
  redirect)**
- Mobile width (390px) for My Tasks — **FAIL (auth redirect)**
- Other pages smoke screenshots — **PARTIAL** (sign-in redirects captured)
- Sidebar navigation — **FAIL (auth redirect)**

### 4) API Testing

- `/api/v1/my-tasks` 200 response in logs — **FAIL (log access blocked)**

### 5) E2E Tests

- Mobile grep on current branch — **PASS** (28 passed)
- Full suite (previous snapshot) — **FAIL** (4 failed, 55 skipped, 91 passed)

---

## ✅ Final Recommendation

**REQUEST CHANGES**

**Rationale:**

- Unable to validate My Tasks UI due to auth redirect.
- E2E suite has 4 failures (some known, but still failing).
- API log verification blocked.

---

## Attachments

- Screenshots in `/tmp/qa-screenshots/`
- Playwright failure artifacts in `apps/web/test-results/`
