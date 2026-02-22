# Execution Log — Cohortix Environment Fix Plan

**Date:** 2026-02-19

## Task 1 — Vercel Custom Staging Environment

- Ran: `vercel env ls --scope team_aimWCwDM5ba64zugb8rgp2e4` (CLI 50.14.0). Env
  vars exist only for `Production`, `Preview`, and `Development`.
- Vercel CLI help (`vercel env add --help`) indicates only
  `production|preview|development` targets; no CLI support for creating custom
  environments.

**Dashboard steps required to create custom `staging` env:**

1. Vercel → Project **cohortix** → **Settings** → **Environments**.
2. **Add Environment**: name `staging`, **Git branch**: `dev`.
3. Add domain **staging.cohortix.ai** in **Settings → Domains**, then attach it
   to `staging` environment (per Vercel UI for custom env domains).
4. Copy Preview env vars into `staging` (same values), then adjust when
   staging-specific creds are available.

**Env vars to copy from Preview to Staging (same names):**

- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- `BYPASS_AUTH`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `DIRECT_URL`
- `CLERK_WEBHOOK_SECRET`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_APP_URL`

**Workflow update:**

- No change committed yet to `deploy-staging.yml` because the custom environment
  has not been created in Vercel. Once `staging` exists, update:
  - `vercel pull --environment=preview` → `vercel pull --environment=staging`
  - Remove manual `vercel alias` if staging env handles domain mapping.

## Task 2 — Supabase Branching Availability

- Supabase CLI installed: `supabase --version` → `2.75.0`.
- `supabase link --project-ref qobvewyakovekbuvwjkt` failed:
  - **Error:**
    `Access token not provided. Supply an access token by running supabase login or setting the SUPABASE_ACCESS_TOKEN environment variable.`
- Branch list/create not attempted due to missing auth.

**Next step:** run `supabase login` (or set `SUPABASE_ACCESS_TOKEN`) and retry:

```
supabase link --project-ref qobvewyakovekbuvwjkt
supabase branches list
supabase branches create staging --persistent
```

## Task 3 — Clerk Cutover Prep (Code-Only)

- Updated `apps/web/src/middleware.ts` to include `authorizedParties`:
  - `http://localhost:3000`
  - `https://staging.cohortix.ai`
  - `https://cohortix.ai`
- Updated `.env.production.example` and `.env.staging.example` to reflect
  **single Cohortix app** (Dev/Prod instances) and removed references to
  separate Clerk apps.
- Changes committed on branch: **`chore/clerk-cutover-prep`**
  - Commit: `f74dbca` — “Add Clerk authorized parties and update env examples”

## Notes

- No production env vars were modified.
- No Clerk apps were touched.
