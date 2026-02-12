# Design Tokens

**Version:** 1.0.0  
**Last Updated:** 2026-02-11  
**Codex Compliance:** Week 2 — Design Documentation

---

## Overview

This directory contains **design tokens** for the Cohortix UI design system. Tokens are the atomic design decisions (colors, spacing, typography) extracted from the Tailwind configuration into structured, type-safe TypeScript constants.

---

## Why Design Tokens?

**Problems they solve:**
1. **Single source of truth** — No more hardcoded `#5E6AD2` scattered across components
2. **Type safety** — TypeScript ensures valid token references at compile-time
3. **Platform-agnostic** — Export to JSON for iOS, Android, Figma plugins
4. **Semantic naming** — `colors.dark.primary` is clearer than raw hex values
5. **Easier updates** — Change primary color once, update everywhere

---

## Token Files

| File | Purpose |
|------|---------|
| **`colors.ts`** | Color palette, semantic colors, status colors, contrast ratios |
| **`spacing.ts`** | Spacing scale (8px grid), layout values, touch targets, z-index |
| **`typography.ts`** | Font families, sizes, weights, line heights, text styles |
| **`index.ts`** | Exports all tokens + metadata (version, changelog) |

---

## Usage

### In React Components

```tsx
import { colors, spacing, typography } from '@cohortix/ui/tokens'

export function MissionCard() {
  return (
    <div
      style={{
        backgroundColor: colors.dark.card.DEFAULT,
        padding: spacing[6],
        borderRadius: spacing.borderRadius.lg,
        color: colors.dark.foreground,
      }}
    >
      <h3 style={typography.textStyles.h3}>Mission Title</h3>
      <p style={typography.textStyles.body}>Mission description...</p>
    </div>
  )
}
```

### In Tailwind Config

```ts
// tailwind.config.ts
import colors from './packages/ui/tokens/colors'
import spacing from './packages/ui/tokens/spacing'
import fontSize from './packages/ui/tokens/typography'

export default {
  theme: {
    extend: {
      colors,
      spacing,
      fontSize,
    },
  },
}
```

### In Styled Components (if needed)

```tsx
import styled from 'styled-components'
import { colors, spacing } from '@cohortix/ui/tokens'

const Button = styled.button`
  background-color: ${colors.dark.primary.DEFAULT};
  color: ${colors.dark.primary.foreground};
  padding: ${spacing[4]} ${spacing[6]};
  border-radius: ${spacing.borderRadius.lg};
  font-weight: ${typography.fontWeight.medium};
  
  &:hover {
    background-color: ${colors.dark.primary.DEFAULT}e6; /* 90% opacity */
  }
`
```

---

## Token Structure

### Colors

```ts
colors.dark.primary.DEFAULT    // #5E6AD2
colors.dark.primary.foreground // #FFFFFF
colors.dark.success            // #10B981
statusColors.mission.active    // Green (On Mission)
statusColors.ally.standingBy   // Gray (Standing By)
```

### Spacing

```ts
spacing[4]           // 16px (1rem)
spacing[6]           // 24px (1.5rem)
layout.sidebarWidth  // 240px
touchTarget.minimum  // 44px (WCAG requirement)
borderRadius.lg      // 8px
```

### Typography

```ts
typography.fontSize.base       // [16px, { lineHeight: 24px }]
typography.fontWeight.medium   // 500
typography.textStyles.h1       // Complete heading style
typography.componentTypography.card.title // Mission card title style
```

---

## Semantic Naming

Tokens use **semantic names** instead of raw values:

| ❌ Bad | ✅ Good |
|--------|---------|
| `#5E6AD2` | `colors.dark.primary.DEFAULT` |
| `16px` | `spacing[4]` |
| `20px` | `spacing[5]` |
| `14px` | `typography.fontSize.sm` |

**Why?** Semantic names:
- Survive design updates (change primary color, references stay valid)
- Self-document ("primary" is clearer than "#5E6AD2")
- Enable theming (light/dark modes use same token names)

---

## Design Decisions Recorded

### DDR-001: Color Palette

- Primary: `#5E6AD2` (Linear-inspired blue-violet)
- Dark mode as default (not a theme)
- All colors meet WCAG 2.2 AA contrast requirements
- See: `docs/design/DDR-001-color-palette-and-accessibility.md`

### DDR-003: Responsive Breakpoints

- Mobile-first approach
- Tailwind default breakpoints (640, 768, 1024, 1280, 1440)
- Desktop (1024px+) as primary experience
- See: `docs/design/DDR-003-responsive-breakpoint-strategy.md`

### Typography Scale

- 1.25 ratio (Major Third)
- Inter variable font (sans-serif)
- Fira Code (monospace)
- Line heights optimized for readability

---

## Exporting Tokens

### To JSON (for Figma, iOS, Android)

```ts
// scripts/export-tokens.ts
import * as tokens from './packages/ui/tokens'
import fs from 'fs'

const json = JSON.stringify(tokens, null, 2)
fs.writeFileSync('./design-tokens.json', json)
```

### To CSS Variables (for legacy support)

```css
/* generated.css */
:root {
  --color-primary: #5E6AD2;
  --color-foreground: #FAFAFA;
  --spacing-4: 1rem;
  --spacing-6: 1.5rem;
  --font-size-base: 1rem;
}
```

---

## Updating Tokens

### When to Update

1. **Design system evolution** — New colors, spacing values, font sizes
2. **Accessibility fixes** — Contrast adjustments, touch target sizes
3. **Brand changes** — Primary color update, typography refresh

### Update Process

1. **Update token file** (e.g., `colors.ts`)
2. **Update Tailwind config** (if needed)
3. **Run tests** — Ensure no breaking changes
4. **Update changelog** in `index.ts`
5. **Bump version** (major for breaking changes, minor for additions)
6. **Document decision** in relevant DDR or create new DDR

---

## Validation

### Accessibility Checks

```ts
// colors.ts exports contrast ratios
contrastRatios.foregroundOnBackground // 17.8:1 (AAA)
contrastRatios.primaryOnBackground    // 9.2:1 (AAA)
```

### Type Safety

TypeScript ensures:
- Valid token references (`colors.dark.primary.DEFAULT` is correct)
- No typos (`colors.dark.primry` fails at compile-time)
- Auto-complete in IDEs

---

## Related Documentation

- [DDR-001: Color Palette](../../docs/design/DDR-001-color-palette-and-accessibility.md)
- [DDR-002: Terminology](../../docs/design/DDR-002-terminology-decisions.md)
- [DDR-003: Responsive Breakpoints](../../docs/design/DDR-003-responsive-breakpoint-strategy.md)
- [DDR-004: Component Library](../../docs/design/DDR-004-component-library-selection.md)
- [UI Design System](../../docs/UI_DESIGN_SYSTEM.md)
- [Tailwind Config](../../apps/web/tailwind.config.ts)

---

## Future Enhancements

### Planned

- [ ] Animation tokens (duration, easing functions)
- [ ] Light mode color palette (when prioritized)
- [ ] Icon size scale (separate from spacing)
- [ ] Gradient definitions (if needed for UI)

### Under Consideration

- [ ] Export to Figma Tokens plugin format
- [ ] Generate Style Dictionary config
- [ ] Automated contrast ratio validation
- [ ] Token usage analytics (which tokens are most used?)

---

## Questions?

- **Design system questions:** Lubna (UI Designer)
- **Implementation questions:** Devi (AI Developer)
- **Token structure:** See `index.ts` changelog

---

*This directory is the single source of truth for design decisions. Update tokens, not hardcoded values.*
