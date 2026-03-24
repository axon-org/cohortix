# Spec: Layout & UX Shell Redesign

> **Purpose:** Redesign Cohortix layout shell — navigation, header, responsive behavior, density — to match approved mockup direction
> **Owner:** Alim (PM role for this spec)
> **Last Reviewed:** 2026-03-24
> **Read After:** docs/specs/feat-001-visual-identity-redesign.md

**ID:** feat-002
**Status:** Approved
**Created:** 2026-03-20
**Last Updated:** 2026-03-24

---

## Context

The visual identity redesign (feat-001) established the brand-light theme, token system, and color direction. However, the app still *feels* like Mission Control — high density, developer-oriented layout, compact panels. The approved v0 mockups showed a significantly different layout: more whitespace, simpler navigation, cleaner cards, friendlier density. This spec redesigns the layout shell that wraps ALL other screens.

**Prerequisite:** feat-001 (Visual Identity & UI Redesign) — merged to main ✅

**This is the foundation for feat-003 through feat-007.** Every screen sits inside this shell.

---

## Requirements
> **Section Ownership:** Author = PM · Reviewer = Specialist · Approver = Product Owner

### Functional Requirements

**Navigation Sidebar (nav-rail.tsx — 1502 lines)**
- [ ] FR1 (MUST): Sidebar redesign from compact nav-rail to friendlier sidebar pattern matching dashboard mockup
- [ ] FR2 (MUST): 4 nav groups preserved (CORE, OBSERVE, AUTOMATE, ADMIN) with all 27 menu items
- [ ] FR3 (MUST): Collapsible groups (`collapsedGroups`) work with new layout
- [ ] FR4 (MUST): Expandable parent items with nested children (e.g., Gateway → Gateways + Config)
- [ ] FR5 (MUST): Plugin navigation items render correctly in new layout
- [ ] FR6 (MUST): `ContextSwitcher` (org/tenant/project switching) redesigned for friendlier UX
- [ ] FR7 (MUST): `OrgRow` component (multi-org navigation) matches new design
- [ ] FR8 (MUST): Interface mode toggle (Essential vs Full) — Essential is default for simplicity, Full mode opt-in for power users
- [ ] FR9 (MUST): Keyboard navigation preserved (`handleKey` — arrow keys, focus management)
- [ ] FR10 (MUST): Sidebar collapse/expand toggle works on desktop
- [ ] FR11 (SHOULD): Sidebar hover-expand when collapsed (peek behavior)
- [ ] FR12 (SHOULD): Smooth animations on collapse/expand (per Codex §15)

**Header Bar (header-bar.tsx — 638 lines)**
- [ ] FR13 (MUST): Cohortix wordmark displayed prominently (per mockup)
- [ ] FR14 (MUST): Search input accessible from header
- [ ] FR15 (MUST): Status indicators preserved: `ModeBadge`, `NavigationLatencyStat`, `SseBadge`
- [ ] FR16 (MUST): Notifications bell functional
- [ ] FR17 (SHOULD): Header simplified — fewer stats, cleaner hierarchy

**Mobile Navigation**
- [ ] FR18 (MUST): `MobileBottomBar` shows priority items (items with `priority: true`)
- [ ] FR19 (MUST): `MobileBottomSheet` for full nav access on mobile
- [ ] FR20 (MUST): Touch targets ≥44px on all mobile nav elements
- [ ] FR21 (SHOULD): Bottom sheet groups match sidebar groups

**Responsive Shell**
- [ ] FR22 (MUST): Mobile-first — works on 320px+ viewports
- [ ] FR23 (MUST): Breakpoints: mobile (≤768px), tablet (769-1024px), desktop (1025px+)
- [ ] FR24 (MUST): Sidebar hidden on mobile, collapsible on tablet, visible on desktop

**Banners & HUD**
- [ ] FR25 (MUST): All 4 banners render correctly in new layout (local-mode, update, promo, doctor)
- [ ] FR26 (MUST): `connection-status.tsx` HUD visible and non-intrusive
- [ ] FR27 (MUST): `live-feed.tsx` real-time event overlay styled to match

