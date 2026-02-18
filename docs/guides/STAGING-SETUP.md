# Staging Environment Setup — Cohortix

> **Audience:** Ahmad (account owner) + DevOps  
> **Updated:** 2026-02-18  
> **Branch:** `dev` → auto-deploys to `staging.cohortix.ai`

Steps marked **[AHMAD]** require his personal accounts. Everything else is already configured.

---

## Architecture

```
GitHub dev branch
      │
      ▼  (GitHub Actions: deploy-staging.yml)
  Vercel Preview / Staging
      │
      ├── Supabase: cohortix-staging
      └── Clerk: cohortix-staging app
```

---

## Step 1 — Create Staging Supabase Project **[AHMAD]**

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Settings:
   - **Name:** `cohortix-staging`
   - **Organization:** your Cohortix org
   - **Region:** `us-east-1` (same as production for consistency)
   - **Database password:** Generate a strong password, save it in 1Password
4. Wait ~2 minutes for the project to initialize
5. Go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`
6. Go to **Settings → Database → Connection String**:
   - Copy **Transaction mode** (port 6543) → `DATABASE_URL`
   - Copy **Direct connection** (port 5432) → `DIRECT_URL`

---

## Step 2 — Create Staging Clerk Application **[AHMAD]**

1. Go to [clerk.com/dashboard](https://dashboard.clerk.com)
2. Click **Add application**
3. Settings:
   - **Name:** `cohortix-staging`
   - **Sign-in options:** same as dev (Email + Google)
4. After creation, go to **API Keys** and copy:
   - `Publishable key` (starts with `pk_test_`) → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret key` (starts with `sk_test_`) → `CLERK_SECRET_KEY`
5. Go to **Webhooks → Add endpoint**:
   - URL: `https://staging.cohortix.ai/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Copy the **Signing Secret** → `CLERK_WEBHOOK_SECRET`

> ℹ️ Staging uses `pk_test_` keys (not `pk_live_`). That's correct — live keys are production-only.

---

## Step 3 — Connect Vercel to GitHub (dev branch) **[AHMAD]**

The Vercel project already exists (`prj_vKO7YaKzW39eGKtqCLrlaaIFoDO9`). Configure the `dev` branch deployment:

1. Go to [vercel.com](https://vercel.com) → **cohortix** project → **Settings**
2. Under **Git** → **Production Branch**, confirm it's set to `main`
3. To add staging as a preview/alias for `dev`:
   - Go to **Settings → Domains**
   - Add `staging.cohortix.ai`
   - Set it to deploy from the `dev` branch
   - OR: use Vercel's **Git Branch Aliases** — add `dev` → `staging.cohortix.ai`
4. Confirm automatic deployments are **enabled** for the `dev` branch

> Note: The current `apps/web/vercel.json` has `"deploymentEnabled": false`. This is intentional — deployments are triggered via GitHub Actions (see Phase 4). Don't change this.

---

## Step 4 — Add Staging Secrets to GitHub **[AHMAD]**

Go to your GitHub repo → **Settings → Secrets and variables → Actions** → **New repository secret**:

| Secret Name | Value |
|------------|-------|
| `STAGING_DATABASE_URL` | Transaction pooler URL from staging Supabase |
| `STAGING_DIRECT_URL` | Direct URL from staging Supabase |
| `STAGING_NEXT_PUBLIC_SUPABASE_URL` | staging Supabase project URL |
| `STAGING_NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging anon key |
| `STAGING_SUPABASE_SERVICE_ROLE_KEY` | staging service role key |
| `STAGING_NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | staging Clerk `pk_test_` key |
| `STAGING_CLERK_SECRET_KEY` | staging Clerk `sk_test_` key |
| `STAGING_CLERK_WEBHOOK_SECRET` | staging Clerk webhook signing secret |
| `VERCEL_TOKEN` | Vercel personal access token (Settings → Tokens) |
| `VERCEL_ORG_ID` | From `.vercel/project.json` or Vercel Settings → General |
| `VERCEL_PROJECT_ID` | `prj_vKO7YaKzW39eGKtqCLrlaaIFoDO9` |

---

## Step 5 — Run Initial Staging Migrations

After credentials are in place, run the initial migration against staging:

```bash
# Set your staging direct URL
export STAGING_DIRECT_URL="postgresql://postgres.lrgjattslacqfhmqexoe:[password]@db.lrgjattslacqfhmqexoe.supabase.co:5432/postgres"
bash scripts/migrate-staging.sh
```

Or trigger it via GitHub Actions (see `db-migrate.yml`).

---

## Step 6 — Verify Staging is Working

1. Push any commit to `dev` branch
2. Watch the **deploy-staging** workflow run in GitHub Actions
3. Visit `https://staging.cohortix.ai`
4. Sign in with a test Clerk account
5. Verify the DB connection works (dashboard should load data)

---

## Env File Reference

See `.env.staging.example` for all required variables with descriptions.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Vercel build fails — missing env | Add missing secrets in GitHub → Secrets |
| Clerk auth error on staging | Ensure webhook URL is `staging.cohortix.ai/api/webhooks/clerk` |
| DB connection refused | Check `STAGING_DATABASE_URL` — use port 6543 for pooler |
| 500 error on staging | Check Vercel deployment logs for the specific error |
