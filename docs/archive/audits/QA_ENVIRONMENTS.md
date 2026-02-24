# QA Environments & Test Data Standards

**Last Updated:** February 12, 2026  
**Owner:** Noah (DevOps Engineer)  
**Audited by:** Alim (CEO)

---

## 🎯 Purpose

This document defines the standard test environment setup for Cohortix QA
testing. All QA engineers (Nina) should use these commands to ensure consistent,
comprehensive test data.

---

## 🚀 Quick Start: One-Command Reset

For a **100% fresh, fully populated test environment**, run:

```bash
pnpm db:reset && pnpm seed
```

**What this does:**

1. `pnpm db:reset` — Drops and recreates all database tables (⚠️
   **DESTRUCTIVE**)
2. `pnpm seed` — Populates ALL tables with comprehensive test data

**Duration:** ~5-10 seconds  
**Safe for:** Development and local testing only (never run on production!)

---

## 📦 What Gets Seeded

The unified `pnpm seed` command populates **ALL** tables:

| Table                   | Count | Description                                            |
| ----------------------- | ----- | ------------------------------------------------------ |
| **Organizations**       | 1     | Demo org: "Axon HQ"                                    |
| **Agents**              | 4     | Devi, Lubna, Zara, Khalid                              |
| **Clients**             | 1     | TechCorp Inc.                                          |
| **Cohorts**             | 4     | AI Team, Design Squad, Content Team, DevOps (at-risk)  |
| **Cohort Members**      | 10    | Agent-to-cohort assignments with engagement scores     |
| **Projects**            | 3     | Dashboard Redesign, Evolution System, Content Strategy |
| **Tasks/Actions**       | 5     | Mix of todo, in_progress, done statuses                |
| **Knowledge Entries**   | 3     | RAG best practices, design patterns, DB tips           |
| **Audit/Activity Logs** | 25+   | Comprehensive activity history for all resources       |

---

## 🔍 Test Data Highlights

### Cohort Membership (NEW!)

Agents are assigned to cohorts with realistic engagement scores:

**AI Development Team** (Active)

- Devi: 95% engagement
- Khalid: 87% engagement
- Zara: 80% engagement

**Product Design Squad** (Active)

- Lubna: 98% engagement ⭐ (highest)
- Zara: 86% engagement

**Content Strategy Team** (Active)

- Zara: 93% engagement
- Lubna: 75% engagement
- Devi: 68% engagement

**DevOps Infrastructure** (⚠️ At-Risk)

- Khalid: 52% engagement
- Devi: 38% engagement (low)

### Activity Logs (NEW!)

Comprehensive audit logs across 7-10 days including:

- ✅ Cohort join events
- ✅ Cohort contributions (agent activity within cohorts)
- ✅ Task status changes (todo → in_progress → done)
- ✅ Project creation
- ✅ Knowledge entry creation
- ✅ Agent status changes
- ✅ System-level events

**Use cases:**

- Timeline graphs (`GET /api/cohorts/:id/activity`)
- Engagement tracking
- Audit trails
- Activity feeds

---

## 🧪 Testing Workflows

### Standard QA Workflow

```bash
# 1. Reset to clean slate
pnpm db:reset && pnpm seed

# 2. Start dev server
pnpm dev

# 3. Run test suite
pnpm test
pnpm test:e2e
```

### Quick Re-seed (without reset)

If you just need fresh data without dropping tables:

```bash
pnpm seed
```

⚠️ **Warning:** This may fail if data already exists (unique constraints). Use
`db:reset` first for clean slate.

### Database Inspection

```bash
# Open Drizzle Studio (GUI)
pnpm db:studio

# Or use psql
psql <your-connection-string>
```

---

## 🔗 API Endpoints to Test

With the unified seed data, you can test:

### Cohort Endpoints

- `GET /api/cohorts` — List all cohorts
- `GET /api/cohorts/:id` — Get cohort details
- `GET /api/cohorts/:id/members` — ✅ **NEW** Get cohort members
- `GET /api/cohorts/:id/activity` — ✅ **NEW** Get activity timeline

### Agent Endpoints

- `GET /api/agents` — List all agents
- `GET /api/agents/:id/cohorts` — Get agent's cohort memberships

### Project & Task Endpoints

- `GET /api/projects` — List all projects
- `GET /api/projects/:id/tasks` — Get project tasks
- `PUT /api/tasks/:id` — Update task status

### Audit Logs

- `GET /api/audit-logs` — Get all activity logs
- `GET /api/audit-logs?resourceType=cohort` — Filter by resource type

---

## 📊 Expected Test Outcomes

### Cohort Member Coverage

✅ **All cohorts have members:**

- Minimum: 2 members (DevOps, Design)
- Maximum: 3 members (AI Team, Content)

✅ **Engagement scores vary:**

- High performers: 80-98%
- At-risk: 38-52%

✅ **At-risk cohort exists:**

- "DevOps Infrastructure" has low engagement
- Should trigger alerts/flags in UI

### Activity Log Coverage

✅ **Timeline data exists:**

- Last 7-10 days of activity
- Multiple event types per cohort
- Realistic timestamps (spread across days)

✅ **Audit trail is complete:**

- Create/update/delete actions logged
- Actor attribution (agent/system)
- Before/after values for updates

---

## 🚨 Common Issues

### Issue: `pnpm seed` fails with "duplicate key value"

**Cause:** Data already exists in database  
**Fix:**

```bash
pnpm db:reset && pnpm seed
```

### Issue: Cohort members not showing up

**Cause:** Missing migration or schema mismatch  
**Fix:**

```bash
pnpm db:generate
pnpm db:push
pnpm seed
```

### Issue: Activity logs missing

**Cause:** Old seed script (pre-Feb 12, 2026)  
**Fix:** Pull latest main branch and re-seed:

```bash
git pull origin main
pnpm install
pnpm db:reset && pnpm seed
```

---

## 🔄 Maintenance

### When to Update This Doc

- New tables added to seed script
- New test scenarios needed
- Seed data structure changes
- New API endpoints to test

### Version History

| Date       | Change                                                              | Author |
| ---------- | ------------------------------------------------------------------- | ------ |
| 2026-02-12 | Initial creation. Unified seed with cohort_members & activity_logs. | Noah   |

---

## 📞 Support

**Questions?** Contact:

- **QA Lead (Nina):** For test scenarios and coverage questions
- **DevOps (Noah):** For seeding issues, database problems
- **CEO (Alim):** For test data standards and compliance

---

**Remember:** Always use `pnpm db:reset && pnpm seed` for a guaranteed clean
slate! 🚀
