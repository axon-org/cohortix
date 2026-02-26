# UX/UI Review: Cohortix Sidebar & Org Switcher

**Date:** February 25, 2026  
**Reviewer:** Lubna (UI Designer Specialist)  
**Status:** Ship with changes 🟡

## Overview

The sidebar redesign successfully introduces a logical hierarchy and integrates
organizational context via Clerk. The dark theme is consistent, and the layout
feels professional. However, there are some alignment issues and accessibility
gaps that should be addressed before final shipment.

---

## Visual States

### 1. Expanded State (Default)

![Expanded Sidebar](https://raw.githubusercontent.com/ahmadashfq/cohortix/feature/org-nav-sidebar/docs/reviews/screenshots/sidebar-expanded.png)
_Note: Screenshot saved locally as `sidebar-expanded.png` during review._

- 🟢 **Good:** Hierarchy is clear. The grouping of "Daily Workflow" vs
  "Workspace" makes sense.
- 🟡 **Suggestion:** The "Soon" badge on Inbox is a bit tight. Consider slightly
  more padding or a more subtle background.

### 2. Collapsed State

![Collapsed Sidebar](https://raw.githubusercontent.com/ahmadashfq/cohortix/feature/org-nav-sidebar/docs/reviews/screenshots/sidebar-collapsed.png)

- 🟢 **Good:** Icons are distinct and recognizable. Active indicator remains
  visible.
- 🔴 **Issue:** The toggle button (chevron) flips 180 degrees but remains inside
  a flex container that looks slightly off-center when collapsed.
- 🟡 **Suggestion:** Tooltips are missing for collapsed items. Users might
  struggle with "Missions" vs "Operations" icons without labels.

### 3. Org Switcher Open

![Org Switcher](https://raw.githubusercontent.com/ahmadashfq/cohortix/feature/org-nav-sidebar/docs/reviews/screenshots/org-switcher.png)

- 🟢 **Good:** Theme matching is excellent. The background `#111113` matches the
  sidebar perfectly.
- 🔴 **Issue:** The "Manage" link and "Create Organization" buttons have very
  low contrast or inconsistent styling compared to the rest of the app.

---

## Detailed Feedback

### 1. Layout & Hierarchy

- **Nav Grouping:** Logical. Grouping "Missions" and "Operations" under a
  workspace divider helps cognitive load.
- **Bottom Placement:** Settings/Account at the bottom is standard and
  well-executed here.
- **User Block:** The avatar and name layout is clean, but the email text is
  very small (11px). Ensure this meets legibility standards.

### 2. Org Switcher

- **Visual Match:** Native feel is high.
- **Recommendation:** In `sidebar.tsx`, the `appearance` prop for Clerk is quite
  verbose. Consider moving this to a shared theme constant if used elsewhere.

### 3. Collapse Toggle

- **Discoverability:** High, but the button is small (w-4).
- **Feedback:** When collapsed, the chevron flips. It would be more intuitive if
  it was always pointing "out" (right) when collapsed and "in" (left) when
  expanded.

### 4. Active States

- **Functionality:** Verified. Navigating to `/missions` correctly triggers the
  active indicator.
- **Visuals:** The `absolute` left indicator is a nice touch, but ensure it
  doesn't overlap with icons on very small screens.

### 5. Spacing & Typography

- **Consistency:** Padding is consistent (px-2.5).
- **Type:** 13px font is fine for a sidebar, but 11px for email is on the edge.

---

## Code Review Findings (`sidebar.tsx`)

### Component Structure

The component is well-structured but could be more modular. The `navigation` and
`bottomNavigation` arrays are inside the component body, causing re-definition
on every render.

### Accessibility (a11y)

- 🔴 **Missing:** Tooltips for collapsed state. Screen readers will hear the
  names, but visual users lose context.
- 🟡 **Suggestion:** Add `aria-expanded` to the collapse toggle button.

### Recommendations & Code Snippets

#### 1. Move Navigation out of Component

```tsx
const NAVIGATION_ITEMS: NavigationItem[] = [ ... ];
// Move outside Sidebar function to prevent re-creation
```

#### 2. Improve Toggle Button Logic

The chevron should point right when collapsed:

```tsx
<ChevronLeft
  className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')}
/>
```

#### 3. Add Tooltips (using a primitive like Radix)

When `collapsed` is true, the `Link` should be wrapped in a Tooltip.

---

## Overall Verdict: Ship with changes 🟡

The sidebar is functional and visually pleasing. Fixing the toggle
alignment/direction and adding tooltips for the collapsed state will elevate it
to "Ship" status.

**Priority Fixes:**

1. Fix toggle chevron rotation/alignment.
2. Add tooltips for collapsed icons.
3. Verify contrast for Clerk popover action buttons.
