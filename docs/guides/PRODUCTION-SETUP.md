# Production Environment Setup — Cohortix

> **Audience:** Ahmad (account owner) + DevOps  
> **Updated:** 2026-02-18  
> **Branch:** `main` → deploys to `app.cohortix.ai` (manual approval required)

⚠️ **Production touches real user data. Every step here requires deliberate
action.**

---

## Architecture

```
GitHub main branch
      │
      ▼  (GitHub Actions: deploy-production.yml — requires manual approval)
  Vercel Production
      │
      ├── Supabase: cohortix-production
      └── Clerk: cohortix-production app (pk_live_ keys)
```

---

## Step 1 — Create Production Supabase Project **[AHMAD]**

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Settings:
   - **Name:** `cohortix-production`
   - **Organization:** your Cohortix org
   - **Region:** `us-east-1` (or closest to your users)
   - **Database password:** Generate a strong unique password — store in
     1Password immediately
   - **Plan:** Pro (required for production — enables PITR backups, read
     replicas)
4. After initialization, go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **Settings → Database → Connection String**:
   - Copy **Transaction mode** (port 6543) → `DATABASE_URL`
   - Copy **Direct connection** (port 5432) → `DIRECT_URL`
6. Enable **Point-in-Time Recovery (PITR)** under Settings → Database → Backups

---

## Step 2 — Create Production Clerk Application **[AHMAD]**

1. Go to [clerk.com/dashboard](https://dashboard.clerk.com)
2. Click **Add application**
3. Settings:
   - **Name:** `cohortix-production`
   - **Sign-in options:** Email + Google (match dev config)
4. Go to **Configure → Restrictions**: review sign-up restrictions for
   production
5. Go to **API Keys** and copy:
   - `Publishable key` (starts with `pk_live_`) →
     `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret key` (starts with `sk_live_`) → `CLERK_SECRET_KEY`
6. Go to **Webhooks → Add endpoint**:
   - URL: `https://app.cohortix.ai/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`, `session.created`
   - Copy the **Signing Secret** → `CLERK_WEBHOOK_SECRET`

> ✅ Production uses `pk_live_` keys. Never use `pk_test_` in production.

---

## Step 3 — Configure Production Domain in Vercel **[AHMAD]**

1. Go to [vercel.com](https://vercel.com) → **cohortix** project → **Settings →
   Domains**
2. Add `app.cohortix.ai` (and `www.cohortix.ai` → redirect to `cohortix.ai`)
3. Follow Vercel's DNS instructions to point your domain:
   - If on Vercel DNS: automatic
   - If on external DNS (Namecheap, Cloudflare, etc.):
     - Add `A` record: `@` → `76.76.21.21`
     - Add `CNAME` record: `www` → `cname.vercel-dns.com`
4. Wait for SSL certificate issuance (~5 minutes)

---

## Step 4 — Configure GitHub Environment with Approval Gate **[AHMAD]**

1. Go to GitHub repo → **Settings → Environments**
2. Click **New environment** → Name: `production`
3. Under **Protection rules**:
   - ✅ Enable **Required reviewers**
   - Add Ahmad as a required reviewer
   - ✅ Enable **Prevent self-review** (if available)
4. Under **Deployment branches**: select **Selected branches** → add `main`

This creates the approval gate: any deploy to production will pause and wait for
Ahmad's approval in the GitHub Actions UI.

---

## Step 5 — Add Production Secrets to GitHub **[AHMAD]**

Go to GitHub repo → **Settings → Secrets and variables → Actions**.

Add these as **Environment secrets** (select `production` environment):

| Secret Name                         | Value                                           |
| ----------------------------------- | ----------------------------------------------- |
| `DATABASE_URL`                      | Transaction pooler URL from production Supabase |
| `DIRECT_URL`                        | Direct URL from production Supabase             |
| `NEXT_PUBLIC_SUPABASE_URL`          | production Supabase project URL                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | production anon key                             |
| `SUPABASE_SERVICE_ROLE_KEY`         | production service role key                     |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | production Clerk `pk_live_` key                 |
| `CLERK_SECRET_KEY`                  | production Clerk `sk_live_` key                 |
| `CLERK_WEBHOOK_SECRET`              | production Clerk webhook signing secret         |
| `NEXT_PUBLIC_APP_URL`               | `https://app.cohortix.ai`                       |
| `VERCEL_TOKEN`                      | Vercel personal access token                    |
| `VERCEL_ORG_ID`                     | Vercel org ID                                   |
| `VERCEL_PROJECT_ID`                 | `prj_vKO7YaKzW39eGKtqCLrlaaIFoDO9`              |

---

## Step 6 — Run Initial Production Migrations

⚠️ Only after staging migrations have been validated:

```bash
# Trigger via GitHub Actions (recommended — audited)
# Go to: Actions → db-migrate → Run workflow → select "production"

# OR run manuagent (requires direct access):
export PRODUCTION_DIRECT_URL="postgresql://postgres.qobvewyakovekbuvwjkt:[password]@db.qobvewyakovekbuvwjkt.supabase.co:5432/postgres"
bash scripts/migrate-production.sh
```

The production migration script includes:

- Checklist confirmation (backup, staging test, rollback plan)
- Double confirmation prompt (`PRODUCTION` must be typed exactly)
- Masked URL output (no credentials in logs)

---

## Step 7 — First Production Deploy

1. Merge `dev` → `main` via a Pull Request
2. The `deploy-production.yml` workflow starts
3. **It will pause** at the approval gate
4. Ahmad reviews and clicks **Approve** in GitHub Actions
5. Deploy proceeds → smoke tests run against `app.cohortix.ai`

---

## Production Runbook Checklist (every release)

Before approving a production deploy:

- [ ] Staging deploy was successful
- [ ] All CI checks passed on the PR
- [ ] No pending breaking database migrations without review
- [ ] Supabase PITR backup taken (or verified recent auto-backup)
- [ ] Changelog/release notes prepared
- [ ] On-call person is available for the next 30 minutes

---

## Rollback Procedure

### Application rollback (< 2 minutes)

1. Go to Vercel → cohortix → Deployments
2. Find the last good deployment
3. Click **...** → **Redeploy**

### Database rollback

1. Supabase Dashboard → cohortix-production → Database → Backups
2. Select a PITR restore point before the migration
3. Contact Ahmad immediately if data loss is suspected

---

## Env File Reference

See `.env.production.example` for all required variables with descriptions.
