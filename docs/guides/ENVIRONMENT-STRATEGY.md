# Cohortix Environment Strategy Guide

**Last Updated:** February 14, 2026  
**Owner:** Ahmad (CEO)  
**Created by:** Devi (AI Developer)

---

## 🎯 Overview

This guide provides a comprehensive, production-ready environment strategy for Cohortix covering the complete pipeline: **localhost → preview → staging → production**. It addresses Vercel deployment, Supabase database management, Clerk authentication, and secure secrets handling.

---

## 📐 Architecture

### Environment Topology

```mermaid
graph TB
    subgraph "Development"
        LOCAL[👨‍💻 Localhost<br/>next dev / vercel dev]
        LOCAL_DB[(🗄️ Local Supabase<br/>Docker)]
    end
    
    subgraph "Git Workflow"
        FEAT[🌿 feature/* branches]
        DEV[🌿 dev branch]
        STAGING[🌿 staging branch]
        MAIN[🌿 main branch]
    end
    
    subgraph "Vercel Environments"
        PREVIEW[🔍 Preview Deployments<br/>PR-specific URLs]
        STAGING_DEPLOY[🧪 Staging<br/>staging.cohortix.app]
        PROD[🚀 Production<br/>cohortix.app]
    end
    
    subgraph "Supabase Environments"
        PREVIEW_DB[(📦 Preview Branches<br/>Auto-created per PR)]
        STAGING_DB[(🧪 Staging Project<br/>Persistent test DB)]
        PROD_DB[(🔒 Production Project<br/>Live customer data)]
    end
    
    subgraph "Clerk Environments"
        DEV_CLERK[🔐 Development Instance<br/>dev/preview keys]
        PROD_CLERK[🔐 Production Instance<br/>production keys]
    end
    
    LOCAL --> FEAT
    FEAT --> DEV
    DEV -.PR merge.-> STAGING
    STAGING -.manual promotion.-> MAIN
    
    FEAT -.auto deploy.-> PREVIEW
    STAGING -.auto deploy.-> STAGING_DEPLOY
    MAIN -.auto deploy.-> PROD
    
    PREVIEW --> PREVIEW_DB
    PREVIEW --> DEV_CLERK
    STAGING_DEPLOY --> STAGING_DB
    STAGING_DEPLOY --> DEV_CLERK
    PROD --> PROD_DB
    PROD --> PROD_CLERK
    
    LOCAL_DB -.migrations sync.-> PREVIEW_DB
    PREVIEW_DB -.merge to staging.-> STAGING_DB
    STAGING_DB -.manual promotion.-> PROD_DB

    style LOCAL fill:#e1f5fe
    style PREVIEW fill:#fff9c4
    style STAGING_DEPLOY fill:#fff59d
    style PROD fill:#c8e6c9
    style PROD_DB fill:#81c784
    style PROD_CLERK fill:#81c784
```

### Environment Mapping

| Environment | Git Branch | Vercel Deploy | Supabase DB | Clerk Instance | Purpose |
|-------------|------------|---------------|-------------|----------------|---------|
| **Local** | `feature/*` | `vercel dev` | Local Docker | Development | Individual development |
| **Preview** | `feature/*` (PR) | Auto-deploy | Supabase Branch | Development | PR review & testing |
| **Staging** | `staging` | Auto-deploy | Staging Project | Development | Integration testing |
| **Production** | `main` | Auto-deploy | Production Project | Production | Live customer traffic |

---

## 🏗️ Setup Guide

### Phase 1: Vercel Project Configuration

#### 1.1 Single Project with Environment-Based Deployment

**Recommendation:** Use a **single Vercel project** with branch-based deployments.

**Why?**
- ✅ Unified analytics and logs
- ✅ Simpler environment variable management
- ✅ Preview deployments automatically created for PRs
- ✅ Cost-effective (no duplicate projects)

#### 1.2 Configure Production Branch

```bash
# In Vercel Dashboard:
# Project Settings → Git → Production Branch
# Set to: main
```

#### 1.3 Set Up Preview Deployments

```bash
# Vercel Dashboard:
# Project Settings → Git → Ignored Build Step
# Enable: "Automatically create deployments for all branches and commits"
# Branch Protection Pattern: staging, main (require PR reviews)
```

#### 1.4 Configure Branch-Specific Environment Variables

Vercel supports three environment scopes:
- **Production**: Only `main` branch deploys
- **Preview**: All non-production branches (PRs)
- **Development**: Local `vercel dev`

**Critical Setup:**
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
cd /Users/alimai/Projects/cohortix
vercel link

# Pull development environment variables locally
vercel env pull .env.local
```

---

### Phase 2: Supabase Multi-Environment Strategy

#### 2.1 Recommended Approach: Hybrid (Branching + Persistent Staging)

**Decision Matrix:**

| Scenario | Solution | Rationale |
|----------|----------|-----------|
| PR/feature testing | **Supabase Branching** | Auto-created, isolated, no manual setup |
| Long-running staging | **Separate Staging Project** | Persistent state for integration tests |
| Production | **Dedicated Project** | Maximum isolation, backup, monitoring |

#### 2.2 Enable Supabase Branching

```bash
# 1. Enable branching on your PRODUCTION Supabase project
# Dashboard → Settings → Branching → Enable

