# BOTTLENECK CHECKLIST — Ahmad's Action Items

> Generated: 2026-02-18  
> Every item here blocks the pipeline and requires **Ahmad personally** (account owner).  
> Everything else has been automated or documented for developers.

---

## 🔴 Blocking: Must Complete Before Staging Works

### 1. Create Supabase Staging Project ✅ DONE
- **Where:** https://supabase.com/dashboard → New Project
- **Name:** `cohortix-staging`
- **Org:** your Cohortix org
- **Plan:** Free (staging can stay Free tier)
- **Reference:** `docs/guides/STAGING-SETUP.md` → Step 1
- **Output:** Project URL, anon key, service role key, connection strings
- **Project ref:** `lrgjattslacqfhmqexoe`
- **URL:** `https://lrgjattslacqfhmqexoe.supabase.co`

### 2. Create Clerk Staging Application ✅ DONE
- **Where:** https://dashboard.clerk.com → Add application
- **Name:** `cohortix-staging`
- **Reference:** `docs/guides/STAGING-SETUP.md` → Step 2
- **Output:** `pk_test_...` key, `sk_test_...` key, webhook signing secret

### 3. Configure Vercel Staging Branch Alias ✅ DONE
- **Where:** https://vercel.com → cohortix project → Settings → Domains
- **Action:** Map `staging.cohortix.ai` → `dev` branch deployments
- **Reference:** `docs/guides/STAGING-SETUP.md` → Step 3

### 4. Add Staging GitHub Secrets ✅ DONE
- **Where:** GitHub repo → Settings → Secrets and variables → Actions
- **Secrets to add:** (13 secrets listed in `docs/guides/CI-CD.md` → Staging Deploy section)
- **Reference:** `docs/guides/STAGING-SETUP.md` → Step 4

### 5. Create GitHub `staging` Environment ✅ DONE
- **Where:** GitHub repo → Settings → Environments → New environment
- **Name:** `staging`
- **No approval gate needed** (staging auto-deploys)

---

## 🔴 Blocking: Must Complete Before Production Works

### 6. Create Supabase Production Project ✅ DONE
- **Where:** https://supabase.com/dashboard → New Project
- **Name:** `cohortix-production`
- **Plan:** Pro (required — enables PITR backups, no pausing, read replicas)
- **Billing:** Requires credit card on file (~$25/month base)
- **Reference:** `docs/guides/PRODUCTION-SETUP.md` → Step 1
- **Output:** Project URL, anon key, service role key, connection strings
- **Project ref:** `qobvewyakovekbuvwjkt`
- **URL:** `https://qobvewyakovekbuvwjkt.supabase.co`

### 7. Create Clerk Production Application ✅ DONE
- **Where:** https://dashboard.clerk.com → Add application
- **Name:** `cohortix-production`
- **Output:** `pk_live_...` key, `sk_live_...` key, webhook signing secret
- **Note:** Live keys (`pk_live_`) require Clerk Pro plan (~$25/month after free tier)
- **Reference:** `docs/guides/PRODUCTION-SETUP.md` → Step 2

### 8. Configure Production Domain (DNS)
- **Domain:** `cohortix.ai` → marketing site, `app.cohortix.ai` → production app
- **Where:** Your DNS registrar (Namecheap, Cloudflare, etc.) + Vercel
- **Action:** Add A record + CNAME per Vercel instructions
- **Reference:** `docs/guides/PRODUCTION-SETUP.md` → Step 3

### 9. Configure GitHub `production` Environment with Approval Gate ✅ DONE
- **Where:** GitHub repo → Settings → Environments → production
- **Action:** Enable "Required reviewers" → add yourself as reviewer
- **Reference:** `docs/guides/PRODUCTION-SETUP.md` → Step 4
- **Why:** Every production deploy will pause and wait for your manual approval

### 10. Add Production GitHub Secrets (in `production` environment)
- **Where:** GitHub repo → Settings → Environments → production → Secrets
- **Secrets to add:** DATABASE_URL, DIRECT_URL, NEXT_PUBLIC_SUPABASE_*, SUPABASE_SERVICE_ROLE_KEY, CLERK_* keys, NEXT_PUBLIC_APP_URL, VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
- **Reference:** `docs/guides/PRODUCTION-SETUP.md` → Step 5

