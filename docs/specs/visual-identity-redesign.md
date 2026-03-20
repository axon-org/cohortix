# Feature: Visual Identity & UI Redesign

<!-- Purpose: Feature spec for Cohortix visual identity redesign (brand, tokens, theme, migration) -->
<!-- Owner: Alim (AI CEO) -->
<!-- Last Reviewed: 2026-03-20 -->
<!-- Read After: docs/design/brand-identity.md -->

- **Author:** Alim (AI CEO)
- **Date:** 2026-03-19
- **Status:** Review

## Context

Cohortix is forked from Mission Control and needs its own visual identity. Ahmad's direction: minimal color palette, made for everyday people (Trello-level approachability), wordmark only (no icon), must work with existing 11-theme system. All work follows Axon Dev Codex.

The codebase has 987 hardcoded Tailwind color references that bypass the theme system, no formal token architecture, and all brand assets still reference "Mission Control."

## Requirements

- [x] M1 (MUST): Three-tier token system (Primitive → Semantic → Component) per Codex §12
- [x] M2 (MUST): New "brand-light" default theme (warm paper + indigo primary)
- [x] M3 (MUST): All 11 existing themes continue to work unchanged
- [x] M4 (MUST): Backward compatibility — existing CSS var names still resolve
- [x] M5 (MUST): Cohortix wordmark (SVG + PNG, primary/inverse/mono variants)
- [x] M6 (MUST): Brand assets updated in layout metadata (no Mission Control references)
- [x] M7 (MUST): Build passes (`pnpm build`) after all changes
- [x] M8 (MUST): WCAG 2.1 AA contrast (4.5:1 text, 3:1 large text/UI) for brand-light theme
- [x] S1 (SHOULD): Migrate hardcoded Tailwind colors to semantic tokens (987 refs)
- [x] S2 (SHOULD): ESLint rule to prevent new hardcoded color usage
- [x] S3 (SHOULD): Design tokens TypeScript file updated for programmatic access
- [x] S4 (SHOULD): Respect `prefers-reduced-motion` (verified preserved)
- [ ] N1 (MAY): Tailwind v4 migration (CSS-first @theme blocks)
- [x] N2 (MAY): v0 SDK mockups of key screens with new identity
- [ ] N3 (MAY): Component lifecycle governance per Codex §14

## Technical Design

### API Changes

None. This is a frontend-only visual change.

### Database Changes

None.

### UI Changes

| Area | Change | Files |
|------|--------|-------|
| Token system | NEW three-tier CSS custom properties | `src/styles/tokens.css` |
| Global styles | Import tokens, add brand-light theme class | `src/app/globals.css` |
| Theme metadata | Add brand-light as first theme | `src/lib/themes.ts` |
| Theme background | Handle brand-light (no overlay) | `src/components/ui/theme-background.tsx` |
| Tailwind config | Map semantic + component tokens to utilities | `tailwind.config.js` |
| Design tokens TS | Add brand-light palette + theme getter | `src/styles/design-tokens.ts` |
| Layout | Default theme → brand-light, update metadata | `src/app/layout.tsx` |
| Brand assets | New wordmark files | `public/brand/cohortix-wordmark-*.{svg,png}` |
| Components | Migrate hardcoded colors → tokens (Phase 2B) | `src/components/**/*.tsx` (~89 files) |

### Design References (REQUIRED for UI work)

- Brand identity: `docs/design/brand-identity.md`
- Design brief: `docs/design/design-brief.md`
- Token architecture: `docs/design/token-architecture.md`
- Wordmark spec: `docs/design/wordmark-spec.md`
- Competitive research: `docs/design/research-approachable-pm-tools.md`
- Mockups: `docs/design/mockups/screens/` (pending Phase 3 Steps 3-8)
- Design review report: `docs/design/review-report.md` (pending Phase 3 Step 8)
- DDR-001: `docs/decisions/ddr-001-three-tier-token-architecture.md`
- DDR-002: `docs/decisions/ddr-002-brand-light-default-theme.md`

### Feature Flag

Not applicable. Visual change — rollback via `git revert`. No staged rollout.

## Edge Cases

1. **localStorage theme:** Users with `void` saved continue seeing Void — NOT forced to brand-light
2. **Legacy `dark` migration:** `theme-selector.tsx` migrates `dark` → `void` — must still work
3. **Circular token refs:** Token chains (component → semantic → primitive) must not create cycles
4. **CSS specificity:** `.brand-light` must not conflict with `.dark` class toggling
5. **Mixed migration state:** During Phase 2B, components with tokens + components with hardcoded colors must coexist
6. **Inline styles:** ~80 inline style references (ReactFlow, Recharts) use `design-tokens.ts`, not hardcoded hex

## Testing Strategy

**Manual (Phase 2A):**
- Visual check: brand-light renders warm paper + indigo in browser
- Theme cycling: switch through all 12 themes — no breakage
- Contrast: check brand-light text/bg ratios with DevTools