**Density System**
- [ ] FR28 (MUST): Content area uses generous spacing (≥16px gaps between sections)
- [ ] FR29 (MUST): All spacing uses feat-001 token system (no hardcoded px values)
- [ ] FR30 (MUST): Density toggle (compact/comfortable/spacious) for power users

### Non-Functional Requirements
- **Performance:** No increase in JS bundle size from layout changes
- **Accessibility:** WCAG 2.1 AA — touch targets ≥44px, keyboard nav preserved, focus management
- **Responsiveness:** Mobile-first — 320px to 4K viewports
- **Compatibility:** All 12 themes render correctly with new layout
- **i18n:** All nav labels use existing `useTranslations` (already implemented)

---

## Architecture
> **Section Ownership:** Author = Specialist · Reviewer = PM · Approver = Product Owner

### Technology Stack
- Existing: React 19 + Next.js 16 + Tailwind CSS + shadcn/ui
- No new dependencies for layout changes
- Component tokens from feat-001 handle spacing/radius/shadow

### Components to Modify

| Component | File | Lines | Changes Needed |
|-----------|------|-------|----------------|
| NavRail | `layout/nav-rail.tsx` | 1502 | Redesign to sidebar pattern, update spacing/typography |
| NavButton | (in nav-rail.tsx) | — | Update sizing, active states, hover effects |
| MobileBottomBar | (in nav-rail.tsx) | — | Restyle to match new design |
| MobileBottomSheet | (in nav-rail.tsx) | — | Update layout and group display |
| ContextSwitcher | (in nav-rail.tsx) | — | Friendlier org/project switching UX |
| OrgRow | (in nav-rail.tsx) | — | Match new sidebar visual style |
| HeaderBar | `layout/header-bar.tsx` | 638 | Simplify, add wordmark, reduce density |
| ModeBadge | (in header-bar.tsx) | — | Restyle indicators |
| LiveFeed | `layout/live-feed.tsx` | 188 | Adjust positioning for new layout |
| ConnectionStatus | `hud/connection-status.tsx` | 125 | Style consistency |
| LocalModeBanner | `layout/local-mode-banner.tsx` | — | Adjust to new header spacing |
| UpdateBanner | `layout/update-banner.tsx` | — | Adjust to new header spacing |
| PromoBanner | `layout/promo-banner.tsx` | — | Adjust to new header spacing |
| DoctorBanner | `layout/openclaw-doctor-banner.tsx` | — | Adjust to new header spacing |

### Data Models
No data model changes — frontend layout only.

### API Contracts
No API changes.

### Design References (REQUIRED)
- **Approved mockups:** `docs/design/mockups/approved-direction/` (dashboard.png, task-board.png, agent-detail.png)
- **Dashboard mockup URL:** https://demo-kzmimklc6gvpv3joebm5.vusercontent.net/
- **Task Board mockup URL:** https://demo-kzmo44cwmcdayr8m8or6.vusercontent.net/
- **Agent Detail mockup URL:** https://demo-kzmp1f92m59ld4f54c42.vusercontent.net/
- **Token architecture:** `docs/design/token-architecture.md`
- **Design brief:** `docs/design/design-brief.md`

### Feature Flag
Not applicable — layout changes are visual, rollback via git revert.

---

## Dependencies
> **Section Ownership:** Author = PM + Specialist · Reviewer = PM + Specialist · Approver = Product Owner

### Agent Dependencies
- **UI Designer:** Mockup refinement if needed during implementation
- **Frontend Specialist:** Layout implementation
- **QA:** Visual regression testing across 12 themes × 4 breakpoints

### System Dependencies
- feat-001 token system (merged ✅)
- Playwright (for visual regression)

### Blocked By
- Nothing (feat-001 complete)

### Blocks
- feat-003 (Core Screens), feat-004 (Observe), feat-005 (Automate), feat-006 (Admin), feat-007 (Detail Views)

---

## Edge Cases

