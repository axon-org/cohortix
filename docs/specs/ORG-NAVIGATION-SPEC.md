# Feature Specification: Org-Based Navigation Hierarchy

**Version:** 1.0 **Date:** 2026-02-24 **Status:** Draft — Awaiting CEO Approval
**Owner:** Alim (CEO Proxy) **Stakeholders:** Ahmad (CEO), Lubna (UI), Devi
(Backend), Sami (Frontend) **Branch:** `feature/org-navigation` (from `dev`)
**Codex Compliance:** Axon Dev Codex v1.6 §1, §2, §3

---

## 1. Executive Summary

Restructure Cohortix from flat `/dashboard/*` routing to org-scoped
`/[orgSlug]/*` routing, matching enterprise patterns used by Linear, Vercel, and
GitHub. This includes a full sidebar redesign, Clerk OrganizationSwitcher
integration, org-aware middleware, enhanced onboarding with slug selection, and
access control pages.

**Why now:** Multi-tenant org support is already in the DB schema
(`organizations` table with `slug` field, `org_memberships` with RBAC roles).
The routing layer is the last piece — without it, URLs aren't shareable,
org-switching isn't possible, and the app can't scale to multi-org users.

---

## 2. Goals & Non-Goals

### Goals

- Org-slug in all authenticated URLs (`/[orgSlug]/dashboard`,
  `/[orgSlug]/missions`, etc.)
- Multi-org support from day 1 (user can belong to multiple orgs)
- Clerk `<OrganizationSwitcher />` with custom Linear-dark theming
- Full sidebar redesign with research-backed information architecture
- Enhanced onboarding with org name + slug input step
- Role-based middleware (owner/admin/member/viewer)
- "Request Access" page for unauthorized deep links
- "My Tasks" cross-operation personal view

### Non-Goals (Deferred)

- Billing integration (separate feature branch)
- Inbox feature (placeholder only — "Coming Soon")
- Subdomain-per-org routing (`acme.cohortix.ai`)
- Agent runtime configuration UI (placeholder in Agents page)
- Full "My Tasks" backend aggregation (MVP: frontend filter on existing tasks
  API)

---

## 3. Current State (Codebase Audit)

### What Exists

| Component               | Status                                                             | Location                                          |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------------------------- |
| `organizations` table   | ✅ Has `slug` field                                                | `packages/database/src/schema/organizations.ts`   |
| `org_memberships` table | ✅ Has RBAC roles (owner/admin/member/viewer)                      | `packages/database/src/schema/org-memberships.ts` |
| Clerk webhook           | ✅ Syncs `organization.created` + `organizationMembership.created` | `apps/web/src/app/api/webhooks/clerk/route.ts`    |
| `getAuthContext()`      | ✅ Resolves org from Clerk session                                 | `apps/web/src/lib/auth-helper.ts`                 |
| Onboarding page         | ✅ Prompts org name, creates via Clerk                             | `apps/web/src/app/onboarding/page.tsx`            |
| Middleware              | ⚠️ Auth-only, no org validation                                    | `apps/web/src/middleware.ts`                      |
| Sidebar                 | ⚠️ Flat hardcoded routes, no org switcher                          | `apps/web/src/components/dashboard/sidebar.tsx`   |
| Dashboard routes        | ⚠️ Flat: `/dashboard/*`                                            | `apps/web/src/app/dashboard/`                     |
| API routes              | ✅ Session-scoped via `getAuthContext()`                           | `apps/web/src/app/api/v1/`                        |

### What Needs to Change

1. **Routes:** Move `apps/web/src/app/dashboard/` →
   `apps/web/src/app/[orgSlug]/`
2. **Middleware:** Add org-slug validation + membership check + role extraction
3. **Sidebar:** Full redesign with org switcher + new IA
4. **Onboarding:** Add slug input step with auto-suggestion + uniqueness check
5. **New pages:** Access denied, My Tasks
6. **Layout:** Update dashboard layout to pass org context

---

## 4. URL Structure

### Authenticated Routes (under `[orgSlug]`)

