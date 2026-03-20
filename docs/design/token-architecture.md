# Token Architecture — Cohortix Design System
**Author:** Lubna (UI Designer Agent)  
**Date:** 2025-07-14  
**Phase:** Codex Phase 3, Step 1 — Design Token System  
**Codex Reference:** §12 Three-Tier Token Architecture  
**Status:** Draft v1 — Pending Ahmad Review

---

## Overview

This document defines the three-tier design token architecture for Cohortix. The goal is to eliminate 987 hardcoded Tailwind color references and create a consistent, theme-aware design language.

### Current State Problems
1. **987 hardcoded color references** (`text-blue-500`, `bg-gray-900`, etc.) bypass the theme system entirely — these colors don't change when the user switches themes.
2. **No component-level tokens** — each component reimplements color logic independently.
3. **Token gap** — CSS vars define semantic tokens but they're not consistently used.
4. **The `design-tokens.ts` file only covers the Void (dark) palette** — no light theme equivalents.

### Solution: Three-Tier Architecture

```
Tier 1: PRIMITIVE TOKENS    Raw values — colors, sizes, spacing
         ↓ Referenced by
Tier 2: SEMANTIC TOKENS     Contextual meaning — "what is this for"
         ↓ Referenced by  
Tier 3: COMPONENT TOKENS    Component-specific — "exactly this element"
```

**Rules:**
- Components ONLY reference Tier 3 or Tier 2 tokens (never Tier 1 directly)
- Tier 2 tokens reference Tier 1 tokens (or raw values)
- Tier 3 tokens reference Tier 2 tokens (for overrides) or Tier 1 (for unique cases)
- Tailwind classes reference CSS variables (via `tailwind.config.js`) — never hardcoded colors

---

## Tier 1: Primitive Tokens

Primitive tokens are raw values with no semantic meaning. They define the complete color scales, spacing units, and type scale.

### Color Primitives

These are defined once and referenced by all themes. Each theme maps semantic tokens to different primitives.

