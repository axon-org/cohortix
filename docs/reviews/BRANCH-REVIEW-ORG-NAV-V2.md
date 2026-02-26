# Branch Review — Org Nav v2

**Date:** 2026-02-25  
**Reviewer:** Nina (QA)

> **Note:** Visual QA + screenshots blocked. Browser tool failed with:
> `Can't reach the OpenClaw browser control service` (profile error). No
> screenshots captured. Please restart OpenClaw gateway and re-run visual
> checks.

## Shared QA Signals (All Branches)

- **`npx tsc --noEmit`** fails with extensive TS errors (missing module paths
  `@/lib/*`, `@/components/*`, DOM lib types, implicit `any`, etc.). Appears
  **baseline** across branches.
- **`pnpm lint`** passes with warnings only (`@next/next/no-img-element`, Next
  lint deprecation).

---

## 1) `feature/org-nav-sidebar`

**Scope:** Sidebar redesign, custom org switcher, collapse toggle, tooltips,
ARIA, Settings/Account at bottom.

### QA Results

- **Typecheck:** ❌ fails (baseline TS errors)
- **Lint:** ⚠️ warnings only
- **Visual QA:** ❌ blocked (browser tool unavailable)
- **Console errors:** Not verified (browser blocked)

### Files Touched (vs dev)

- `apps/web/next.config.ts`
- `apps/web/src/components/dashboard/org-switcher.tsx`
- `apps/web/src/components/dashboard/sidebar.tsx`
- `docs/reviews/BRANCH-REVIEW-ORG-NAV.md`
- `docs/reviews/UX-REVIEW-SIDEBAR.md`

### Verdict

**🟡 Ship with changes** — Blocked on visual QA + screenshots. Also depends on
known TS failures (baseline). Once browser available, verify sidebar states
(expanded/collapsed), tooltips, ARIA, and bottom Settings/Account placement.

---

## 2) `feature/org-nav-onboarding`

**Scope:** `/onboarding` flow with slug validation.

### QA Results

- **Typecheck:** ❌ fails (baseline TS errors + onboarding-specific
  `use-slug-check`/`slug-utils` references)
- **Lint:** ⚠️ warnings only
- **Visual QA:** ❌ blocked (browser tool unavailable)
- **Console errors:** Not verified (browser blocked)

### Files Touched (vs dev)

- `apps/web/next.config.ts`
- `apps/web/src/app/onboarding/page.tsx`
- `apps/web/src/components/dashboard/sidebar.tsx`
- `apps/web/src/hooks/use-slug-check.ts`
- `apps/web/src/lib/slug-utils.ts`

### Verdict

**🟡 Ship with changes** — Blocked on visual QA + screenshots. Validate
`/onboarding` slug validation UI/UX once browser is available.

---

## 3) `feature/org-nav-access-denied`

**Scope:** `/access-denied` variants (not-found + not-member).

### QA Results

- **Typecheck:** ❌ fails (baseline TS errors + `access-requests` route typing)
- **Lint:** ⚠️ warnings only
- **Visual QA:** ❌ blocked (browser tool unavailable)
- **Console errors:** Not verified (browser blocked)

### Files Touched (vs dev)

- `apps/web/next.config.ts`
- `apps/web/src/app/access-denied/page.tsx`
- `apps/web/src/app/api/v1/access-requests/route.ts`
- `apps/web/src/components/access-denied/workspace-redirect.tsx`
- `apps/web/src/components/dashboard/sidebar.tsx`

### Verdict

**🟡 Ship with changes** — Blocked on visual QA + screenshots. Verify both
access-denied variants render correctly and `workspace-redirect` behavior once
browser is available.

---

## Merge/Conflict Risk Notes

Overlapping files across branches (potential conflicts):

- `apps/web/src/components/dashboard/sidebar.tsx` (touched in **all 3
  branches**)
- `apps/web/next.config.ts` (touched in **all 3 branches**)

**Recommendation:** Merge in stated order and resolve sidebar/next.config
conflicts deliberately.

---

## Action Items

1. **Restore browser tooling** (OpenClaw gateway) and re-run visual QA +
   screenshots.
2. Confirm whether **TS errors are known baseline** or regressions; if baseline,
   document exemptions or run scoped typecheck for changed files.
3. Re-verify `/onboarding` slug validation and `/access-denied` variants once
   visual QA possible.
