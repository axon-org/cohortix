# Spec: Observe Screens Redesign

<!-- Purpose: Redesign the 6 Observe screens to match the approved design direction from feat-001/002/003 -->
<!-- Owner: Alim (PM) -->
<!-- Last Reviewed: 2026-03-27 -->
<!-- Read After: docs/specs/feat-003-core-screens-redesign.md -->

> **Purpose:** Redesign the 6 Observe screens to match the approved design direction
> **Owner:** Alim (PM role for this spec)
> **Last Reviewed:** 2026-03-27
> **Read After:** docs/specs/feat-003-core-screens-redesign.md

**ID:** feat-004
**Status:** Approved
**Created:** 2026-03-26
**Last Updated:** 2026-03-27

---

## Discovery (Phase 1)

### 5 Mandatory Questions

| # | Question | Answer |
|---|----------|--------|
| 1 | **Intent & Goals** | Pure visual redesign — align 6 Observe screens with feat-001/002/003 design language. No new features added, no existing features removed. |
| 2 | **Scope & Boundaries** | All 6 screens in scope. Implementation order based on dependency/complexity logic (simpler screens first → complex last). No deprioritization. |
| 3 | **Technical Constraints** | None. Design tokens from feat-001 already in place. No timeline pressure. No external blockers. |
| 4 | **Edge Cases** | Empty states for all screens, high-volume data (10k+ logs), all 12 themes must render correctly, Office sprite performance with 20+ agents, theme compatibility with sprite colors. |
| 5 | **Acceptance Criteria** | Every existing feature/component preserved and functional. Zero regressions. All themes render correctly. Build + typecheck pass. Zero hardcoded values. |

**Discovery approved by:** Ahmad (Product Owner) — 2026-03-27

---

## Context

