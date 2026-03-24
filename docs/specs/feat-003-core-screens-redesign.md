# Spec: Core Screens Redesign

> **Purpose:** Redesign the 7 highest-impact screens to match the approved design direction
> **Owner:** Alim (PM role for this spec)
> **Last Reviewed:** 2026-03-24
> **Read After:** docs/specs/feat-002-layout-ux-redesign.md

**ID:** feat-003
**Status:** Approved — Design complete, ready for implementation
**Created:** 2026-03-24
**Last Updated:** 2026-03-25 (design references + approved mockups added)

---

## Context

With the layout shell redesigned (feat-002), the 7 Core screens need their content areas updated to match the approved mockup direction. These are the screens users see and interact with most — Overview, Agents, Tasks, Chat, Channels, Skills, and Memory. The goal is friendlier density, cleaner cards, better visual hierarchy, and consistency across all screens while preserving every existing feature.

**Prerequisites:** feat-001 (Visual Identity) ✅ merged · feat-002 (Layout & Shell) ✅ approved

---

## Discovery (Codex Phase 1)

### 1. Intent & Goals
Bring every Core screen's visual design in line with the approved mockups. No functionality changes — this is a visual redesign that preserves all features.

### 2. Scope & Boundaries
**In scope:** Visual redesign of 7 Core screens (25+ component files, ~12,500 lines)
**Out of scope:** Backend/API changes, new features, database changes, Observe/Automate/Admin screens (feat-004 through feat-006)

### 3. Technical Constraints
- Must work with feat-001 token system and feat-002 layout shell
- Must preserve all 12 themes
- Zero feature removal — every button, filter, modal, and widget that exists today must still work
- Performance: no increase in JS bundle size

### 4. Edge Cases
- Dashboard widgets with no data (empty state)
- Task board with 100+ tasks across columns
- Chat with 500+ messages in a conversation
- Channels with disconnected/errored integrations
- Skills with 50+ installed skills
- Memory graph with large knowledge bases

### 5. Acceptance Criteria
Defined below per screen.

---

## Requirements
> **Section Ownership:** Author = PM · Reviewer = Specialist · Approver = Product Owner

### Screen 1: Overview (Dashboard)
**Components:** dashboard.tsx, stats-grid.tsx, widget-grid.tsx, widget-primitives.tsx, agent-network.tsx, sessions-list.tsx, sidebar.tsx + 11 widget components (2,423 lines total)

**11 Dashboard Widgets:**
- MetricCardsWidget (107 lines) — key stats cards
- RuntimeHealthWidget (23 lines) — runtime status
- GatewayHealthWidget (21 lines) — gateway status
- SessionWorkbenchWidget (56 lines) — active sessions
- EventStreamWidget (32 lines) — real-time events
- TaskFlowWidget (21 lines) — task progress
- GithubSignalWidget (31 lines) — GitHub activity
- SecurityAuditWidget (64 lines) — security status
- MaintenanceWidget (25 lines) — maintenance alerts
- QuickActionsWidget (28 lines) — shortcut actions
- OnboardingChecklistWidget (169 lines) — setup progress

**Functional Requirements:**
- [ ] FR1 (MUST): Stats grid redesigned — larger cards, breathing room, clear hierarchy matching dashboard mockup
- [ ] FR2 (MUST): Widget grid uses new spacing tokens, cards have rounded corners and subtle shadows per mockup
- [ ] FR3 (MUST): All 11 widgets preserved and styled consistently
- [ ] FR4 (MUST): Agent network visualization styled to match new design
- [ ] FR5 (MUST): Sessions list sidebar readable with friendly density
- [ ] FR6 (MUST): Widget primitives (MetricCard, SignalPill, HealthRow, StatRow, LogRow, QuickAction) all updated
- [ ] FR7 (SHOULD): Empty states for widgets when no data (friendly messaging, not blank)
- [ ] FR8 (MAY): Widget reordering/resizing maintains new visual style

### Screen 2: Agents
**Components:** agent-squad-panel.tsx (624 lines) + agent-squad-panel-phase3.tsx (1,182 lines)