**Automated (Phase 2A):**
- `pnpm build` — exit 0
- `pnpm typecheck` — exit 0

**Visual Regression (Phase 2B):**
- Playwright screenshots of dashboard, kanban, agent detail in all 12 themes
- Before/after comparison to verify migration preserved layouts

**Accessibility (Phase 3):**
- axe-core scan of brand-light theme
- Manual keyboard navigation test
- Focus ring visibility across components

## Acceptance Criteria

- [x] AC1: `src/styles/tokens.css` contains Tier 1 (primitives), Tier 2 (semantic), Tier 3 (component) tokens with backward-compatible aliases
- [x] AC2: Fresh visit with no localStorage renders brand-light (warm paper bg, indigo primary, soft status colors)
- [x] AC3: All 11 original themes render correctly when selected; existing CSS var names resolve in all 12 themes; localStorage `void` still loads Void
- [x] AC4: `public/brand/` contains 3 SVG wordmarks + 9 PNG exports (3 variants × 3 sizes)
- [x] AC5: `layout.tsx` title = "Cohortix", no Mission Control references, OG/icon images reference cohortix-wordmark files
- [x] AC6: `pnpm build` and `pnpm typecheck` exit 0
- [x] AC7: `globals.css` imports `tokens.css` before Tailwind directives; no circular token references
- [x] AC8: After Phase 2B migration, hardcoded Tailwind color count < 50 (from 987); all status indicators use `--status-*` tokens
- [x] AC9: After Phase 2C, ESLint warns/errors on new hardcoded Tailwind color classes

---

## Phase Tracking

| Phase | Description | Owner | Status | Codex Step |
|-------|-------------|-------|--------|------------|
| 1A | Competitive research | Lubna (UI Designer) | ✅ Done | Phase 3.1 |
| 1B | Brand identity | Lubna (UI Designer) | ✅ Done | Phase 3.1 |
| 1C | Token architecture design | Lubna (UI Designer) | ✅ Done | Phase 3.2 |
| 1D | Wordmark | Farhan (Graphic Designer) | ✅ Done | Phase 3.1 |
| 2A | Token foundation + brand-light | Sami (Frontend Dev) | ✅ Verified | Phase 4 |
| 3A | Design brief | Alim (CEO) | ✅ Done | Phase 3.2 |
| 3B | DDR-001 + DDR-002 | Alim (CEO) | ✅ Done | Phase 2 |
| 3C | Mockup generation (v0 SDK) | Lubna (UI Designer) | ✅ Done | Phase 3.3 |
| 3D | Agent design review | Lubna (UI Designer) | ✅ Done | Phase 3.8 |
| 3E | WCAG contrast audit | Alim (CEO) | ✅ Done | Phase 3.6 |
| 2B | Hardcoded color migration | Sami + Zara | ✅ Done | Phase 4 |
| 2C | ESLint guard rail | Sami (Frontend Dev) | ✅ Done | Phase 4 |
| 4 | Visual regression testing | TBD | In Progress | Phase 5 |

## Codex Checklists

### Phase 2 (Specification)
- [x] Spec written in `docs/specs/`
- [x] API contract defined (N/A)
- [x] Database migration designed (N/A)
- [x] Feature flag planned (N/A — git revert)
- [x] Testing strategy defined
- [x] DDRs written (DDR-001, DDR-002)
- [x] Spec approved by reviewer (Ahmad, 2026-03-20)

### Phase 3 (Design & UX)
- [x] Brand identity saved to `docs/design/brand-identity.md`
- [x] Design brief saved to `docs/design/design-brief.md`
- [x] Token architecture in `docs/design/token-architecture.md`
- [x] Mockups generated and saved to `docs/design/mockups/screens/`
- [x] Design review report saved to `docs/design/review-report.md`
- [x] Accessibility audit complete (docs/design/wcag-audit.md)
- [x] Stakeholder approved mockups (Ahmad, 2026-03-20)

## Verification Log

### Phase 2A (2026-03-19) — Verified by Alim

| AC | Result | Notes |
|----|--------|-------|
| AC1 | ✅ PASS | 63 primitive + 65 semantic + 63 component tokens, 9 legacy aliases |
| AC2 | ✅ PASS | brand-light first in themes.ts, default in layout.tsx |
| AC3 | ✅ PASS | All 11 theme classes preserved in globals.css |
| AC4 | ✅ PASS | 3 SVGs + 9 PNGs in public/brand/ |
| AC5 | ✅ PASS | Title="Cohortix", OG images updated |
| AC6 | ✅ PASS | `pnpm build` exit 0 |
| AC7 | ✅ PASS | tokens.css imported before Tailwind directives |
| AC8 | ⏳ | Phase 2B not started |
| AC9 | ⏳ | Phase 2C not started |

**Runtime verification pending:** Visual rendering, WCAG contrast, 12-theme switching