```
/[orgSlug]/                          → Dashboard/Overview
/[orgSlug]/inbox                     → Inbox (Coming Soon placeholder)
/[orgSlug]/my-tasks                  → My Tasks (cross-operation personal view)
/[orgSlug]/missions                  → All missions
/[orgSlug]/missions/[id]             → Single mission detail
/[orgSlug]/operations                → All operations
/[orgSlug]/operations/[id]           → Single operation detail (5-tab view)
/[orgSlug]/cohorts                   → All cohorts
/[orgSlug]/cohorts/[id]              → Single cohort detail
/[orgSlug]/agents                    → Agent directory
/[orgSlug]/agents/[id]               → Single agent detail
/[orgSlug]/settings                  → Org settings (general)
/[orgSlug]/settings/members          → Member management
/[orgSlug]/settings/billing          → Billing (placeholder)
/[orgSlug]/settings/integrations     → Integrations (placeholder)
```

### Account Routes (org-independent)

```
/account                             → Personal account settings
/account/profile                     → Profile (name, avatar, email)
/account/preferences                 → Theme, notifications, language
/account/security                    → Password, 2FA, sessions
```

### Public/Unauthenticated Routes

```
/                                    → Landing page (future)
/sign-in                             → Clerk sign-in
/sign-up                             → Clerk sign-up
/onboarding                          → Org creation flow
/access-denied                       → "Request Access" page
/api/webhooks/clerk                  → Clerk webhooks
/api/health                          → Health check
/api/ready                           → Readiness check
```

### API Routes (NO change — stay session-scoped)

```
/api/v1/operations                   → Uses getAuthContext() for org scoping
/api/v1/missions                     → Session token carries active org
/api/v1/cohorts                      → No slug in API paths
/api/v1/agents                       → Secure, no enumeration risk
```

**Rationale:** Enterprise best practice is to keep APIs session-scoped (token
carries org context) and only put slugs in frontend URLs for shareability. This
avoids slug enumeration, simplifies API versioning, and matches AWS SaaS
multi-tenant guidance.

---

## 5. Middleware Specification

### Current Middleware (auth-only)

```typescript
// Only checks: is user logged in? If not, redirect to /sign-in
```

### New Middleware (org-aware)

```typescript
// Pseudocode — actual implementation follows Codex patterns

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // 1. Public routes — pass through
  if (isPublicRoute(request)) return NextResponse.next();

  // 2. Auth check
  const { userId, orgId, orgSlug: activeOrgSlug } = await auth();
  if (!userId) return redirect('/sign-in');

  // 3. Account routes — no org needed
  if (pathname.startsWith('/account')) return NextResponse.next();

  // 4. Onboarding — no org needed
  if (pathname.startsWith('/onboarding')) return NextResponse.next();

  // 5. API routes — session-scoped, no slug validation needed
  if (pathname.startsWith('/api/')) return NextResponse.next();

  // 6. Extract orgSlug from URL
  const urlOrgSlug = extractOrgSlug(pathname); // first path segment

  // 7. No slug in URL — redirect to active org or onboarding
  if (!urlOrgSlug) {
    if (activeOrgSlug) return redirect(`/${activeOrgSlug}/`);
    return redirect('/onboarding');
  }

  // 8. Validate: does this org exist?
  const org = await lookupOrgBySlug(urlOrgSlug);
  if (!org) return redirect('/access-denied?reason=not-found');

  // 9. Validate: is user a member of this org?
  const membership = await checkMembership(userId, org.id);
  if (!membership)
    return redirect('/access-denied?reason=not-member&org=' + urlOrgSlug);

  // 10. If URL org differs from active Clerk org, switch active org
  if (activeOrgSlug !== urlOrgSlug) {
    // Set active org in Clerk session via header
    // Clerk middleware handles this via orgId param
  }

  // 11. Inject org context into headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-org-id', org.id);
  response.headers.set('x-org-slug', urlOrgSlug);
  response.headers.set('x-org-role', membership.role);
  return response;
});
```

### Performance Consideration

Org lookup + membership check on every request could be slow. Mitigations:

- **Cache org slug → org ID mapping** in-memory (org slugs are immutable per
  spec)
- **Clerk's `auth()` already returns `orgId`** — use that instead of DB lookup
  when possible
- **Edge middleware** — keep it lightweight, defer heavy checks to layout/page
  level if needed

