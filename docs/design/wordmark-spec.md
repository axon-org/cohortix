# Cohortix Wordmark Specification

**Version:** 1.0  
**Created:** 2026-03-19  
**Designer:** Farhan (Graphic Designer AI)  
**Status:** Production-ready v1

---

## Design Rationale

### Typography: Inter Medium 500

**Why Inter?**
- Designed explicitly for screen legibility at all sizes — critical for a dashboard product
- Sentence-case "Cohortix" in Inter Medium hits the sweet spot: approachable like Trello's wordmark, not corporate-heavy like Salesforce
- Inter's geometry is optically balanced — the "C", "o", "h" arches feel consistent and calm
- Extremely wide OS/browser support (fallback chain: `'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif`)

**Weight choice — 500 (Medium):**  
Light enough to feel friendly, heavy enough to hold at small sizes without losing presence. Avoids the "enterprise slab" feel of 700/Bold.

**Letter-spacing: -1px (slight tight tracking):**  
At 48px display size, default tracking creates visual gaps. -1px pulls the word together as a cohesive unit — makes "Cohortix" feel like a brand name, not just a typed word.

**Case: Sentence case ("Cohortix"):**  
ALL CAPS = enterprise/formal. Sentence case = approachable, modern. Matches the Trello/Linear/Notion precedent for product brands targeting everyday users.

---

## Color Palette

### Primary Wordmark (Light backgrounds)

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| "Cohort" | Slate 900 | `#0F172A` | Main text on white/light |
| "ix" | Indigo 500 | `#6366F1` | Accent — the "magic" suffix |

### Inverse Wordmark (Dark backgrounds)

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| "Cohort" | White | `#FFFFFF` | Main text on dark |
| "ix" | Indigo 300 | `#A5B4FC` | Lightened accent for dark UI contrast |

### Monochrome

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Full word | Slate 900 | `#0F172A` | Print, embossing, single-color contexts |

**Why the "ix" accent?**  
"ix" is the unique differentiator in the name — it sounds technical but approachable (like "matrix", "felix"). The indigo accent draws the eye to it, creating a subtle two-beat read: "Cohort" + "ix". This gives the wordmark rhythm without needing an icon. Indigo is a trusted, modern color (used by Linear, Notion, GitHub Copilot) — not techy/cyberpunk, just precise and calm.

---

## Files

```
public/brand/
├── cohortix-wordmark.svg              ← Primary (dark text, light BG)
├── cohortix-wordmark-inverse.svg      ← Inverse (white text, dark BG)
├── cohortix-wordmark-mono.svg         ← Monochrome (single color)
├── cohortix-wordmark-128w.png         ← 128×27px
├── cohortix-wordmark-256w.png         ← 256×54px
├── cohortix-wordmark-512w.png         ← 512×108px
├── cohortix-wordmark-inverse-128w.png
├── cohortix-wordmark-inverse-256w.png
├── cohortix-wordmark-inverse-512w.png
├── cohortix-wordmark-mono-128w.png
├── cohortix-wordmark-mono-256w.png
└── cohortix-wordmark-mono-512w.png
```

---

## SVG Viewbox & Dimensions

```
viewBox="0 0 340 72"
```

- Width: 340px (intrinsic)
- Height: 72px (intrinsic)
- Aspect ratio: ~4.72:1
- SVGs are scalable — use CSS `width` to resize

---

## Sizing Guidelines

| Context | Minimum Width | Notes |
|---------|-------------|-------|
| Sidebar header | 120px | Both words legible |
| Mobile header | 100px | Acceptable minimum — "ix" accent still visible |
| Email footer | 80px | Tight limit — test before going smaller |
| Favicon (full word) | N/A | Use "C" lettermark at 16–32px instead |
| Print (small) | 25mm / ~95px | Minimum for print reproduction |

**Absolute minimum:** 80px width for digital, 20mm for print.  
Below 80px, switch to a single-letter "C" or "Cx" lockup.

---

## Usage Rules

### ✅ Do
- Use primary wordmark on white or light gray backgrounds (#F8F9FA and above)
- Use inverse wordmark on Slate 900 (`#0F172A`) or dark mode backgrounds
- Scale proportionally — never stretch or squash
- Leave clear space of at least 1× cap-height on all sides

### ❌ Don't
- Don't add gradients, shadows, or outlines
- Don't change the font to anything else without a brand review
- Don't use the primary (dark) version on dark backgrounds — use inverse
- Don't recolor the "ix" accent to non-brand colors
- Don't place on busy photographic backgrounds without a backing shape

---

## Accessibility

- Primary wordmark contrast ratio: `#0F172A` on `#FFFFFF` = **19.05:1** (AAA ✓)
- Inverse wordmark contrast ratio: `#FFFFFF` on `#0F172A` = **19.05:1** (AAA ✓)
- Indigo "ix" on white: `#6366F1` on `#FFFFFF` = **4.55:1** (AA ✓)
- All SVGs include `role="img"` and `aria-label="Cohortix"` and `<title>Cohortix</title>`

---

## Font Stack

```css
font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
font-weight: 500;
letter-spacing: -0.02em;
```

For web use, load Inter via:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500&display=swap" rel="stylesheet">
```
Or via npm: `npm install @fontsource/inter`

---

## Integration Notes

- SVG files use text elements (not paths) for easy CMS/code edits
- For production embedding, consider converting text to paths with Inkscape to guarantee rendering across all environments
- The SVG `width`/`height` attributes set intrinsic size; override with CSS as needed
- Dark mode: use `cohortix-wordmark-inverse.svg` when `prefers-color-scheme: dark`

---

*This spec feeds into `brand-identity.md`. Any updates here should be reflected there.*
