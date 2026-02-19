# Cohortix Repository Cleanup Audit (READ‑ONLY)

**Repo:** `/Users/alimai/Projects/cohortix`  
**Primary branch audited:** `dev`  
**Comparison branch:** `main`  
**Date:** 2026-02-20

> Audit only. No deletions or modifications performed.

---

## 1) Stale Branches

**Local branches (git branch -a)**
- **Merged into `dev`**
  - 🟢 `feature/deployment-pipeline` — merged into `dev` (safe candidate to delete locally)
  - 🔴 `main` — merged into `dev` but should not be deleted (protected / active mainline)
- **Unmerged into `dev` (needs review)**
  - 🟡 `chore/clerk-cutover-prep`
  - 🟡 `feature/operations-redesign`
  - 🟡 `feature/sentry-integration`
  - 🟡 `fix/qa-stabilization`

**Remote branches**
- **Merged into `dev`**
  - 🔴 `origin/main` — do not delete
  - 🔴 `origin/dev` — active
- **Unmerged into `dev` (needs review)**
  - 🟡 `origin/chore/clerk-cutover-prep`
  - 🟡 `origin/cursor/authentication-and-database-config-6014`
  - 🟡 `origin/cursor/project-security-and-configuration-746c`
  - 🟡 `origin/cursor/script-env-var-validation-454b`

**Recommendation:** prune only the local merged feature branch if approved; review unmerged branches for orphaned work before deletion.

---

## 2) Unused Dependencies (Knip)
**Command:** `npx knip --no-exit-code`

### Unused dependencies (15)
🟡 **Needs review** (possible false positives due to dynamic imports or cross‑package usage)
- `@hookform/resolvers` (apps/web)
- `@radix-ui/react-toast` (apps/web)
- `react-hook-form` (apps/web)
- `zustand` (apps/web)
- `zod` (packages/types)
- `react` (packages/ui)
- `react-dom` (packages/ui)
- `@radix-ui/react-dialog` (packages/ui)
- `@radix-ui/react-dropdown-menu` (packages/ui)
- `@radix-ui/react-select` (packages/ui)
- `@radix-ui/react-toast` (packages/ui)
- `class-variance-authority` (packages/ui)
- `clsx` (packages/ui)
- `tailwind-merge` (packages/ui)
- `lucide-react` (packages/ui)

### Unused devDependencies (10)
🟡 **Needs review**
- `@repo/database`, `@repo/types`, `@repo/ui` (apps/web)
- `dotenv`, `husky`, `prettier-plugin-tailwindcss` (root)
- `eslint`, `tailwindcss` (packages/config)
- `@types/react`, `@types/react-dom` (packages/ui)

### Unlisted dependencies (4)
🟡 **Needs review**
- `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` (packages/ui/.eslintrc.json)
- `@supabase/supabase-js` (scripts/reset-db.ts, scripts/seed-db.ts)

### Unlisted binaries (2)
🟡 **Needs review**
- `playwright` (.github/workflows/preview.yml)
- `lint-staged` (.husky/pre-commit)

**Recommendation:** verify with package owners before removing; many may be used via runtime/dynamic imports or in other workspace contexts.

---

## 3) Dead / Unreferenced Source Files
**Knip unused files (56)** — all **🟡 Needs review** due to possible dynamic imports or indirect usage.

Notable examples:
- `apps/web/src/components/cohorts/*` (cohort detail client/header/modal)
- `apps/web/src/components/dashboard/*` (engagement chart, KPI cards)
- `apps/web/src/hooks/use-*` (cohort detail, cohorts)
- `apps/web/src/lib/supabase/*` (client/index/middleware)
- `apps/web/src/server/db/queries/operations.ts`
- `packages/database/src/schema/*` (debriefs/domains/intelligence/operations/rhythms/tasks/visions)
- `packages/ui/tokens/*`
- Many `scripts/*` (migration/seed helpers)

**Unused exports (62) & unused exported types (29)** include UI primitives, data schemas, hooks, and API helpers.

**Duplicate exports (12)** noted (e.g., in database schema, validations).

**Recommendation:** prioritize reviewing unused files under `apps/web/src/components/` and `apps/web/src/lib/` first; they are most likely to be dead if routes are not referencing them. Mark dynamic imports and API route consumers before removal.

---

## 4) Orphaned Assets / Leftover Configs

