# Design Brief: Cohortix Visual Identity & UI Redesign

## Context
Cohortix is forked from Mission Control and needs its own visual identity. The product is a project management and agent orchestration dashboard targeting everyday people (not just developers). This redesign covers brand identity, design token system, and codebase-wide color migration.

## Target Users
Non-technical to semi-technical team members managing projects and AI agents. Think Trello/Basecamp users — people who want power without complexity. Technical sophistication: low-to-medium.

## Design System
- [x] Existing design system applies (shadcn/ui + Tailwind + next-themes)
- [x] New design system needed (three-tier token architecture per Codex §12)
- Tokens: `src/styles/tokens.css`
- Architecture spec: `docs/design/token-architecture.md`
- Brand identity: `docs/design/brand-identity.md`
- DDR: `docs/decisions/ddr-001-three-tier-token-architecture.md`

## Key Screens

### Screen 1: Dashboard (main view)
- Purpose: Overview of missions, operations, tasks, agent status
- Key elements: Stats grid, widget cards, sidebar navigation, header bar with theme selector
- States: default (with data), loading (shimmer), empty (onboarding), error (toast)
- Mockup: Not yet generated (Phase 3 pending)

### Screen 2: Task Board (kanban view)
- Purpose: Drag-and-drop task management across status columns
- Key elements: Kanban columns, task cards with priority/assignee/status badges, column headers
- States: default, drag-in-progress, empty column, loading
- Mockup: Not yet generated (Phase 3 pending)

### Screen 3: Agent Detail
- Purpose: View individual agent status, history, configuration
- Key elements: Agent avatar, status indicators, tab panels (history, costs, comms, memory)
- States: default, agent offline, agent processing
- Mockup: Not yet generated (Phase 3 pending)

## Interaction Design
- Theme switching: instant via next-themes (no page reload), 12 themes total
- Kanban: drag-and-drop with visual drag-over highlight
- Sidebar: collapsible with nav-rail icons
- Animations: follow `prefers-reduced-motion`, consistent timing tokens

## Responsive Strategy
- Mobile-first breakpoints via Tailwind (`sm`, `md`, `lg`, `xl`)
- Mobile: single-column layout, bottom nav
- Tablet: two-column grid, sidebar overlay
- Desktop: full sidebar + main content area
- Touch target minimums: 44px (per existing `touch-target` utility)

## Accessibility
- [ ] Color contrast verified (4.5:1 text, 3:1 UI) — pending runtime audit
- [x] Keyboard navigation flow defined (existing in shadcn/ui components)
- [ ] Screen reader announcement order defined — not yet audited
- [x] Focus management for modals/dialogs (existing in shadcn/ui)

## White-Label / Theming
- Customizable elements: all colors via CSS custom properties (12 themes)
- CSS variable structure: three-tier (primitive → semantic → component) in `tokens.css`
- Theme switching via `next-themes` + CSS class on `<html>`
- Each theme overrides semantic tokens; component tokens inherit automatically

## Approval
- [x] Design reviewed by stakeholder (Ahmad approved brand direction 2026-03-19)
- [ ] Mockups approved (not yet generated)
- [x] Token architecture approved (Phase 2A implemented and verified)
- [ ] Ready for full implementation (Phase 2B migration pending)