# 2. Install Supabase CLI
brew install supabase/tap/supabase

# 3. Link to production project
cd /Users/alimai/Projects/cohortix
supabase link --project-ref <your-prod-ref>

# 4. Configure GitHub integration (REQUIRED for auto-branch creation)
# Supabase Dashboard → Settings → Branching → Connect to GitHub
# Select repo: your-org/cohortix
# Branch pattern: feature/*, bugfix/*
```

**What happens now:**
- Every PR automatically creates a Supabase preview branch
- Branch includes schema/functions but **no production data**
- Merging PR runs migrations on production
- Preview branches auto-delete after PR merge/close

#### 2.3 Create Separate Staging Project

```bash
# 1. Create new Supabase project in dashboard
# Name: cohortix-staging
# Region: Same as production (for consistency)

# 2. Copy production database schema to staging
supabase db dump --db-url "postgresql://..." > schema.sql
# Import to staging project via Supabase Dashboard → SQL Editor

# 3. Link staging project locally
supabase link --project-ref <staging-ref>

# 4. Seed with test data
pnpm db:seed
```

#### 2.4 Configure Database URLs

**Production Supabase Project:**
- URL: `https://<prod-ref>.supabase.co`
- DB: `postgresql://postgres:[password]@db.<prod-ref>.supabase.co:5432/postgres`

**Staging Supabase Project:**
- URL: `https://<staging-ref>.supabase.co`
- DB: `postgresql://postgres:[password]@db.<staging-ref>.supabase.co:5432/postgres`

**Preview Branches (auto-created):**
- URL: `https://<branch-name>-<prod-ref>.supabase.co`
- DB: Auto-generated connection string

---

### Phase 3: Clerk Multi-Instance Setup

#### 3.1 Install Vercel Marketplace Integration (Recommended)

```bash
# Option A: Vercel Marketplace (automatic)
# 1. Visit: https://vercel.com/integrations/clerk
# 2. Click "Add Integration"
# 3. Select your Cohortix project
# 4. Vercel auto-provisions:
#    - Development Clerk instance (for preview/dev)
#    - Production Clerk instance (for main)
# 5. Environment variables auto-synced to Vercel
```

**Automatic Mapping:**
- Vercel **Development** + **Preview** → Clerk Development Instance
- Vercel **Production** → Clerk Production Instance

#### 3.2 Manual Setup (if not using Marketplace)

```bash
# 1. Create TWO separate Clerk applications:
#    - cohortix-dev
#    - cohortix-prod

# 2. Get API keys from each:
# Development:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Production:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx

# 3. Add to Vercel:
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
# (paste production publishable key)

vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY preview
# (paste development publishable key)

vercel env add CLERK_SECRET_KEY production
# (paste production secret key, ENCRYPTED)

vercel env add CLERK_SECRET_KEY preview
# (paste development secret key, ENCRYPTED)
```

#### 3.3 Configure Clerk Application Settings

**Development Instance:**
```
Allowed Origins:
- http://localhost:3000
- https://*.vercel.app (Vercel preview URLs)
- https://staging.cohortix.app

Redirect URLs:
- http://localhost:3000/sign-in
- https://*.vercel.app/sign-in
- https://staging.cohortix.app/sign-in
```

**Production Instance:**
```
Allowed Origins:
- https://cohortix.app
- https://www.cohortix.app

Redirect URLs:
- https://cohortix.app/sign-in
- https://www.cohortix.app/sign-in
```

---

### Phase 4: Environment Variables Matrix

#### 4.1 Full Variable List

