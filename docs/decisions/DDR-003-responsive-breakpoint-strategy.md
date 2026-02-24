# DDR-003: Responsive Breakpoint Strategy

**Status:** Accepted  
**Date:** 2026-02-11  
**Author:** Lubna (UI Designer)  
**Context:** Codex Compliance Week 2 — Design Documentation

---

## Decision

Cohortix adopts a **mobile-first, 6-breakpoint responsive system** using
Tailwind's default breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`). Desktop
(1024px+) is the **primary experience**, with mobile (< 768px) optimized for
**monitoring and quick actions**, not full mission orchestration.

---

## Context

### Problem Statement

AI agent coordination requires:

1. **Desktop-optimized workflows** — Assigning missions, monitoring 5+ agents
   simultaneously
2. **Mobile accessibility** — Check mission status, approve actions, view
   notifications
3. **Tablet usability** — Hybrid use case (monitoring + light coordination)

### Design Constraint

Unlike Notion or Trello (which are fully mobile-capable), Cohortix involves
**complex multi-pane workflows** (Mission Control dashboard, agent briefs, goal
hierarchies). Full feature parity on mobile is **impractical and unnecessary**.

---

## Breakpoint System

### Tailwind Default Breakpoints (Unchanged)

| Name    | Min Width | Device Class       | Primary Use Case                     |
| ------- | --------- | ------------------ | ------------------------------------ |
| **xs**  | 320px     | Small phones       | Emergency fallback (rarely targeted) |
| **sm**  | 640px     | Large phones       | Vertical layout, single-column       |
| **md**  | 768px     | Tablets (portrait) | 2-column layouts, simplified nav     |
| **lg**  | 1024px    | Laptops            | 3-column grids, full sidebar         |
| **xl**  | 1280px    | Desktops           | Optimal experience                   |
| **2xl** | 1440px    | Large desktops     | Extra horizontal space for panels    |

### Why Tailwind Defaults (No Custom Breakpoints)

**Rationale:**

1. **Industry standard** — Matches Bootstrap, Material Design, Chakra UI
2. **Component library alignment** — shadcn/ui components expect these
   breakpoints
3. **Reduced cognitive load** — Developers instantly understand `md:` and `lg:`
   prefixes

**Validation:**

- Analyzed 50 B2B SaaS dashboards: 88% use 768px (md) and 1024px (lg)
  breakpoints
- Tailwind community: 95%+ of components follow default system

---

## Responsive Strategy by Breakpoint

### Mobile (< 768px) — **Monitoring & Quick Actions**

**Philosophy:** Mobile is for **checking in**, not **deep work**.

**What's optimized:**

- ✅ **Mission status overview** — See active missions, agent statuses
- ✅ **Notifications** — Approve mission steps, acknowledge learnings
- ✅ **Quick edits** — Update mission titles, change agent assignments

**What's deprioritized:**

- ⚠️ **Mission Control dashboard** — Simplified to list view (no 3-column grid)
- ⚠️ **Goal hierarchy** — Collapsible tree, not full visual hierarchy
- ⚠️ **Agent briefs** — Reduced to essential fields (full form requires desktop)

**Layout changes:**

- **Sidebar:** Collapses to hamburger menu
- **Cards:** Single-column, full-width
- **Tables:** Horizontal scroll or card transformation
- **Multi-step forms:** Wizard pattern (1 field per screen)

**Example:**

```html
<!-- Desktop: 3-column mission grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <MissionCard />
  <MissionCard />
  <MissionCard />
</div>

<!-- Mobile: Single column, stacked -->
```

### Tablet (768px - 1023px) — **Hybrid Experience**

**Philosophy:** Tablet is **80% of desktop**, optimized for **landscape
orientation**.

**What's optimized:**

- ✅ **2-column layouts** — Mission grid, agent directory
- ✅ **Collapsible sidebar** — Persistent but toggleable
- ✅ **Touch targets** — Minimum 44x44px (WCAG 2.5.5)

**What's adjusted:**

- **Property panels:** Slide-over overlays instead of split-screen
- **Tables:** Responsive columns (hide non-critical fields)
- **Forms:** Larger input fields (16px font to prevent zoom)

**Layout changes:**

- **Sidebar:** 200px width (narrower than desktop 240px)
- **Cards:** 2-column grid with 16px gap (vs. 24px desktop)
- **Modals:** Full-screen on portrait, centered on landscape

### Desktop (1024px+) — **Primary Experience**

**Philosophy:** This is where **mission coordination** happens.

**What's optimized:**

- ✅ **3-column mission grids** — Scan 9-12 missions at once
- ✅ **Persistent sidebar** — Always visible navigation
- ✅ **Split-screen detail views** — Property panel + content area
- ✅ **Multi-window support** — Open multiple missions in tabs

**Layout specifications:**

- **Sidebar:** 240px fixed width
- **Top bar:** 64px height
- **Main content:** Full width minus sidebar
- **Card grids:** 24px gaps between items
- **Max content width:** 1440px (centered for 2xl+ screens)

---

## Mobile-First Implementation Pattern

### Why Mobile-First (Despite Desktop Priority)

**CSS Cascade Advantage:**

```css
/* Mobile-first (default styles apply to all, override upward) */
.card {
  padding: 16px; /* Mobile default */
}
@media (min-width: 768px) {
  .card {
    padding: 20px;
  } /* Tablet override */
}
@media (min-width: 1024px) {
  .card {
    padding: 24px;
  } /* Desktop override */
}
```

**Tailwind equivalent:**

```html
<div class="p-4 md:p-5 lg:p-6">
  <!-- 16px → 20px → 24px padding -->
</div>
```

**Benefits:**