---

## 6. Sidebar Redesign

### Information Architecture (Research-Backed)

```
┌─────────────────────────────────┐
│ 🔄 Org Switcher                 │  ← Clerk <OrganizationSwitcher /> custom themed
│ ─────────────────────────────── │
│ 📊 Dashboard                    │  ← /[orgSlug]/
│ 📥 Inbox              🔵 Soon  │  ← /[orgSlug]/inbox (placeholder)
│ ✅ My Tasks                     │  ← /[orgSlug]/my-tasks
│ ─────────────────────────────── │  ← Divider: "personal" above, "workspace" below
│ 🎯 Missions                    │  ← /[orgSlug]/missions
│ 📁 Operations                   │  ← /[orgSlug]/operations
│ 👥 Cohorts                      │  ← /[orgSlug]/cohorts
│ 🤖 Agents                      │  ← /[orgSlug]/agents
│ ─────────────────────────────── │
│ ⚙️ Settings                    │  ← /[orgSlug]/settings
│ 👤 Account                      │  ← /account
└─────────────────────────────────┘
```

### Grouping Rationale

| Group                  | Items                                 | Purpose                                     |
| ---------------------- | ------------------------------------- | ------------------------------------------- |
| **Daily workflow**     | Dashboard, Inbox, My Tasks            | High-frequency, checked every session       |
| **Workspace entities** | Missions, Operations, Cohorts, Agents | Organizational containers, medium frequency |
| **Admin**              | Settings, Account                     | Low frequency, configuration                |

### Design Requirements

- **Org Switcher:** Custom themed to match Linear-dark aesthetic. Clerk's
  `<OrganizationSwitcher />` with `appearance` prop for theming. Must support:
  switch org, create new org, org avatar/name display.
- **Collapsible:** Keep existing collapse behavior (icon-only mode at 64px)
- **Active indicator:** Keep existing left-border active state
- **Coming Soon badge:** Small muted pill badge for Inbox
- **Responsive:** Sidebar hidden on mobile, accessible via hamburger menu
- **Keyboard navigation:** Tab through items, Enter to navigate

### Sidebar Component Changes

**Current:** Hardcoded `navigation` array with `/dashboard/*` paths **New:**
Dynamic `navigation` array using `orgSlug` from URL params

```typescript
// Pseudocode
const orgSlug = useParams().orgSlug;

const navigation = [
  // Daily workflow
  { name: 'Dashboard', href: `/${orgSlug}`, icon: LayoutGrid },
  { name: 'Inbox', href: `/${orgSlug}/inbox`, icon: Inbox, badge: 'Soon' },
  { name: 'My Tasks', href: `/${orgSlug}/my-tasks`, icon: CheckSquare },
  // Divider
  { type: 'divider' },
  // Workspace
  { name: 'Missions', href: `/${orgSlug}/missions`, icon: Target },
  { name: 'Operations', href: `/${orgSlug}/operations`, icon: FolderKanban },
  { name: 'Cohorts', href: `/${orgSlug}/cohorts`, icon: Users },
  { name: 'Agents', href: `/${orgSlug}/agents`, icon: Bot },
];
```

---

## 7. Onboarding Enhancement

### Current Flow

1. User signs up via Clerk
2. Redirected to `/onboarding`
3. Prompted: "Name your organization"
4. Org created → redirect to `/dashboard`

### New Flow

1. User signs up via Clerk
2. Redirected to `/onboarding`
3. **Step 1 — Welcome:** "Welcome to Cohortix, [name]!" → Continue
4. **Step 2 — Create Organization:**
   - Organization name input (required)
   - **Slug input** (auto-generated from name, editable)
     - Auto-suggestion: lowercase, hyphenated (e.g., "Acme Corp" → "acme-corp")
     - Real-time uniqueness check (debounced API call)
     - Validation: lowercase alphanumeric + hyphens, 3-50 chars, no
       leading/trailing hyphens
     - **Warning:** "This URL cannot be changed later" (shown below slug input)
   - Create button
5. Org created → redirect to `/[slug]/` (their new org dashboard)

### Slug Validation Rules