| Variable | Development | Preview | Staging | Production | Security Level |
|----------|-------------|---------|---------|------------|----------------|
| `DATABASE_URL` | Local Docker | Supabase Branch | Staging Project | Prod Project | 🔒 Secret |
| `DIRECT_URL` | Local Docker | Supabase Branch | Staging Project | Prod Project | 🔒 Secret |
| `NEXT_PUBLIC_SUPABASE_URL` | `http://localhost:54321` | Branch URL | Staging URL | Prod URL | 🌐 Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Local key | Branch key | Staging key | Prod key | 🌐 Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Local key | Branch key | Staging key | Prod key | 🔒 Secret |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Dev instance | Dev instance | Dev instance | Prod instance | 🌐 Public |
| `CLERK_SECRET_KEY` | Dev instance | Dev instance | Dev instance | Prod instance | 🔒 Secret |
| `UPSTASH_REDIS_REST_URL` | Local Redis (optional) | Staging Redis | Staging Redis | Prod Redis | 🔒 Secret |
| `UPSTASH_REDIS_REST_TOKEN` | Local token | Staging token | Staging token | Prod token | 🔒 Secret |
| `INNGEST_EVENT_KEY` | Test key | Test key | Test key | Prod key | 🔒 Secret |
| `INNGEST_SIGNING_KEY` | Test key | Test key | Test key | Prod key | 🔒 Secret |
| `SENTRY_DSN` | (omit) | Staging DSN | Staging DSN | Prod DSN | 🌐 Public |
| `NEXT_PUBLIC_SENTRY_DSN` | (omit) | Staging DSN | Staging DSN | Prod DSN | 🌐 Public |
| `OPENAI_API_KEY` | Personal key | Staging key | Staging key | Prod key | 🔒 Secret |
| `ANTHROPIC_API_KEY` | Personal key | Staging key | Staging key | Prod key | 🔒 Secret |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Preview URL | `https://staging.cohortix.app` | `https://cohortix.app` | 🌐 Public |
| `NODE_ENV` | `development` | `development` | `production` | `production` | 🌐 Public |
| `VERCEL_ENV` | `development` | `preview` | `preview` | `production` | 🌐 Public (auto) |
| `VERCEL_URL` | (not set) | Preview URL | Staging URL | Prod URL | 🌐 Public (auto) |

#### 4.2 Vercel Configuration

```bash
# Production environment (main branch only)
vercel env add DATABASE_URL production
# Paste: postgresql://postgres:[prod-password]@db.[prod-ref].supabase.co:5432/postgres
# Scope: Production (encrypted)

vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste: https://[prod-ref].supabase.co
# Scope: Production

vercel env add CLERK_SECRET_KEY production
# Paste: sk_live_xxx
# Scope: Production (encrypted)

# Preview environment (all PRs, dev, staging branches)
vercel env add DATABASE_URL preview
# Paste: postgresql://postgres:[staging-password]@db.[staging-ref].supabase.co:5432/postgres
# Scope: Preview (encrypted)

vercel env add NEXT_PUBLIC_SUPABASE_URL preview
# Paste: https://[staging-ref].supabase.co
# Scope: Preview

vercel env add CLERK_SECRET_KEY preview
# Paste: sk_test_xxx
# Scope: Preview (encrypted)

# Development (local vercel dev)
vercel env add DATABASE_URL development
# Paste: postgresql://postgres:postgres@localhost:54322/postgres
# Scope: Development

vercel env add NEXT_PUBLIC_SUPABASE_URL development
# Paste: http://localhost:54321
# Scope: Development

# Pull all to local .env.local
vercel env pull .env.local
```

#### 4.3 Local Development (.env.local)

```bash
# /Users/alimai/Projects/cohortix/.env.local
# NEVER commit this file to git

# Local Supabase (via Docker)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
DIRECT_URL=postgresql://postgres:postgres@localhost:54322/postgres
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (from supabase start)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (from supabase start)

# Clerk Development Instance
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Optional: Local Redis (or use Upstash free tier)
UPSTASH_REDIS_REST_URL=http://localhost:6379
UPSTASH_REDIS_REST_TOKEN=local-token

# AI APIs (use personal test keys)
OPENAI_API_KEY=sk-proj-test-xxx
ANTHROPIC_API_KEY=sk-ant-test-xxx

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🔄 Migration Workflow

### Lifecycle: Local → Preview → Staging → Production

```
┌──────────────────────────────────────────────────────────────────────┐
│                    DATABASE MIGRATION WORKFLOW                       │
└──────────────────────────────────────────────────────────────────────┘

1️⃣ LOCAL DEVELOPMENT
   ├─ Edit schema in packages/database/src/schema/
   ├─ Generate migration: pnpm db:generate
   ├─ Review SQL in packages/database/src/migrations/
   ├─ Test locally: pnpm db:push
   ├─ Verify: pnpm db:studio
   └─ Seed: pnpm db:seed

2️⃣ PREVIEW (PR-based)
   ├─ Push branch: git push origin feature/new-table
   ├─ Create PR to dev
   ├─ Supabase auto-creates preview branch
   ├─ Vercel deploys preview (uses preview Supabase branch)
   ├─ Migrations run automatically on preview branch
   ├─ Test via preview URL: https://cohortix-git-feature-new-table.vercel.app
   └─ QA approves PR

3️⃣ STAGING (Integration Testing)
   ├─ Merge PR to dev
   ├─ Dev → Staging (manual promotion or auto)
   ├─ GitHub Actions runs: supabase db push (to staging project)
   ├─ Vercel deploys to staging.cohortix.app
   ├─ Full integration tests run
   ├─ Product team validates
   └─ Sign-off for production

4️⃣ PRODUCTION (Manual Promotion)
   ├─ Staging → Main (manual PR, approved by 2+ reviewers)
   ├─ GitHub Actions runs: supabase db push (to prod project)
   ├─ Vercel deploys to cohortix.app
   ├─ Smoke tests run automatically
   ├─ Monitor: Sentry, Vercel Analytics
   └─ Rollback plan: git revert + manual DB rollback
