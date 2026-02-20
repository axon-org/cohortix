# Cohortix Environment Audit & Fix Plan (Clerk • Vercel • Supabase • GitHub)

**Date:** 2026-02-19 **Project:** `/Users/alimai/Projects/cohortix` **Domains:**
`cohortix.ai` (prod), `staging.cohortix.ai` (staging)

---

## 1) Current State (Observed)

### Clerk

- **3 separate Clerk apps** exist (per Ahmad): `Cohortix`,
  `cohortix-production`, `cohortix-staging`.
- `.env.production.example` and `.env.staging.example` reference separate Clerk
  apps for prod/staging.
- Middleware uses `clerkMiddleware` and honors `BYPASS_AUTH` flag.

### Vercel

- `.vercel/project.json` links to project `cohortix` in org
  `team_aimWCwDM5ba64zugb8rgp2e4`.
- `vercel env ls` shows **only Preview + Production** env scopes; **no
  Development** scope in Vercel UI.
- Preview + Production env vars are populated for Clerk/Supabase/App URLs; no
  Development-scoped vars.
- GitHub Actions deploys:
  - **Production** from `main` branch (`deploy-production.yml`) using Vercel
    production env.
  - **Staging** from `dev` branch (`deploy-staging.yml`) using Vercel preview
    env + alias to `staging.cohortix.ai`.
  - **Preview** on PRs into `main` (`preview.yml`) using Vercel preview env.

### Supabase

- Projects referenced:
  - **Dev:** `rfwscvklcokzuofyzqwx`
  - **Staging:** `lrgjattslacqfhmqexoe`
  - **Prod:** `qobvewyakovekbuvwjkt`
- `.env.local` is populated with **real dev project keys** (local only; should
  remain uncommitted).

### GitHub

- Local branches: `main` (checked out), `dev`, plus feature/fix branches.
- `origin/HEAD` points to `origin/dev` indicating **dev is default branch on
  origin**.
- Workflows assume:
  - **dev → staging**
  - **main → production**
  - **PRs into main → preview**

---

## 2) Issues Found (Why It’s Wrong)

### Clerk

- **Anti-pattern:** 3 separate Clerk apps instead of **one app with Dev + Prod
  instances**.
- This creates inconsistent environments, duplicated configuration, and harder
  key/domain management.

### Vercel

- **Missing Development-scoped env vars**: Local dev should pull Vercel
  **Development** env variables via `vercel pull --environment=development`.
- **Staging uses Preview env** with manual aliasing. This can be OK, but often
  better to use a **custom "staging" environment** (Pro supports 1 custom env)
  with domain + branch tracking.

### Supabase

- Using **three separate projects** increases overhead (migrations, policy sync,
  secrets).
- Supabase **branching** offers a more cohesive staging/preview model and can
  reduce project sprawl.

### GitHub

- Default branch appears to be **dev**, but production deployments and PR
  previews are based on **main**.
- If dev is truly the primary branch, workflow + branch strategy should be
  documented and aligned (or switch default to main and use dev as long-lived
  staging).

---

## 3) Best Practice (Per Vendor)

### Clerk (Docs)

- **One Clerk app** with **Development + Production instances**.
- Use **pk*test*/sk*test*** for dev/staging, **pk*live*/sk*live*** for
  production.
- Set domains in Clerk dashboard and deploy certificates.
- Configure `authorizedParties` (allowlist domains) to protect against subdomain
  cookie leakage.

### Vercel (Docs)

- Use **3 standard environments**: Local, Preview, Production.
- For a persistent staging environment, **create a Custom Environment** (Pro
  allows 1), attach `staging.cohortix.ai`, and set **branch tracking to dev**.
- Use `vercel pull --environment=development` for local `.env.local`.

### Supabase (Docs)

- **Branching** can replace separate staging/project sprawl.
  - **Persistent branch** for staging
  - **Preview branches** for PRs (auto-created and cleaned)
