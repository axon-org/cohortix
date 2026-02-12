# ADR-002: Turborepo Monorepo Structure

**Status:** Accepted  
**Date:** 2026-02-11  
**Author:** PM (Codex Compliance Initiative)  
**Reviewers:** Ahmad Ashfaq, Devi (ai-developer), Idris (architect)  
**Related ADRs:** ADR-001 (Tech Stack)

---

## Context

**What is the problem or situation that requires a decision?**

Cohortix needs a repository structure that supports:
- **Code sharing:** UI components, database schemas, TypeScript types, utilities shared between web app, mobile PWA (future), and CLI (future)
- **Independent deployment:** Web app and API can be deployed independently if needed
- **Fast builds:** Incremental builds, caching, parallel task execution
- **Type safety across packages:** Shared types that stay in sync
- **Developer experience:** Single `git clone`, unified tooling, one `pnpm install`

**Constraints:**
- Must support multiple apps (web, mobile PWA, docs site)
- Must support shared packages (database, UI, types, utils)
- Must integrate with Vercel deployment (monorepo-aware)
- Build times must scale as codebase grows (caching required)
- Type errors in one package must not block unrelated packages

**Assumptions:**
- Team uses pnpm as package manager (faster than npm/yarn)
- Vercel deployment is primary (monorepo support required)
- Multiple apps will exist in future (mobile PWA, docs site, admin dashboard)

---

## Decision

**We will use Turborepo with pnpm workspaces.**

**Repository Structure:**

```
cohortix/
├── apps/                       # Applications (independently deployable)
│   ├── web/                    # Main Next.js SaaS app
│   ├── docs/                   # Documentation site (future)
│   └── mobile/                 # Mobile PWA (future)
│
├── packages/                   # Shared packages (internal dependencies)
│   ├── database/               # Drizzle schema, client, migrations
│   ├── types/                  # Shared TypeScript types
│   ├── ui/                     # Shared UI components (shadcn/ui)
│   ├── utils/                  # Shared utility functions
│   └── config/                 # Shared configurations
│
├── tooling/                    # Development tooling (configs only)
│   ├── eslint/                 # ESLint shared configs
│   ├── typescript/             # TypeScript shared configs
│   └── tailwind/               # Tailwind shared configs
│
├── docs/                       # Project documentation
├── scripts/                    # Development scripts
├── turbo.json                  # Turborepo task pipeline
├── pnpm-workspace.yaml         # pnpm workspace definition
└── package.json                # Root package.json
```

**Rationale:**

1. **Turborepo for caching:** Intelligent build caching (local + remote) prevents rebuilding unchanged packages. Speeds up CI/CD by 3-5x.

2. **pnpm workspaces:** Efficient disk usage (shared dependencies via symlinks), fast installs, strict dependency management (no phantom dependencies).

3. **Clear separation:** `apps/` (deployable), `packages/` (shared code), `tooling/` (configs). Easy to understand, follows Vercel conventions.

4. **Vercel-native support:** Vercel detects Turborepo automatically, builds only changed apps, uses remote caching.

5. **Future-proof:** Easy to add new apps (mobile PWA, admin dashboard) without restructuring.

---

## Options Considered

### Option 1: Polyrepo (Separate Repositories)

**Pros:**
- Complete isolation between projects
- Independent versioning
- Smaller repository size

**Cons:**
- Code duplication (UI components, types, utils copied across repos)
- Type drift (shared types fall out of sync)
- Complex dependency management (need to publish internal packages to npm)
- Slower development (change in shared code requires publishing, version bumping)
- Poor DX for agents (need to clone multiple repos)

**Why not chosen:**  
Code sharing is critical for Cohortix. Duplicating database schema, types, and UI components across repos leads to bugs and maintenance burden.

---

### Option 2: Turborepo + pnpm ✅ **SELECTED**

**Pros:**
- **Shared code without publishing:** Packages consumed directly via workspace protocol
- **Type safety:** Changes to types are immediately reflected across packages
- **Fast builds:** Turborepo caching (local + remote)
- **Single source of truth:** One `git clone`, one `pnpm install`
- **Vercel integration:** Native monorepo support, per-app deployments
- **Incremental adoption:** Start with one app, add more later

**Cons:**
- Slightly more complex setup than single-app repo
- Build configuration spans multiple files (turbo.json, root package.json)
- Need to understand workspace protocol (`workspace:*`)