```
- Allowed: [a-z0-9-]
- Length: 3-50 characters
- No leading/trailing hyphens
- No consecutive hyphens
- Must not match reserved slugs: [api, app, admin, account, onboarding, sign-in, sign-up, access-denied, settings, help, docs, blog, pricing, about, status, health, ready]
- Unique across all organizations (case-insensitive)
- Immutable after creation (cannot be changed)
```

### API Endpoint for Slug Validation

```
GET /api/v1/org-slug/check?slug=acme-corp
Response: { available: boolean, suggestion?: string }
```

---

## 8. Access Denied Page

### Route: `/access-denied`

### Scenarios

| Query Param                   | Display                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `?reason=not-found`           | "This workspace doesn't exist" + "Go to your workspace" link                                |
| `?reason=not-member&org=acme` | "You don't have access to **acme**" + "Request Access" button + "Go to your workspace" link |

### "Request Access" Flow (MVP)

1. User clicks "Request Access"
2. Creates a notification/record for org admins (stored in `access_requests`
   table or Clerk invitation system)
3. Shows confirmation: "Access requested. The workspace admin will review your
   request."
4. Org admin sees pending requests in Settings → Members

### "Go to your workspace" Link

- If user has an active org → redirect to `/${activeOrgSlug}/`
- If user has no org → redirect to `/onboarding`

---

## 9. My Tasks Page

### Route: `/[orgSlug]/my-tasks`

### Purpose

Cross-operation view of all tasks assigned to the current user within this org.

### MVP Implementation

- Query existing tasks API with `assigneeId=currentUser` filter
- Display as a flat list grouped by Operation (parent)
- Columns: Task name, Status, Priority, Operation (parent link), Due date
- Filter: Status (all/active/completed), Priority
- Sort: Due date, Priority, Recently updated

### Future Enhancement (not in this branch)

- Drag-and-drop status changes
- Inline editing
- Calendar view
- "Assigned to me" from Missions (not just Operations)

---

## 10. Settings Hierarchy

### Org Settings: `/[orgSlug]/settings`

| Route                              | Content                                                | Access     |
| ---------------------------------- | ------------------------------------------------------ | ---------- |
| `/[orgSlug]/settings`              | General: Org name, logo, description                   | Admin+     |
| `/[orgSlug]/settings/members`      | Member list, invite, role management, pending requests | Admin+     |
| `/[orgSlug]/settings/billing`      | Billing & subscription (placeholder)                   | Owner only |
| `/[orgSlug]/settings/integrations` | Connected services (placeholder)                       | Admin+     |

### Personal Account: `/account`

| Route                  | Content                                |
| ---------------------- | -------------------------------------- |
| `/account`             | Profile overview                       |
| `/account/profile`     | Name, avatar, email                    |
| `/account/preferences` | Theme, notification settings, language |
| `/account/security`    | Password, 2FA, active sessions         |

**Rationale:** Billing lives under org settings (not personal account) because
billing is per-workspace — this matches Notion, Linear, and enterprise SaaS best
practice. Each org has its own plan and billing cycle.

---

## 11. File System Changes

### Directory Restructure

```
apps/web/src/app/
├── (auth)/                          # Auth pages (unchanged)
│   ├── sign-in/[[...sign-in]]/
│   └── sign-up/[[...sign-up]]/
├── onboarding/                      # Enhanced with slug step
│   └── page.tsx
├── access-denied/                   # NEW
│   └── page.tsx
├── account/                         # NEW — personal settings
│   ├── layout.tsx
│   ├── page.tsx
│   ├── profile/page.tsx
│   ├── preferences/page.tsx
│   └── security/page.tsx
├── [orgSlug]/                       # NEW — org-scoped routes
│   ├── layout.tsx                   # Sidebar + Header + org context
│   ├── page.tsx                     # Dashboard (moved from dashboard/)
│   ├── inbox/page.tsx               # Placeholder
│   ├── my-tasks/page.tsx            # NEW
│   ├── missions/
│   │   ├── page.tsx                 # List
│   │   └── [id]/page.tsx            # Detail
│   ├── operations/
│   │   ├── page.tsx                 # Grid/List/Kanban
│   │   └── [id]/page.tsx            # Detail (5-tab)
│   ├── cohorts/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── agents/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   └── settings/
│       ├── layout.tsx               # Settings sub-nav
│       ├── page.tsx                 # General
│       ├── members/page.tsx
│       ├── billing/page.tsx         # Placeholder
│       └── integrations/page.tsx    # Placeholder
├── api/                             # API routes (UNCHANGED)
│   ├── v1/
│   └── webhooks/
└── layout.tsx                       # Root layout
```