**UX Decision (approved 2026-03-24): 11→4 Tab Consolidation**
> Consolidate the 11 agent detail tabs into 4 primary tabs using the "Overview + Grouped Tabs" pattern:
>
> | Primary Tab | Merged Content | Pattern |
> |---|---|---|
> | **Overview** | Overview + Activity | Hero status + metrics + activity stream |
> | **Identity** | Soul + Memory | Personality config + 5-view memory browser |
> | **Work** | Tasks + Files | Task list/kanban + workspace file tree |
> | **Settings** | Config + Models + Channels + Cron + Tools | Collapsible accordion sections |
>
> **Rationale:** NN/Group research shows tabs work best with 2-7 items. The 4-tab grouping follows the same pattern as Linear (3 zones), LangSmith (4 tabs), and W&B (4 tabs). Settings uses accordion pattern because users rarely need all 5 config areas simultaneously — collapsed state shows 1-line summary per section.
>
> **Progressive disclosure:** Overview covers 80% of visits. Identity/Work for power users. Settings for admins.

**Functional Requirements:**
- [ ] FR9 (MUST): Agent roster redesigned — larger avatar cards, clearer status indicators, model badges
- [ ] FR10 (MUST): Agent detail modal uses 4 primary tabs: Overview, Identity, Work, Settings
- [ ] FR11 (MUST): All 11 original content areas preserved within the 4-tab structure (zero content removal)
- [ ] FR11a (MUST): Overview tab merges status hero + key metrics + recent activity stream (replaces separate Activity tab)
- [ ] FR11b (MUST): Identity tab contains Soul editor + Memory browser (with segmented control for 5 memory views)
- [ ] FR11c (MUST): Work tab contains Tasks section + Files section
- [ ] FR11d (MUST): Settings tab uses collapsible accordion: Config, Models, Channels, Cron, Tools — each with 1-line collapsed summary
- [ ] FR12 (MUST): Agent status (online/offline/busy) clearly visible at a glance
- [ ] FR13 (SHOULD): Agent cards show key metrics (sessions, tasks, cost) in a scannable format
- [ ] FR13a (SHOULD): Settings accordion collapsed state shows summary: "Models: claude-opus-4 | Channels: 3 connected | Cron: 2 jobs | Tools: 15 active"

### Screen 3: Tasks
**Components:** task-board-panel.tsx (2,440 lines) + project-manager-modal.tsx

**Sub-components:** Kanban columns, task cards, TaskDetailModal, CreateTaskModal, EditTaskModal, DunkItButton, MentionTextarea, ClaudeCodeTasksSection, HermesCronSection

**Functional Requirements:**
- [ ] FR14 (MUST): Kanban board redesigned matching task board mockup — wider columns, friendlier cards
- [ ] FR15 (MUST): Task cards have readable text hierarchy — title prominent, assignee/priority/due date secondary
- [ ] FR16 (MUST): All task modals (create, edit, detail) updated with new spacing and typography
- [ ] FR17 (MUST): Status columns (backlog, todo, in-progress, review, done) clearly differentiated
- [ ] FR18 (MUST): MentionTextarea styled consistently with chat input
- [ ] FR19 (MUST): ClaudeCodeTasksSection and HermesCronSection preserved and styled
- [ ] FR20 (MUST): DunkItButton functional and visually integrated
- [ ] FR21 (MUST): ProjectManagerModal (missions/operations) updated
- [ ] FR22 (SHOULD): Drag-and-drop between columns uses smooth animations
- [ ] FR23 (SHOULD): Priority badges (critical, high, medium, low) use consistent color coding

### Screen 4: Chat
**Components:** 8 files in chat/ (2,555 lines total)
- chat-workspace.tsx (774 lines) — main workspace container
- conversation-list.tsx (553 lines) — sidebar conversation list
- message-list.tsx (259 lines) — message thread
- message-bubble.tsx (269 lines) — individual messages
- chat-input.tsx (337 lines) — input area
- session-message.tsx (242 lines) — session-aware messages
- session-kind-brand.tsx (96 lines) — session type branding
- chat-panel.tsx (25 lines) — wrapper

**Functional Requirements:**
- [ ] FR24 (MUST): Conversation list readable with friendly density — avatar, name, preview, timestamp
- [ ] FR25 (MUST): Message bubbles have proper padding, border-radius, and visual distinction between user/agent
- [ ] FR26 (MUST): Chat input styled consistently with rest of app
- [ ] FR27 (MUST): Session-kind branding (icons for different session types) clearly visible
- [ ] FR28 (MUST): Chat workspace (embedded mode) fits naturally in new layout
- [ ] FR29 (SHOULD): Agent avatar component consistent between chat and agent roster
- [ ] FR30 (SHOULD): Notification indicators for unread messages styled

### Screen 5: Channels
**Components:** channels-panel.tsx (826 lines)

**Platform cards:** WhatsAppCard, TelegramCard, DiscordCard, SlackCard, SignalCard, NostrCard, GenericChannelCard + CardShell, StatusRow, ErrorCallout, ProbeResult

