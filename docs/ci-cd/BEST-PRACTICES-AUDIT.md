# Best Practices Audit — Cohortix CI/CD (Clerk • Vercel • Supabase)

**Repo:** `~/Projects/cohortix`  
**Date:** 2026-02-24

---

## 1) Clerk Best Practices

### Current State

- **Middleware**: `apps/web/src/middleware.ts` uses `clerkMiddleware` +
  `createRouteMatcher` to define public routes and redirects unauthenticated
  users to `/sign-in` with `redirect_url`.
- **Env vars**: `.env.local.example` and `.env.staging.example` define
  `NEXT_PUBLIC_CLERK_*`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`. Local
  example uses `NEXT_PUBLIC_CLERK_AFTER_*` while staging uses
  `NEXT_PUBLIC_CLERK_*_FALLBACK_REDIRECT_URL` (inconsistent).
- **Sign-in/up**: Pages use `<SignIn/>` and `<SignUp/>` with theme overrides; no
  explicit `redirectUrl` props (rely on env).
- **Webhooks**: `apps/web/src/app/api/webhooks/clerk/route.ts` verifies Svix
  signature and dedupes events via DB table.
- **ClerkProvider**: Root layout wraps app with `<ClerkProvider>` (App Router
  pattern).

### Recommended State

- Align to Clerk’s Next.js App Router middleware pattern using
  `auth().protect()` for protected routes and `createRouteMatcher` for public
  routes.
- Keep env vars consistent across environments (prefer
  `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`,
  `*_FALLBACK_REDIRECT_URL`).
- Keep webhook verification via Svix (current is correct) but consider Clerk’s
  official `verifyWebhook` helper for future-proofing.

### Findings

- **SUBOPTIMAL:** Middleware handles auth manuagent vs `auth().protect()`; higher
  maintenance and possible edge-cases (e.g., auth reason handling).
- **SUBOPTIMAL:** Mixed env variable conventions (`AFTER_*` vs `*_FALLBACK_*`).
- **FIXED (quick win):** `BYPASS_AUTH` now ignored in production (reduces
  accidental auth bypass risk).

### Recommendations (Priority)

1. **Switch to `auth().protect()` for protected routes** and use `publicRoutes`
   matcher for whitelisted paths (e.g., `/sign-in`, `/sign-up`,
   `/api/webhooks/clerk`).  
   **Effort:** Medium
2. **Standardize Clerk env variables across all environments** (use consistent
   `*_FALLBACK_REDIRECT_URL` or `*_AFTER_*` but not both).  
   **Effort:** Quick fix
3. **Consider `verifyWebhook` from `@clerk/nextjs/webhooks`** to stay aligned
   with Clerk updates (optional).  
   **Effort:** Quick fix

---

## 2) Vercel Deployment Best Practices

### Current State

- Vercel Git Integration **disabled** via `vercel.json`
  (`deploymentEnabled: false`).
- Deployments are handled by GitHub Actions using `vercel pull` → `vercel build`
  → `vercel deploy --prebuilt` for production/staging/preview.
- **Preview** workflow runs on PRs to `main` only (`preview.yml`), posts preview
  URL and runs Playwright against it.
- **Staging** workflow uses `vercel build --target=staging` and
  `vercel deploy --target=staging`.

### Recommended State

- Custom GitHub Actions deploy is fine **if** it’s intentional for governance,
  but it increases maintenance burden.
- Ensure CLI usage matches Vercel’s supported targets. If “staging” is a custom
  environment, confirm it’s enabled in Vercel; otherwise, use Preview + alias or
  a dedicated staging project.
- Keep environment variables managed in Vercel (preferred) and **pulled** during
  build, rather than manuagent injected in CI.

### Findings

- **SUBOPTIMAL:** Staging flow relies on `--target=staging` (only valid if
  Vercel Custom Environments is enabled). Risk of invalid deploy target.
- **SUBOPTIMAL:** CI build jobs manuagent inject env vars, while deploy workflows
  rely on `vercel pull` — two parallel env strategies.

### Recommendations (Priority)

1. **Verify Vercel CLI support for `--target=staging` in your team plan.** If
   unsupported, switch staging to Preview+alias or a separate Vercel project.  
   **Effort:** Medium
2. **Consolidate environment management**: prefer Vercel envs + `vercel pull`
   for deploys; avoid duplicating secrets in CI unless required.  
   **Effort:** Medium
3. **Consider re-enabling Vercel Git Integration** if you don’t need strict
   deployment control; it reduces custom workflow burden.  
   **Effort:** Large

---

## 3) Supabase + Drizzle Best Practices

### Current State

- `packages/database/src/client.ts` uses `DATABASE_URL` for runtime and
  migrations.
- `drizzle.config.ts` uses `DATABASE_URL` for migrations.
- `db-migrate.yml` is manual (workflow_dispatch) and applies both Drizzle +
  Supabase migrations.
- Supabase branching is referenced in docs, with separate staging/prod
  connection URLs.

### Recommended State

- **Use pooled URL** for runtime queries and **direct URL** for migrations/DDL
  (Supabase pooler does not support DDL safely).
- Keep a **single** source of truth for migrations (either Drizzle or Supabase)
  or clearly separate their roles.
- Make migration strategy part of deploy pipeline (at least for staging) with
  manual approval for production.

### Findings

- **SUBOPTIMAL:** Runtime and migrations both used `DATABASE_URL` (pooling
  risk).
- **SUBOPTIMAL:** Dual migration systems (Drizzle + Supabase) increase
  complexity.
- **FIXED (quick win):** Drizzle now uses `DIRECT_URL` when available; migration
  client uses direct connection.

### Recommendations (Priority)

1. **Keep `DIRECT_URL` for all migrations** (already fixed in code). Ensure
   environment secrets are set for all environments.  
   **Effort:** Quick fix
2. **Clarify migration ownership** (Drizzle vs Supabase SQL). Decide primary and
   make the other secondary/optional.  
   **Effort:** Medium
3. **Add a staging migration step to deploy pipeline** (auto-run on dev pushes;
   manual approval for production).  
   **Effort:** Medium

---

## 4) GitHub Actions Best Practices

### Current State

- **15 workflows** across CI, deploys, security, SBOM, stale, etc.
- CI is split across self-hosted and hosted runners.
- Multiple security scanners: **TruffleHog**, **Gitleaks**, **Semgrep**,
  **Snyk**, **pnpm audit**, plus `security-baseline.yml`.
- `rollback.yml` is a placeholder (no actual rollback logic).

### Recommended State

- Consolidate overlapping security checks to reduce noise and cost.
- Avoid placeholder workflows in production (they create false confidence).
- Run CI on `dev` too (at least core lint/unit) to reduce staging regressions.

### Findings

- **WRONG:** `rollback.yml` is non-functional but presented as “Automated
  Rollback”.
- **SUBOPTIMAL:** Redundant security scanning across CI + security-baseline +
  Snyk (high maintenance, long run times).
- **SUBOPTIMAL:** CI doesn’t run on direct pushes to `dev` (except staging
  workflow pre-checks).
- **SUBOPTIMAL (potentiagent WRONG):** `health-check.yml` uses repo secrets for
  Supabase (`NEXT_PUBLIC_SUPABASE_URL/ANON_KEY`). If staging uses a separate
  Supabase project, health checks target prod values.

### Recommendations (Priority)

1. **Either implement rollback logic or remove `rollback.yml`.** Right now it is
   misleading.  
   **Effort:** Medium
2. **Consolidate security scanning**: choose _one_ secret scanner (TruffleHog
   **or** Gitleaks), _one_ SAST (Semgrep), and _one_ dependency scan (pnpm audit
   **or** Snyk).  
   **Effort:** Medium
3. **Run CI on `dev` pushes** (at least lint + unit + type-check) to reduce
   staging regressions.  
   **Effort:** Quick fix
4. **Make health-check secrets environment-specific** (staging vs prod), or pass
   Supabase URL/key as inputs.  
   **Effort:** Quick fix
5. **Review self-hosted vs hosted split**: keep build-heavy jobs on self-hosted,
   move security-only scans to GitHub-hosted.  
   **Effort:** Medium

---

## 5) Branching & Git Flow

### Current State

- `main` → production, `dev` → staging.
- PRs to `main` get preview deployments.
- Dependabot PRs target `dev`.

### Recommended State

- Use PRs into `dev` as primary integration gate; merge `dev` → `main` for
  production releases (promote staging to prod).
- Require CI checks on `dev` and `main` with consistent branch protection.

### Findings

- **SUBOPTIMAL:** PR previews are only for `main`. If `dev` is the staging gate,
  PRs into `dev` should also get previews.
- **SUBOPTIMAL:** CI on `dev` is lighter than on `main`.

### Recommendations (Priority)

1. **Shift standard PR target to `dev`** and enforce dev → main promotion for
   releases.  
   **Effort:** Medium
2. **Enable preview deployments for PRs to `dev`**, or ensure staging deploy is
   triggered for those PRs.  
   **Effort:** Medium
3. **Align branch protection rules** so `dev` has the same “core CI checks” as
   `main`.  
   **Effort:** Quick fix

---

## Quick Wins Applied

- ✅ **`DIRECT_URL` preferred for migrations** (Drizzle config + migration
  client)
- ✅ **`BYPASS_AUTH` disabled in production** (middleware guard)

---

## Notes for Follow‑Up

- Re‑verify `staging` target with Vercel CLI (custom env support).
- If keeping custom deploy pipelines, document the “why” and ensure env handling
  is consistent.
- Confirm Supabase branching mapping to staging/prod environment variables in
  GitHub and Vercel.
