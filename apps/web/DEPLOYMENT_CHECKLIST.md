# Deployment Checklist - Mission Control Dashboard

## Pre-Deployment

### 1. Environment Variables

- [ ] Copy `.env.example` to `.env.local`
- [ ] Set Supabase URL (`NEXT_PUBLIC_SUPABASE_URL`)
- [ ] Set Supabase Anon Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] Set Supabase Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
- [ ] Set Database URL (`DATABASE_URL`)
- [ ] Verify environment variables on Vercel/hosting platform

### 2. Database Setup

- [ ] Create Supabase project
- [ ] Enable required PostgreSQL extensions:
  - [ ] `uuid-ossp`
  - [ ] `pgcrypto`
  - [ ] `vector` (for future embeddings)
  - [ ] `pg_trgm` (for full-text search)
- [ ] Configure authentication providers:
  - [ ] Email/password authentication
  - [ ] Set redirect URLs (development + production)
- [ ] Create database schema:
  - [ ] `organizations` table
  - [ ] `users` table (Supabase provides this)
  - [ ] `cohorts` table (future)
  - [ ] `allies` table (future)
  - [ ] `missions` table (future)
  - [ ] `activity_logs` table (future)
  - [ ] `alerts` table (future)
- [ ] Set up Row-Level Security (RLS) policies

### 3. Testing

- [ ] Type-check passes: `pnpm type-check`
- [ ] Lint passes: `pnpm lint`
- [ ] Dev server starts: `pnpm dev`
- [ ] Build succeeds: `pnpm build`
- [ ] Sign-in flow works
- [ ] Dashboard renders correctly
- [ ] All components display mock data
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Dark theme applies correctly

### 4. Code Quality

- [ ] All TypeScript errors resolved
- [ ] No console.error or console.warn in production code
- [ ] Components follow project conventions (see CLAUDE.md)
- [ ] Proper error handling in place
- [ ] Loading states implemented where needed

## Deployment Steps

### Option 1: Vercel (Recommended)

1. **Connect Repository**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login
   vercel login

   # Deploy
   cd /Users/alimai/Projects/cohortix
   vercel
   ```

2. **Configure Project Settings**
   - Framework Preset: Next.js
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && pnpm build --filter=@cohortix/web`
   - Output Directory: `apps/web/.next`
   - Install Command: `cd ../.. && pnpm install`

3. **Environment Variables**
   - Add all variables from `.env.local` in Vercel dashboard
   - Mark `SUPABASE_SERVICE_ROLE_KEY` as sensitive

4. **Domain Setup**
   - Configure custom domain (cohortix.ai)
   - Set up SSL certificate (automatic with Vercel)

### Option 2: Self-Hosted

1. **Build**

   ```bash
   cd /Users/alimai/Projects/cohortix/apps/web
   pnpm build
   ```

2. **Run Production Server**

   ```bash
   pnpm start
   ```

3. **Nginx Configuration** (example)

   ```nginx
   server {
       listen 80;
       server_name cohortix.ai;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Process Manager** (PM2)
   ```bash
   npm i -g pm2
   pm2 start pnpm --name cohortix-web -- start
   pm2 save
   pm2 startup
   ```

## Post-Deployment

### 1. Verification

- [ ] Dashboard loads at production URL
- [ ] Authentication works
- [ ] All API calls succeed
- [ ] Real-time connections work (Supabase Realtime)
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Analytics configured (Vercel Analytics, etc.)

### 2. Monitoring

- [ ] Set up uptime monitoring
- [ ] Configure error alerts
- [ ] Set up performance monitoring
- [ ] Enable logging

### 3. Documentation

- [ ] Update README with production URL
- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Update team on deployment status

## Rollback Plan

If issues occur:

1. **Vercel:** Revert to previous deployment via dashboard
2. **Self-hosted:** Restore previous git commit and rebuild
   ```bash
   git revert HEAD
   pnpm build
   pm2 restart cohortix-web
   ```

## Future Enhancements

After initial deployment:

- [ ] Connect real KPI data from database
- [ ] Implement real-time activity feed
- [ ] Add mobile sidebar (hamburger menu)
- [ ] Create API endpoints for dashboard data
- [ ] Set up automated backups
- [ ] Add E2E tests with Playwright
- [ ] Implement error boundaries
- [ ] Add loading skeletons
- [ ] Optimize images and assets
- [ ] Set up CI/CD pipeline

## Support Contacts

- **Technical Issues:** [Technical Lead]
- **Database:** [Database Admin]
- **Hosting:** [DevOps]
- **Emergency:** [On-call rotation]

---

**Last Updated:** February 11, 2026  
**Version:** 1.0.0