```css
/* Color Scale Format: --color-{hue}-{step} */
/* Steps: 50 (lightest) → 950 (darkest) */

/* Neutral (warm gray — for approachable default) */
--color-neutral-0:   hsl(0 0% 100%);
--color-neutral-50:  hsl(240 10% 98%);
--color-neutral-100: hsl(240 8% 95%);
--color-neutral-200: hsl(240 6% 90%);
--color-neutral-300: hsl(240 5% 82%);
--color-neutral-400: hsl(240 4% 68%);
--color-neutral-500: hsl(240 4% 52%);
--color-neutral-600: hsl(240 5% 40%);
--color-neutral-700: hsl(240 6% 28%);
--color-neutral-800: hsl(240 8% 18%);
--color-neutral-900: hsl(240 10% 10%);
--color-neutral-950: hsl(240 12% 5%);

/* Warm (amber/paper warmth) */
--color-warm-50:  hsl(40 40% 97%);
--color-warm-100: hsl(40 35% 93%);
--color-warm-200: hsl(40 30% 87%);
--color-warm-300: hsl(40 25% 76%);
--color-warm-400: hsl(40 30% 60%);
--color-warm-500: hsl(40 45% 50%);
--color-warm-600: hsl(40 60% 40%);
--color-warm-700: hsl(40 70% 30%);
--color-warm-800: hsl(40 75% 20%);
--color-warm-900: hsl(40 80% 12%);

/* Indigo (brand primary — warm-toned, approachable) */
--color-indigo-50:  hsl(248 100% 97%);
--color-indigo-100: hsl(248 90% 93%);
--color-indigo-200: hsl(248 85% 86%);
--color-indigo-300: hsl(248 75% 75%);
--color-indigo-400: hsl(248 65% 64%);
--color-indigo-500: hsl(248 55% 55%);   /* brand default */
--color-indigo-600: hsl(248 55% 46%);
--color-indigo-700: hsl(248 58% 38%);
--color-indigo-800: hsl(248 60% 28%);
--color-indigo-900: hsl(248 60% 18%);

/* Cyan (Void theme accent — existing) */
--color-cyan-400: hsl(187 82% 53%);
--color-cyan-500: hsl(187 82% 45%);
--color-cyan-600: hsl(187 82% 38%);

/* Green (success) */
--color-green-100: hsl(148 60% 94%);
--color-green-200: hsl(148 55% 85%);
--color-green-400: hsl(148 55% 58%);
--color-green-500: hsl(148 50% 42%);   /* primary success */
--color-green-600: hsl(148 55% 34%);
--color-green-900: hsl(148 60% 12%);

/* Amber (warning) */
--color-amber-100: hsl(38 90% 94%);
--color-amber-200: hsl(38 85% 84%);
--color-amber-400: hsl(38 90% 58%);
--color-amber-500: hsl(38 85% 50%);   /* primary warning */
--color-amber-600: hsl(38 85% 40%);
--color-amber-900: hsl(38 80% 12%);

/* Red (error/destructive) */
--color-red-100: hsl(4 80% 95%);
--color-red-200: hsl(4 75% 86%);
--color-red-400: hsl(4 78% 60%);
--color-red-500: hsl(4 75% 52%);     /* primary destructive */
--color-red-600: hsl(4 75% 42%);
--color-red-900: hsl(4 72% 14%);

/* Blue (info) */
--color-blue-100: hsl(220 70% 95%);
--color-blue-200: hsl(220 65% 86%);
--color-blue-400: hsl(220 70% 62%);
--color-blue-500: hsl(220 65% 55%);  /* primary info */
--color-blue-600: hsl(220 65% 44%);
--color-blue-900: hsl(220 60% 14%);

/* Pink/Violet (synthwave accent, catppuccin accent) */
--color-violet-400: hsl(263 90% 66%);
--color-violet-500: hsl(263 80% 56%);

/* Pure black/white for Vercel theme */
--color-black:    hsl(0 0% 0%);
--color-white:    hsl(0 0% 100%);
```

### Spacing Primitives

```css
--space-0:    0px;
--space-0-5:  2px;
--space-1:    4px;
--space-1-5:  6px;
--space-2:    8px;
--space-3:    12px;
--space-4:    16px;
--space-5:    20px;
--space-6:    24px;
--space-8:    32px;
--space-10:   40px;
--space-12:   48px;
--space-16:   64px;
```

### Radius Primitives

```css
--radius-xs:   4px;
--radius-sm:   6px;
--radius-md:   8px;
--radius-lg:   10px;
--radius-xl:   12px;
--radius-2xl:  16px;
--radius-full: 9999px;
```

### Typography Primitives

```css
--font-sans:  'Inter', system-ui, -apple-system, sans-serif;
--font-mono:  'JetBrains Mono', 'SF Mono', 'Fira Code', ui-monospace, monospace;

--text-xs:    12px;
--text-sm:    13px;
--text-base:  14px;
--text-md:    15px;
--text-lg:    18px;
--text-xl:    20px;
--text-2xl:   24px;
--text-3xl:   30px;

--font-regular:   400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;

--leading-tight:  1.25;
--leading-snug:   1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

---

## Tier 2: Semantic Tokens

Semantic tokens define **what a color is for**, not what it looks like. These live in CSS as the existing `--background`, `--foreground` etc. vars — but we're expanding the vocabulary significantly.

### Theme-Mapped Semantic Tokens

Each token below is defined per theme. The full mapping for all 11 themes would replace the current `globals.css` theme blocks.

```css
/* Backgrounds */
--bg-canvas          /* page background */
--bg-surface         /* cards, panels */
--bg-surface-raised  /* tooltips, dropdowns (above surface) */
--bg-surface-overlay /* modals, dialogs */
--bg-subtle          /* subtle highlight / hover state bg */
--bg-inverse         /* inverted surface (dark-on-light or light-on-dark) */