**Public assets:** no `public/` directory found.

**Image/font assets found (67):**
- **Design & mockups:** `docs/design/logo-concepts/*`, `mockups/*`, `design/mockups/*`  
  - 🟡 **Needs review** (likely not used by app runtime, but may be intentional archival)
- **Test artifacts:** `apps/web/playwright-report/*`, `apps/web/test-results/*`, `apps/web/coverage/*`  
  - 🟢 **Safe to clean** (generated reports/artifacts)

**Leftover env examples/configs:**
- `.env.example`, `.env.local.example`, `.env.production.example`, `.env.staging.example`, `apps/web/.env.example`  
  - 🟡 **Needs review** (keep if onboarding or deployment docs reference them)

---

## 5) TypeScript Health
**Command:** `npx tsc --noEmit`

**Total errors:** **427**

**Primary error categories:**
- 🟡 **Module resolution / alias failures** (many `Cannot find module '@/...'`) — likely TS config / path mapping / build context
- 🟡 **DOM lib missing** (tests/e2e using `document`, `HTMLElement` without DOM lib)
- 🟡 **Implicit `any` & type narrowing** (TS7006 / TS2339 / TS7053)
- 🟡 **Strict null checks** (TS18047/48/46)

**Files with highest error counts:**
- `scripts/seed-audit-logs.ts` (25)
- `scripts/seed-cohort-members.ts` (21)
- `apps/web/src/components/operations/operation-modal.tsx` (15)
- `apps/web/src/app/dashboard/operations/[id]/page.tsx` (14)
- `apps/web/src/app/dashboard/cohorts/[id]/page.tsx` (14)
- `apps/web/src/components/operations/operations-table.tsx` (13)
- `apps/web/src/components/dashboard/global-intel-feed.tsx` (13)
- `apps/web/src/components/kanban/task-detail-sheet.tsx` (12)
- `apps/web/src/components/cohorts/cohort-modal.tsx` (12)
- `apps/web/src/app/dashboard/missions/[id]/page.tsx` (12)

**Recommendation:** fix TS path aliases and lib settings first; that will likely collapse many errors and improve signal for real dead code.

---

## 6) Main vs Dev Gap
**Command:** `git log main..dev --oneline | wc -l` → **15 commits ahead**

**Notable dev-only changes:**
- Dashboard route rework (`/dashboard`), auth flow fixes, Clerk OAuth callbacks
- Supabase schema alignment, test updates
- Deployment/staging fixes + SAST shell injection remediations
- Environment consolidation and docs updates (`CONTRIBUTING.md`, `CLAUDE.md`)

**Recommendation:** merge or cherry-pick into `main` once validated to reduce drift.

---

## 7) Large Files in History
**Command:**
```
 git rev-list --objects --all \
 | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
 | awk '/^blob/ {print $3, $4}' | sort -rn | head -20
```

**Largest blobs (top 20) include:**
- `mockups/FINAL_04_knowledge_base_interface.png` (~4.7 MB)
- Multiple `pnpm-lock.yaml` versions (~200–360 KB each)
- Large mockup images under `mockups/` and `mockups/stitch-*`

**Recommendation:** keep design history if needed, but consider LFS or archival if repo size becomes an issue.

---

# Actionable Recommendations (Prioritized)
1. **🟢 Safe cleanup candidates**
   - Generated test artifacts: `apps/web/playwright-report/*`, `apps/web/test-results/*`, `apps/web/coverage/*`
   - Local branch `feature/deployment-pipeline` (already merged into `dev`)

2. **🟡 Needs review (likely cleanup targets, but confirm usage)**
   - Knip unused files (56) in `apps/web/src/components/`, `apps/web/src/lib/`, `scripts/`
   - Unused dependencies & devDependencies reported by Knip
   - Design/mockup assets in `docs/design/` and `mockups/`
   - Unmerged branches: `chore/clerk-cutover-prep`, `feature/operations-redesign`, `feature/sentry-integration`, `fix/qa-stabilization`, and `cursor/*`

3. **🔴 Don’t touch**
   - `main`, `origin/main`, `origin/dev` branches
   - Core config and env examples unless explicitly deprecated

---

## Notes
- This audit is **read-only**. No files, branches, or configs were modified.
- Knip can over-report in monorepos with dynamic imports or path aliases; treat results as a review list.