```

### Migration Commands Reference

```bash
# LOCAL: Create new migration
pnpm db:generate
# Generates SQL in packages/database/src/migrations/YYYYMMDDHHMMSS_description.sql

# LOCAL: Apply migrations to local DB
pnpm db:push

# LOCAL: Reset database (DESTRUCTIVE - dev only!)
pnpm db:reset && pnpm db:seed

# LOCAL: Open Drizzle Studio
pnpm db:studio

# STAGING: Apply migrations to staging Supabase (via CI/CD)
# In GitHub Actions workflow:
supabase link --project-ref <staging-ref>
supabase db push

# PRODUCTION: Apply migrations to production (via CI/CD)
# In GitHub Actions workflow (main branch only):
supabase link --project-ref <prod-ref>
supabase db push
```

### GitHub Actions Migration Workflow

Create `.github/workflows/db-migrations.yml`:

```yaml
name: Database Migrations

on:
  push:
    branches:
      - staging
      - main
    paths:
      - 'packages/database/src/migrations/**'
      - 'supabase/migrations/**'

jobs:
  migrate-staging:
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Link to staging project
        run: supabase link --project-ref ${{ secrets.SUPABASE_STAGING_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Run migrations on staging
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Notify Slack
        if: success()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
          -H 'Content-Type: application/json' \
          -d '{"text":"✅ Database migrations applied to STAGING"}'

  migrate-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      
      - name: Link to production project
        run: supabase link --project-ref ${{ secrets.SUPABASE_PROD_REF }}
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Backup production database
        run: supabase db dump --db-url "${{ secrets.DATABASE_URL_PROD }}" > backup.sql
      
      - name: Run migrations on production
        run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      
      - name: Verify migration
        run: |
          # Add your verification queries here
          echo "SELECT COUNT(*) FROM cohorts;" | psql ${{ secrets.DATABASE_URL_PROD }}
      
      - name: Notify Slack
        if: success()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
          -H 'Content-Type: application/json' \
          -d '{"text":"🚀 Database migrations applied to PRODUCTION"}'
      
      - name: Rollback on failure
        if: failure()
        run: |
          echo "❌ Migration failed! Investigate and rollback manually."
          # Manual rollback: psql $DATABASE_URL_PROD < backup.sql
```

---

## 🧪 Testing Strategy

### Local Development Testing

```bash
# 1. Start local Supabase
supabase start

# 2. Run Next.js dev server
pnpm dev

# 3. Run unit tests
pnpm test:unit

# 4. Run E2E tests (local)
pnpm test:e2e

# 5. Test with Vercel-like environment
vercel dev
```

### Preview Environment Testing (QA Process)

**When:** Every PR to `dev`

**What to test:**
1. **Automated checks (via GitHub Actions):**
   - ✅ Linting: `pnpm lint`
   - ✅ Type checking: `pnpm type-check`
   - ✅ Unit tests: `pnpm test:unit`
   - ✅ Build succeeds: `pnpm build`

2. **Manual QA (by Nina or PM):**
   - ✅ Test new feature on preview URL
   - ✅ Verify database schema changes (via preview Supabase Studio)
   - ✅ Check auth flows (Clerk dev instance)
   - ✅ Validate UI/UX changes
   - ✅ Test edge cases

3. **Accessibility testing:**
   ```bash
   # Run Axe accessibility tests in E2E suite
   pnpm test:e2e --grep "accessibility"
   ```

**Approval criteria:**
- All automated tests pass ✅
- Manual QA sign-off ✅
- Code review approved (2+ reviewers) ✅
- No breaking changes in preview environment ✅

### Staging Environment Testing

**When:** After merge to `staging` branch

**What to test:**
1. **Integration tests:**
   - Multi-user workflows
   - Cross-feature interactions
   - Performance under realistic load
   - Third-party integrations (Inngest, Sentry)

2. **Smoke tests (automated):**
   ```bash
   # Playwright smoke tests against staging
   STAGING_URL=https://staging.cohortix.app pnpm test:e2e:smoke
   ```

3. **Product validation:**
   - Product manager walkthroughs
   - Stakeholder demos
   - User acceptance testing (UAT)

**Sign-off required:**
- Product Manager ✅
- QA Lead (Nina) ✅
- DevOps (Noah) ✅
- CEO (Ahmad) for major features ✅

### Production Testing

**When:** After deploy to `main`

**What to test:**
1. **Smoke tests (automated post-deploy):**
   ```yaml
   # In GitHub Actions after production deploy
   - name: Production Smoke Tests
     run: pnpm test:e2e:smoke
     env:
       PROD_URL: https://cohortix.app
   ```

2. **Manual verification:**
   - Critical user paths (signup, login, dashboard)
   - Payment flows (if applicable)
   - Data integrity checks

3. **Monitoring:**
   - Sentry error tracking
   - Vercel Analytics (performance)
   - Supabase Logs (queries, RLS)

---

## 🔐 Security Best Practices

### 1. Secrets Management

#### DO ✅

```bash
# Store secrets in Vercel environment variables (encrypted at rest)
vercel env add DATABASE_URL production
# Mark as "Encrypted" for sensitive values

# Use separate secrets per environment
# NEVER reuse production secrets in dev/staging

# Rotate secrets regularly
# - Production API keys: quarterly
# - Database passwords: semi-annually
# - Clerk keys: on security incidents

# Validate environment variables at app startup
# Create /apps/web/src/lib/env.ts:
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(20),
  OPENAI_API_KEY: z.string().startsWith('sk-'),
});