**Functional Requirements:**
- [ ] FR31 (MUST): Channel cards redesigned — each platform card has clear branding, connection status, and action buttons
- [ ] FR32 (MUST): CardShell component provides consistent card frame for all platforms
- [ ] FR33 (MUST): StatusRow, ErrorCallout, and ProbeResult styled consistently
- [ ] FR34 (MUST): All 7 platform-specific cards (WhatsApp, Telegram, Discord, Slack, Signal, Nostr, Generic) maintained
- [ ] FR35 (MUST): Connected vs disconnected state clearly visible per channel
- [ ] FR36 (SHOULD): Platform logos/icons properly sized and positioned

### Screen 6: Skills
**Components:** skills-panel.tsx (928 lines)

**Functional Requirements:**
- [ ] FR37 (MUST): Installed/Registry tab switcher styled consistently
- [ ] FR38 (MUST): Skill cards redesigned — name, description, source, status clearly readable
- [ ] FR39 (MUST): Search input styled consistently with header search
- [ ] FR40 (MUST): Skill detail view (expanded) has proper spacing and hierarchy
- [ ] FR41 (SHOULD): Source labels (local, registry, built-in) use consistent badge styling
- [ ] FR42 (SHOULD): Install/uninstall actions clearly accessible

### Screen 7: Memory
**Components:** memory-browser-panel.tsx (1,016 lines) + memory-graph.tsx (506 lines)

**5 views:** Files, Graph, Health, Pipeline, Hermes

**UX Decision (approved 2026-03-24): Segmented Control + View-Specific Patterns**
> Replace tab row with a compact **segmented control** (pill toggle) for the 5 views. Each view uses a pattern optimized for its content type:
>
> | View | UX Pattern | Reference |
> |---|---|---|
> | **Files** | VS Code-style tree — hover actions, breadcrumb path, indent guides, file type icons | VS Code, Figma file browser |
> | **Graph** | Cluster-first zoom — start zoomed out, click to expand, search overlay top-left, mini-map corner | Neo4j Bloom, Obsidian Graph |
> | **Health** | Dashboard cards — status pill + metric + sparkline, 3-4 cards, no scrolling | Vercel project health |
> | **Pipeline** | Horizontal flow diagram — stages as nodes with status badges | GitHub Actions workflow |
> | **Hermes** | Timeline feed — chat-like entries with filters | Activity feed pattern |
>
> **Rationale:** Segmented controls signal "different modes of viewing the same data" (Obsidian, Figma pattern). Views are too heterogeneous for uniform treatment — each deserves its own optimized layout. Graph visualization must cache render state to avoid re-layout on tab switch.

**Functional Requirements:**
- [ ] FR43 (MUST): View switcher uses segmented control (pill toggle), not tabs
- [ ] FR43a (MUST): File browser view uses VS Code-style tree — hover actions, breadcrumb path, indent guides, file type icons, size in muted text
- [ ] FR44 (MUST): Knowledge graph starts zoomed out with clusters, click-to-expand, search overlay top-left, mini-map in corner, node colors from theme tokens
- [ ] FR44a (MUST): Graph render state cached — no re-layout on view switch
- [ ] FR45 (MUST): Health view uses dashboard cards pattern — status pill + metric + sparkline, 3-4 key metrics visible without scrolling
- [ ] FR46 (MUST): Pipeline view uses horizontal flow diagram — stages as nodes with status badges
- [ ] FR47 (MUST): Hermes memory view uses timeline feed pattern with filters
- [ ] FR48 (MUST): All 5 views use theme tokens exclusively — no hardcoded colors
- [ ] FR49 (MUST): File icons, size formatting, and directory tree all styled consistently
- [ ] FR50 (SHOULD): Graph visualization uses smooth animations for node expansion
- [ ] FR50a (SHOULD): Segmented control shows active view count/status hint (e.g., "Files (23)" or "Health ✓")

### Non-Functional Requirements
- **Performance:** No increase in JS bundle size from visual changes
- **Accessibility:** WCAG 2.1 AA — all interactive elements ≥44px touch targets, color contrast ≥4.5:1
- **Responsiveness:** All 7 screens work at 320px, 768px, 1024px, 1440px breakpoints
- **Compatibility:** All 12 themes render correctly
- **i18n:** All existing translations preserved — no new hardcoded strings

---

## Architecture
> **Section Ownership:** Author = Specialist · Reviewer = PM · Approver = Product Owner

