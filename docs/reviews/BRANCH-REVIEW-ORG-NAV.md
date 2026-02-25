# QA Review — Cohortix Org Nav & Sidebar (3 branches)

**Date:** 2026-02-24 **Reviewer:** Nina (qa-engineer) **Env:** macOS (OpenClaw
subagent) **Dev server:** localhost:3000 (port open)

> ⚠️ **Browser automation unavailable**: OpenClaw browser tool could not connect
> (gateway/profile error). As a result, I **could not open the UI**, **could not
> capture screenshots**, and **could not check console errors or responsive
> behavior**. Findings below are based on code review + CLI checks only.

---

## Global checks

- ✅ **Type check:** `pnpm type-check` — **pass**
- ⚠️ **Lint:** `pnpm lint` — warnings only:
  - `@next/next/no-img-element` warnings in:
    - `apps/web/src/app/[orgSlug]/agents/[id]/page.tsx`
    - `apps/web/src/app/dashboard/agents/[id]/page.tsx`
    - `apps/web/src/components/cohorts/batch-members.tsx`
    - `apps/web/src/components/dashboard/recent-activity.tsx`

---

## Branch 1 — `feature/org-nav-sidebar`

**Scope:** Sidebar redesign + Clerk OrganizationSwitcher

### ✅ What looks correct (code review)

- Sidebar component updated to include OrganizationSwitcher in header.
- Collapsible sidebar state with toggle.
- Navigation items grouped with dividers; active state handled via pathname.
- User block shows avatar or fallback icon.

### ⚠️ Potential UX/visual risks (not verified in UI)

- Collapsed mode hides labels; relies on `title` attr on link only.
- No explicit keyboard/focus styles on toggle button (Tailwind defaults likely
  ok).
- Active state logic uses `pathname.startsWith(item.href)` for most links —
  should work but watch for overlapping routes.

### ❌ Broken functionality / errors

- Not verified (UI + console blocked).

### 📸 Screenshots

- Not available (browser tool unavailable).

---

## Branch 2 — `feature/org-nav-onboarding`

**Scope:** Onboarding flow with slug input + real-time validation

### ✅ What looks correct (code review)

- Onboarding page with welcome step + create-org step.
- Slug auto-generation from org name, with manual override.
- Validation via `isValidSlug` and debounce check via `useSlugCheck`.
- CTA disabled unless valid & available.

### ⚠️ Potential UX/edge issues

- `useSlugCheck` sets `status='idle'` and `error` on fetch failure, but UI only
  shows errors when `slugStatus === 'taken'`. **Network/API errors are not
  surfaced to the user.**
- No explicit cancellation for in-flight slug checks; fast typing could still
  update state out of order (low risk).

### ❌ Broken functionality / errors

- Not verified (UI + console blocked).

### 📸 Screenshots

- Not available (browser tool unavailable).

---

## Branch 3 — `feature/org-nav-access-denied`

**Scope:** Access denied page redesign + access request API

### ✅ What looks correct (code review)

- Access denied page includes two variants (`reason=not-found` vs not-member).
- Request access flow calls `/api/v1/access-requests` and transitions to success
  UI.
- API route validates auth + slug format and returns success for MVP.

### ⚠️ Potential UX/edge issues

- If request fails (non-200), UI silently stays in original state without error
  messaging.
- Access request API does not verify org existence or membership (acknowledged
  TODO). Could lead to false success state.

### ❌ Broken functionality / errors

- Not verified (UI + console blocked).

### 📸 Screenshots

- Not available (browser tool unavailable).

---

## Conflicts / branch interactions

- `apps/web/src/components/dashboard/sidebar.tsx` modified across branches (not
  validated visually). Watch for merge conflicts between sidebar changes and
  onboarding/access-denied flows.

---

## Blockers

- **Browser tool unavailable** prevented live QA, responsive checks, and
  screenshots. Need gateway/profile fix to complete UI verification.

---

## Next steps

1. Restore browser access (OpenClaw gateway / profile issue) and re-run UI
   checks.
2. Validate onboarding slug API errors are visible to user.
3. Consider adding user-facing error states for access request failures.
