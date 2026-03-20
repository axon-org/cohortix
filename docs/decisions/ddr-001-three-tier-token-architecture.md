# DDR-001: Three-Tier Design Token Architecture

<!-- Purpose: Decision record for adopting three-tier token system per Codex §12 -->
<!-- Owner: Alim (CEO) -->
<!-- Last Reviewed: 2026-03-20 -->
<!-- Read After: docs/design/token-architecture.md -->

- **Date:** 2026-03-19
- **Status:** Accepted
- **Deciders:** Ahmad (CEO), Alim (AI CEO)
- **Consulted:** Lubna (UI Designer)
- **Informed:** Sami (Frontend Developer), Farhan (Graphic Designer)

## Context

Cohortix's codebase has 987 hardcoded Tailwind color references (`text-red-400`, `bg-green-500/20`, etc.) that bypass the theme system. When users switch themes, these colors don't change. The existing CSS variable system (~30 vars per theme) is flat — no separation between raw values, contextual meaning, and component-specific usage.

Codex §12 mandates a three-tier token system. We need to decide how to implement it without breaking 11 existing themes.

## Decision

Adopt the Axon Dev Codex §12 three-tier token architecture:

1. **Tier 1 (Primitive):** Raw color scales, spacing, radius, typography — defined once, shared across all themes
2. **Tier 2 (Semantic):** Contextual tokens (`--bg-canvas`, `--text-primary`, `--status-success-fg`) — each theme overrides these
3. **Tier 3 (Component):** Component-specific (`--btn-primary-bg`, `--card-border`, `--kanban-card-shadow`) — reference semantic tokens

Implementation in `src/styles/tokens.css`, imported before Tailwind directives. Existing CSS var names (`--background`, `--foreground`, `--primary`, etc.) preserved as backward-compatible aliases mapping to new semantic tokens.

## Consequences

**Gains:**
- All 987 hardcoded colors can be migrated to semantic/component tokens
- New features automatically respect theme switching
- Component tokens enable consistent styling without per-component color decisions
- Backward compatibility — existing code continues to work during migration

**Risks:**
- Token file adds ~300 lines of CSS custom properties
- Migration of 987 refs is a large effort (estimated 1-2 weeks)
- Circular references possible if token chains aren't carefully managed

**Follow-up actions:**
- [x] Implement token foundation (Phase 2A) — Sami
- [ ] Migrate 987 hardcoded colors (Phase 2B) — TBD
- [ ] Add ESLint rule preventing new hardcoded colors (Phase 2C) — TBD