With the layout shell (feat-002) and Core screens (feat-003) complete, the 6 Observe screens need visual redesign. These are monitoring and observation screens — Activity, Logs, Cost Tracker, Nodes, Approvals, and Office. They range from straightforward list views (Activity, Logs) to complex visualizations (Office's isometric virtual office with sprite animations).

**This is a pure visual redesign** — applying the approved design tokens, card patterns, and UX patterns from feat-001/002/003. No functional changes, no features added or removed.

**Prerequisites:** feat-001 ✅ merged · feat-002 ✅ merged · feat-003 ✅ merged

---

## Requirements
> **Section Ownership:** Author = PM · Reviewer = Specialist · Approver = Product Owner

### Screen 1: Activity (activity-feed-panel.tsx — 622 lines)
**Sub-components:** ActivityRow, TimelineRow, formatRelativeTime, groupByDay

**Functional Requirements:**
- [ ] FR1 (MUST): Activity feed redesigned with friendly density — clear event cards, readable timestamps
- [ ] FR2 (MUST): Timeline view (TimelineRow) styled with new design tokens
- [ ] FR3 (MUST): Day grouping headers (groupByDay) use consistent section styling
- [ ] FR4 (MUST): Relative timestamps (formatRelativeTime) displayed clearly
- [ ] FR5 (SHOULD): Activity type icons/badges distinguish event categories visually
- [ ] FR6 (SHOULD): Smooth scroll with virtualization for large activity lists

### Screen 2: Logs (log-viewer-panel.tsx — 411 lines)
**Sub-components:** LogViewerPanel, downloadFile

**Functional Requirements:**
- [ ] FR7 (MUST): Log viewer redesigned — monospace log entries, severity color coding, filter controls
- [ ] FR8 (MUST): Log severity levels (info, warn, error, debug) use consistent color tokens
- [ ] FR9 (MUST): Search/filter functionality styled consistently with app-wide search
- [ ] FR10 (MUST): Download function (downloadFile) accessible via clear action button
- [ ] FR11 (SHOULD): Log entries have expandable detail for long messages
- [ ] FR12 (SHOULD): Auto-scroll toggle for real-time log tailing

### Screen 3: Cost Tracker (cost-tracker-panel.tsx — 800 lines + token-dashboard-panel.tsx — 1,197 lines = 1,997 lines total)
**4 views:** Overview, Agents, Sessions, Tasks
**Sub-components:** OverviewView, AgentsView, SessionsView, TasksView

**Token Dashboard (separate panel):**
**2 views:** Overview, Sessions

**Functional Requirements:**
- [ ] FR13 (MUST): Cost tracker 4-view switcher (Overview/Agents/Sessions/Tasks) styled with new tab pattern
- [ ] FR14 (MUST): OverviewView — cost summary cards with clear hierarchy and token usage
- [ ] FR15 (MUST): AgentsView — per-agent cost breakdown with readable table/cards
- [ ] FR16 (MUST): SessionsView — session cost list with sorting and filtering
- [ ] FR17 (MUST): TasksView — task cost breakdown with clear data display
- [ ] FR18 (MUST): Token dashboard (2 views) styled consistently with cost tracker
- [ ] FR19 (MUST): Model selector and session filters styled consistently
- [ ] FR20 (SHOULD): Cost trends/sparklines use new color tokens
- [ ] FR21 (SHOULD): Large numbers formatted readably (e.g., "$12.5K" not "$12,534.23")

### Screen 4: Nodes (nodes-panel.tsx — 608 lines)
**2 tabs:** Instances, Devices
**Sub-components:** InstancesTab, DevicesTab, PendingDevicesSection, PairedDevicesSection

**Functional Requirements:**
- [ ] FR22 (MUST): Instance/Device tab switcher styled consistently
- [ ] FR23 (MUST): InstancesTab — node cards with status, last seen, connection info
- [ ] FR24 (MUST): DevicesTab — device cards with platform icons and pairing status
- [ ] FR25 (MUST): PendingDevicesSection — approve/reject actions clearly accessible
- [ ] FR26 (MUST): PairedDevicesSection — token rotation and management actions styled
- [ ] FR27 (MUST): Node status colors (statusColor) use design tokens
- [ ] FR28 (SHOULD): Device platform icons (iOS, Android, macOS) clearly displayed

### Screen 5: Approvals (exec-approval-panel.tsx — 540 lines + exec-approval-overlay.tsx — 202 lines = 742 lines)
**Sub-components:** AllowlistEditor, AgentAllowlistCard, ApprovalCard, ExecApprovalOverlay, MetaRow

**Functional Requirements:**
- [ ] FR29 (MUST): Approval cards redesigned — command preview, agent info, approve/deny actions prominent
- [ ] FR30 (MUST): Allowlist editor styled with clear card layout per agent
- [ ] FR31 (MUST): AgentAllowlistCard shows agent identity and their allowed commands clearly
- [ ] FR32 (MUST): Approval overlay (modal) styled consistently with app-wide modals
- [ ] FR33 (MUST): Time remaining (formatRemaining) displayed with urgency indication
- [ ] FR34 (MUST): MetaRow component styled for consistent key-value display
- [ ] FR35 (SHOULD): Pending approvals have visual urgency (time-based color shift)

### Screen 6: Office (office-panel.tsx — 2,411 lines)
**Complex visualization:** Isometric virtual office with sprite animations, agent workers, walkability grid, desk assignments

**20 internal functions** including: getInitials, hashColor, getPropSprite, getWorkerHeroFrame, getWorkerVariant, buildWalkabilityGrid, toTile, tileToPercent, easeInOut, clamp

**Functional Requirements:**
- [ ] FR36 (MUST): Office isometric view renders correctly with new theme tokens
- [ ] FR37 (MUST): Agent sprites and desk props styled consistently
- [ ] FR38 (MUST): Sprite animations (spriteFrame, easeInOut) preserved and functional
- [ ] FR39 (MUST): Worker variants (getWorkerVariant) and hero frames render correctly
- [ ] FR40 (MUST): Status emotes (getStatusEmote) visible and themed
- [ ] FR41 (MUST): Walkability grid and tile system maintained
- [ ] FR42 (MUST): Agent info tooltips/overlays styled with new design
- [ ] FR43 (SHOULD): Office background/floor tiles adapt to current theme
- [ ] FR44 (MAY): Office panel performance optimized (it's 2,411 lines — largest panel)

### Non-Functional Requirements
- **Performance:** Office panel must maintain 30fps+ animation with 20+ agent sprites
- **Accessibility:** WCAG 2.1 AA on all screens except Office (visual-only, best-effort)
- **Responsiveness:** All 6 screens work at 320px through 1440px
- **Compatibility:** All 12 themes render correctly
- **i18n:** All existing translations preserved

---

## Architecture
> **Section Ownership:** Author = Specialist · Reviewer = PM · Approver = Product Owner

### Technology Stack
- Existing: React 19 + Next.js 16 + Tailwind CSS + shadcn/ui
- feat-001 token system for all styling
- No new dependencies

### Components to Modify (8 files)

| Component | File | Lines | Complexity |
|-----------|------|-------|------------|
| ActivityFeedPanel | activity-feed-panel.tsx | 622 | Medium — list view with timeline |
| LogViewerPanel | log-viewer-panel.tsx | 411 | Low — filtered log list |
| CostTrackerPanel | cost-tracker-panel.tsx | 800 | Medium — 4 tabbed views |
| TokenDashboardPanel | token-dashboard-panel.tsx | 1,197 | Medium — charts and filters |
| NodesPanel | nodes-panel.tsx | 608 | Medium — 2 tabs with device management |
| ExecApprovalPanel | exec-approval-panel.tsx | 540 | Medium — approval cards with actions |
| ExecApprovalOverlay | exec-approval-overlay.tsx | 202 | Low — modal overlay |
| OfficePanel | office-panel.tsx | 2,411 | High — isometric rendering, sprites, animation |

**Total: ~6,791 lines across 8 files**

### Data Models
No changes — pure visual redesign.

### API Contracts
No changes — pure visual redesign.

### Security Boundaries
No changes — no new auth, data access, or API surface. All existing security boundaries preserved.

### Feature Flag
- **Flag name:** `release.observe.screens-redesign`
- **Rollout plan:** internal → 5% → 25% → 100%
- **Fallback:** Original Observe screen components render when flag is off

### Design References
- Approved mockups: `docs/design/mockups/approved-direction/` (reference for design language)
- Token architecture: `docs/design/token-architecture.md`
- feat-003 patterns: Use same card, tab, and list patterns established in Core screens
- **feat-004 mockups:** `docs/design/mockups/feat-004-v0/` (5 screens generated via v0 SDK)
- **feat-004 design review:** `docs/design/review-feat-004.md` (8-point checklist passed)

---

## Dependencies
> **Section Ownership:** Author = PM + Specialist · Reviewer = PM + Specialist · Approver = Product Owner

### Agent Dependencies
- **UI Designer:** Mockups for all 6 Observe screens (none have approved mockups yet — Phase 3 blocker)
- **Frontend Specialist:** Implementation (blocked on mockup approval)
- **QA:** Visual regression testing (blocked on implementation)

### System Dependencies
- feat-001 design token system (✅ merged)
- feat-002 layout shell (✅ merged)
- feat-003 core screens (✅ merged — establishes card/tab/list patterns to reuse)

### Blocks
- Nothing downstream — Observe screens are independent of Automate/Admin screens

---

## Edge Cases

1. **Empty activity feed:** New gateway with no events — friendly empty state needed
2. **Massive log volume:** 10,000+ log entries — must virtualize/paginate
3. **Cost tracker with zero usage:** New account — show helpful onboarding rather than empty charts
4. **Nodes with no devices:** No paired devices — clear instructions to pair
5. **Stale approvals:** Expired approval requests — show expired state clearly
6. **Office with many agents:** 20+ agents in isometric view — performance and visual clarity
7. **Theme compatibility on Office:** Sprite colors may conflict with certain themes
8. **Cost tracker with partial data:** Some sessions have cost data, others don't — graceful degradation
9. **Log viewer with no filters match:** Search returns zero results — helpful empty state

---

## Testing Strategy

- **Unit tests:** Component rendering tests for each screen variant
- **Integration tests:** Tab switching, filter interactions, download actions
- **E2E tests:** Navigate to each Observe screen, verify rendering, interact with controls
- **Visual regression:** 6 screens × 4 breakpoints × 12 themes = 288 screenshots
- **Functional:** All tabs, filters, actions, and downloads still work
- **Performance:** Office panel frame rate test with 20+ sprites
- **Responsive:** Each screen at 320px, 768px, 1024px, 1440px
- **Accessibility:** axe-core on all screens (Office best-effort)
- **Build:** `pnpm build` + `pnpm typecheck` pass

---

## Acceptance Criteria
> **Section Ownership:** Author = PM · Reviewer = Specialist · Approver = Product Owner

### Activity
- [ ] AC1: Given the Activity screen, when rendered with new design tokens, then event cards use consistent card patterns from feat-003
- [ ] AC2: Given the Timeline view, when scrolling through events, then timeline styling matches new design language

### Logs
- [ ] AC3: Given the Log viewer, when logs of different severity levels are displayed, then each level uses the correct color token (info=blue, warn=amber, error=red, debug=gray)
- [ ] AC4: Given the Log viewer, when the user searches/filters and downloads logs, then all controls are functional and styled consistently

### Cost Tracker
- [ ] AC5: Given the Cost Tracker, when switching between Overview/Agents/Sessions/Tasks views, then each view renders correctly with new tab pattern
- [ ] AC6: Given the Token Dashboard, when viewing Overview and Sessions, then both views are styled consistently with the Cost Tracker
- [ ] AC7: Given large cost numbers, when displayed, then they are formatted readably (e.g., "$12.5K")

### Nodes
- [ ] AC8: Given the Nodes panel, when switching between Instance and Device tabs, then both tabs render correctly with new styling
- [ ] AC9: Given a pending device, when the user clicks approve/reject, then actions execute correctly with styled controls

### Approvals
- [ ] AC10: Given a pending approval, when displayed, then the card clearly shows command preview, agent info, and approve/deny actions
- [ ] AC11: Given the Allowlist editor, when managing agent allowlists, then the card layout renders correctly with new styling

### Office
- [ ] AC12: Given the Office panel, when rendered with any of the 12 themes, then the isometric view displays correctly
- [ ] AC13: Given the Office panel with 20+ agent sprites, when animating, then frame rate stays at 30fps+

### Global
- [ ] AC14: Given any Observe screen, when rendered with any of the 12 themes, then all elements use correct theme tokens
- [ ] AC15: Given any Observe screen, when viewed at 320px, 768px, 1024px, or 1440px, then the layout is responsive and usable
- [ ] AC16: Given the full codebase, when running `pnpm build` + `pnpm typecheck`, then both pass with zero errors
- [ ] AC17: Given any Observe screen (except Office), when scanned with axe-core, then zero critical/serious violations
- [ ] AC18: Given any modified file, when inspected, then zero hardcoded px/color values — design tokens only
- [ ] AC19: Given the full feature set before redesign, when compared after redesign, then zero features have been removed

---

## Implementation Plan

### Phase 1: Activity + Logs — estimated 1-2 days
Straightforward list views. Apply new card patterns from feat-003. No dependencies between them.

### Phase 2: Cost Tracker + Token Dashboard — estimated 2-3 days
Most complex data display. 6 views total across 2 panels. These share similar patterns, so doing them together ensures consistency.

### Phase 3: Nodes + Approvals — estimated 1-2 days
Device management and approval cards. Moderate complexity. Independent of each other but grouped by similar card-based patterns.

### Phase 4: Office — estimated 2-3 days
Highest complexity. Isometric rendering with theme adaptation. Depends on all other phases being complete (to establish final design patterns). Should split the 2,411-line file during implementation.

### Phase 5: QA — estimated 1-2 days
Visual regression (288 screenshots), responsive, performance, accessibility.

**Total estimated: 7-12 days**

---

## Timeline

- **Discovery Completed:** 2026-03-27 ✅
- **Spec Approval:** 2026-03-27 ✅ (Ahmad approved)
- **Design Mockups:** 2026-03-27 ✅ (5 screens via v0 SDK, Office handled separately)
- **Design Approval:** 2026-03-27 ✅ (Ahmad approved mockup direction)
- **Implementation Start:** After spec + mockup approval
- **Implementation Complete:** TBD
- **QA Complete:** TBD

---

## Notes

- office-panel.tsx (2,411 lines) should be split during implementation — sprite rendering, layout engine, and agent state management are separate concerns
- Cost tracker has two separate panels (cost-tracker + token-dashboard) that share similar patterns — consider unifying during redesign
- The Office panel is the most unique component in the app — it's an isometric game-like visualization. Theme adaptation needs special attention for sprite filters
- This spec follows the Axon Dev Codex v2.0 Start New Feature playbook