export const env = envSchema.parse(process.env);
```

#### DON'T ❌

```bash
# NEVER commit secrets to git
# Add to .gitignore:
.env*
!.env.example

# NEVER use NEXT_PUBLIC_ for secrets
# Bad: NEXT_PUBLIC_DATABASE_URL (exposed in browser!)
# Good: DATABASE_URL (server-only)

# NEVER hardcode fallbacks that expose secrets
# Bad: process.env.API_KEY || 'sk-prod-xxx'
# Good: process.env.API_KEY (fail if missing)

# NEVER share production credentials in Slack/email
# Use password managers (1Password, LastPass)
```

### 2. Row-Level Security (RLS)

Ensure all Supabase tables have RLS enabled:

```sql
-- Example: cohorts table
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see cohorts in their organization
CREATE POLICY "cohorts_select_org_members" ON cohorts
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Test RLS in local Supabase Studio
-- Switch to "User mode" and verify queries return correct data
```

### 3. API Route Protection

```typescript
// apps/web/src/app/api/cohorts/route.ts
import { auth } from '@clerk/nextjs';
import { db } from '@repo/database';

export async function GET(request: Request) {
  // 1. Verify authentication
  const { userId } = await auth();
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Rate limiting (via Upstash Redis)
  const rateLimitKey = `rate-limit:${userId}`;
  // ... implement rate limiting logic

  // 3. Input validation (never trust client input)
  const { searchParams } = new URL(request.url);
  const cohortId = searchParams.get('id');
  
  if (cohortId && !isValidUUID(cohortId)) {
    return new Response('Invalid cohort ID', { status: 400 });
  }

  // 4. Query with RLS enabled (via Supabase client)
  const cohorts = await db.query.cohorts.findMany({
    where: (cohorts, { eq }) => eq(cohorts.userId, userId),
  });

  return Response.json(cohorts);
}
```

### 4. CORS & CSP Headers

Configure in `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.cohortix.app",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://clerk.cohortix.app",
            ].join('; ')
          }
        ],
      },
    ];
  },
};
```

---

## 💰 Cost Implications

### Vercel Pricing

| Plan | Cost | Deployment Minutes | Bandwidth | Notes |
|------|------|-------------------|-----------|-------|
| **Hobby** | Free | 100 hours/month | 100 GB | **Not recommended for production** |
| **Pro** | $20/month | 400 hours/month | 1 TB | ✅ **Recommended for startups** |
| **Enterprise** | Custom | Unlimited | Custom | For scale (1M+ users) |

**Recommendations:**
- Start with **Pro plan** ($20/month per user)
- Enable Vercel Analytics (included in Pro)
- Monitor build minutes (preview deploys count toward quota)

**Optimization tips:**
```bash
# Reduce build minutes by skipping unchanged apps
# In vercel.json:
{
  "buildCommand": "turbo build --filter=[HEAD^1]",
  "ignoreCommand": "npx turbo-ignore"
}
```

### Supabase Pricing

| Plan | Cost | Database Size | Bandwidth | API Requests |
|------|------|---------------|-----------|--------------|
| **Free** | $0 | 500 MB | 5 GB | 500K/month |
| **Pro** | $25/month | 8 GB included | 250 GB | 500M/month |
| **Team** | $599/month | 8 GB included | 250 GB | 500M/month |

**Multi-Environment Costs:**

| Setup | Monthly Cost | Notes |
|-------|--------------|-------|
| **Recommended: 1 Production + Branching** | $25/month | Branches included in Pro plan |
| **With Staging: 2 Projects** | $25 + $25 = $50/month | Production + Staging projects |
| **Full Separation: 3 Projects** | $75/month | Prod + Staging + Dev (not recommended) |

**Branching vs. Multiple Projects:**

✅ **Use Branching (Recommended):**
- **Cost:** $25/month (1 production project)
- **Included:** Unlimited preview branches
- **Best for:** Rapid iteration, PR-based testing
- **Limitation:** Preview branches auto-delete (no persistent staging)

✅ **Add Staging Project:**
- **Cost:** $50/month (Prod + Staging)
- **Use case:** Persistent integration testing environment
- **When:** You need long-running staging with stable data

❌ **Avoid 3+ Projects:**
- **Cost:** $75+/month
- **Complexity:** Manual schema sync, migration drift risk
- **Only if:** Regulatory compliance requires full environment isolation

**Recommendation for Cohortix:**
```
Phase 1 (MVP): 1 Production project + Branching ($25/month)
Phase 2 (Growth): + 1 Staging project ($50/month)
Phase 3 (Scale): Stay at 2 projects, scale via compute upgrades
```

### Clerk Pricing

| Plan | Cost | MAU Included | Additional MAU | Notes |
|------|------|--------------|----------------|-------|
| **Free** | $0 | 10,000 | N/A | Dev-only, no production SLA |
| **Pro** | $25/month | 10,000 | $0.02/user | ✅ **Recommended for production** |
| **Enterprise** | Custom | Custom | Custom | For 100K+ MAU |

**Multi-Environment Costs:**

| Setup | Monthly Cost | Notes |
|-------|--------------|-------|
| **1 Dev + 1 Prod instance** | $0 (dev) + $25 (prod) = $25/month | ✅ Recommended |
| **Vercel Marketplace integration** | Billed via Vercel Pro | Unified billing |

**Note:** Development and Preview environments share the **same Clerk development instance** (no additional cost).

### Total Monthly Costs (Startup Phase)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro (1 user) | $20 |
| Supabase | Pro (Production only) | $25 |
| Clerk | Pro | $25 |
| Upstash Redis | Free tier | $0 |
| Inngest | Free tier | $0 |
| Sentry | Team ($26/month for 100K errors) | $26 |
| **TOTAL** | | **$96/month** |

**With Staging Environment:**
| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20 |
| Supabase | 2 Pro Projects | $50 |
| Clerk | Pro | $25 |
| Others | Same | $26 |
| **TOTAL** | | **$121/month** |

**Cost Optimization:**
- Use free tiers for dev/staging (Upstash, Inngest)
- Delay Staging Supabase project until Post-MVP
- Share Vercel Pro among 2-3 team members ($60/month)

---

## ⚠️ Common Pitfalls & Solutions

### 1. Environment Variable Mismatches

**Problem:** Preview deploys use production database by accident.

**Solution:**
```bash
# Always verify environment in code
if (process.env.VERCEL_ENV === 'production') {
  // Use production-specific logic
} else {
  // Use development/preview logic
}