- Branches are isolated environments with their own API keys and DB URLs.

### GitHub

- Keep a **clear, enforced strategy**:
  - Option A: `main` = production, `dev` = staging
  - Option B: `dev` = default branch, `main` = protected release branch
- Align Vercel + Clerk + Supabase + workflows to the chosen strategy.

---

## 4) Fix Plan (Step-by-Step)

### Phase A — Clerk Consolidation (Critical)

1. **Create production instance** inside the primary Clerk app (if not already
   done).
2. **Migrate configuration** from the existing production app to the production
   instance:
   - OAuth providers
   - Webhooks (update signing secrets)
   - Sessions/domains
3. **Update env vars**:
   - Dev/staging → `pk_test_` + `sk_test_` from the **Development instance**
   - Production → `pk_live_` + `sk_live_` from the **Production instance**
4. **Set Domains + Certificates** in Clerk for:
   - `cohortix.ai` / `app.cohortix.ai`
   - `staging.cohortix.ai` (if using shared dev instance)
5. **Update middleware** to include `authorizedParties` allowlist.
6. **Decommission redundant Clerk apps** (only after validation).

### Phase B — Vercel Environment Hygiene

1. **Add Development env vars** in Vercel for local usage.
2. **(Recommended)** Create **custom "staging" environment** with:
   - Domain `staging.cohortix.ai`
   - Branch tracking: `dev`
   - Import Preview vars → override as needed
3. Update `deploy-staging.yml` to use `--environment=staging` and remove manual
   aliasing (if custom env is used).

### Phase C — Supabase Rationalization

1. Decide between:
   - **Keep 3 projects**, or
   - **Use Supabase Branching** with:
     - Main = production
     - Persistent branch = staging
     - Preview branches = PRs
2. If switching to branching:
   - Create a **persistent staging branch** from prod
   - Update staging env vars (Vercel + GitHub secrets)
   - Update preview workflow to use branch-specific DB URLs
   - Retire redundant staging/dev projects after migration

### Phase D — GitHub Branch Strategy Alignment

1. Confirm desired branch strategy with Ahmad:
   - If `dev` is default → update workflows to ensure `main` is protected
     release branch.
   - If `main` is default → set `origin/HEAD` to main and keep dev as staging.
2. Update GitHub **Environments** (staging/production) to match workflow envs.
3. Document the final strategy in `/docs/`.

---

## 5) Environment Matrix (Target State)

| Environment | Git Branch | Vercel Env                                        | Domain                        | Clerk                    | Supabase                                 | GitHub Env |
| ----------- | ---------- | ------------------------------------------------- | ----------------------------- | ------------------------ | ---------------------------------------- | ---------- |
| Local Dev   | feature/\* | Development                                       | localhost                     | Dev Instance (pk*test*)  | Dev project or local                     | —          |
| Staging     | dev        | **Custom: staging** (or Preview if no custom env) | staging.cohortix.ai           | Dev Instance (pk*test*)  | **Persistent branch** or staging project | staging    |
| Production  | main       | Production                                        | cohortix.ai / app.cohortix.ai | Prod Instance (pk*live*) | Main/prod project                        | production |

---

## Notes / Validation Checklist

- [ ] Confirm Vercel domain `staging.cohortix.ai` is attached (alias currently
      attempted in CI).
- [ ] Verify `BYPASS_AUTH` is **false** in all non-local envs.
- [ ] Ensure `.env.local` is gitignored and never committed.
- [ ] Confirm `authorizedParties` allowlist includes prod + staging domains.
- [ ] Validate Clerk production instance certificates are deployed.

---

## References (Docs)

- Clerk Production Deployment:
  https://clerk.com/docs/guides/development/deployment/production
- Clerk Changing Domains:
  https://clerk.com/docs/guides/development/deployment/changing-domains
- Supabase Branching: https://supabase.com/docs/guides/deployment/branching
- Vercel Environments: https://vercel.com/docs/deployments/environments
