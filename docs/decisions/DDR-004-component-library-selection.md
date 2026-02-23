# DDR-004: Component Library Selection (shadcn/ui)

**Status:** Accepted  
**Date:** 2026-02-11  
**Author:** Lubna (UI Designer)  
**Context:** Codex Compliance Week 2 — Design Documentation

---

## Decision

Cohortix adopts **shadcn/ui** as the primary component library, built on **Radix
UI primitives** and **Tailwind CSS**. Components are **copied into the
codebase** (not npm-installed), giving full ownership and customization without
library lock-in.

---

## Context

### Problem Statement

Cohortix requires:

1. **Accessible components** — WCAG 2.2 AA compliance out-of-the-box
2. **Full customization** — Linear-inspired dark theme without fighting library
   defaults
3. **TypeScript-first** — Strong typing for AI developer agents (Devi)
4. **Developer velocity** — Pre-built patterns for common UI elements

### Evaluated Alternatives

| Library               | Pros                                       | Cons                                      | Verdict                 |
| --------------------- | ------------------------------------------ | ----------------------------------------- | ----------------------- |
| **MUI (Material-UI)** | Mature, comprehensive                      | Material Design opinionated, large bundle | ❌ Too opinionated      |
| **Chakra UI**         | Great DX, accessible                       | Theming abstraction, CSS-in-JS overhead   | ⚠️ Acceptable but heavy |
| **Headless UI**       | Minimal, unstyled                          | Too low-level, repetitive styling         | ⚠️ Too much work        |
| **Radix UI**          | Accessible primitives                      | No default styles, every component custom | ⚠️ Better as foundation |
| **shadcn/ui**         | Copy-paste, full control, Radix + Tailwind | Manual updates, no npm package            | ✅ **SELECTED**         |

---

## Why shadcn/ui

### 1. Copy-Paste Philosophy (Full Ownership)

**How it works:**

```bash
npx shadcn@latest add button
```

This **copies** `components/ui/button.tsx` into your codebase. It's not an npm
dependency.

**Why this matters:**

- ✅ **Full control** — Modify components without forking or ejecting
- ✅ **No version lock-in** — Update on your schedule, not library releases
- ✅ **Transparent code** — AI agents (Devi) can read and understand components
  directly
- ✅ **Zero breaking changes** — Library updates don't break your app

**Trade-off:**  
You manage updates manuagent. But for Cohortix, **stability > automatic
updates**.

### 2. Built on Radix UI (Accessibility Foundation)

**Radix UI provides:**

- ✅ **Keyboard navigation** — Tab, Arrow keys, Enter/Space activation
- ✅ **Screen reader support** — Proper ARIA attributes, announcements
- ✅ **Focus management** — Correct focus trapping in modals, dialogs
- ✅ **Touch-friendly** — Handles hover/focus/active states correctly

**Example: Dialog component**

```tsx
import * as Dialog from '@radix-ui/react-dialog';

// Radix handles:
// - Escape key closes dialog
// - Focus trap inside dialog
// - Body scroll lock
// - aria-describedby, aria-labelledby
// - Focus return to trigger button
```

shadcn/ui wraps Radix with Tailwind styles, so we get **accessible primitives +
visual design**.

### 3. Tailwind CSS Integration (No CSS-in-JS)

**Why this matters:**

- ✅ **Consistent styling** — Same Tailwind classes everywhere (buttons, cards,
  forms)
- ✅ **Zero runtime overhead** — No CSS-in-JS parsing, smaller bundles
- ✅ **Responsive by default** — `md:`, `lg:` prefixes work seamlessly
- ✅ **Dark mode built-in** — `dark:` prefix matches our dark-first strategy

**Example:**

```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Deploy Cohort
</Button>
```

Tailwind's `hover:bg-primary/90` gives us 90% opacity on hover. No CSS file, no
styled-components, just utility classes.

### 4. TypeScript-First (AI Developer Friendly)

**All shadcn/ui components:**

- ✅ **Strongly typed** — `ButtonProps`, `DialogProps` with full IntelliSense
- ✅ **Exported interfaces** — Devi can extend types without guessing
- ✅ **Generics support** — `<Select<T>>` for type-safe options