### Files to Delete (after migration)

- `apps/web/src/app/dashboard/` — entire directory (replaced by `[orgSlug]/`)

---

## 12. Implementation Plan

### Sub-Feature Branches

This is a large feature. Per Codex branching strategy, we break it into
sequential sub-feature branches off `dev`, each merged before the next begins.

| #   | Branch                          | Scope                                                                 | Specialist                       | Est.   |
| --- | ------------------------------- | --------------------------------------------------------------------- | -------------------------------- | ------ |
| 1   | `feature/org-nav-middleware`    | Middleware + org slug validation + route restructure (empty pages OK) | Devi (Backend) + Sami (Frontend) | 2 days |
| 2   | `feature/org-nav-sidebar`       | Sidebar redesign + Clerk OrganizationSwitcher + theming               | Lubna (UI) + Sami (Frontend)     | 2 days |
| 3   | `feature/org-nav-onboarding`    | Enhanced onboarding with slug step + slug check API                   | Devi (Backend) + Sami (Frontend) | 1 day  |
| 4   | `feature/org-nav-access-denied` | Access denied page + request access flow                              | Sami (Frontend)                  | 1 day  |
| 5   | `feature/org-nav-my-tasks`      | My Tasks page (frontend filter on existing API)                       | Lubna (UI) + Sami (Frontend)     | 1 day  |
| 6   | `feature/org-nav-settings`      | Settings hierarchy (org settings + account pages)                     | Sami (Frontend)                  | 1 day  |
| 7   | `feature/org-nav-cleanup`       | Delete old `/dashboard/` routes, update all internal links, QA        | Nina (QA)                        | 1 day  |

**Total estimated: 9 days (some parallel work possible)**

### Execution Order & Dependencies

```
Branch 1 (middleware + routes) ──► merge to dev
    │
    ├── Branch 2 (sidebar) ──► merge to dev
    │
    ├── Branch 3 (onboarding) ──► merge to dev
    │
    └── Branch 4 (access denied) ──► merge to dev
              │
              ├── Branch 5 (my tasks) ──► merge to dev
              │
              ├── Branch 6 (settings) ──► merge to dev
              │
              └── Branch 7 (cleanup + QA) ──► merge to dev
```

Branch 1 is the foundation — all others depend on it. Branches 2-4 can run in
parallel after Branch 1 merges. Branches 5-6 can run in parallel after 2-4.
Branch 7 is final cleanup.

---

## 13. Migration & Backwards Compatibility

### URL Redirects

All existing `/dashboard/*` URLs must redirect to `/[activeOrgSlug]/*`:

- `/dashboard` → `/[activeOrgSlug]/`
- `/dashboard/missions` → `/[activeOrgSlug]/missions`
- `/dashboard/operations` → `/[activeOrgSlug]/operations`
- etc.

This is handled in middleware — if path starts with `/dashboard`, redirect to
`/${activeOrgSlug}/${rest}`.

### Existing Data

No data migration needed. The `organizations` table already has `slug`. The
Clerk webhook already syncs orgs. We just need to ensure:

1. All existing orgs have a valid slug (audit + backfill if needed)
2. Clerk's `org.slug` matches our DB `organizations.slug`

### API Routes

No changes. APIs remain at `/api/v1/*` and use `getAuthContext()` for org
scoping.

---

## 14. Acceptance Criteria

### Branch 1: Middleware + Routes

- [ ] Visiting `/[orgSlug]/` loads dashboard for valid org member
- [ ] Visiting `/[orgSlug]/` redirects to `/access-denied` for non-member
- [ ] Visiting `/dashboard` redirects to `/[activeOrgSlug]/`
- [ ] Visiting invalid slug shows access denied
- [ ] API routes unchanged and functional
- [ ] All existing pages render (content can be placeholder)

