# Design Review Report: Observe Screens Redesign (feat-004)

<!-- Purpose: Validate v0 mockups against design brief and token system -->
<!-- Owner: Alim (CEO/PM) -->
<!-- Last Reviewed: 2026-03-27 -->
<!-- Read After: docs/design/design-brief-feat-004.md -->

> **Purpose:** Validate mockups against design brief before implementation
> **Owner:** Alim (CEO/PM)
> **Last Reviewed:** 2026-03-27
> **Read After:** docs/design/design-brief-feat-004.md

**Reviewer:** Alim (CEO)
**Date:** 2026-03-27
**Design Brief:** `docs/design/design-brief-feat-004.md`
**Mockup Source:** v0 SDK (v0-sdk@0.16.4)

## Overall Verdict

- [x] ✅ Ready for implementation (with noted adaptations)
- [ ] 🔄 Needs iteration first

**Note:** Mockups are approved as *design direction reference*. Implementation MUST use the actual Cohortix token system (`src/styles/tokens.css`), not the literal hex values from v0 output. v0 generates hardcoded colors — the implementation phase translates these to semantic tokens.

---

## 8-Point Design Review Checklist

### 1. Brand Compliance ✅
All 5 mockups follow the Cohortix brand direction:
- Warm paper background (hsl(40, 30%, 97%)) ✅
- Indigo primary accent (#6C5CE7) ✅
- Dark navy sidebar (#1E1E2D) ✅
- Inter font family ✅
- Cohortix logo placement in sidebar ✅

**Implementation note:** Map v0 hex values → Cohortix semantic tokens:
- `#6C5CE7` → `var(--interactive-primary)` / `hsl(248 50% 52%)`
- `#1A1A2E` → `var(--text-primary)` / `hsl(240 10% 16%)`
- `#1E1E2D` → sidebar tokens (already in sidebar component)
- `hsl(40, 30%, 97%)` → `var(--bg-canvas)` / `hsl(40 30% 97%)`

### 2. Design Brief Adherence ✅
Each screen matches its spec requirements:
- **Activity Feed:** Event cards with type badges, day grouping, relative timestamps ✅
- **Log Viewer:** Monospace entries, severity color coding, filter bar, download ✅
- **Cost Tracker:** 4-view tabs, stat cards, charts, readable number formatting ✅
- **Nodes:** Instance/Device tabs, status indicators, approve/reject actions ✅
- **Approvals:** Risk-colored cards, countdown timer, 3 action buttons, allowlist view ✅

### 3. Design System Token Compliance ⚠️
**v0 outputs hardcoded colors** — this is expected and acceptable at mockup stage.

**Mandatory during implementation:**
- All hardcoded hex → semantic tokens from `src/styles/tokens.css`
- Status colors: `--status-success-*`, `--status-warning-*`, `--status-error-*`, `--status-info-*`
- Card styling: `--bg-surface-raised`, `--border-default`, `--shadow-sm`
- Text: `--text-primary`, `--text-secondary`, `--text-muted`
- Interactive: `--interactive-primary`, `--interactive-primary-hover`
- Spacing: use `--space-*` tokens (8px grid)
- Radius: `--radius-xl` (12px) for cards, `--radius-full` for pills
- Typography: `--font-sans` (Inter), `--font-mono` (JetBrains Mono)

### 4. Accessibility ✅ (with notes)
- Color contrast ratios designed into token system (4.5:1+ text, 3:1+ UI) ✅
- All interactive elements use standard shadcn/ui primitives (keyboard accessible) ✅
- Focus states inherited from existing component library ✅
- **Log viewer:** Dark background with light text meets contrast requirements ✅
- **Approvals:** Risk colors (green/amber/orange/red) have sufficient contrast ✅
- **Office:** Best-effort only (isometric visual — not WCAG-auditable)

### 5. Responsive Design ✅
Mockups show desktop layout. Implementation must handle:
- 320px: Single column, stacked cards, collapsed sidebar
- 768px: Two-column where appropriate
- 1024px+: Full sidebar + main content
- All screens use existing responsive patterns from feat-003

### 6. White-Label / Theme Readiness ✅
- All 12 themes will work IF implementation uses semantic tokens (not hardcoded values)
- Token system already handles light/dark/custom themes via CSS variable overrides
- **Office panel:** Sprite colors need CSS filter approach for theme adaptation (noted in spec)

### 7. Interaction State Completeness ⚠️
States shown in mockups:
- ✅ Default (data populated) — all 5 screens
- ✅ Hover states on cards/buttons — specified in prompts
- ⚠️ Empty states — described in prompts but may not be fully rendered by v0
- ⚠️ Loading states — not shown in mockups (implementation uses existing Loader component)
- ⚠️ Error states — not shown (implementation uses existing error patterns)

**Action:** During implementation, ensure empty/loading/error states use existing patterns from feat-003 screens.

### 8. Improvement Suggestions
1. **Cost Tracker:** Consider using the existing Recharts color palette mapped to tokens rather than v0's default chart colors
2. **Log Viewer:** The dark log area should use `--bg-inverse` or a dedicated `--bg-log-viewer` token for theme compatibility
3. **Approvals:** The countdown timer urgency (color shift as time decreases) should use CSS transitions for smooth visual feedback
4. **Activity Feed:** Consider adding a compact/comfortable density toggle (like Gmail) — but as a future enhancement, not for this redesign

---

## Per-Screen Review

### Screen 1: Activity Feed
| Criterion | Pass | Notes |
|-----------|------|-------|
| Brand compliance | ✅ | Warm bg, indigo accent, sidebar present |
| Design brief adherence | ✅ | Event cards, day groups, timestamps, type badges |
| Design system tokens | ⚠️ | Translate hex → tokens during implementation |
| Accessibility | ✅ | Standard card list pattern, keyboard navigable |
| Responsive | ✅ | Cards stack naturally |
| White-label ready | ✅ | Via semantic tokens |
| All states covered | ⚠️ | Empty state described in prompt, verify in implementation |

### Screen 2: Log Viewer
| Criterion | Pass | Notes |
|-----------|------|-------|
| Brand compliance | ✅ | Dark log area fits brand, controls use indigo accent |
| Design brief adherence | ✅ | Severity colors, filter bar, download, auto-scroll toggle |
| Design system tokens | ⚠️ | Need dedicated log viewer token for dark bg |
| Accessibility | ✅ | Monospace readable, contrast sufficient |
| Responsive | ✅ | Log area is full-width, filters stack on mobile |
| White-label ready | ⚠️ | Dark log area needs theme-aware token |
| All states covered | ⚠️ | Buffer full indicator in prompt, verify rendering |

### Screen 3: Cost Tracker
| Criterion | Pass | Notes |
|-----------|------|-------|
| Brand compliance | ✅ | Stat cards, indigo charts, warm background |
| Design brief adherence | ✅ | 4 views, charts, readable numbers, timeframe selector |
| Design system tokens | ⚠️ | Chart colors need token mapping |
| Accessibility | ✅ | Standard card/tab/chart patterns |
| Responsive | ✅ | Stat cards grid → stack, charts resize |
| White-label ready | ⚠️ | Recharts colors must use CSS variables |
| All states covered | ⚠️ | Zero-usage state described, verify |

### Screen 4: Nodes
| Criterion | Pass | Notes |
|-----------|------|-------|
| Brand compliance | ✅ | Status colors, card layout, sidebar |
| Design brief adherence | ✅ | Instance/Device tabs, approve/reject, token mgmt |
| Design system tokens | ⚠️ | Status colors → `--status-*-*` tokens |
| Accessibility | ✅ | Standard card pattern, buttons labeled |
| Responsive | ✅ | Card grid → stack |
| White-label ready | ✅ | Via semantic tokens |
| All states covered | ⚠️ | Empty states for both tabs needed |

### Screen 5: Approvals
| Criterion | Pass | Notes |
|-----------|------|-------|
| Brand compliance | ✅ | Risk colors, monospace commands, action buttons |
| Design brief adherence | ✅ | Countdown, 3 action types, allowlist editor |
| Design system tokens | ⚠️ | Risk border colors → status tokens |
| Accessibility | ✅ | Action buttons clearly labeled, keyboard accessible |
| Responsive | ✅ | Cards stack, actions remain visible |
| White-label ready | ✅ | Via semantic tokens |
| All states covered | ⚠️ | Expired state described, verify rendering |

---

## Issues

### 🔴 Must Fix (blocks implementation)
None — mockups are approved direction, not pixel-perfect specs.

### 🟡 Should Fix (during implementation)
1. **All screens:** Map all hardcoded hex values to semantic tokens from `src/styles/tokens.css`
2. **Log viewer:** Create or use a dark background token (`--bg-inverse` or dedicated) for the log area that adapts to all 12 themes
3. **Cost tracker:** Map Recharts color palette to design token values
4. **All screens:** Implement empty/loading/error states using existing feat-003 patterns

### 🟢 Nice to Have (future)
1. Activity feed density toggle
2. Log viewer line-wrap toggle
3. Cost tracker CSV export button styling

---

## Implementation Guidance

**Critical rule:** These mockups are DESIGN DIRECTION, not copy-paste source code.

The implementation specialist MUST:
1. Read each mockup for layout, hierarchy, and visual pattern reference
2. Use the EXISTING component files (`*-panel.tsx`) as the code base
3. Apply styling changes using ONLY semantic tokens from `src/styles/tokens.css`
4. Preserve ALL existing functionality (this is a visual-only redesign)
5. Follow existing patterns from feat-003 for cards, tabs, lists, and spacing

**Do NOT:**
- Copy v0 source code directly into the codebase
- Use any hardcoded color values from v0 output
- Remove or modify any functional code
- Add new dependencies

---

## Sign-off
- [x] All 🔴 issues resolved (none exist)
- [x] Reviewer approves for implementation
- [x] Stakeholder approved mockup direction (Ahmad, 2026-03-27)