**Example:**

```tsx
interface AgentSelectProps {
  agents: Agent[];
  onSelect: (agent: Agent) => void;
}

export function AgentSelect({ agents, onSelect }: AgentSelectProps) {
  return (
    <Select<Agent>
      options={agents}
      getOptionLabel={(agent) => agent.name}
      onChange={onSelect}
    />
  );
}
```

Devi (AI Developer) can read this and understand the contract without
documentation.

---

## Component Coverage

### Core Components (Installed)

| Component         | Usage                            | WCAG Compliance                      |
| ----------------- | -------------------------------- | ------------------------------------ |
| **Button**        | Primary actions, links           | ✅ AA (focus ring, contrast)         |
| **Card**          | Missions, goals, agent profiles  | ✅ AA (semantic HTML)                |
| **Dialog**        | Modals, confirmations            | ✅ AAA (focus trap, Esc key)         |
| **Form**          | Mission briefs, agent creation   | ✅ AA (labels, error messages)       |
| **Input**         | Text fields, search              | ✅ AA (aria-labelledby, placeholder) |
| **Select**        | Agent assignment, status filters | ✅ AA (keyboard navigation)          |
| **Dropdown Menu** | Context menus, actions           | ✅ AA (arrow key navigation)         |
| **Tabs**          | Mission details, agent settings  | ✅ AA (arrow keys, Home/End)         |
| **Toast**         | Success, error notifications     | ✅ AA (aria-live regions)            |
| **Avatar**        | Agent profiles, user menu        | ✅ AA (alt text, fallback initials)  |
| **Badge**         | Status indicators, counts        | ✅ AA (color + text)                 |
| **Progress**      | Mission completion, workload     | ✅ AA (aria-valuenow, min/max)       |
| **Tooltip**       | Icon explanations, help text     | ✅ AA (aria-describedby)             |

### Custom Components (To Be Built)

| Component           | Based On                | Status         |
| ------------------- | ----------------------- | -------------- |
| **MissionCard**     | Card + Badge + Progress | 🟡 In progress |
| **AgentCard**       | Card + Avatar + Badge   | 🟡 In progress |
| **WorkloadMeter**   | Progress + Tooltip      | 📝 Planned     |
| **StatusRing**      | Custom SVG              | 📝 Planned     |
| **MissionTimeline** | Custom (no base)        | 📝 Planned     |

---

## Customization Strategy

### Theme Integration

**shadcn/ui uses CSS variables** for theming:

```css
/* globals.css */
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 221.2 83.2 53.3%; /* #5E6AD2 in HSL */
  --ring: 221.2 83.2 53.3%;
}

.dark {
  --background: 0 0% 3.9%; /* #0A0A0B */
  --foreground: 0 0% 98%; /* #FAFAFA */
}
```

**Why CSS variables:**

- ✅ **Runtime theme switching** — Dark mode toggle without re-render
- ✅ **Scoped overrides** — Theme a specific section differently
- ✅ **Design token compatibility** — Maps directly to our token system

### Component Variants (cva)

shadcn/ui uses **class-variance-authority (cva)** for variant management:

```tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);
```

**Benefits:**

- ✅ **Type-safe variants** — IntelliSense suggests `variant="outline"`
- ✅ **Composable styles** — Combine variants without className hell
- ✅ **Default fallbacks** — Missing props use sensible defaults

**Usage:**

```tsx
<Button variant="destructive" size="lg">
  Delete Mission
</Button>
```

---

## Integration with Tailwind Config

### Color Token Mapping

Our `tailwind.config.ts` defines colors. shadcn/ui references them via CSS
variables:

```ts
// tailwind.config.ts
colors: {
  primary: {
    DEFAULT: '#5E6AD2',
    foreground: '#FFFFFF',
  },
}
```

```css
/* components/ui/button.tsx */
className="bg-primary text-primary-foreground"
```

Tailwind compiles this to:

```css
.bg-primary {
  background-color: hsl(var(--primary));
}
.text-primary-foreground {
  color: hsl(var(--primary-foreground));
}
```