### Branch 2: Sidebar

- [ ] Org switcher displays at top, themed to Linear-dark
- [ ] Switching org navigates to new `/[orgSlug]/`
- [ ] Creating new org from switcher works
- [ ] Navigation items use dynamic org slug in URLs
- [ ] Inbox shows "Coming Soon" badge
- [ ] Sidebar collapses to icon-only mode
- [ ] Active state highlights correctly
- [ ] Dividers between sections render

### Branch 3: Onboarding

- [ ] Slug input auto-generates from org name
- [ ] Real-time uniqueness check works (debounced)
- [ ] Validation rules enforced (length, characters, reserved words)
- [ ] "Cannot be changed later" warning visible
- [ ] After creation, redirects to `/[slug]/`
- [ ] Reserved slugs rejected

### Branch 4: Access Denied

- [ ] "Not found" variant renders for invalid slugs
- [ ] "Not member" variant renders with org name
- [ ] "Request Access" button creates notification
- [ ] "Go to your workspace" redirects correctly
- [ ] No org → redirects to onboarding

### Branch 5: My Tasks

- [ ] Shows tasks assigned to current user across all operations
- [ ] Grouped by parent Operation
- [ ] Filter by status and priority works
- [ ] Sort by due date, priority works
- [ ] Click task navigates to operation detail

### Branch 6: Settings

- [ ] Org settings accessible at `/[orgSlug]/settings`
- [ ] Member management shows org members with roles
- [ ] Billing and Integrations show placeholder
- [ ] Account settings at `/account` with profile/preferences/security
- [ ] Settings access respects role (admin+ for most, owner for billing)

### Branch 7: Cleanup

- [ ] No references to `/dashboard/` remain in codebase
- [ ] All internal links use `/${orgSlug}/` pattern
- [ ] No 404s or broken links
- [ ] TypeScript: 0 errors
- [ ] Lint: 0 errors
- [ ] Existing tests pass (updated as needed)

---

## 15. Risks & Mitigations

| Risk                                           | Impact               | Mitigation                                                               |
| ---------------------------------------------- | -------------------- | ------------------------------------------------------------------------ |
| Middleware performance (DB lookup per request) | Latency increase     | Cache slug→org mapping; use Clerk's auth() orgId when possible           |
| Existing bookmarks/links break                 | User confusion       | `/dashboard/*` → `/${orgSlug}/*` redirects in middleware                 |
| Clerk OrganizationSwitcher theming limitations | Brand inconsistency  | Test Clerk `appearance` prop; fallback to custom switcher if needed      |
| Slug collision with future routes              | Routing conflicts    | Reserved slug list; validate against it                                  |
| Multi-org session confusion                    | Wrong data displayed | Middleware validates URL slug matches session org; auto-switch if needed |

---

## 16. Open Questions (For Future Branches)

1. **Billing model:** Per-org seat-based (like Notion)? Needs separate spec.
2. **Agent runtime selection:** Own hardware vs VM vs Cohortix runtime — needs
   architecture spec.
3. **Inbox feature:** Full email consolidation for agents — needs separate spec.
4. **Org slug changes:** Currently immutable. Should we support slug migration
   with redirects in the future?
5. **Org deletion:** What happens to data? Soft delete? Needs policy.

---

## 17. References

- [Notion Workspace Billing Model](https://www.notion.com/help/billing)
- [Linear Workspaces](https://linear.app/docs/workspaces)
- [AWS SaaS Tenant Routing](https://aws.amazon.com/blogs/networking-and-content-delivery/tenant-routing-strategies-for-saas-applications/)
- [Clerk Organizations](https://clerk.com/docs/organizations/overview)
- [UX Sidebar Best Practices](https://uxplanet.org/best-ux-practices-for-designing-a-sidebar-9174ee0ecaa2)
- [Cohortix PRD v2.0](../specs/PRD.md)
- [Axon Dev Codex v1.6](~/Projects/axon/dev-codex/THE-AXON-CODEX.md)

---

_Spec written by Alim (CEO Proxy) based on 18 Q&A rounds with Ahmad (CEO) and
web research across enterprise SaaS patterns._