/* Text */
--text-primary        /* main content text */
--text-secondary      /* secondary labels, descriptions */
--text-muted          /* placeholder, disabled, deemphasized */
--text-inverse        /* text on inverse bg */
--text-link           /* clickable text links */
--text-link-hover     /* link hover state */

/* Interactive (brand colors) */
--interactive-primary           /* brand primary: buttons, active links, focus rings */
--interactive-primary-hover     /* primary hover */
--interactive-primary-subtle    /* primary 10% opacity bg (pill badges, tags) */
--interactive-primary-fg        /* text on primary bg */
--interactive-secondary         /* secondary/ghost button bg */
--interactive-secondary-hover   /* secondary hover */
--interactive-secondary-fg      /* secondary text */

/* Borders */
--border-default     /* default border (cards, inputs, dividers) */
--border-strong      /* prominent border (focused inputs, selected items) */
--border-subtle      /* very subtle (internal dividers) */
--border-focus       /* focus ring color */

/* Status: Success */
--status-success-bg       /* badge/alert background */
--status-success-fg       /* badge/alert text */
--status-success-border   /* badge/alert border */
--status-success-icon     /* icon color */
--status-success-solid    /* solid success (progress fill, dot) */

/* Status: Warning */
--status-warning-bg
--status-warning-fg
--status-warning-border
--status-warning-icon
--status-warning-solid

/* Status: Error / Destructive */
--status-error-bg
--status-error-fg
--status-error-border
--status-error-icon
--status-error-solid

/* Status: Info */
--status-info-bg
--status-info-fg
--status-info-border
--status-info-icon
--status-info-solid

/* Status: Neutral (default/no status) */
--status-neutral-bg
--status-neutral-fg
--status-neutral-border

/* Priority levels */
--priority-urgent     /* P1 urgent */
--priority-high       /* P2 high */
--priority-medium     /* P3 medium */
--priority-low        /* P4 low */
--priority-none       /* no priority */

/* Shadows */
--shadow-sm:   0 1px 2px hsl(var(--shadow-color) / 0.06);
--shadow-md:   0 4px 12px hsl(var(--shadow-color) / 0.08);
--shadow-lg:   0 8px 24px hsl(var(--shadow-color) / 0.12);
--shadow-xl:   0 16px 48px hsl(var(--shadow-color) / 0.16);
--shadow-color: 240 10% 0%;  /* overridden per theme */