**Why this indirection:**  
CSS variables enable **dark mode** without duplicating classes.
`.dark .bg-primary` automaticagent uses the dark theme value.

---

## Trade-offs & Limitations

### What We Sacrificed

1. **Automatic updates** — No `npm update` for components
   - _Mitigation:_ Subscribe to shadcn/ui changelog, manuagent port relevant
     fixes
2. **Community themes** — Can't install pre-built themes from npm
   - _Mitigation:_ We control theming (not a downside for custom design)
3. **Documentation overhead** — Must document custom modifications
   - _Mitigation:_ Add inline comments, update Storybook

### What We Gained

1. **Zero vendor lock-in** — Can replace shadcn/ui anytime (components live in
   our repo)
2. **Perfect alignment with design system** — No CSS overrides, no `!important`
   hacks
3. **AI agent transparency** — Devi can read, modify, generate components
   directly
4. **Bundle size control** — Only ship components we use (no tree-shaking
   uncertainty)

---

## Developer Workflow

### Adding a New Component

```bash
# 1. Install the component
npx shadcn@latest add dialog

# 2. Component copied to:
packages/ui/src/components/ui/dialog.tsx

# 3. Import and use:
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'
```

### Customizing an Existing Component

**Example:** Make all buttons rounded-full instead of rounded-md

```tsx
// packages/ui/src/components/ui/button.tsx
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-full text-sm font-medium'
  //                                            ^^^^^ Changed from rounded-md
  // ... rest unchanged
);
```

**Impact:** All buttons across the app now use full rounding. No breaking
changes (it's our code).

### Testing Strategy

**Unit tests:**

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

test('button renders with correct variant', () => {
  render(<Button variant="destructive">Delete</Button>);
  expect(screen.getByRole('button')).toHaveClass('bg-destructive');
});
```

**Accessibility tests:**

```tsx
import { axe } from 'jest-axe';

test('button has no accessibility violations', async () => {
  const { container } = render(<Button>Click me</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Migration Path (If Needed)

**If we outgrow shadcn/ui:**

1. **Components are ours** — No need to "eject" (we already own the code)
2. **Replace primitives** — Swap Radix UI for Headless UI or React Aria
3. **Keep styling** — Tailwind classes remain unchanged
4. **Gradual migration** — Replace components one at a time (no big-bang
   rewrite)

**Estimated effort:** 2-3 weeks for full migration (vs. 6-8 weeks for locked-in
libraries like MUI)

---

## Performance Characteristics

### Bundle Size Impact

**Typical shadcn/ui component:**

- Button: ~2KB (gzipped)
- Dialog: ~8KB (includes Radix primitives)
- Form: ~12KB (includes React Hook Form integration)

**Comparison:**

- MUI Button: ~15KB (includes ThemeProvider, styled-components)
- Chakra Button: ~10KB (includes Emotion runtime)

**Advantage:** 50-70% smaller bundles due to no CSS-in-JS runtime.

### Runtime Performance

- **Zero runtime theming overhead** — CSS variables are native browser feature
- **No styled-component parsing** — Tailwind classes are pre-compiled
- **Tree-shaking friendly** — Only import what you use

---

## Accessibility Validation

### Pre-Launch Checklist

- [x] **Keyboard navigation** — All components accessible via Tab, Arrow keys
- [x] **Screen reader testing** — VoiceOver (macOS), NVDA (Windows)
- [x] **Focus management** — Modals trap focus, close returns focus
- [x] **Color contrast** — All text meets 4.5:1 (WCAG AA)
- [x] **Touch targets** — Minimum 44x44px (WCAG 2.5.5)
- [x] **Reduced motion** — Respects `prefers-reduced-motion`

### Ongoing Monitoring

- **axe DevTools** — Run on every page during development
- **Lighthouse** — CI/CD accessibility score must be 95+
- **Manual testing** — Monthly screen reader audits

---

## References

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Primitives](https://radix-ui.com)
- [class-variance-authority](https://cva.style)
- [Tailwind CSS + Accessibility](https://tailwindcss.com/docs/screen-readers)

---

## Changelog

- **2026-02-11:** Initial version (Lubna)
