# Staging Environment Setup — Cohortix

> **Audience:** Ahmad (account owner) + DevOps  
> **Updated:** 2026-02-18  
> **Branch:** `dev` → auto-deploys to `staging.cohortix.ai`

Steps marked **[AHMAD]** require his personal accounts. Everything else is
already configured.

---

## Architecture

```
GitHub dev branch
      │
      ▼  (Vercel Git Integration — auto-deploy)
  Vercel Staging (staging.cohortix.ai)
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
   - `Publishable key` (starts with `pk_test_`) →
     `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret key` (starts with `sk_test_`) → `CLERK_SECRET_KEY`
5. Go to **Webhooks → Add endpoint**:
   - URL: `https://staging.cohortix.ai/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
   - Copy the **Signing Secret** → `CLERK_WEBHOOK_SECRET`

> ℹ️ Staging uses `pk_test_` keys (not `pk_live_`). That's correct — live keys
> are production-only.

---

## Step 3 — Connect Vercel to GitHub (dev branch) **[AHMAD]**

The Vercel project already exists (`prj_vKO7YaKzW39eGKtqCLrlaaIFoDO9`).
Configure the `dev` branch deployment:

1. Go to [vercel.com](https://vercel.com) → **cohortix** project → **Settings**
2. Under **Git** → **Production Branch**, confirm it's set to `main`
3. To add staging as a preview/alias for `dev`:
   - Go to **Settings → Domains**
   - Add `staging.cohortix.ai`
   - Set it to deploy from the `dev` branch
   - OR: use Vercel's **Git Branch Aliases** — add `dev` → `staging.cohortix.ai`
4. Confirm automatic deployments are **enabled** for the `dev` branch

> Note: The current `apps/web/vercel.json` has `"deploymentEnabled": true`. This
> is required so Vercel Git Integration can handle deployments.

---

## Step 4 — Add Staging Environment Variables in Vercel **[AHMAD]**

Go to Vercel → **cohortix** project → **Settings → Environment Variables** and
add the staging values (scope: **Preview** or **Development**, mapped to `dev`
branch):

| Variable Name                       | Value                                        |
| ----------------------------------- | -------------------------------------------- |
| `DATABASE_URL`                      | Transaction pooler URL from staging Supabase |
| `DIRECT_URL`                        | Direct URL from staging Supabase             |
| `NEXT_PUBLIC_SUPABASE_URL`          | Staging Supabase project URL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | Staging anon key                             |
| `SUPABASE_SERVICE_ROLE_KEY`         | Staging service role key                     |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Staging Clerk `pk_test_` key                 |
| `CLERK_SECRET_KEY`                  | Staging Clerk `sk_test_` key                 |
| `CLERK_WEBHOOK_SECRET`              | Staging Clerk webhook signing secret         |

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
2. Confirm Vercel auto-deploys the `dev` branch
3. Visit `https://staging.cohortix.ai`
4. Sign in with a test Clerk account
5. Verify the DB connection works (dashboard should load data)

---

## Env File Reference

See `.env.staging.example` for all required variables with descriptions.

---

## Troubleshooting

| Issue                            | Fix                                                            |
| -------------------------------- | -------------------------------------------------------------- |
| Vercel build fails — missing env | Add missing env vars in Vercel → Environment Variables         |
| Clerk auth error on staging      | Ensure webhook URL is `staging.cohortix.ai/api/webhooks/clerk` |
| DB connection refused            | Check `DATABASE_URL` — use port 6543 for pooler                |
| 500 error on staging             | Check Vercel deployment logs for the specific error            |