/* Focus ring */
--focus-ring:  0 0 0 2px var(--bg-canvas), 0 0 0 4px var(--border-focus);
```

### Semantic Token → Primitive Mapping (Light Brand Theme)

```css
[data-theme="brand"] {  /* or :root for default */
  --bg-canvas:             var(--color-warm-50);
  --bg-surface:            var(--color-warm-100);
  --bg-surface-raised:     var(--color-white);
  --bg-surface-overlay:    var(--color-white);
  --bg-subtle:             var(--color-neutral-100);
  --bg-inverse:            var(--color-neutral-900);

  --text-primary:          var(--color-neutral-900);
  --text-secondary:        var(--color-neutral-700);
  --text-muted:            var(--color-neutral-500);
  --text-inverse:          var(--color-neutral-50);
  --text-link:             var(--color-indigo-600);
  --text-link-hover:       var(--color-indigo-700);

  --interactive-primary:          var(--color-indigo-500);
  --interactive-primary-hover:    var(--color-indigo-600);
  --interactive-primary-subtle:   var(--color-indigo-100);
  --interactive-primary-fg:       var(--color-white);
  --interactive-secondary:        var(--color-neutral-100);
  --interactive-secondary-hover:  var(--color-neutral-200);
  --interactive-secondary-fg:     var(--color-neutral-800);

  --border-default:  var(--color-neutral-200);
  --border-strong:   var(--color-neutral-400);
  --border-subtle:   var(--color-neutral-100);
  --border-focus:    var(--color-indigo-400);

  --status-success-bg:     var(--color-green-100);
  --status-success-fg:     var(--color-green-600);
  --status-success-border: var(--color-green-200);
  --status-success-icon:   var(--color-green-500);
  --status-success-solid:  var(--color-green-500);

  --status-warning-bg:     var(--color-amber-100);
  --status-warning-fg:     var(--color-amber-600);
  --status-warning-border: var(--color-amber-200);
  --status-warning-icon:   var(--color-amber-500);
  --status-warning-solid:  var(--color-amber-500);

  --status-error-bg:       var(--color-red-100);
  --status-error-fg:       var(--color-red-600);
  --status-error-border:   var(--color-red-200);
  --status-error-icon:     var(--color-red-500);
  --status-error-solid:    var(--color-red-500);

  --status-info-bg:        var(--color-blue-100);
  --status-info-fg:        var(--color-blue-600);
  --status-info-border:    var(--color-blue-200);
  --status-info-icon:      var(--color-blue-500);
  --status-info-solid:     var(--color-blue-500);

  --status-neutral-bg:     var(--color-neutral-100);
  --status-neutral-fg:     var(--color-neutral-600);
  --status-neutral-border: var(--color-neutral-200);

  --priority-urgent:  var(--color-red-500);
  --priority-high:    var(--color-amber-500);
  --priority-medium:  var(--color-blue-500);
  --priority-low:     var(--color-neutral-400);
  --priority-none:    var(--color-neutral-300);

  --shadow-color: 240 10% 0%;
}
```

### Semantic Token → Primitive Mapping (Void Dark Theme)

```css
.dark, .void {
  --bg-canvas:             var(--color-neutral-950);    /* 215 27% 4% */
  --bg-surface:            hsl(220 30% 8%);
  --bg-surface-raised:     hsl(220 30% 10%);
  --bg-surface-overlay:    hsl(220 25% 12%);
  --bg-subtle:             hsl(220 20% 14%);
  --bg-inverse:            var(--color-neutral-50);

  --text-primary:          hsl(210 20% 92%);
  --text-secondary:        hsl(210 15% 70%);
  --text-muted:            hsl(220 15% 50%);
  --text-inverse:          var(--color-neutral-950);
  --text-link:             var(--color-cyan-400);
  --text-link-hover:       hsl(187 90% 65%);

  --interactive-primary:          var(--color-cyan-400);
  --interactive-primary-hover:    hsl(187 88% 60%);
  --interactive-primary-subtle:   hsl(187 82% 53% / 0.12);
  --interactive-primary-fg:       hsl(220 30% 6%);
  --interactive-secondary:        hsl(220 25% 11%);
  --interactive-secondary-hover:  hsl(220 20% 16%);
  --interactive-secondary-fg:     hsl(210 20% 92%);

  --border-default:  hsl(220 20% 14%);
  --border-strong:   hsl(220 25% 22%);
  --border-subtle:   hsl(220 15% 10%);
  --border-focus:    var(--color-cyan-400);

  /* Status colors — dark variants */
  --status-success-bg:     hsl(160 60% 52% / 0.12);
  --status-success-fg:     hsl(160 60% 60%);
  --status-success-border: hsl(160 60% 52% / 0.25);
  --status-success-icon:   hsl(160 60% 52%);
  --status-success-solid:  hsl(160 60% 52%);

  --status-warning-bg:     hsl(38 92% 50% / 0.12);
  --status-warning-fg:     hsl(38 92% 60%);
  --status-warning-border: hsl(38 92% 50% / 0.25);
  --status-warning-icon:   hsl(38 92% 50%);
  --status-warning-solid:  hsl(38 92% 50%);

  --status-error-bg:       hsl(0 72% 51% / 0.12);
  --status-error-fg:       hsl(0 72% 62%);
  --status-error-border:   hsl(0 72% 51% / 0.25);
  --status-error-icon:     hsl(0 72% 51%);
  --status-error-solid:    hsl(0 72% 51%);

  --status-info-bg:        hsl(187 82% 53% / 0.12);
  --status-info-fg:        hsl(187 82% 62%);
  --status-info-border:    hsl(187 82% 53% / 0.25);
  --status-info-icon:      hsl(187 82% 53%);
  --status-info-solid:     hsl(187 82% 53%);

  --status-neutral-bg:     hsl(220 20% 14%);
  --status-neutral-fg:     hsl(220 15% 50%);
  --status-neutral-border: hsl(220 20% 18%);

  --priority-urgent:  hsl(0 72% 55%);
  --priority-high:    hsl(38 92% 50%);
  --priority-medium:  hsl(187 82% 53%);
  --priority-low:     hsl(220 15% 50%);
  --priority-none:    hsl(220 15% 35%);

  --shadow-color: 215 27% 0%;
}
```

---

## Tier 3: Component Tokens

Component tokens are the most granular level — they map semantic tokens to specific component slots.

### Badge / Status Chip

```css
/* badges use status semantic tokens directly */
.badge {
  background: var(--status-{variant}-bg);
  color:      var(--status-{variant}-fg);
  border:     1px solid var(--status-{variant}-border);
}
/* No hardcoded colors needed */
```

### Button

```css
--btn-primary-bg:          var(--interactive-primary);
--btn-primary-bg-hover:    var(--interactive-primary-hover);
--btn-primary-fg:          var(--interactive-primary-fg);
--btn-primary-border:      transparent;

