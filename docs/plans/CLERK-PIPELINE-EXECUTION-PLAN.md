# Cohortix: Clerk + Pipeline Execution Plan

**Created:** 2026-02-14
**Status:** Ready for execution
**Owner:** Alim (CEO) → Specialists

---

## Current State Assessment

- **Auth:** Supabase Auth is fully implemented (middleware, sign-in/up pages, callback route)
- **Clerk:** Not installed. `.env.example` has placeholders but zero code exists
- **CI/CD:** 4 GitHub Actions workflows exist (ci.yml, lighthouse.yml, preview.yml, release.yml)
- **Monorepo:** Turborepo with single `apps/web` app
- **DB:** Supabase with Drizzle ORM
- **Middleware:** `apps/web/src/middleware.ts` → Supabase session management

⚠️ **This is a MIGRATION from Supabase Auth → Clerk, not a fresh install.**

---

## Phase A: Clerk Integration (Devi — AI Developer)

### A1. Install & Configure Clerk SDK
- [ ] `pnpm add @clerk/nextjs` in `apps/web/`
- [ ] Create Clerk dev instance at clerk.com
- [ ] Add Clerk env vars to `.env.local`:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`
  - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard`
  - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding`

### A2. Replace Middleware
- [ ] Replace `apps/web/src/middleware.ts` with Clerk's `clerkMiddleware()`
- [ ] Delete `apps/web/src/lib/supabase/middleware.ts`
- [ ] Configure public routes (/, /sign-in, /sign-up, /api/ready)
- [ ] Keep BYPASS_AUTH support for testing

### A3. Replace Auth Pages
- [ ] Replace `apps/web/src/app/sign-in/page.tsx` with Clerk `<SignIn />` component
- [ ] Replace `apps/web/src/app/sign-up/page.tsx` with Clerk `<SignUp />` component
- [ ] Remove `apps/web/src/app/forgot-password/page.tsx` (Clerk handles this)
- [ ] Remove `apps/web/src/app/auth/callback/route.ts` (Clerk handles OAuth callbacks)

### A4. Update Layout & Providers
- [ ] Wrap root layout with `<ClerkProvider>`
- [ ] Add `<UserButton />` to navigation/header
- [ ] Replace any `supabase.auth.getUser()` calls with `auth()` from `@clerk/nextjs/server`
- [ ] Replace any `supabase.auth.getSession()` calls

### A5. Clerk ↔ Supabase User Sync
- [ ] Create webhook endpoint: `apps/web/src/app/api/webhooks/clerk/route.ts`
- [ ] Handle events: `user.created`, `user.updated`, `user.deleted`
- [ ] Sync Clerk user ID → Supabase `profiles` or `users` table
- [ ] Update Supabase RLS policies to use Clerk user ID (via JWT custom claims)
- [ ] Configure Clerk JWT template to include Supabase-compatible claims

### A6. Update API Routes
- [ ] Audit all `apps/web/src/app/api/` routes that call `supabase.auth.getUser()`
- [ ] Replace with Clerk's `auth()` for user identification
- [ ] Keep Supabase service role client for DB operations (auth-independent)

### A7. Update Tests
- [ ] Update `apps/web/src/app/auth/__tests__/callback.test.ts`
- [ ] Add Clerk mock utilities for testing
- [ ] Verify all existing tests pass with Clerk

### A8. Organization Support (Clerk's Key Feature)
- [ ] Enable Clerk Organizations
- [ ] Create org-based middleware for workspace routing
- [ ] Map Clerk org → Supabase team/workspace
- [ ] Set up org invitation flow

**Estimated effort:** 8-12 hours of specialist work

---

## Phase B: Pipeline Setup (Noah — DevOps)

> Can start in parallel with Phase A after A1 is done (needs Clerk env vars defined)

### B1. Supabase Branching
- [ ] Enable branching on Cohortix Supabase project (Dashboard → Settings)
- [ ] Connect GitHub repo to Supabase (GitHub integration)
- [ ] Verify: PR creation → Supabase branch auto-created
- [ ] Document branch naming convention

### B2. Vercel Environment Variable Scoping
- [ ] Audit current Vercel env vars
- [ ] Scope existing vars: Production / Preview / Development
- [ ] Add Clerk vars with proper scoping:
  - Production: `pk_live_*`, `sk_live_*`
  - Preview/Dev: `pk_test_*`, `sk_test_*`
- [ ] Add Supabase branch vars for preview:
  - `SUPABASE_DB_URL` → use `$SUPABASE_BRANCH_DB_URL` in preview
- [ ] Verify: `NEXT_PUBLIC_*` vars are correctly exposed

### B3. GitHub Actions Enhancement
- [ ] Review existing `ci.yml` — add Clerk env vars for CI tests
- [ ] Review existing `preview.yml` — ensure Supabase branch URL injection
- [ ] Add DB migration step to `release.yml` (production deploys)
- [ ] Add branch protection on `main`:
  - Require CI pass
  - Require 1 approval (when team grows)
  - No force push

### B4. Preview Environment Validation
- [ ] Create PR → verify Vercel preview URL works
- [ ] Verify Supabase branch DB is accessible from preview
- [ ] Verify Clerk dev instance works with preview URL
- [ ] Document the preview testing workflow

### B5. Production Deployment Flow
- [ ] Document: merge to `main` → Vercel auto-deploys → production
- [ ] Add production migration safety check in `release.yml`
- [ ] Set up Vercel deployment protection (optional)

**Estimated effort:** 4-6 hours of specialist work

---

## Phase C: Verification (Nina — QA)

> Starts after Phase A & B are complete

### C1. Auth Flow Testing
- [ ] Sign up → verify Clerk + Supabase user created
- [ ] Sign in → verify session + dashboard access
- [ ] Sign out → verify clean session teardown
- [ ] Organization creation → verify Supabase team record
- [ ] Org invite → verify member access

### C2. Pipeline Testing
- [ ] Create feature branch + PR → preview deploys correctly
- [ ] Preview has Clerk auth working
- [ ] Preview has Supabase branch DB (isolated data)
- [ ] Merge PR → production deploys, Supabase branch cleaned up
- [ ] Rollback test: revert deploy if needed

### C3. Environment Isolation Verification
- [ ] Dev data doesn't leak to production
- [ ] Clerk dev instance ≠ production instance
- [ ] Supabase branch DB ≠ production DB
- [ ] Env vars correctly scoped per environment

**Estimated effort:** 2-3 hours of specialist work

---

## Dependencies

```
A1 (Clerk install) ──┬──→ A2-A8 (Clerk migration) ──→ C1 (Auth testing)
                      │
                      └──→ B1-B5 (Pipeline setup) ──→ C2-C3 (Pipeline testing)
```

Phase A and B can run **in parallel** after A1 completes (Noah needs to know the Clerk env var names).

---

## Cost Impact

| Item | Monthly Cost |
|------|-------------|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Clerk Pro | $25 |
| **Total** | **$70/mo** |

Sentry deferred until closer to production launch.

---

## Success Criteria

1. ✅ Clerk auth works locally, in preview, and (when ready) in production
2. ✅ Creating a PR auto-creates Supabase branch + Vercel preview
3. ✅ Merging to `main` auto-deploys to production
4. ✅ Environment variables are properly isolated per environment
5. ✅ Clerk organizations enable team/workspace features
6. ✅ All existing tests pass with Clerk
