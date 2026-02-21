# Development Kickoff Checklist

**Project:** Cohortix  
**Created:** 2026-02-10  
**Status:** Pre-Development

---

## 🎯 Phase 0: Pre-Development Setup

### Environment & Credentials

- [✓] Supabase project created (`rfwscvklcokzuofyzqwx`)
- [✓] Supabase account access verified
- [⏳] Supabase API keys obtained (waiting on Ahmad)
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [✓] Vercel invitation sent (alimai.agent@gmail.com)
- [ ] Vercel invitation accepted
- [ ] Vercel CLI authenticated
- [ ] Clerk account setup
- [ ] Clerk API keys obtained

### Documentation

- [✓] Tech stack finalized and documented
- [✓] Migration plan created (Neon → Supabase)
- [✓] Clerk + Supabase integration guide
- [✓] Environment variables template (`.env.example`)
- [ ] Database schema design reviewed
- [ ] API endpoints documented

### Design & UI

- [⏳] UI design tool research (Devi - in progress)
- [ ] UI design tool selected
- [ ] Design inspiration reviewed (Twitter posts)
- [ ] Mockups created:
  - [ ] Dashboard (agent overview)
  - [ ] Agent detail view
  - [ ] Knowledge base browser
  - [ ] Mission assignment flow
  - [ ] Goal proposal review
- [ ] Ahmad's design approval

---

## 🗄️ Phase 1: Database Migration

### Supabase Setup

- [ ] Enable required PostgreSQL extensions:
  - [ ] `uuid-ossp` (UUID generation)
  - [ ] `pgcrypto` (encryption)
  - [ ] `vector` (pgvector for embeddings)
  - [ ] `pg_trgm` (trigram similarity)
- [ ] Configure connection pooling (PgBouncer)
- [ ] Set up backup schedule

### Schema Migration

- [ ] Run Drizzle migrations on Supabase
- [ ] Test database connection (run `test-supabase-connection.ts`)
- [ ] Create RLS helper functions
- [ ] Implement RLS policies for all tables
- [ ] Test RLS with different user roles

### Clerk Integration

- [ ] Configure Clerk JWT template for Supabase
- [ ] Add Supabase JWT verification in Clerk
- [ ] Test auth flow (Clerk → Supabase)
- [ ] Verify cross-org isolation

### Real-time Setup

- [ ] Enable real-time on critical tables:
  - [ ] `agent_activities`
  - [ ] `missions`
  - [ ] `knowledge_entries`
  - [ ] `goal_proposals`
- [ ] Configure publication rules
- [ ] Test real-time subscriptions from client
- [ ] Add error handling for subscriptions

---

## 🚀 Phase 2: Development Environment

### Local Setup

- [ ] Clone/verify repository
- [ ] Install dependencies (`pnpm install`)
- [ ] Configure `.env.local` with all credentials
- [ ] Run database migrations (`pnpm db:migrate`)
- [ ] Seed test data (optional)
- [ ] Start dev server (`pnpm dev`)
- [ ] Verify localhost:3000 loads

### Vercel Deployment

- [ ] Link project to Vercel (`vercel link`)
- [ ] Configure environment variables in Vercel
- [ ] Deploy to staging (`vercel --prod=false`)
- [ ] Test staging deployment
- [ ] Set up production deployment

### Testing

- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests setup (Playwright)
- [ ] RLS policy tests passing

---

## 👥 Phase 3: Team & Collaboration

### Agent Assignments

- [ ] Devi: Backend architecture & API development
- [ ] Lubna: UI/UX design & frontend components
- [ ] [Other agents TBD]

### Code Quality

- [ ] ESLint configured
- [ ] Prettier configured
- [ ] Pre-commit hooks (Husky)
- [ ] CI/CD pipeline (GitHub Actions)

### Documentation

- [ ] README updated
- [ ] Setup guide for new developers
- [ ] API documentation (auto-generated?)
- [ ] Architecture decision records (ADRs)

---

## 📊 Phase 4: Monitoring & Observability

### Tools Setup

- [ ] Sentry for error tracking
- [ ] Vercel Analytics for performance
- [ ] Axiom for agent observability (recommended by Devi)
- [ ] Upstash Redis for caching/rate limiting

### Logging

- [ ] Structured logging configured
- [ ] Agent activity logging
- [ ] API request logging
- [ ] Error tracking

---

## ✅ Definition of "Ready to Build"

**All of these must be checked before Phase 1 development begins:**

1. [⏳] UI mockups approved by Ahmad
2. [ ] Supabase migration complete and tested
3. [ ] Environment variables configured (local + Vercel)
4. [ ] Clerk auth working with Supabase RLS
5. [ ] Dev environment running locally
6. [ ] Staging environment deployed and accessible

---

## 🚨 Blockers & Dependencies

| Item                       | Waiting On                   | ETA       |
| -------------------------- | ---------------------------- | --------- |
| Supabase API keys          | Ahmad                        | Immediate |
| UI design tool selection   | Devi                         | 30-45 min |
| Design mockups             | Lubna (after tool selection) | TBD       |
| Design approval            | Ahmad                        | TBD       |
| Clerk account setup        | Ahmad/Team                   | TBD       |
| Vercel access verification | Alim (email verification)    | Immediate |

---

## 📅 Timeline Estimate

| Phase                           | Duration  | Dependencies                 |
| ------------------------------- | --------- | ---------------------------- |
| **Phase 0:** Pre-Dev Setup      | 1-2 days  | Credentials, design approval |
| **Phase 1:** Database Migration | 4-6 hours | Phase 0 complete             |
| **Phase 2:** Dev Environment    | 2-4 hours | Phase 1 complete             |
| **Phase 3:** Team Setup         | Ongoing   | -                            |
| **Phase 4:** Monitoring         | 2-3 hours | Can be parallel              |

**Total to "Ready to Build":** ~2-3 days

---

**Next Actions:**

1. ⏳ Await Supabase API keys from Ahmad
2. ⏳ Await Devi's UI tool recommendations
3. ⏳ Await design mockups and approval
4. 🚀 Execute migration once approved

**Updated:** 2026-02-10 19:40 PKT