--btn-secondary-bg:        var(--interactive-secondary);
--btn-secondary-bg-hover:  var(--interactive-secondary-hover);
--btn-secondary-fg:        var(--interactive-secondary-fg);
--btn-secondary-border:    var(--border-default);

--btn-ghost-bg:            transparent;
--btn-ghost-bg-hover:      var(--bg-subtle);
--btn-ghost-fg:            var(--text-secondary);
--btn-ghost-fg-hover:      var(--text-primary);

--btn-destructive-bg:      var(--status-error-solid);
--btn-destructive-bg-hover: hsl(from var(--status-error-solid) h s calc(l - 5%));
--btn-destructive-fg:      var(--color-white);

--btn-radius:              var(--radius-md);
--btn-padding-sm:          var(--space-1-5) var(--space-3);
--btn-padding-md:          var(--space-2) var(--space-4);
--btn-padding-lg:          var(--space-3) var(--space-5);
--btn-font-size:           var(--text-base);
--btn-font-weight:         var(--font-medium);
```

### Card / Panel

```css
--card-bg:          var(--bg-surface);
--card-bg-hover:    var(--bg-subtle);
--card-border:      var(--border-default);
--card-radius:      var(--radius-xl);
--card-padding:     var(--space-4);
--card-shadow:      var(--shadow-sm);
--card-shadow-hover: var(--shadow-md);
```

### Input / Form

```css
--input-bg:            var(--bg-surface);
--input-bg-disabled:   var(--bg-subtle);
--input-border:        var(--border-default);
--input-border-hover:  var(--border-strong);
--input-border-focus:  var(--border-focus);
--input-text:          var(--text-primary);
--input-placeholder:   var(--text-muted);
--input-radius:        var(--radius-md);
--input-padding:       var(--space-2) var(--space-3);
--input-font-size:     var(--text-base);

