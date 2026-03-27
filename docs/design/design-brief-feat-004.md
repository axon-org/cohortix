# Design Brief: Observe Screens Redesign (feat-004)

<!-- Purpose: Design direction for 6 Observe screen redesigns -->
<!-- Owner: Alim (PM) -->
<!-- Last Reviewed: 2026-03-27 -->
<!-- Read After: docs/specs/feat-004-observe-screens-redesign.md -->

> **Purpose:** Define design direction for the 6 Observe screen visual redesigns
> **Owner:** Alim (PM)
> **Last Reviewed:** 2026-03-27
> **Read After:** docs/specs/feat-004-observe-screens-redesign.md

## Context
The 6 Observe screens (Activity, Logs, Cost Tracker, Nodes, Approvals, Office) need visual redesign to match the approved design direction established in feat-001/002/003. This is a pure visual redesign — no functional changes.

## Target Users
Non-technical to semi-technical team members monitoring agent activity, costs, and system health. Same audience as core screens — people who want clarity without complexity.

## Design System
- [x] Existing design system applies (feat-001 tokens + feat-003 patterns)
- Tokens: `src/styles/tokens.css`
- Architecture: `docs/design/token-architecture.md`
- v0 context: `docs/design/v0-context.md`

## Key Screens

### Screen 1: Activity Feed
- **Purpose:** Timeline of agent/system events — task created, status changes, comments, mentions
- **Key elements:** Event cards with type icons/badges, relative timestamps, day group headers, timeline view
- **States:** default (with events), loading, empty (no events yet — onboarding message)
- **Current file:** `activity-feed-panel.tsx` (622 lines)
- **Design pattern:** Card-based event list, similar to GitHub activity feed or Linear's activity log

### Screen 2: Log Viewer
- **Purpose:** Real-time log viewer with severity filtering, search, and download
- **Key elements:** Monospace log entries, severity color coding (info/warn/error/debug), filter bar, search, download button, auto-scroll toggle
- **States:** default (with logs), loading, empty (no logs), buffer full warning
- **Current file:** `log-viewer-panel.tsx` (411 lines)
- **Design pattern:** Terminal-inspired log viewer with modern card styling

### Screen 3: Cost Tracker
- **Purpose:** Token usage and cost analytics across 4 views (Overview, Agents, Sessions, Tasks) + Token Dashboard (2 views)
- **Key elements:** View switcher tabs, cost summary cards, pie/line/bar charts (Recharts), model selector, timeframe filter, export button
- **States:** default, loading, empty (no usage data — onboarding), exporting
- **Current files:** `cost-tracker-panel.tsx` (800 lines) + `token-dashboard-panel.tsx` (1,197 lines)
- **Design pattern:** Analytics dashboard — stat cards top, charts middle, detailed table bottom

### Screen 4: Nodes
- **Purpose:** Manage gateway instances and paired devices (2 tabs: Instances, Devices)
- **Key elements:** Tab switcher, instance/device cards with status badges, approve/reject buttons, token management, platform icons
- **States:** default, loading, no instances, no devices (pairing instructions)
- **Current file:** `nodes-panel.tsx` (608 lines)
- **Design pattern:** Card grid with status indicators, similar to infrastructure dashboards

### Screen 5: Approvals
- **Purpose:** Manage exec approval requests + command allowlists (2 views: Approvals, Allowlist)
- **Key elements:** Approval cards (command preview, agent, risk level, countdown timer), approve/deny/always-allow buttons, allowlist editor, agent cards with glob patterns
- **States:** default, no pending approvals, expired approval, allowlist empty
- **Current files:** `exec-approval-panel.tsx` (540 lines) + `exec-approval-overlay.tsx` (202 lines)
- **Design pattern:** Action-oriented cards with urgency indicators

### Screen 6: Office
- **Purpose:** Isometric virtual office visualization showing agent sprites at desks with animations
- **Key elements:** Isometric grid, desk props, agent worker sprites, walking animations, status emotes, tooltips
- **States:** default (agents at desks), no agents, many agents (20+)
- **Current file:** `office-panel.tsx` (2,411 lines)
- **Design pattern:** Game-like isometric visualization — unique in the app. Theme adaptation for floor/walls/furniture. NOT a standard dashboard screen.
- **Note:** This is the most complex screen. Mockup focuses on the overall container, info panel, and theme-adaptive styling — NOT the isometric rendering engine itself.

## Interaction Design
- **No new interactions** — preserve all existing interactions exactly
- Tab switching, filter controls, scroll behavior, drag interactions remain unchanged
- Theme switching must work instantly across all 6 screens
- Auto-scroll in logs, countdown timers in approvals, sprite animations in office — all preserved

## Responsive Strategy
- Same as feat-003: mobile-first, breakpoints at 320px/768px/1024px/1440px
- Mobile: single column, stacked cards
- Tablet: two-column where appropriate
- Desktop: full sidebar + main content area
- Touch targets: 44px minimum

## Accessibility
- [x] Color contrast verified (4.5:1 text, 3:1 UI) — via design tokens
- [x] Keyboard navigation — preserved from existing shadcn/ui components
- [x] Focus management — preserved from existing modal/overlay patterns
- [ ] Screen reader testing — QA phase
- **Office panel:** Best-effort accessibility (visual-only isometric view)

## White-Label / Theming
- All 12 themes must render correctly
- All colors via CSS custom properties (design tokens)
- No hardcoded color values
- Office sprites: theme-adaptive via CSS filters where possible

## Approval
- [x] Design reviewed by stakeholder (Ahmad approved 2026-03-27)
- [x] Mockups approved (5 screens via v0 SDK — Ahmad approved 2026-03-27)
- [x] Agent design review completed (`docs/design/review-feat-004.md`)
- [x] Ready for implementation