### Technology Stack
- Existing: React 19 + Next.js 16 + Tailwind CSS + shadcn/ui
- feat-001 token system for all spacing/color/typography
- No new dependencies

### Components to Modify (25+ files)

**Dashboard (7 + 11 widgets = 18 files):**
dashboard.tsx, stats-grid.tsx, widget-grid.tsx, widget-primitives.tsx, agent-network.tsx, sessions-list.tsx, sidebar.tsx, + all 11 widget files

**Agents (2 files):**
agent-squad-panel.tsx, agent-squad-panel-phase3.tsx

**Tasks (2 files):**
task-board-panel.tsx, project-manager-modal.tsx

**Chat (8 files):**
chat-workspace.tsx, conversation-list.tsx, message-list.tsx, message-bubble.tsx, chat-input.tsx, session-message.tsx, session-kind-brand.tsx, chat-panel.tsx

**Channels (1 file):**
channels-panel.tsx

**Skills (1 file):**
skills-panel.tsx

**Memory (2 files):**
memory-browser-panel.tsx, memory-graph.tsx

### Data Models
No changes.

### API Contracts
No changes.

### Design References

**Design context file (mandatory pre-flight for implementation):** `docs/design/v0-context.md`

**Approved Mockups — All 7 Screens:**

| # | Screen | Demo URL | v0 Editor | Screenshot |
|---|--------|----------|-----------|------------|
| 1 | Dashboard | [demo](https://demo-kzmimklc6gvpv3joebm5.vusercontent.net) | [editor](https://v0.app/chat/m4idTPxj8rS) | `mockups/approved-direction/dashboard.png` |
| 2 | Task Board | [demo](https://demo-kzmo44cwmcdayr8m8or6.vusercontent.net) | [editor](https://v0.app/chat/dVjHZ3hebPP) | `mockups/approved-direction/task-board.png` |
| 3 | Agent Detail | [demo](https://demo-kzmp1f92m59ld4f54c42.vusercontent.net) | [editor](https://v0.app/chat/oih2C6SMaCS) | `mockups/approved-direction/agent-detail.png` |
| 4 | Chat | [demo](https://demo-kzmqdyaruecglvkrplqn.vusercontent.net) | [editor](https://v0.app/chat/gbYJMe5Ellp) | `mockups/feat-003-v0/chat-v2.png` |
| 5 | Channels | [demo](https://demo-kzmgnw3qzsrs575ykzeq.vusercontent.net) | [editor](https://v0.app/chat/oOFCRm9DwBF) | `mockups/feat-003-v0/channels-v2.png` |
| 6 | Skills | [demo](https://demo-kzmlo39y8a34r8d9jz2q.vusercontent.net) | [editor](https://v0.app/chat/uFb5YMbf10G) | `mockups/feat-003-v0/skills-v2.png` |
| 7 | Memory | [demo](https://demo-kzmq2yyye0buixtib8my.vusercontent.net) | [editor](https://v0.app/chat/j1mX8sFfg6t) | `mockups/feat-003-v0/memory-v2.png` |

**Supporting docs:**
- Design context / v0 pre-flight: `docs/design/v0-context.md`
- Token architecture: `docs/design/token-architecture.md`
- Brand identity: `docs/design/brand-identity.md`
- Design brief: `docs/design/design-brief.md`
- Mockup summary: `docs/design/mockups/mockup-summary.md`
- feat-002 shell: provides the nav/header/responsive container these screens sit inside

### Feature Flag
Not applicable — visual changes, rollback via git revert.

---

## Dependencies
> **Section Ownership:** Author = PM + Specialist · Reviewer = PM + Specialist · Approver = Product Owner

### Agent Dependencies
- **UI Designer:** Mockup generation for screens without approved mockups (Channels, Skills, Memory, Chat)
- **Frontend Specialist:** Implementation of all 7 screens
- **QA:** Visual regression testing

### System Dependencies
- feat-001 token system (merged ✅)
- feat-002 layout shell (approved ✅)

### Blocks
- feat-007 (Detail Views) depends on Agents screen patterns from this spec

---

## Edge Cases

1. **Empty dashboard:** New user with zero data — all 11 widgets need friendly empty states
2. **Overloaded task board:** 100+ tasks per column — must scroll without performance degradation
3. **Long chat history:** 500+ messages — virtualized scrolling required
4. **Disconnected channels:** Error states for each platform card must be clear and actionable
5. **Large skill count:** 50+ installed skills — search and scrolling must be performant
6. **Knowledge graph scale:** Large memory graphs — graph visualization must handle 100+ nodes
7. **Theme edge cases:** 12 themes × 7 screens = 84 combinations — all must render correctly
8. **Mixed modes:** Essential mode hides some nav items but all screens still accessible via URL

---

## Testing Strategy

- **Visual regression:** Playwright screenshots — 7 screens × 4 breakpoints × 12 themes = 336 screenshots
- **Functional:** Every button, modal, filter, tab, and action still works after redesign
- **Responsive:** Each screen tested at 320px, 768px, 1024px, 1440px
- **Accessibility:** axe-core scan per screen, keyboard navigation test, focus management
- **Performance:** Lighthouse check — no regression in LCP/FID/CLS
- **Build:** `pnpm build` + `pnpm typecheck` pass

---

## Acceptance Criteria
> **Section Ownership:** Author = PM · Reviewer = Specialist · Approver = Product Owner

### Overview
- [ ] AC1: Dashboard stats cards match mockup — generous spacing, clear hierarchy
- [ ] AC2: All 11 widgets render correctly with new styling
- [ ] AC3: Widget primitives (MetricCard, SignalPill, etc.) use tokens exclusively

### Agents
- [ ] AC4: Agent roster cards match mockup direction — larger avatars, readable status
- [ ] AC5: Agent detail modal (11 tabs) all functional with new styling

### Tasks
- [ ] AC6: Kanban board matches task board mockup — wider columns, friendlier cards
- [ ] AC7: All task modals (create, edit, detail) work with new design
- [ ] AC8: Task priority badges use consistent color coding

### Chat
- [ ] AC9: Conversation list is readable with friendly density
- [ ] AC10: Message bubbles have proper visual distinction between user and agent
- [ ] AC11: Chat input consistent with app-wide input styling

### Channels
- [ ] AC12: All 7 platform cards render correctly with connection status visible
- [ ] AC13: Error/disconnected states are clear and actionable

### Skills
- [ ] AC14: Installed/Registry tabs work with new tab styling
- [ ] AC15: Skill cards are scannable with clear name/description/source

### Memory
- [ ] AC16: All 5 views (Files, Graph, Health, Pipeline, Hermes) functional with new styling
- [ ] AC17: Knowledge graph uses new color tokens

### Global
- [ ] AC18: All 12 themes render correctly across all 7 screens
- [ ] AC19: All screens responsive at 320px, 768px, 1024px, 1440px
- [ ] AC20: `pnpm build` + `pnpm typecheck` pass
- [ ] AC21: axe-core reports 0 critical/serious violations per screen
- [ ] AC22: Zero hardcoded px/color values in new code — tokens only
- [ ] AC23: Zero features removed — every existing button, modal, filter, widget still works

---

## Implementation Plan

### Phase 1: Overview (Dashboard) — estimated 2-3 days
Highest visibility screen. Stats grid → widget grid → individual widgets → agent network → sessions list.

### Phase 2: Tasks — estimated 2-3 days
Kanban board → task cards → task modals (create/edit/detail) → sections.

### Phase 3: Agents — estimated 1-2 days
Agent roster cards → agent detail modal phase3 → tab styling.

### Phase 4: Chat — estimated 2-3 days
Conversation list → message bubbles → chat input → workspace container → session branding.

### Phase 5: Channels — estimated 1 day
CardShell frame → platform-specific cards (7) → status/error components.

### Phase 6: Skills — estimated 1 day
Tab switcher → skill cards → search → detail view.

### Phase 7: Memory — estimated 1-2 days
File browser → knowledge graph → health/pipeline/hermes views.

### Phase 8: QA — estimated 2-3 days
Visual regression (336 screenshots) → responsive testing → accessibility → performance.

**Total estimated: 12-18 days**

---

## Timeline

- **Spec Approval:** ✅ Approved 2026-03-24 (UX decisions for Memory Browser + Agent Tabs)
- **Design Mockups:** ✅ All 7 screens approved 2026-03-25 (see Design References table above)
- **Implementation Start:** 2026-03-25 — Phase 1 (Dashboard)
- **Implementation Complete:** TBD
- **QA Complete:** TBD

---

## Notes

- task-board-panel.tsx (2,440 lines) and agent-detail-tabs.tsx (2,951 lines) should be considered for splitting during implementation — they exceed the Codex 500-line limit significantly
- Chat has 8 separate files already well-structured — likely needs less restructuring than other screens
- Memory graph visualization may need special attention for theme compatibility (canvas/SVG rendering)
- All 7 screens now have approved mockups (see Design References). Implementation can proceed for all phases.
