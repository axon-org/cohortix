# Contributing to Cohortix

## Branching Strategy

```
feature/xyz ──PR──▶ dev ──PR──▶ main
   (work)         (staging)    (production)
```

### Branches

| Branch | Purpose | Deploys to | Supabase | Clerk |
|--------|---------|------------|----------|-------|
| `main` | Production | `cohortix.ai` | Production (`qobvewyakovekbuvwjkt`) | Prod instance |
| `dev` | Staging/integration | `staging.cohortix.ai` | Staging branch (`cclsfxrnlgjfididtzym`) | Dev instance |
| `feature/*` | New features | Vercel preview URL | Same as staging | Dev instance |
| `fix/*` | Bug fixes | Vercel preview URL | Same as staging | Dev instance |
| `hotfix/*` | Urgent prod fixes | Vercel preview URL | Production | Prod instance |

### Naming Conventions

- `feature/short-description` — new features
- `fix/short-description` — bug fixes
- `chore/short-description` — tooling, deps, CI, docs
- `hotfix/short-description` — urgent production fixes

## Development Workflow

### 1. Local Development

```bash
# Start from latest dev
git checkout dev && git pull

# Create feature branch
git checkout -b feature/my-feature

# Install deps & run locally
pnpm install
pnpm dev
```

Local dev uses `.env.local` which points to the staging Supabase branch + Clerk dev instance. What works locally will work on staging.

**Bypass auth for quick testing:**
Set `BYPASS_AUTH=true` in `.env.local` to skip Clerk login (uses first org in DB).

### 2. Push & Preview

```bash
git push origin feature/my-feature
```

Vercel auto-generates a preview deployment with a unique URL for every push.

### 3. Open PR → `dev`

- CI runs: lint, type check, build, security scans
- Get review, then **squash merge** into `dev`

### 4. Staging Verification

After merge to `dev`, Vercel auto-deploys to `staging.cohortix.ai`. Test the feature there.

### 5. Production Release

When staging is verified:
- Open PR: `dev` → `main`
- Review & merge
- Vercel auto-deploys to production

### Hotfixes (urgent production bugs)

```bash
git checkout main && git pull
git checkout -b hotfix/critical-bug
# fix, commit, push
# Open PR → main (merge)
# Then merge main back into dev to keep them in sync
git checkout dev && git merge main
```

## Environment Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Local      │    │   Staging   │    │  Production  │
│  localhost   │    │ staging.    │    │ cohortix.ai  │
│  :3000       │    │ cohortix.ai │    │              │
├─────────────┤    ├─────────────┤    ├──────────────┤
│ Supabase    │    │ Supabase    │    │ Supabase     │
│ staging     │◄──►│ staging     │    │ production   │
│ branch      │    │ branch      │    │              │
├─────────────┤    ├─────────────┤    ├──────────────┤
│ Clerk Dev   │◄──►│ Clerk Dev   │    │ Clerk Prod   │
│ instance    │    │ instance    │    │ instance     │
└─────────────┘    └─────────────┘    └──────────────┘
     shared DB + auth                   isolated
```

## Code Standards

- **Formatting:** Prettier (run `pnpm format` before committing)
- **Linting:** ESLint (`pnpm lint`)
- **Type checking:** TypeScript strict (`pnpm typecheck`)
- **Commits:** Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/.env.local` | Local env vars (never committed) |
| `apps/web/src/middleware.ts` | Clerk auth middleware |
| `apps/web/src/lib/auth-helper.ts` | Auth context + auto-provisioning |
| `CLAUDE.md` | AI agent project context |