**Why chosen:**  
Best balance of code sharing, type safety, and build performance. Turborepo's caching is critical for CI/CD speed.

---

### Option 3: Nx Monorepo

**Pros:**
- More powerful than Turborepo (advanced features like affected commands)
- Strong Angular ecosystem (if we used Angular)

**Cons:**
- Overkill for our use case (we don't need Nx's advanced features)
- Steeper learning curve
- Turborepo is Vercel-native (same team maintains both)
- Nx is more opinionated (enforces stricter conventions)

**Why not chosen:**  
Turborepo provides everything we need with simpler mental model. Vercel's first-class Turborepo support is a major advantage.

---

## Consequences

### Positive Consequences

- ✅ **Zero code duplication:** UI components, types, schemas shared across apps
- ✅ **Type safety:** TypeScript errors surface immediately across packages
- ✅ **Fast CI/CD:** Turborepo remote cache (Vercel) speeds up builds by 3-5x
- ✅ **Easy testing:** Run `pnpm test` at root to test entire monorepo
- ✅ **Future-ready:** Adding mobile app or admin dashboard requires only `apps/mobile/` directory

### Negative Consequences

- ❌ **Learning curve:** Developers must understand workspace protocol, Turborepo tasks
- ❌ **Build complexity:** Incorrect task pipelines can break builds
- ❌ **Global dependency conflicts:** All apps share root pnpm lock file (harder to use different versions)

### Mitigation Strategies

- **Learning curve:** Document monorepo patterns in AGENTS.md. Provide examples in CLAUDE.md.
- **Build complexity:** Test `turbo.json` changes in CI before merging. Use `turbo --dry` to preview task execution.
- **Dependency conflicts:** Use pnpm overrides sparingly. Prefer unified versions across packages (enforced by Renovate).

---

## Implementation

### Action Items

- [x] Initialize Turborepo (`pnpm dlx create-turbo@latest`)
- [x] Set up pnpm workspace (`pnpm-workspace.yaml`)
- [x] Configure task pipelines (`turbo.json`)
- [x] Migrate existing code to `apps/web/`
- [x] Extract shared code to `packages/` (database, types, ui)
- [x] Set up Vercel remote caching
- [x] Document workspace conventions in AGENTS.md

**Owner:** Devi (ai-developer)  
**Completed:** February 5, 2026

### Validation Criteria

- [x] `pnpm install` completes in <30 seconds
- [x] `pnpm build` uses Turborepo caching (subsequent builds <10 seconds)
- [x] Type errors in `packages/database` surface in `apps/web` immediately
- [x] Vercel builds detect changed apps and skip unchanged apps
- [x] CI pipeline uses remote caching (build time <5 minutes)

**Review Date:** 2026-05-01 (After adding second app to monorepo)

---

## References

**Supporting Documents:**
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces Guide](https://pnpm.io/workspaces)
- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)

**Related Work:**
- ADR-001: Tech stack selection
- `docs/FOLDER_STRUCTURE.md` — Detailed repository layout

---

## Status History

| Date | Status | Notes |
|------|--------|-------|
| 2026-02-05 | Proposed | Chosen during project setup |
| 2026-02-05 | Accepted | Implemented by Devi |
| 2026-02-11 | Documented | Formalized as ADR-002 during Codex compliance rollout |

---

## Notes

**Turborepo Task Pipeline:**

Our `turbo.json` defines these tasks:
- `build` — Build all apps and packages (depends on `^build` of dependencies)
- `dev` — Start dev server (no caching)
- `lint` — Run ESLint (caching enabled)
- `type-check` — Run TypeScript compiler (caching enabled)
- `test` — Run tests (caching enabled)

**Cache Inputs:** Turborepo caches based on:
- File content hashes (all files in package directory)
- Environment variables (if specified in `turbo.json`)
- Task outputs (defined in `turbo.json`)

**Remote Cache:** Vercel provides free remote caching for Turborepo. Shared across team members and CI.

**Workspace Protocol Example:**

```json
// apps/web/package.json
{
  "dependencies": {
    "@repo/database": "workspace:*",
    "@repo/ui": "workspace:*"
  }
}
```

The `workspace:*` protocol resolves to the local package in `packages/database/`, no publishing required.

---

*This ADR follows the Axon Codex v1.2 ADR Standards (§5.1.3).*