# Add startup checks
// apps/web/src/lib/startup-checks.ts
export function validateEnvironment() {
  const requiredVars = ['DATABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
  
  // Verify production vars don't leak to preview
  if (process.env.VERCEL_ENV !== 'production' && 
      process.env.DATABASE_URL?.includes('prod-ref')) {
    throw new Error('🚨 Production database detected in non-production environment!');
  }
}
```

### 2. Migration Conflicts

**Problem:** Multiple developers create migrations with same timestamp.

**Solution:**
```bash
# Use feature-branch workflow
# Never merge two feature branches directly

# Before creating migration:
git checkout dev
git pull origin dev
git checkout -b feature/your-feature
pnpm db:generate

# Migrations are timestamped, but still check for conflicts
git diff dev -- packages/database/src/migrations/

# If conflict exists, regenerate migration:
rm packages/database/src/migrations/latest.sql
pnpm db:generate
```

### 3. Supabase Branch Not Auto-Created

**Problem:** PR created, but no Supabase preview branch.

**Root causes:**
- GitHub integration not configured
- Branch pattern doesn't match (e.g., `feat/` instead of `feature/`)
- Supabase branching not enabled

**Solution:**
```bash
# 1. Verify GitHub integration
# Supabase Dashboard → Settings → Branching → GitHub
# Ensure repo is connected

# 2. Check branch pattern
# Pattern should include: feature/*, bugfix/*, feat/*

# 3. Manually create branch
supabase branches create <branch-name> --project-ref <prod-ref>

# 4. Verify in Supabase Dashboard
# Check "Branches" tab for new branch
```

### 4. Clerk Redirect Loops

**Problem:** After login, user gets redirected infinitely.

**Root cause:** Mismatched redirect URLs between Clerk and application.

**Solution:**
```bash
# 1. Verify Clerk environment URLs
# Development Clerk instance should allow:
# - http://localhost:3000/*
# - https://*.vercel.app/*

# 2. Update .env.local
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# 3. Clear Clerk session
# In browser DevTools: Application → Storage → Clear Site Data

# 4. Test with explicit redirect
// apps/web/src/middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware({
  publicRoutes: ['/', '/sign-in', '/sign-up'],
  afterAuth(auth, req) {
    // Log for debugging
    console.log('Auth state:', auth.userId ? 'Authenticated' : 'Guest');
    console.log('Requested path:', req.nextUrl.pathname);
  }
});
```

### 5. Database Connection Pooling Exhaustion

**Problem:** "Too many connections" error in production.

**Root cause:** Each serverless function creates new connection.

**Solution:**
```typescript
// packages/database/src/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Connection pooling for serverless
const connectionString = process.env.DATABASE_URL!;

