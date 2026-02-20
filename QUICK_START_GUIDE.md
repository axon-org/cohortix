# 🚀 Quick Start Guide: Complete Cohortix Database Setup

**Time Required:** ~15 minutes  
**Current Status:** Schema ready, seed ready, queries ready → Just needs manual
push

---

## Step 1: Push Schema to Supabase (10 min)

### Option A: Supabase SQL Editor (Easiest) ✅ Recommended

1. **Open Supabase:**
   - Go to: https://supabase.com/dashboard/project/rfwscvklcokzuofyzqwx
   - Navigate to **SQL Editor** (left sidebar)

2. **Create New Query:**
   - Click **New Query** button

3. **Copy Migration SQL:**
   - Open:
     `/Users/alimai/Projects/cohortix/packages/database/src/migrations/0000_initial_with_rls.sql`
   - Select All (Cmd+A)
   - Copy (Cmd+C)

4. **Paste and Execute:**
   - Paste into SQL Editor
   - Click **Run** (or press Cmd+Enter)
   - Wait ~30-60 seconds

5. **Verify Success:**
   - Go to **Database** → **Tables**
   - You should see 16 new tables:
     - ✅ organizations
     - ✅ profiles
     - ✅ organization_memberships
     - ✅ clients
     - ✅ workspaces
     - ✅ agents
     - ✅ projects
     - ✅ tasks
     - ✅ knowledge_entries
     - ✅ audit_logs
     - ... and 6 more

### Option B: Upgrade Drizzle Kit & Push

```bash
cd /Users/alimai/Projects/cohortix/packages/database

# Upgrade to latest Drizzle Kit
pnpm add -D drizzle-kit@latest

# Push schema
pnpm db:push
```

---

## Step 2: Seed Database (1 min)

```bash
cd /Users/alimai/Projects/cohortix

# Run the seed script
pnpm tsx scripts/seed-supabase.ts
```

**Expected Output:**

```
🌱 Seeding database with Supabase client...
📦 Creating organization: Axon HQ
✅ Created organization: Axon HQ (uuid...)
🤖 Creating AI allies...
✅ Created 4 allies
...
✨ Database seeding complete!
```

**What you'll get:**

- 1 demo organization (Axon HQ)
- 4 AI allies (Devi, Lubna, Zara, Khalid)
- 1 sample client (TechCorp Inc.)
- 3 projects/cohorts
- 5 tasks/missions
- 2 knowledge entries

---

## Step 3: Wire Dashboard Data (5 min)

### Import Dashboard Queries

The queries are already created at:

```
apps/web/src/server/db/queries/dashboard.ts
```

### Update Your Dashboard Page

**Example: `apps/web/src/app/(dashboard)/page.tsx`**

```typescript
import { getDashboardData } from '@/server/db/queries/dashboard';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  // Fetch all dashboard data
  const data = await getDashboardData();

  if (!data) {
    redirect('/sign-in');
  }

  return (
    <div className="dashboard">
      {/* Update these components to use real data */}
      <DashboardHeader
        user={data.user}
        organization={data.organization}
      />

      <KPICards kpis={data.kpis} />
      {/* kpis = { activeCohorts, missionsInProgress, activeAllies, completionRate } */}

      <ActivityFeed activity={data.activity} />
      {/* activity = array of recent audit log entries */}

      <AlertsBanner alerts={data.alerts} />
      {/* alerts = array of warnings/errors/info */}

      <CohortsGrid cohorts={data.cohorts} />
      {/* cohorts = active projects with task stats */}

      <AlliesSidebar allies={data.allies} />
      {/* allies = agents with workload info */}
    </div>
  );
}
```

### Fix Hardcoded User Name

**Find and replace:**

```typescript
// OLD (hardcoded)
<span>Alex Chen</span>

// NEW (dynamic)
<span>{data.user.profile?.display_name || data.user.email}</span>
```

---

## Step 4: Test Everything (5 min)

### Start Dev Server

```bash
cd /Users/alimai/Projects/cohortix
pnpm dev
```

### Open Dashboard

```
http://localhost:3000/dashboard
```

### Verify

- [ ] Dashboard loads without errors
- [ ] KPI cards show numbers (not "loading..." or hardcoded values)
- [ ] Activity feed shows recent actions
- [ ] Sidebar shows your username (not "Alex Chen")
- [ ] Cohorts/projects appear
- [ ] Allies section shows 4 agents

---

## Troubleshooting

### "Relation does not exist" error

**Problem:** Schema not pushed yet  
**Fix:** Complete Step 1 first

### Seed script fails

**Problem:** Schema not pushed yet  
**Fix:** Complete Step 1, then retry Step 2

### Dashboard shows no data

**Problem:** Database not seeded  
**Fix:** Run Step 2 (seed script)

### Connection errors

**Problem:** Supabase credentials wrong  
**Fix:** Verify `.env.local` has correct keys:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://rfwscvklcokzuofyzqwx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## What's Ready to Use

### ✅ Database Schema

- All tables designed
- RLS policies configured
- Indexes optimized
- Enums defined

### ✅ Seed Script

- Location: `scripts/seed-supabase.ts`
- Uses Supabase client (HTTPS)
- Creates realistic demo data

### ✅ Dashboard Queries

- Location: `apps/web/src/server/db/queries/dashboard.ts`
- TypeScript typed
- RLS-aware (auto tenant filtering)
- Optimized with parallel fetching

### ✅ Documentation

- **DATA_WIRING_BUILD.md** — Full technical report (archived in
  `docs/archive/build-logs/`)
- **QUICK_START_GUIDE.md** — This file
- **DB_SCHEMA_BUILD.md** — Original schema docs (archived in
  `docs/archive/migration-reports/`)
- **CLAUDE.md** — Project context

---

## Quick Command Reference

```bash
# Push schema (after Drizzle Kit upgrade)
pnpm db:push

# Seed database
pnpm tsx scripts/seed-supabase.ts

# Start dev server
pnpm dev

# Open Drizzle Studio (inspect DB)
pnpm db:studio

# Type check
pnpm type-check

# Build
pnpm build
```

---

## Next Steps After Setup

1. **Add authentication flow:**
   - Sign up page
   - Sign in page
   - Protected routes

2. **Create more dashboard components:**
   - Task kanban board
   - Agent detail pages
   - Knowledge base search

3. **Add Realtime features:**
   - Live task updates
   - Presence indicators
   - Real-time notifications

4. **Implement data mutations:**
   - Create/edit/delete projects
   - Assign tasks to agents
   - Add knowledge entries

---

## Support

**Detailed Documentation:** See `docs/archive/build-logs/DATA_WIRING_BUILD.md`
for:

- Full query API reference
- Security notes (RLS policies)
- Performance optimization tips
- Database schema details

**Questions?** Check the troubleshooting section in
`docs/archive/build-logs/DATA_WIRING_BUILD.md`

---

**Ready to go!** 🎉

Just complete Steps 1 & 2, and your dashboard will be wired with real data.