1. **Data-heavy nav:** Plugin items could add 10+ extra menu items — sidebar must scroll gracefully
2. **Theme interaction:** All 12 themes must look correct with new sidebar/header spacing
3. **Sidebar collapse on tablet:** Need clear behavior for 769-1024px range
4. **Context switcher with many orgs:** 10+ tenants must be scrollable/searchable
5. **Banner stacking:** Multiple banners (update + doctor + promo) must not push content below fold
6. **RTL support:** Nav layout should accommodate future RTL languages (prepare, don't implement)
7. **Essential mode:** Reduced nav items mode must still look balanced in new layout

---

## Testing Strategy

- **Visual regression:** Playwright screenshots of shell at 4 breakpoints (320, 768, 1024, 1440px) × 12 themes = 48 screenshots
- **Responsive:** Manual test sidebar behavior at every breakpoint transition
- **Functional:** All 27 nav items route correctly, sidebar collapse/expand, mobile bottom bar, context switcher
- **Accessibility:** axe-core scan, keyboard nav test (tab through all nav items), touch target verification
- **Build:** `pnpm build` + `pnpm typecheck` pass

---

## Acceptance Criteria
> **Section Ownership:** Author = PM · Reviewer = Specialist · Approver = Product Owner

- [ ] AC1: Sidebar matches approved mockup direction — wider, friendlier, readable labels, clear active states
- [ ] AC2: All 27 menu items accessible and routable in new sidebar
- [ ] AC3: Header shows Cohortix wordmark prominently, is visually simplified
- [ ] AC4: Nav items have ≥44px touch targets with clear active/hover states
- [ ] AC5: Mobile (≤768px) uses MobileBottomBar + MobileBottomSheet pattern
- [ ] AC6: Sidebar collapse/expand works on desktop with smooth animation
- [ ] AC7: ContextSwitcher (org/tenant/project) works in new layout
- [ ] AC8: Interface mode toggle (Essential vs Full) works correctly
- [ ] AC9: All 4 banners render without breaking layout
- [ ] AC10: All spacing uses feat-001 tokens (zero hardcoded px values in new code)
- [ ] AC11: Keyboard navigation works (arrow keys through nav items, focus visible)
- [ ] AC12: All 12 themes render correctly with new layout
- [ ] AC13: `pnpm build` + `pnpm typecheck` pass
- [ ] AC14: axe-core reports 0 critical/serious violations on shell
- [ ] AC15: Content area has ≥16px spacing between major sections

---

## Implementation Plan

### Phase 1: Sidebar Redesign
- NavRail → wider sidebar pattern
- NavButton restyling (sizing, typography, active states)
- Collapsible groups with new spacing
- ContextSwitcher UX improvement

### Phase 2: Header Simplification
- Add Cohortix wordmark
- Simplify status indicators
- Clean up search UI
- Adjust notification bell

### Phase 3: Mobile Navigation
- MobileBottomBar restyling
- MobileBottomSheet layout update
- Touch target verification

### Phase 4: Banners & HUD
- Banner spacing in new layout
- ConnectionStatus positioning
- LiveFeed overlay adjustment

### Phase 5: Density & Tokens
- Replace any hardcoded spacing with tokens
- Content area spacing system
- Verify all 12 themes

### Phase 6: QA
- Visual regression (48 screenshots)
- Responsive testing at all breakpoints
- Accessibility audit
- Keyboard navigation test

---

## Timeline

- **Spec Approval:** ✅ Approved 2026-03-24
- **Implementation Complete:** TBD (estimated 3-4 days after approval)
- **QA Complete:** TBD
- **Production Deploy:** TBD

---

## Decisions Log

| # | Decision | Approved By | Date |
|---|----------|-------------|------|
| D1 | Wider sidebar approved as default (must look good in practice) | Ahmad | 2026-03-24 |
| D2 | Essential mode kept — simple UI by default, Full mode opt-in for advanced users | Ahmad | 2026-03-24 |
| D3 | Density toggle promoted to MUST (no deferrals) | Ahmad | 2026-03-24 |
| D4 | nav-rail.tsx splitting into sub-components approved for implementation | Ahmad | 2026-03-24 |

---

## Notes

- This spec builds on feat-001. Token system, brand colors, and theme infrastructure are already in place.
- nav-rail.tsx is 1502 lines — approved for splitting into sub-components during implementation (NavSidebar, NavGroup, NavItem, MobileNav).
- The approved mockups serve as directional reference. Implementation should match the *feel* not pixel-perfect copy.
- Plugin nav items are dynamic — test with 0, 1, and 5+ plugin items.