// Max connections based on Supabase plan
// Free: 60, Pro: 200, Team: 400
const client = postgres(connectionString, {
  max: process.env.VERCEL_ENV === 'production' ? 10 : 1,
  idle_timeout: 20,
  max_lifetime: 60 * 30, // 30 minutes
});

export const db = drizzle(client);
```

### 6. Stale Preview Deployments

**Problem:** Old preview URLs still accessible, confusing QA.

**Solution:**
```bash
# Enable automatic preview deletion in Vercel
# Project Settings → Git → Delete Preview Deployments
# ✅ "After branch is deleted"
# ✅ "After PR is merged or closed"

# Manually delete stale previews
vercel list
vercel remove <deployment-url>
```

---

## 📋 Daily Workflow Cheatsheet

### For Developers

**Starting a new feature:**
```bash
# 1. Pull latest dev
git checkout dev
git pull origin dev

# 2. Create feature branch
git checkout -b feature/COH-123-new-cohort-table

# 3. Start local environment
supabase start          # Start local Supabase
pnpm dev                # Start Next.js dev server

# 4. Develop, create migrations
pnpm db:generate
pnpm db:push

# 5. Test locally
pnpm test:unit
pnpm test:e2e

# 6. Push and create PR
git add .
git commit -m "feat(cohorts): add cohort table with RLS"
git push origin feature/COH-123-new-cohort-table

# 7. Create PR to dev
# GitHub automatically:
# - Deploys Vercel preview
# - Creates Supabase preview branch
# - Runs CI/CD tests

# 8. Share preview URL with QA
# https://cohortix-git-feature-coh-123.vercel.app
```

**Debugging preview environment:**
```bash
# Pull preview environment variables locally
vercel env pull .env.preview

# Run local server with preview config
vercel dev --env .env.preview

# Access preview Supabase Studio
# https://<branch-name>-<prod-ref>.supabase.co
```

### For QA (Nina)

**Testing a PR:**
```bash
# 1. Review PR description (acceptance criteria)

# 2. Access preview deployment
# URL in PR comment: "View deployment: https://..."

# 3. Test checklist:
# ✅ Feature works as expected
# ✅ No console errors (F12 DevTools)
# ✅ Responsive design (mobile/tablet)
# ✅ Accessibility (keyboard navigation, screen reader)
# ✅ Edge cases (empty states, errors)

# 4. Check database state
# Access preview Supabase Studio (URL in PR)
# Verify migrations applied correctly

# 5. Leave feedback in PR
# 👍 Approve, or
# 💬 Request changes with screenshots
```

**Staging environment validation:**
```bash
# After merge to staging branch:

# 1. Access staging URL
# https://staging.cohortix.app

# 2. Run full integration tests
# Test multi-user workflows
# Verify third-party integrations (Inngest, Sentry)

# 3. Sign off in #qa-testing channel
# "✅ Staging validated for release v1.2.0"
```

### For DevOps (Noah)

**Monitoring production deploy:**
```bash
# 1. Watch GitHub Actions workflow
# Ensure migrations complete successfully

# 2. Verify deployment in Vercel Dashboard
# Check build logs for errors

# 3. Run smoke tests
pnpm test:e2e:smoke

# 4. Monitor Sentry for errors
# https://sentry.io/organizations/cohortix/issues/

# 5. Check Supabase logs
# Dashboard → Logs → Query recent errors

# 6. Notify team in Slack
# "🚀 Production deploy complete: v1.2.0"
```

**Emergency rollback:**
```bash
# Option 1: Revert Vercel deployment
vercel rollback

# Option 2: Revert Git commit
git revert <commit-hash>
git push origin main

# Option 3: Manual database rollback (LAST RESORT)
# Restore from backup (created automatically by GitHub Actions)
psql $DATABASE_URL_PROD < backup-YYYYMMDD.sql
```

---

## 🎓 Training & Onboarding

### For New Developers

**Day 1: Local Setup**
```bash
# 1. Clone repo
git clone git@github.com:your-org/cohortix.git
cd cohortix

# 2. Install dependencies
pnpm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Get credentials from 1Password
# Search: "Cohortix Development Environment"

# 5. Start local Supabase
supabase start

# 6. Apply migrations
pnpm db:push

# 7. Seed database
pnpm db:seed

# 8. Start dev server
pnpm dev

# 9. Verify: http://localhost:3000
```

**Week 1: First PR**
- Read: `/docs/GIT_WORKFLOW.md`
- Pick starter issue labeled `good-first-issue`
- Follow PR template, request review from 2+ developers
- Deploy to preview, test with QA

**Week 2: Environment Mastery**
- Read this guide in full
- Practice: Create test migration, deploy to preview
- Shadow: Watch senior dev deploy to staging/production
- Quiz: Complete environment strategy quiz (notion)

### For QA Team

**Testing Matrix:**

| Environment | When | What to Test | Tools |
|-------------|------|--------------|-------|
| **Preview** | Every PR | Feature-specific, acceptance criteria | Playwright, manual |
| **Staging** | Pre-release | Full integration, user journeys | Automated suite |
| **Production** | Post-release | Smoke tests, critical paths | Synthetic monitoring |

**QA Checklist Template:**

```markdown
## QA Report: [PR #123] New Cohort Table