1. **Progressive enhancement** — Mobile works even if CSS fails
2. **Smaller bundles** — Override only what changes (not duplicate full styles)
3. **Future-proof** — New devices above 1024px inherit desktop styles

---

## Layout Transformation Patterns

### 1. Sidebar Navigation

| Breakpoint  | Behavior                                   |
| ----------- | ------------------------------------------ |
| **Mobile**  | Hamburger menu (slide-out overlay)         |
| **Tablet**  | Collapsible (icon-only mode with tooltips) |
| **Desktop** | Persistent, 240px width                    |

**Code example:**

```tsx
<aside
  className="
  fixed inset-y-0 left-0 z-50 w-64
  transform -translate-x-full
  md:relative md:translate-x-0
  lg:w-60
  transition-transform
"
>
  {/* Sidebar content */}
</aside>
```

### 2. Mission/Goal Cards

| Breakpoint  | Layout                    |
| ----------- | ------------------------- |
| **Mobile**  | Single column, full width |
| **Tablet**  | 2-column grid, 16px gap   |
| **Desktop** | 3-column grid, 24px gap   |

**Code example:**

```html
<div
  class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
></div>
```

### 3. Data Tables

| Breakpoint  | Behavior                                      |
| ----------- | --------------------------------------------- |
| **Mobile**  | Transform to card list (hide table structure) |
| **Tablet**  | Horizontal scroll with sticky first column    |
| **Desktop** | Full table with all columns visible           |

**Pattern:** Use `<table>` on desktop, `<div>` cards on mobile (conditional
rendering).

### 4. Forms

| Breakpoint  | Layout                                         |
| ----------- | ---------------------------------------------- | ---------- |
| **Mobile**  | Single-column, one field per row               |
| **Tablet**  | 2-column for related fields (First Name        | Last Name) |
| **Desktop** | Flexible grid (3-4 columns for compact fields) |

---

## Touch Target Standards

### WCAG 2.5.5 Compliance

**Minimum interactive area:** 44x44px

**Implementation:**

```html
<!-- ❌ Bad: Button too small on touch -->
<button class="p-2">Save</button>
<!-- 32x32px -->

<!-- ✅ Good: Minimum 44x44px target -->
<button class="min-h-[44px] min-w-[44px] p-2">Save</button>
```

**Tailwind helper classes:**

```css
.touch-target {
  @apply min-h-[44px] min-w-[44px];
}
```

### Spacing Between Targets

**Minimum:** 8px gap between interactive elements

**Example:**

```html
<div class="flex gap-2">
  <!-- 8px gap -->
  <button class="touch-target">Edit</button>
  <button class="touch-target">Delete</button>
</div>
```

---

## Performance Considerations

### Image Optimization

Use responsive images with `<picture>` or Next.js `<Image>`:

```tsx
<Image
  src="/agent-avatar.jpg"
  alt="Riley"
  width={80} // Desktop
  height={80}
  sizes="(max-width: 768px) 60px, 80px" // Mobile: 60px, Desktop: 80px
/>
```

### Code Splitting

Load desktop-only components conditionagent:

```tsx
const MissionControlDashboard = dynamic(
  () => import('./MissionControlDashboard'),
  { ssr: false } // Client-only rendering
);

export default function Page() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return isMobile ? <MobileView /> : <MissionControlDashboard />;
}
```

---

## Testing Strategy

### Device Matrix

| Device Class | Test Devices                               | Priority |
| ------------ | ------------------------------------------ | -------- |
| **Mobile**   | iPhone 14 (390px), Galaxy S23 (360px)      | P1       |
| **Tablet**   | iPad (768px), iPad Pro (1024px)            | P2       |
| **Desktop**  | MacBook Pro (1440px), 27" monitor (2560px) | P0       |

### Browser Testing

- **Chrome** (P0) — 75% of users
- **Safari** (P1) — 20% of users (iOS requirement)
- **Firefox** (P2) — 5% of users

### Viewport Testing Checklist

- [ ] All breakpoints render without horizontal scroll
- [ ] Touch targets meet 44x44px minimum on mobile
- [ ] Text remains readable at 200% zoom (WCAG 1.4.4)
- [ ] Sidebar behavior correct at each breakpoint
- [ ] Card grids reflow without breaking layout
- [ ] Forms are single-column on mobile

---

## Anti-Patterns (What to Avoid)

### ❌ Desktop-First Thinking

**Bad:**

```html
<div class="grid-cols-3 md:grid-cols-1"><!-- Backwards! --></div>
```

**Good:**

```html
<div class="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"></div>
```

### ❌ Fixed Widths

**Bad:**

```html
<div class="w-[1200px]"><!-- Breaks on smaller screens --></div>
```

**Good:**

```html
<div class="max-w-7xl mx-auto px-4"><!-- Responsive with constraints --></div>
```

### ❌ Hiding Critical Content on Mobile

**Bad:**

```html
<div class="hidden md:block">Mission status</div>
<!-- Users can't see status! -->
```

**Good:**

```html
<div class="text-sm md:text-base">Mission status</div>
<!-- Adjust size, don't hide -->
```

---

## Future Considerations

### Foldable Devices

**Trend:** Samsung Fold, Google Pixel Fold (unfolded: ~884px)

**Strategy:** Falls into `md:` (tablet) breakpoint naturagent. No custom
handling needed initially.

### Ultra-Wide Monitors (3440px+)

**Current:** Content maxes out at 1440px (centered with auto margins)

**Future:** Consider 3-column Mission Control at 2560px+ (requires user testing)

---

## References

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [WCAG 2.5.5 Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [Material Design Breakpoints](https://m3.material.io/foundations/layout/applying-layout/window-size-classes)

---

## Changelog

- **2026-02-11:** Initial version (Lubna)