--input-error-border:  var(--status-error-icon);
--input-error-text:    var(--status-error-fg);
```

### Navigation / Sidebar

```css
--nav-bg:            var(--bg-surface);
--nav-border:        var(--border-default);
--nav-item-fg:       var(--text-secondary);
--nav-item-fg-active: var(--interactive-primary);
--nav-item-bg-hover: var(--bg-subtle);
--nav-item-bg-active: var(--interactive-primary-subtle);
--nav-item-radius:   var(--radius-md);
--nav-item-padding:  var(--space-2) var(--space-3);
```

### Table / List

```css
--table-bg:              var(--bg-canvas);
--table-row-border:      var(--border-subtle);
--table-row-bg-hover:    var(--bg-subtle);
--table-row-bg-selected: var(--interactive-primary-subtle);
--table-header-bg:       var(--bg-surface);
--table-header-fg:       var(--text-muted);
--table-header-border:   var(--border-default);
--table-cell-fg:         var(--text-primary);
--table-cell-fg-secondary: var(--text-secondary);
```

### Kanban Card

```css
--kanban-card-bg:            var(--bg-surface);
--kanban-card-bg-hover:      var(--bg-surface-raised);
--kanban-card-border:        var(--border-default);
--kanban-card-border-hover:  var(--border-strong);
--kanban-card-radius:        var(--radius-xl);
--kanban-card-padding:       var(--space-3) var(--space-4);
--kanban-card-shadow:        var(--shadow-sm);
--kanban-card-shadow-drag:   var(--shadow-xl);
--kanban-column-bg:          var(--bg-subtle);
--kanban-column-radius:      var(--radius-xl);
--kanban-column-padding:     var(--space-3);
```

### Modal / Dialog

```css
--modal-bg:             var(--bg-surface-overlay);
--modal-border:         var(--border-default);
--modal-radius:         var(--radius-2xl);
--modal-shadow:         var(--shadow-xl);
--modal-overlay-bg:     hsl(0 0% 0% / 0.5);
--modal-header-border:  var(--border-subtle);
--modal-footer-border:  var(--border-subtle);
```

### Tag / Chip

```css
--tag-bg:        var(--bg-subtle);
--tag-fg:        var(--text-secondary);
--tag-border:    var(--border-default);
--tag-radius:    var(--radius-full);
--tag-padding:   var(--space-0-5) var(--space-2);
--tag-font-size: var(--text-xs);
```

---

## Mapping the 987 Hardcoded Colors

The 987 hardcoded Tailwind color references fall into these categories:

### Category Mapping

| Hardcoded Pattern | Count (est.) | Correct Token |
|-------------------|--------------|---------------|
| `text-gray-*`, `text-slate-*`, `text-zinc-*` | ~200 | `text-[--text-primary]`, `text-[--text-secondary]`, `text-[--text-muted]` |
| `bg-gray-*`, `bg-slate-*`, `bg-zinc-*` | ~180 | `bg-[--bg-surface]`, `bg-[--bg-subtle]`, `bg-[--bg-canvas]` |
| `border-gray-*`, `border-slate-*` | ~120 | `border-[--border-default]`, `border-[--border-subtle]` |
| `text-green-*`, `bg-green-*` | ~80 | `text-[--status-success-fg]`, `bg-[--status-success-bg]` |
| `text-red-*`, `bg-red-*` | ~80 | `text-[--status-error-fg]`, `bg-[--status-error-bg]` |
| `text-yellow-*`, `text-amber-*`, `bg-amber-*` | ~70 | `text-[--status-warning-fg]`, `bg-[--status-warning-bg]` |
| `text-blue-*`, `bg-blue-*` | ~70 | `text-[--status-info-fg]`, `bg-[--status-info-bg]`, `text-[--interactive-primary]` |
| `text-purple-*`, `text-violet-*` | ~40 | `text-[--interactive-primary]` (or priority) |
| `bg-white`, `text-black` | ~30 | `bg-[--bg-surface-overlay]`, `text-[--text-primary]` |
| Inline styles (ReactFlow, charts) | ~37 | Use `hsl()` helper from `design-tokens.ts` with semantic tokens |

**Total:** ~907 declarative + ~80 inline = 987

### Migration Strategy

**Phase A (1-2 days):** Run a codemod to replace the most common patterns:
```bash
# Example patterns to auto-replace
text-gray-500  →  text-muted-foreground  (existing token)
text-gray-400  →  text-muted-foreground
bg-gray-100    →  bg-muted
bg-gray-900    →  bg-card or bg-background
border-gray-200 →  border-border
text-green-400 →  text-[--status-success-fg]
bg-green-500/15 →  bg-[--status-success-bg]
```

**Phase B (1 week):** Manually audit components for semantic correctness. Some `gray-500` might be secondary text, others might be borders — requires human judgment.

**Phase C (ongoing):** Add ESLint rule to block new hardcoded colors:
```json
"no-restricted-syntax": [
  "error",
  { "selector": "...", "message": "Use token via CSS var instead of hardcoded Tailwind color" }
]
```

---

## Tailwind Integration

Update `tailwind.config.js` to expose all new semantic tokens as Tailwind utilities:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Existing tokens (keep backward compat)
        background:  'hsl(var(--background) / <alpha-value>)',
        foreground:  'hsl(var(--foreground) / <alpha-value>)',
        // ... existing tokens ...

        // New semantic tokens
        canvas:    'hsl(var(--bg-canvas) / <alpha-value>)',
        surface:   'hsl(var(--bg-surface) / <alpha-value>)',
        
        // Status tokens as Tailwind colors
        'status-success': {
          bg:     'var(--status-success-bg)',
          fg:     'var(--status-success-fg)',
          border: 'var(--status-success-border)',
          icon:   'var(--status-success-icon)',
        },
        // ... etc
      },
      // Component token shortcuts
      borderRadius: {
        card: 'var(--card-radius)',
        btn:  'var(--btn-radius)',
        tag:  'var(--tag-radius)',
      },
    },
  },
}
```