**Preview URL:** https://cohortix-git-feature-123.vercel.app
**Tested by:** Nina
**Date:** 2026-02-14

### Acceptance Criteria
- [ ] Users can create cohorts
- [ ] Cohort members display correctly
- [ ] RLS prevents cross-organization access

### Test Results
- ✅ Feature works as expected
- ✅ No console errors
- ✅ Responsive on mobile
- ⚠️  Minor: Button alignment off on iPad (screenshot attached)

### Database Validation
- ✅ Migrations applied successfully
- ✅ RLS policies active
- ✅ Indexes created

### Recommendation
**APPROVE** with minor fix (button alignment)

### Screenshots
[Attach screenshots]
```

---

## 📚 Additional Resources

### Official Documentation
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Supabase Branching](https://supabase.com/features/branching)
- [Clerk Multi-Environment](https://clerk.com/docs/guides/development/deployment/vercel)
- [Next.js Environment Variables](https://nextjs.org/docs/pages/guides/environment-variables)
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)

### Internal Docs
- `/docs/GIT_WORKFLOW.md` - Branch strategy and PR process
- `/docs/QA_ENVIRONMENTS.md` - QA testing standards
- `/docs/SECURITY.md` - Security guidelines
- `/docs/DATABASE_SCHEMA.md` - Database schema reference

### Support Channels
- **#dev-general** - General development questions
- **#devops** - Deployment and infrastructure
- **#qa-testing** - QA and testing coordination
- **#ceo-office** - Escalation for critical issues

---

## ✅ Implementation Checklist

Use this checklist to implement the environment strategy step-by-step:

### Phase 1: Foundation (Week 1)
- [ ] Enable Vercel Pro plan
- [ ] Configure Vercel production branch (`main`)
- [ ] Set up Vercel preview deployments
- [ ] Create Supabase production project
- [ ] Enable Supabase branching on production project
- [ ] Connect Supabase GitHub integration
- [ ] Create Clerk production instance
- [ ] Create Clerk development instance
- [ ] Add all environment variables to Vercel (production + preview)
- [ ] Test preview deployment (create dummy PR)

### Phase 2: CI/CD (Week 2)
- [ ] Create GitHub Actions workflow for database migrations
- [ ] Add Supabase secrets to GitHub (SUPABASE_ACCESS_TOKEN, etc.)
- [ ] Test migration workflow on staging branch
- [ ] Set up Sentry error tracking
- [ ] Configure Vercel Analytics
- [ ] Create Slack webhooks for deployment notifications
- [ ] Document rollback procedure

### Phase 3: QA & Testing (Week 3)
- [ ] Create QA testing checklist template
- [ ] Set up Playwright E2E test suite
- [ ] Configure accessibility tests (Axe)
- [ ] Create smoke test suite for production
- [ ] Train QA team on preview environment testing
- [ ] Document testing workflows

### Phase 4: Staging Environment (Week 4 - Optional)
- [ ] Create Supabase staging project
- [ ] Configure staging branch in Git
- [ ] Add staging environment variables to Vercel
- [ ] Set up staging-specific monitoring
- [ ] Create staging data seed script
- [ ] Test full workflow: dev → staging → production

### Phase 5: Production Hardening (Week 5)
- [ ] Enable Vercel deployment protection (require approval)
- [ ] Set up branch protection rules (main, staging)
- [ ] Configure RLS policies on all tables
- [ ] Add CSP headers to Next.js config
- [ ] Implement rate limiting on API routes
- [ ] Create incident response runbook
- [ ] Schedule first production deploy dry run

### Phase 6: Documentation & Training (Week 6)
- [ ] Onboard all developers (local setup)
- [ ] Train QA team (preview/staging testing)
- [ ] Train DevOps (deployment process)
- [ ] Create video walkthrough (Loom)
- [ ] Add this guide to weekly dev meeting agenda
- [ ] Schedule quarterly environment strategy review

---

## 🔄 Maintenance & Review

### Weekly
- **Monday:** Review preview deployments (delete stale ones)
- **Friday:** Check Vercel build minutes usage

### Monthly
- **First Monday:** Review environment variable usage (audit access)
- **Last Friday:** Validate backup/restore procedures

### Quarterly
- **Q1, Q3:** Rotate production API keys and database passwords
- **Q2, Q4:** Review and update this guide based on team feedback

---

**Questions or improvements?** Contact Devi (AI Developer) or Ahmad (CEO).

**Last Review:** February 14, 2026  
**Next Review:** May 14, 2026

---

*This guide is a living document. Update it as the team learns and the product evolves.* 🚀