### 11. Configure Branch Protection Rules ✅ DONE
- **Where:** GitHub repo → Settings → Branches
- **Rules for `main`:** Require PR, 1 approval, status checks must pass, restrict pushers
- **Rules for `dev`:** Require PR, status checks must pass
- **Reference:** `docs/guides/CI-CD.md` → Branch Protection Rules section

---

## 🟡 Nice-to-Have: Improves CI Speed

### 12. Set Up Turborepo Remote Cache
- **Where:** https://vercel.com → Remote Cache → Create team token
- **GitHub Secrets to add:** `TURBO_TOKEN`, `TURBO_TEAM`
- **Impact:** ~40-60% faster CI builds (cache sharing between runs)

### 13. Set Up Upstash Redis (Rate Limiting)
- **Where:** https://upstash.com → Create Database
- **Create:** 2 databases — `cohortix-staging` and `cohortix-production`
- **Secrets to add:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (per environment)

### 14. Set Up Inngest (Background Jobs)
- **Where:** https://www.inngest.com → New project
- **Create:** staging and production branches
- **Secrets to add:** `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` (per environment)

### 15. Set Up Sentry (Error Monitoring)
- **Where:** https://sentry.io → New project → Next.js
- **Create:** staging and production projects
- **Secrets to add:** `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (per environment)

### 16. Set Up Vercel Automation Bypass Secret
- **Where:** Vercel → cohortix project → Settings → Security → Vercel Protection Bypass
- **Action:** Generate secret
- **GitHub Secret to add:** `VERCEL_AUTOMATION_BYPASS_SECRET`
- **Why:** Allows GitHub Actions smoke tests to bypass Vercel password protection

### 17. Set Up Snyk (Dependency Scanning)
- **Where:** https://snyk.io → connect GitHub repo
- **GitHub Secret to add:** `SNYK_TOKEN`
- **Note:** Currently non-blocking in CI — good to have for security visibility

### 18. Set Up Slack Webhook (Deploy Notifications)
- **Where:** Slack → App settings → Incoming Webhooks
- **GitHub Secret to add:** `SLACK_WEBHOOK_URL`
- **Note:** Used by `release.yml` for team notifications on production deploy

### 19. Set Up Codecov (Coverage Reporting)
- **Where:** https://codecov.io → connect repo
- **GitHub Secret to add:** `CODECOV_TOKEN`

---

## ✅ Already Done (No Action Needed)

- [x] Vercel project created and linked (`prj_vKO7YaKzW39eGKtqCLrlaaIFoDO9`) — org: `anqs-projects`, project: `cohortix`
- [x] Local Supabase project exists (`rfwscvklcokzuofyzqwx`)
- [x] Local Clerk app exists (dev instance)
- [x] `feature/deployment-pipeline` branch created with all pipeline files
- [x] GitHub Actions CI workflow (`ci.yml`) — updated for `dev` branch
- [x] Preview deploy workflow (`preview.yml`) — PRs to main
- [x] Production release workflow (`release.yml`) — push to main
- [x] `deploy-staging.yml` — auto-deploy on push to `dev`
- [x] `deploy-production.yml` — manual approval gate for `main`
- [x] `db-migrate.yml` — migration runner (staging + production)
- [x] All env example files created
- [x] All setup guides written
- [x] Migration scripts with safety checks
- [x] Supabase staging project created (`lrgjattslacqfhmqexoe`)
- [x] Supabase production project created (`qobvewyakovekbuvwjkt`)
- [x] Clerk staging application created
- [x] Clerk production application created
- [x] GitHub `staging` environment created
- [x] GitHub `production` environment created (with approval gate)
- [x] Branch protection rules configured (`main` + `dev`)
- [x] GitHub secrets configured

---

## Domain Structure

| Subdomain | Purpose |
|-----------|---------|
| `cohortix.ai` | Marketing site |
| `app.cohortix.ai` | Production app |
| `staging.cohortix.ai` | Staging environment |
| `www.cohortix.ai` | Redirect to root |
| `api.cohortix.ai` | API (future) |
| `docs.cohortix.ai` | Documentation (future) |

---

## Priority Order for Ahmad

```
Day 1 (before staging works):
  ✅ Items 1, 2, 3, 4, 5

Day 2 (before production works):
  ✅ Items 6, 7, 9, 11
  ⏳ Items 8, 10 (DNS + prod secrets still needed)

Anytime (improves reliability):
  ✅ Items 12-19
```

---

*All detailed steps are in `docs/guides/STAGING-SETUP.md`, `docs/guides/PRODUCTION-SETUP.md`, and `docs/guides/CI-CD.md`.*