---

## Implementation Phases

### Phase 0 (Done) — Existing State
- ✅ CSS vars for 11 themes
- ✅ Semantic tokens: background, foreground, primary, card, muted, border, etc.
- ✅ Status vars: success, warning, info, destructive
- ✅ Surface hierarchy: surface-0 through surface-3
- ✅ `design-tokens.ts` for Void palette
- ❌ 987 hardcoded color references bypassing theme system
- ❌ No component tokens
- ❌ No primitive token layer
- ❌ Status tokens not used for badges (hardcoded `green-500/15` etc.)

### Phase 1 — Token Foundation (1 week)
1. Add primitive tokens to globals.css (color scales)
2. Add expanded semantic tokens (status bg/fg/border/icon per variant)
3. Add component tokens for Button, Badge, Card, Input
4. Update `design-tokens.ts` to export all semantic tokens

### Phase 2 — Codemod & Cleanup (1 week)
1. Run semi-automated migration for ~600 clear-cut cases
2. Manually review remaining ~387 cases
3. Audit all badge/status components → use status tokens
4. Add ESLint rule blocking new hardcoded colors

### Phase 3 — Brand Theme (1 week)
1. Create new brand light theme (warm indigo + paper)
2. Set as default theme
3. Verify all 11 themes render correctly with new token layer
4. Update Storybook / design docs

---

## Compatibility Notes

### next-themes Integration
The token system is compatible with the existing `next-themes` approach. Theme classes (`.void`, `.midnight-blue`, etc.) can override semantic tokens directly. No changes needed to the theme switching mechanism.

### design-tokens.ts
The programmatic token file (`design-tokens.ts`) is used for inline styles in ReactFlow and Recharts (which can't use CSS vars). It should be extended to export semantic token values per theme, likely via:

```ts
export function getTokens(theme: ThemeId): SemanticTokens {
  // returns resolved color values for a given theme
  // used by charts and canvas-based renderers
}
```

### Backward Compatibility
All existing CSS variable names (`--background`, `--foreground`, `--primary`, etc.) are preserved. New tokens are additive. Migration is non-breaking.

---

## Open Questions for Ahmad

1. **Default theme:** Confirm "brand light" (warm indigo + paper) as default, with Void as default dark?
2. **Phase priority:** Start with Phase 1 (token foundation) or Phase 2 (codemod) first?
3. **ESLint enforcement:** Hard error (blocks CI) or warning for new hardcoded colors?
4. **Density:** Should we define a `--density: comfortable|compact|spacious` CSS variable for the layout?

---

*Token architecture complete. Implementation can begin pending Ahmad's review of brand-identity.md and this document.*
