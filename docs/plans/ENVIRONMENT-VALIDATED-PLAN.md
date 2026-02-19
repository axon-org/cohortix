# Cohortix Environment Strategy — Validated Plan

**Date:** 2026-02-19 (Updated with Ahmad's decisions)  
**Prepared by:** Alim (CEO) with AI Developer specialist review + fresh vendor
research  
**Status:** ✅ Decisions locked — ready for execution

---

## Executive Summary

The original audit correctly identified 4 problem areas: Clerk app sprawl,
Supabase project sprawl, Vercel env gaps, and git branch confusion. After
specialist review and fresh research, we've **reordered the phases**, added
missing operational details, and flagged one major risk: **Clerk consolidation
is harder than initially planned** because user data can't be merged between
Clerk apps.

### Phase Order (Changed from Original)

| Phase                      | What                                                   | Risk   | Est. Effort |
| -------------------------- | ------------------------------------------------------ | ------ | ----------- |
| **1. Git Strategy**        | Align branch strategy (main = prod, dev = staging)     | Low    | 1-2 hours   |
| **2. Vercel Environments** | Add Development env vars + custom staging env (if Pro) | Low    | 1-2 hours   |
| **3. Supabase**            | Evaluate branching; keep current setup as safe default | Medium | Half day    |
| **4. Clerk**               | Consolidate apps — largest blast radius, do last       | High   | 1-2 days    |

---

## Phase 1: Git Strategy Alignment (Do First)

**Why first:** Every other phase depends on knowing which branch maps to which
environment.

### Decision Needed from Ahmad

> **Option A (Recommended): Trunk-based / GitHub Flow**
>
> - `main` = production (default branch)
> - Feature branches → PRs into `main` → preview deployments
> - `dev` branch becomes the staging tracking branch (pushes to dev → staging
>   deploy)
> - Simplest model, aligns with Vercel/Next.js best practices
>
> **Option B: Keep current (dev-default)**
>
> - `dev` = default branch, `main` = protected release branch
> - Less conventional but works if team prefers it

### Steps (assuming Option A)

1. Set GitHub default branch to `main`
2. Protect `main` (require PR reviews, status checks)
3. Keep `dev` as long-lived staging branch (not default, but still used)
4. Update `origin/HEAD` → `main`
5. Verify all 3 workflows still trigger correctly
6. Document strategy in `/docs/BRANCHING.md`

### What breaks

- Nothing if `dev` is kept as staging branch — workflows already use explicit
  branch names
- Local scripts referencing `origin/HEAD` will resolve differently

---

## Phase 2: Vercel Environment Hygiene

### Pre-requisite: Verify Vercel Plan

⚠️ **Custom staging environment requires Pro plan.** Check in Vercel UI →
Settings → Billing.

### If Pro Plan ✅

1. **Create custom "staging" environment** in Vercel dashboard
   - Name: `staging`
   - Branch tracking: `dev`
   - Domain: `staging.cohortix.ai`
2. **Add Development-scoped env vars** for local dev
   (`vercel pull --environment=development`)
3. **Update `deploy-staging.yml`:**
   - Change `vercel pull --environment=preview` →
     `vercel pull --environment=staging`
   - Remove manual aliasing (`vercel alias`)
   - Use `vercel deploy --target=staging` if supported, or
     `--environment=staging`
4. **Update GitHub Environment** name to `staging` (for deployment protection
   rules)

### If Not Pro ❌

- Keep current Preview + alias approach
- Still add Development-scoped env vars
- Document the limitation

### Rollback

- Delete custom environment in Vercel UI → reverts to preview-based staging

---

## Phase 3: Supabase Rationalization

### Recommendation: Keep Current Setup, Evaluate Branching

**Why:** Supabase Branching 2.0 is the official recommendation now, but it's
still in beta with real limitations:

- Branches merge only to `main` (no branch-to-branch)
- Migration conflicts require manual resolution
- Some resources (custom roles, storage buckets) may not fully replicate

### Safe Approach

1. **Keep prod + staging as separate projects** (current state) — this works
   fine
2. **Optionally enable branching on the dev project** for PR preview
   environments
3. **Revisit full branching adoption** in 1-2 months when it exits beta
4. **Ensure all DB migrations are idempotent** (good practice regardless)

### If Going Full Branching Later

- Create persistent staging branch from prod project
- Update env vars in Vercel staging environment
- Retire staging + dev projects after one stable release cycle

### Decision Needed from Ahmad

> Keep 3 projects for now (safe) vs. start branching pilot on dev project?

---

## Phase 4: Clerk Consolidation (Largest Change)

### ⚠️ Critical Finding: Apps Can't Be Merged

Clerk treats each app as a hard boundary. You **cannot** transfer users,
sessions, or data between apps. This means consolidation requires a deliberate
migration strategy.

### Current State

- 3 Clerk apps: `Cohortix` (dev?), `cohortix-production`, `cohortix-staging`
- Each has its own users, keys, webhooks, OAuth config

### Decision Needed from Ahmad

> **How many real users exist in each app?**
>
> - If minimal/test users only → **Hard cutover** (simplest)
> - If real production users → **Soft migration** needed (more complex)

### Migration Path A: Hard Cutover (if few/no real users)

1. Create **one new Clerk app** with Dev + Prod instances
2. Configure Dev instance: OAuth providers, webhook endpoints, domains
3. Configure Prod instance: same, with production domains + HTTPS
4. Update all env vars:
   - Local/staging → `pk_test_*` / `sk_test_*` (Dev instance)
   - Production → `pk_live_*` / `sk_live_*` (Prod instance)
5. Update OAuth callback URLs at each provider (Google, GitHub, etc.)
6. Update webhook signing secrets in backend
7. Add `authorizedParties` to middleware:
   `['cohortix.ai', 'staging.cohortix.ai']`
8. Deploy → All existing sessions invalidated → Users re-auth
9. Verify: sign-in, sign-out, OAuth flows, webhooks
10. Decommission old apps after 2 weeks of stable operation

### Migration Path B: Soft Migration (if real users exist)

1. Same setup as Path A (new single app)
2. **Export user records** from old apps via Clerk Backend API
3. **Re-create users** in new app (note: passwords can't be imported as hashes)
4. **Map old Clerk user IDs → new IDs** in Supabase `users` table
5. Require password reset or magic link re-auth for all users
6. Run old + new apps in parallel during transition
7. Decommission old apps only after migration metrics confirm success

### Breakage Checklist (Both Paths)

- [ ] Webhook signing secrets rotated and verified
- [ ] OAuth callback URLs updated at all providers
- [ ] JWT/JWKS endpoints updated (if referenced anywhere)
- [ ] All active sessions will be invalidated
- [ ] `BYPASS_AUTH` confirmed `false` in staging + prod
- [ ] `.env.*.example` files updated to reflect single app
- [ ] DNS/domain certs configured in Clerk dashboard

---

## Smoke Test Checklist (Per Phase)

### After Phase 1 (Git)

- [ ] `git push origin dev` triggers staging deploy
- [ ] PR to `main` triggers preview deploy
- [ ] Merge to `main` triggers production deploy
- [ ] `origin/HEAD` points to `main`

### After Phase 2 (Vercel)

- [ ] `vercel pull --environment=development` works locally
- [ ] Staging deploys to `staging.cohortix.ai` correctly
- [ ] Environment variables scoped correctly per environment
- [ ] Preview URLs still work for PRs

### After Phase 3 (Supabase)

- [ ] All environments connect to correct Supabase project
- [ ] Migrations run cleanly in staging
- [ ] RLS policies work correctly
- [ ] Edge functions deploy to correct project

### After Phase 4 (Clerk)

- [ ] Sign-in/sign-out works in all environments
- [ ] OAuth flows work (Google, GitHub, etc.)
- [ ] Webhooks fire and verify correctly
- [ ] `authorizedParties` blocks unauthorized domains
- [ ] Session tokens valid and refreshing
- [ ] User records in Supabase correctly linked to new Clerk IDs

---

## What's NOT Changing (Confirmed OK)

- `.env.local` is gitignored ✅
- GitHub Actions structure (3 workflows) — updating, not replacing
- Supabase production project — staying as-is regardless of branching decision
- Core app code — no application code changes needed

---

## Ahmad's Decisions (2026-02-19)

1. **Vercel plan:** Need to confirm Pro in UI (can't verify via CLI). Custom
   staging env depends on this.
2. **Git strategy:** ✅ `main` is already the default branch (verified via
   `git remote show origin`). No change needed.
3. **Supabase:** Go with best practices (branching) — we want a solid
   foundation, not shortcuts.
4. **Clerk users:** ✅ No real users in any app. **Hard cutover approved.** Use
   the main `Cohortix` app, delete the other two (`cohortix-production`,
   `cohortix-staging`).
5. **Downtime tolerance:** ✅ Brief auth disruption is acceptable.

---

## References

- [Clerk Production Deployment](https://clerk.com/docs/guides/development/deployment/production)
- [Supabase Branching 2.0](https://supabase.com/blog/branching-2-0)
- [Supabase Branching Docs](https://supabase.com/docs/guides/deployment/branching)
- [Vercel Environments](https://vercel.com/docs/deployments/environments)
- [Vercel Staging Setup Guide](https://vercel.com/kb/guide/set-up-a-staging-environment-on-vercel)

---

_Original audit: `ENVIRONMENT-AUDIT-AND-FIX-PLAN.md` | Technical review:
`ENVIRONMENT-PLAN-REVIEW.md`_
