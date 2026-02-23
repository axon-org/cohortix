# Cohortix UI/UX Design System

**Version:** 1.0  
**Date:** 2026-02-10  
**Author:** Lubna (UI Designer)  
**Status:** Ready for Review

---

## 1. Design Principles

### Core Philosophy: "Agent-First, Human-Friendly"

Cohortix is not a traditional PM tool — it's a **control center for AI
teammates**. Every design decision reinforces this unique positioning:

#### **1.1 Clarity Over Cleverness**

- Information hierarchy is sacred: Users should instantly understand what's
  happening
- No mystery states — every agent status, mission progress, and goal health must
  be transparent
- Avoid UI patterns that require explanation; the interface should feel
  intuitive

#### **1.2 Generous, Not Cluttered**

- Whitespace is functional, not decorative — it creates breathing room for
  cognitive processing
- Density serves a purpose: Lists can be dense when scanning; cards are spacious
  when decision-making
- Every pixel earns its place; avoid decoration for decoration's sake

#### **1.3 Agents Are Teammates, Not Tools**

- Agent profiles have warmth and personality (avatars, status rings, skill
  badges)
- Status language is human: "On Mission" / "Standing By" / "Off Duty" (not
  "Running" / "Idle" / "Offline")
- Celebrate agent wins: Mission accomplished states are joyful, not clinical

#### **1.4 Progressive Disclosure**

- Show essentials first; reveal details on demand
- Card views prioritize quick scanning; detail views provide depth
- Don't overwhelm new users; guide them progressively into power features

#### **1.5 Speed and Responsiveness**

- Interactions feel instant (< 100ms perceived latency)
- Loading states are friendly, not frustrating
- Optimistic UI updates wherever possible

#### **1.6 Designed for Dark Mode**

- Not a dark mode "theme" — it's a first-class experience
- Colors maintain semantic meaning in both modes
- Contrast ratios meet WCAG AA standards in both themes

---

## 2. Layout System

### 2.1 Grid Foundation

**Base Unit:** 8px (Tailwind spacing scale)  
**Container Max Width:** 1440px  
**Content Grid:** 12-column flexible grid

```
Desktop (1440px+):  12 columns, 24px gutters
Laptop (1024-1439): 12 columns, 16px gutters
Tablet (768-1023):  8 columns, 16px gutters
Mobile (< 768px):   4 columns, 12px gutters
```

### 2.2 Responsive Breakpoints

```javascript
breakpoints: {
  'xs': '320px',   // Small phones
  'sm': '640px',   // Large phones
  'md': '768px',   // Tablets
  'lg': '1024px',  // Laptops
  'xl': '1280px',  // Desktops
  '2xl': '1440px', // Large desktops
}
```

### 2.3 Layout Patterns

#### **Sidebar + Main Content (Primary)**

```
┌──────────────────────────────────────┐
│ Logo          Search      User Menu  │ ← Top Bar (64px)
├────────┬─────────────────────────────┤
│        │                             │
│        │  Main Content Area          │
│ Side   │  (Mission Control,          │
│ bar    │   Agent Directory, etc.)     │
│        │                             │
│ 240px  │  Full width - 240px         │
│        │                             │
└────────┴─────────────────────────────┘
```

**Sidebar Width:** 240px (fixed on desktop, collapsible on mobile)  
**Top Bar Height:** 64px  
**Main Content Padding:** 32px (desktop), 24px (tablet), 16px (mobile)

#### **Three-Column Card Grid (Missions/Goals)**

```
┌─────────┬─────────┬─────────┐
│ Card 1  │ Card 2  │ Card 3  │
├─────────┼─────────┼─────────┤
│ Card 4  │ Card 5  │ Card 6  │
└─────────┴─────────┴─────────┘
```

**Desktop:** 3 columns with 24px gap  
**Tablet:** 2 columns with 16px gap  
**Mobile:** 1 column with 16px gap

#### **Detail View (Split Screen)**

```
┌────────────┬────────────────────────┐
│            │                        │
│ Properties │  Mission Detail        │
│ Panel      │  (Rich text, comments, │
│ 360px      │   attachments)         │
│            │                        │
└────────────┴────────────────────────┘
```

**Property Panel Width:** 360px (fixed on desktop, stacked on mobile)

### 2.4 Z-Index Scale

```javascript
z-index: {
  'base': 0,
  'dropdown': 1000,
  'sticky': 1020,
  'fixed': 1030,
  'modal-backdrop': 1040,
  'modal': 1050,
  'popover': 1060,
  'tooltip': 1070,
}
```

---

## 3. Component Inventory

### 3.1 Navigation Components

#### **Sidebar Navigation**

**Structure:**

- Logo/Brand (top, 64px height)
- Primary navigation items (with icons)
- Active Missions section (collapsible)
- Settings/Help/Profile (bottom)

**States:**

- Default: Gray text, icon
- Hover: Primary-50 background, darker text
- Active: Primary-100 background, primary-700 text, 3px left border
  (primary-500)
- Badge: Notification count (red dot or number)

**Visual Specs:**

- Item height: 40px
- Padding: 12px 16px
- Icon size: 20px
- Gap between icon and label: 12px
- Border radius: 8px

#### **Breadcrumbs**

```
Home / Goals / Q1 Marketing Goal / Mission #42
```

**Visual Specs:**

- Font: text-sm (14px)
- Color: neutral-600 (dark mode: neutral-400)
- Separator: `/` with 8px margin on each side
- Hover: primary-600 underline
- Current page: neutral-900 (no hover state)

#### **Tabs**

**Variants:**

- **Line Tabs (default):** Underline indicator, for secondary navigation
- **Pill Tabs:** Background highlight, for filter/view switching

**Line Tabs Visual Specs:**

- Tab height: 48px
- Bottom border: 2px solid primary-500 (active), neutral-200 (inactive)
- Text: font-medium, neutral-600 (inactive), neutral-900 (active)
- Gap: 32px between tabs

### 3.2 Card Components

#### **Mission/Goal Card**

**Anatomy:**

```
┌─────────────────────────────────┐
│ 📁 Icon    ● Active (badge)     │ ← Header (48px)
│                                 │
│ Fintech Mobile App Redesign     │ ← Title (font-semibold, text-lg)
│ Acme Corp • MVP • 2 weeks       │ ← Metadata (text-sm, neutral-600)
│                                 │
│ 📅 Feb 12, 2024    📊 High      │ ← Properties
│                                 │
│ ◐ 35%   ☰ 1 / 4 Actions   👤      │ ← Footer (progress, actions, avatar)
└─────────────────────────────────┘
```

**Visual Specs:**

- Card dimensions: Min-height 220px, aspect ratio ~ 1:1.2
- Background: white (dark mode: neutral-900)
- Border: 1px solid neutral-200 (dark mode: neutral-800)
- Border radius: 12px
- Padding: 20px
- Shadow: shadow-sm (hover: shadow-md)
- Hover: Transform translateY(-2px), transition 200ms

**Status Badge:**

- Position: Top-right
- Variants: Active (green dot), Backlog (orange), Completed (blue), Planned
  (gray)
- Size: text-xs, px-2 py-1, rounded-full
- Background: Semantic color-50 (dark mode: color-900/20)
- Text: Semantic color-700 (dark mode: color-300)

#### **Agent Card**

**Anatomy:**

```
┌─────────────────────────────────┐
│         👤                      │ ← Avatar (80px, centered)
│       Riley                     │ ← Name (font-semibold, text-lg)
│    AI Developer                 │ ← Role (text-sm, neutral-600)
│                                 │
│  ● On Mission                   │ ← Status (with colored dot)
│                                 │
│  [Python] [React] [API Design]  │ ← Skill Pills
│                                 │
│  ◐ 65% Load    📊 12 Missions   │ ← Workload Meter
└─────────────────────────────────┘
```

**Visual Specs:**

- Card dimensions: 280px x 320px
- Avatar: 80px circle, with 3px status ring (green = On Mission, gray = Standing
  By, red = Off Duty)
- Skill pills: text-xs, px-2 py-1, rounded-full, primary-100 bg, primary-700
  text
- Workload meter: Progress bar, 4px height, primary-500 fill

#### **Mission Card (Kanban)**

**Anatomy:**

```
┌─────────────────────────────────┐
│ ⋮⋮ Mission Title (draggable)    │ ← Header with drag handle
│                                 │
│ Brief description text goes     │ ← Description (text-sm, 2 lines max)
│ here, truncated if too long...  │
│                                 │
│ 🔴 High    📎 2    💬 5         │ ← Metadata (priority, attachments, comments)
│                                 │
│ 👤 Assigned Agent                │ ← Footer (avatar + name)
└─────────────────────────────────┘
```

**Visual Specs:**

- Card dimensions: Full column width, min-height 140px
- Background: white (dark mode: neutral-900)
- Border: 1px solid neutral-200
- Border radius: 8px
- Padding: 16px
- Margin bottom: 12px
- Drag handle: 6 dots (⋮⋮), neutral-400, left edge

#### **Knowledge/Intel Card**

**Anatomy:**

```
┌─────────────────────────────────┐
│ 💡 Insight Title                │
│                                 │
│ Short summary of the learning   │
│ captured by the agent during...  │
│                                 │
│ Source: [Research] Mission #42  │ ← Source badge (purple = Research, pink = Manual)
│                                 │
│ Riley • 2 days ago              │ ← Footer (agent avatar, timestamp)
└─────────────────────────────────┘
```

**Visual Specs:**

- Background: accent-50 (light purple tint)
- Border: 1px solid accent-200
- Border-left: 4px solid accent-500 (accent strip)
- Icon: 20px lightbulb emoji or icon

#### **Client Card**

**Anatomy:**

```
┌─────────────────────────────────┐
│ 🏢 Client Logo / Icon           │
│                                 │
│ Acme Corporation                │ ← Name (font-semibold, text-lg)
│ Technology • Enterprise         │ ← Industry, size metadata
│                                 │
│ 3 Active Goals              │
│ 12 Agents Assigned              │
│                                 │
│ Last activity: 2 hours ago      │
└─────────────────────────────────┘
```

### 3.3 Status Indicators

#### **Status Badges**

**Variants:**

```javascript
statusBadges: {
  'active':    { color: 'success', dot: 'green',  label: 'Active' },
  'on-mission':{ color: 'success', dot: 'green',  label: 'On Mission' },
  'standing-by':{ color: 'neutral', dot: 'gray', label: 'Standing By' },
  'backlog':   { color: 'warning', dot: 'orange', label: 'Backlog' },
  'completed': { color: 'info',    dot: 'blue',   label: 'Completed' },
  'blocked':   { color: 'danger',  dot: 'red',    label: 'Blocked' },
  'planned':   { color: 'neutral', dot: 'gray',   label: 'Planned' },
}
```

**Visual Specs:**

- Dot: 6px circle, inline with text, 6px margin-right
- Text: text-xs, font-medium
- Container: px-2.5 py-1, rounded-full, semantic bg color

#### **Progress Rings/Circles**

**Use Cases:**

- Goal completion percentage
- Agent workload meter
- Mission progress

**Visual Specs:**

- Size: 48px (default), 32px (compact), 64px (large)
- Stroke width: 4px
- Background stroke: neutral-200 (dark mode: neutral-700)
- Progress stroke: Gradient from primary-400 to primary-600
- Center text: font-semibold, text-sm (percentage)

#### **Health Meters**

**Use Cases:** Goal health, system health, agent performance

**Visual Specs:**

- Horizontal bar, 8px height, rounded-full
- Background: neutral-200
- Fill: Gradient based on health
  - 0-40%: danger-500 → danger-600 (red)
  - 41-70%: warning-500 → warning-600 (orange)
  - 71-100%: success-500 → success-600 (green)

#### **Priority Indicators**

**Visual Specs:**

- Icon + Label (e.g., `📊 High`)
- Colors:
  - **Urgent:** danger-600 (red)
  - **High:** warning-600 (orange)
  - **Medium:** neutral-600 (gray)
  - **Low:** neutral-400 (light gray)

### 3.4 Data Display

#### **Tables**

**Use Cases:** Mission lists, agent directory (list view), audit logs

**Visual Specs:**

- Header: font-medium, text-sm, neutral-700, border-bottom 2px neutral-200
- Row: text-sm, neutral-900, hover:bg-neutral-50, 48px min-height
- Cell padding: px-4 py-3
- Zebra striping: Optional, even rows bg-neutral-50
- Actions column: Right-aligned, dropdown menu

**Responsive:** Stack cells verticagent on mobile (card-like layout)

#### **Activity Feed**

**Structure:**

```
┌─────────────────────────────────┐
│ 👤  Riley completed Mission #42 │
│     2 hours ago                 │
│                                 │
│ 🎯  New goal created        │
│     "Q1 Marketing Push"         │
│     5 hours ago                 │
└─────────────────────────────────┘
```

**Visual Specs:**

- Item: py-3, border-bottom 1px neutral-200
- Icon: 20px, left-aligned, neutral-400
- Text: text-sm, neutral-700
- Timestamp: text-xs, neutral-500, mt-1
- Hover: bg-neutral-50

#### **Timeline (Gantt-style)**

**Visual Specs:**

- Header: Month/week labels, text-xs, neutral-600
- Row height: 48px
- Bar: 8px height, rounded, primary-500 fill
- Dependencies: Dashed line (2px), neutral-400, arrow at end
- Milestone: Diamond shape, 12px, primary-600

### 3.5 Form Components

#### **Text Input**

**Visual Specs:**

- Height: 40px
- Padding: px-3
- Border: 1px solid neutral-300 (hover: neutral-400, focus: primary-500)
- Border radius: 8px
- Font: text-sm
- Placeholder: neutral-400
- Focus ring: 3px primary-200 shadow

**States:**

- Default, Hover, Focus, Disabled (opacity-50), Error (border-danger-500)

#### **Select Dropdown**

**Visual Specs:**

- Same as text input, with chevron-down icon (right-aligned, 16px)
- Dropdown menu: shadow-lg, border 1px neutral-200, max-height 300px, scroll

#### **Toggle Switch**

**Visual Specs:**

- Width: 44px, height: 24px
- Track: rounded-full, neutral-300 (off), primary-500 (on)
- Circle: 20px, absolute, left-0.5 (off), right-0.5 (on)
- Transition: 200ms ease

#### **Search Bar**

**Visual Specs:**

- Height: 40px (compact), 48px (prominent)
- Icon: Magnifying glass (left, 20px, neutral-400)
- Padding: pl-10 pr-3
- Border radius: 12px (prominent), 8px (compact)
- Background: neutral-100 (no border in default state)
- Focus: white bg, border 1px primary-500

#### **Rich Text Editor**

**Use Cases:** Mission descriptions, comments, intel notes

**Visual Specs:**

- Toolbar: bg-neutral-50, border-bottom 1px neutral-200, 48px height
- Toolbar buttons: 32px square, rounded-md, hover:bg-neutral-200
- Content area: min-height 200px, p-4, border 1px neutral-300, rounded-b-lg
- Syntax highlighting for code blocks: Fira Code font, bg-neutral-900,
  text-neutral-100

### 3.6 Modals, Dialogs, Sheets

#### **Modal (Overlay)**

**Use Cases:** Confirm actions, create new agent, mission detail (mobile)

**Visual Specs:**

- Backdrop: bg-black/50, fixed inset-0
- Container: max-w-lg (512px), bg-white, rounded-xl, shadow-2xl
- Header: px-6 py-4, border-bottom 1px neutral-200
- Content: px-6 py-4, max-height 70vh, overflow-y-auto
- Footer: px-6 py-4, border-top 1px neutral-200, flex justify-end gap-3

**Animation:** Fade in backdrop (200ms), scale + fade modal (300ms,
cubic-bezier)

#### **Sheet (Side Panel)**

**Use Cases:** Filters, settings, mission properties

**Visual Specs:**

- Width: 400px (desktop), 100vw (mobile)
- Background: white, shadow-2xl
- Position: Fixed right-0 top-0 bottom-0
- Slide-in animation: 300ms ease-out

#### **Popover**

**Use Cases:** Tooltips, quick actions, date pickers

**Visual Specs:**

- max-w-xs (320px), bg-white, rounded-lg, shadow-lg, border 1px neutral-200
- Arrow: 8px triangle, same bg and border
- Padding: p-3

### 3.7 Agent-Specific Components

#### **Agent Profile (Full)**

**Sections:**

1. **Header**
   - Avatar (120px) with status ring
   - Name (text-2xl, font-bold)
   - Role/Specialty (text-lg, neutral-600)
   - Status badge

2. **Skills & Expertise**
   - Skill pills grid (3 columns)
   - Expertise meter: Horizontal bar with percentage (e.g., "Python: 85%")

3. **Current Missions**
   - List of 3-5 current missions (linked cards)

4. **Evolution Timeline**
   - Vertical timeline showing learning milestones
   - Timestamps, course completions, skill gains

5. **Performance Stats**
   - Missions completed (count)
   - Success rate (percentage)
   - Avg. mission time (duration)
   - Intel contributed (count)

**Visual Specs:**

- Container: max-w-4xl, mx-auto
- Sections: py-6, border-bottom 1px neutral-200
- Timeline dots: 12px circle, primary-500, connected by 2px vertical line

#### **Agent Avatar with Status Ring**

**Visual Specs:**

- Avatar: Circle, sizes: 32px (small), 48px (default), 80px (large), 120px
  (profile)
- Ring: 3px thick, 4px gap from avatar
- Ring colors:
  - Green (success-500): On Mission
  - Gray (neutral-300): Standing By
  - Red (danger-500): Off Duty / Error
- Ring animation: Pulse (2s, infinite) for "On Mission" state

#### **Skill Badge/Pill**

**Visual Specs:**

- Background: primary-100 (dark mode: primary-900/30)
- Text: primary-700 (dark mode: primary-300)
- Font: text-xs, font-medium
- Padding: px-2.5 py-1
- Border radius: rounded-full
- Hover: bg-primary-200, cursor-pointer (if interactive)

#### **Expertise Meter**

**Visual Specs:**

- Label: text-sm, font-medium, neutral-700
- Bar: 8px height, rounded-full, bg-neutral-200
- Fill: Gradient primary-400 → primary-600
- Percentage: text-xs, neutral-600, right-aligned, mt-1

#### **Evolution Timeline**

**Structure:**

```
┌─────────────────────────────────┐
│ ● Completed "Advanced React"    │
│ │ Gained +15 Frontend Expertise │
│ │ Feb 8, 2026                   │
│ │                               │
│ ● Mission #42 completed         │
│ │ Learned: API rate limiting    │
│ │ Feb 5, 2026                   │
└─────────────────────────────────┘
```

**Visual Specs:**

- Dots: 12px circle, primary-500
- Line: 2px, neutral-300, connecting dots
- Text: text-sm, neutral-700
- Timestamp: text-xs, neutral-500
- Padding: py-4 between items

---

## 4. Color System

### 4.1 Brand Colors (from Tailwind Preset)

#### **Primary: Blue-Violet (Linear-Inspired)**

Main brand color, used for primary actions, active states, links. Inspired by
Linear.app's homepage — leans blue, not purple.

```javascript
primary: {
  50: '#eef0ff',   // Lightest backgrounds
  100: '#dde2ff',  // Hover states
  200: '#c2caff',  // Subtle highlights
  300: '#9ca8f0',
  400: '#7C8AFF',  // Lighter interactive states
  500: '#5E6AD2',  // Main brand blue-violet
  600: '#4F5ABF',  // Hover on primary-500
  700: '#3F48A8',  // Text on light bg
  800: '#2F3590',  // Deep accent
  900: '#1F2378',  // Text on white
  950: '#0F1260',  // Darkest
}
```

#### **Secondary: Cool Gray**

Complementary to primary, used for secondary actions, borders, subtle UI.

```javascript
secondary: {
  500: '#868690',  // Secondary text
  600: '#6E6E78',
  700: '#56565E',
}
```

#### **Accent: Cyan-Blue**

Used for knowledge sources, highlights, special badges.

```javascript
accent: {
  50: '#ecfeff',
  500: '#22d3ee',
  700: '#0e7490',
}
```

### 4.2 Semantic Colors

#### **Success (Green)**

Mission completed, positive status, agent available.

```javascript
success: {
  50: '#f0fdf4',   // Background
  500: '#22c55e',  // Default
  600: '#16a34a',  // Hover
  700: '#15803d',  // Text
}
```

#### **Warning (Orange)**

Attention needed, medium priority, backlog.

```javascript
warning: {
  50: '#fffbeb',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
}
```

#### **Danger (Red)**

Errors, blocked missions, critical priority, off duty.

```javascript
danger: {
  50: '#fef2f2',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
}
```

#### **Info (Blue)**

Informational messages, completed state (alternative), neutral highlights.

```javascript
info: {
  50: '#eff6ff',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
}
```

### 4.3 Neutral Scale

Used for text, borders, backgrounds, shadows.

```javascript
neutral: {
  50: '#fafafa',   // Light background (cards, hover states)
  100: '#f5f5f5',  // Subtle backgrounds
  200: '#e5e5e5',  // Borders
  300: '#d4d4d4',  // Input borders
  400: '#a3a3a3',  // Placeholder text, icons
  500: '#737373',  // Secondary text
  600: '#525252',  // Body text (light mode)
  700: '#404040',  // Headings (light mode)
  800: '#1A1A1E',  // Dark mode elevated surfaces (Linear-inspired)
  900: '#131316',  // Dark mode surface cards (Linear-inspired)
  950: '#0A0A0B',  // Dark mode page background (Linear-inspired)
}
// Dark mode specific tokens (Linear.app aesthetic):
// --bg-page: #0A0A0B (deep true black)
// --bg-surface: #131316 (card backgrounds)
// --bg-elevated: #1A1A1E (modals, dropdowns)
// --border-subtle: #1F1F23 (1px borders)
// --text-primary: #F2F2F2 (white text)
// --text-secondary: #868690 (gray text)
// --glow-primary: rgba(94, 106, 210, 0.08) (radial gradient glows)
```

### 4.4 Usage Guidelines

#### **Text Hierarchy (Light Mode)**

```javascript
heading: 'neutral-900';
body: 'neutral-700';
secondary: 'neutral-600';
placeholder: 'neutral-400';
disabled: 'neutral-400';
```

#### **Backgrounds (Light Mode)**

```javascript
page: 'white' or 'neutral-50'
card: 'white'
hover: 'neutral-50'
active: 'primary-50'
sidebar: 'neutral-100'
```

#### **Borders (Light Mode)**

```javascript
default: 'neutral-200'
hover: 'neutral-300'
focus: 'primary-500'
error: 'danger-500'
```

---

## 5. Typography Scale

### 5.1 Font Families

```javascript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],  // Primary
  mono: ['Fira Code', 'monospace'],            // Code blocks
}
```

**Import:** Google Fonts Inter (weights: 400, 500, 600, 700)

### 5.2 Font Sizes

```javascript
'xs':   '0.75rem',   // 12px - Captions, badges, timestamps
'sm':   '0.875rem',  // 14px - Body text (default), table cells
'base': '1rem',      // 16px - Body text (prominent), inputs
'lg':   '1.125rem',  // 18px - Subheadings, card titles
'xl':   '1.25rem',   // 20px - Section headings
'2xl':  '1.5rem',    // 24px - Page headings
'3xl':  '1.875rem',  // 30px - Dashboard headings
'4xl':  '2.25rem',   // 36px - Marketing/Landing
'5xl':  '3rem',      // 48px - Hero text
```

### 5.3 Font Weights

```javascript
normal: 400; // Body text
medium: 500; // Subtle emphasis
semibold: 600; // Headings, buttons, labels
bold: 700; // Strong emphasis
extrabold: 800; // Rare (hero text only)
```

### 5.4 Line Heights

```javascript
tight: 1.25; // Headings
normal: 1.5; // Body text
relaxed: 1.75; // Long-form content
```

### 5.5 Typography Usage

| Element             | Size      | Weight   | Line Height | Color                    |
| ------------------- | --------- | -------- | ----------- | ------------------------ |
| **Hero Heading**    | 3xl / 4xl | bold     | tight       | neutral-900              |
| **Page Heading**    | 2xl       | bold     | tight       | neutral-900              |
| **Section Heading** | xl        | semibold | tight       | neutral-900              |
| **Card Title**      | lg        | semibold | normal      | neutral-900              |
| **Body Text**       | sm / base | normal   | normal      | neutral-700              |
| **Caption**         | xs        | normal   | normal      | neutral-600              |
| **Label**           | sm        | medium   | normal      | neutral-700              |
| **Button Text**     | sm / base | semibold | normal      | (varies)                 |
| **Code Block**      | sm        | normal   | relaxed     | neutral-100 (on dark bg) |

### 5.6 Code Block Styling

**Visual Specs:**

- Font: Fira Code, text-sm
- Background: neutral-900 (light mode), neutral-950 (dark mode)
- Text: neutral-100
- Border radius: 8px
- Padding: 16px
- Syntax highlighting: Minimal (keywords in primary-400, strings in accent-400)

---

## 6. Spacing & Grid

### 6.1 Base Unit: 8px

All spacing follows an 8px base unit for visual consistency and developer
ergonomics.

```javascript
spacing: {
  '0':   '0px',
  '0.5': '2px',   // 0.25rem (rare, hairline adjustments)
  '1':   '4px',   // 0.25rem
  '2':   '8px',   // 0.5rem  ← Base unit
  '3':   '12px',  // 0.75rem
  '4':   '16px',  // 1rem
  '5':   '20px',  // 1.25rem
  '6':   '24px',  // 1.5rem
  '8':   '32px',  // 2rem
  '10':  '40px',  // 2.5rem
  '12':  '48px',  // 3rem
  '16':  '64px',  // 4rem
  '20':  '80px',  // 5rem
}
```

### 6.2 Consistent Padding/Gap Rules

#### **Cards**

```javascript
padding: {
  compact: '16px',   // Small cards
  default: '20px',   // Standard cards
  spacious: '24px',  // Large cards, detail views
}
```

#### **Component Internal Spacing**

```javascript
gap: {
  tight: '8px',      // Closely related elements (icon + label)
  default: '12px',   // Default gap (form fields, list items)
  relaxed: '16px',   // Sections within a card
  loose: '24px',     // Between major sections
}
```

#### **Page/Container Padding**

```javascript
padding: {
  mobile: '16px',
  tablet: '24px',
  desktop: '32px',
}
```

### 6.3 Grid Gap

```javascript
gap: {
  card-grid: '24px',      // Between cards in grid
  list-items: '12px',     // Between list items
  form-fields: '16px',    // Between form fields
  sections: '32px',       // Between page sections
}
```

---

## 7. Icon System

### 7.1 Recommended Icon Library

**Lucide Icons** (MIT license, 1000+ icons, perfect for shadcn/ui)

**Why Lucide?**

- Native React components
- Consistent 24x24 stroke design
- Excellent shadcn/ui compatibility
- Lightweight (tree-shakeable)
- Clean, modern aesthetic

**Installation:**

```bash
npm install lucide-react
```

**Usage:**

```jsx
import { Home, Users, Target, Sparkles } from 'lucide-react';

<Home className="w-5 h-5 text-neutral-600" />;
```

### 7.2 Icon Sizes

```javascript
sizes: {
  'xs':  '14px',  // Inline with text-xs
  'sm':  '16px',  // Inline with text-sm
  'md':  '20px',  // Default (navigation, buttons)
  'lg':  '24px',  // Headings, prominent actions
  'xl':  '32px',  // Feature highlights
  '2xl': '48px',  // Empty states, illustrations
}
```

### 7.3 Core Icon Mapping

| Concept               | Icon (Lucide)   | Usage                      |
| --------------------- | --------------- | -------------------------- |
| **Home / Dashboard**  | `Home`          | Sidebar nav, breadcrumbs   |
| **Agents**            | `Users`         | Agent directory, team      |
| **Goals**             | `Target`        | Goal creation, tracking    |
| **Goals**             | `Briefcase`     | Goal cards, nav            |
| **Missions**          | `CheckSquare`   | Mission cards, lists       |
| **Intel / Knowledge** | `Lightbulb`     | Knowledge base, insights   |
| **Clients**           | `Building2`     | Client management          |
| **Settings**          | `Settings`      | Configuration, preferences |
| **Add / Create**      | `Plus`          | Create buttons             |
| **Search**            | `Search`        | Search bars                |
| **Filter**            | `Filter`        | Filter controls            |
| **Notifications**     | `Bell`          | Alerts, updates            |
| **Calendar**          | `Calendar`      | Dates, schedules           |
| **Attachments**       | `Paperclip`     | Files, documents           |
| **Comments**          | `MessageSquare` | Discussions, threads       |
| **AI / Agent**        | `Sparkles`      | AI-specific features       |
| **Status: Active**    | `CircleDot`     | Active missions/agents     |
| **Status: Completed** | `CheckCircle2`  | Completed states           |
| **Status: Blocked**   | `AlertCircle`   | Errors, blockers           |
| **Priority: High**    | `ArrowUp`       | High priority indicator    |
| **Priority: Low**     | `ArrowDown`     | Low priority indicator     |

### 7.4 Icon Colors

```javascript
iconColors: {
  default: 'neutral-600',       // Standard icons
  hover: 'neutral-700',         // Hover state
  active: 'primary-600',        // Active state
  disabled: 'neutral-400',      // Disabled state
  success: 'success-500',       // Success icons
  warning: 'warning-500',       // Warning icons
  danger: 'danger-500',         // Error icons
}
```

---

## 8. Dark Mode

### 8.1 Strategy

**Class-based dark mode** (`class` strategy in Tailwind)

```jsx
<html className="dark">
```

**shadcn/ui compatibility:** Uses CSS variables for theming, allowing smooth
light/dark transitions.

### 8.2 Color Mappings

#### **Backgrounds**

```javascript
lightMode → darkMode

'white'       → '#0A0A0B'    // Deep true black (Linear-inspired)
'neutral-50'  → '#131316'    // Surface cards
'neutral-100' → '#1A1A1E'    // Elevated surfaces
// Dark mode borders: '#1F1F23' (subtle, 1px)
// Glow effects: radial-gradient with primary-500 at 5-10% opacity
```

#### **Text**

```javascript
'neutral-900' → 'neutral-50'
'neutral-700' → 'neutral-200'
'neutral-600' → 'neutral-300'
'neutral-400' → 'neutral-500'
```

#### **Borders**

```javascript
'neutral-200' → 'neutral-700'
'neutral-300' → 'neutral-600'
```

#### **Primary Colors**

Primary, accent, and semantic colors **remain the same** in dark mode, but
adjust opacity/saturation slightly:

```javascript
// Light mode
primary - 500;

// Dark mode (slightly brighter)
primary - 400;
```

### 8.3 Dark Mode Component Adjustments

#### **Cards**

```css
/* Light mode */
bg-white border-neutral-200 shadow-sm

/* Dark mode — Linear-inspired with subtle glow */
dark:bg-[#131316] dark:border-[#1F1F23] dark:shadow-none
/* Optional glow: add radial gradient behind key cards */
/* background: radial-gradient(ellipse at center, rgba(94,106,210,0.08) 0%, transparent 70%) */
```

#### **Inputs**

```css
/* Light mode */
bg-white border-neutral-300 text-neutral-900

/* Dark mode */
dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100
```

#### **Buttons (Primary)**

```css
/* Light mode */
bg-primary-500 text-white hover:bg-primary-600

/* Dark mode */
dark:bg-primary-600 dark:text-white dark:hover:bg-primary-700
```

#### **Shadows**

Reduce or eliminate shadows in dark mode (they're less visible and can look
muddy):

```css
shadow-md dark:shadow-none
```

### 8.4 Dark Mode Toggle

**Component:** Toggle switch in top bar (right side, near user menu)

**Icon:** Sun (light mode), Moon (dark mode)

**Behavior:**

- Persists preference in localStorage
- Applies `.dark` class to `<html>` element
- Smooth transition (200ms) on all color properties

---

## 9. Animation & Motion

### 9.1 Principles

- **Purposeful:** Every animation serves a function (feedback, guidance,
  delight)
- **Subtle:** Avoid distracting motion; animations should feel natural
- **Fast:** Durations should be snappy (150-300ms for most interactions)
- **Respectful:** Honor `prefers-reduced-motion` for accessibility

### 9.2 Transition Durations

```javascript
duration: {
  'instant': '100ms',  // Hover states, tooltips
  'fast':    '150ms',  // Button clicks, toggles
  'normal':  '200ms',  // Dropdowns, popovers
  'slow':    '300ms',  // Modals, sheets, page transitions
  'slower':  '500ms',  // Special effects (rare)
}
```

### 9.3 Easing Functions

```javascript
easing: {
  'default': 'cubic-bezier(0.4, 0, 0.2, 1)',  // Tailwind default
  'in':      'cubic-bezier(0.4, 0, 1, 1)',
  'out':     'cubic-bezier(0, 0, 0.2, 1)',
  'bounce':  'cubic-bezier(0.68, -0.55, 0.265, 1.55)',  // Playful (rare)
}
```

### 9.4 Common Animations

#### **Hover States**

```css
/* Cards */
transition: transform 200ms ease, shadow 200ms ease;
hover: transform translateY(-2px), shadow-md

/* Buttons */
transition: background-color 150ms ease;
hover: bg-primary-600
```

#### **Loading States**

**Spinner:**

```jsx
<div className="animate-spin rounded-full h-8 w-8 border-4 border-neutral-200 border-t-primary-500" />
```

**Skeleton Loader:**

```css
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeleton {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  background-color: neutral-200;
  border-radius: 8px;
}
```

**Progress Bar (Indeterminate):**

```css
@keyframes indeterminate {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-bar {
  animation: indeterminate 1.5s ease-in-out infinite;
}
```

#### **Modal/Dialog Entry**

```css
/* Backdrop */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Modal */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-backdrop {
  animation: fadeIn 200ms ease;
}
.modal-content {
  animation: scaleIn 300ms cubic-bezier(0, 0, 0.2, 1);
}
```

#### **Sheet/Drawer Entry**

```css
@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.sheet {
  animation: slideInRight 300ms ease-out;
}
```

#### **Toast Notification**

```css
@keyframes slideInBottom {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast {
  animation: slideInBottom 300ms ease-out;
}
```

#### **Agent Status Ring (On Mission)**

```css
@keyframes pulse-ring {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-ring.on-mission {
  animation: pulse-ring 2s ease-in-out infinite;
}
```

### 9.5 Accessibility: Reduced Motion

**Always respect user preferences:**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 10. Key Page Layouts

### 10.1 Dashboard (Mission Control)

**Purpose:** High-level overview of goals, agents, and recent activity

**Layout Structure:**

```
┌────────────────────────────────────────────────────────────┐
│ Top Bar: Logo | Search | "Create Mission" | Notifications  │
├──────────┬─────────────────────────────────────────────────┤
│          │  Mission Control                                │
│          │  ┌────────┬────────┬────────┐                   │
│ Sidebar  │  │ Active │ On Mis │ Complt │  ← Stats Cards    │
│          │  │ 12     │ 5      │ 8      │     (3 cols)      │
│ - Home   │  └────────┴────────┴────────┘                   │
│ - Agents │                                                  │
│ - Goals  │  Active Goals                               │
│ - Intel  │  ┌─────────────┬─────────────┬─────────────┐   │
│ - Clients│  │ Q1 Marketing│ Website     │ Product     │   │
│ - Settings│ │ ◐ 45%       │ ◐ 70%       │ ◐ 20%       │   │
│          │  └─────────────┴─────────────┴─────────────┘   │
│          │                                                  │
│          │  Recent Activity           Upcoming Milestones  │
│          │  ┌──────────────────┐      ┌────────────────┐  │
│          │  │ Riley completed  │      │ Feb 15: Launch │  │
│          │  │ Mission #42      │      │ Feb 20: Review │  │
│          │  └──────────────────┘      └────────────────┘  │
└──────────┴─────────────────────────────────────────────────┘
```

**Key Elements:**

- **Stats Cards** (row 1): Active Goals, Agents On Mission, Missions Completed
  Today
- **Goal Grid** (row 2): 3-column grid of active goal cards (see Component
  Inventory)
- **Activity Feed** (bottom-left): Real-time updates (scrollable, max 5 items
  visible)
- **Milestones** (bottom-right): Upcoming deadlines and key dates

**Responsive:**

- **Desktop:** 3-column goal grid, side-by-side activity/milestones
- **Tablet:** 2-column goal grid, stacked activity/milestones
- **Mobile:** Sidebar hidden (hamburger menu), 1-column everything

---

### 10.2 Agent Directory

**Purpose:** Browse, search, and manage all agents in the cohort

**Layout Structure:**

```
┌────────────────────────────────────────────────────────────┐
│ Agent Directory                                             │
│ [Search] [Filter: All | On Mission | Standing By] [+ Recru│
├────────────────────────────────────────────────────────────┤
│ ┌──────────┬──────────┬──────────┬──────────┐            │
│ │  Riley   │  Jordan  │  Casey   │  Alex    │  ← Agent    │
│ │  👤      │  👤      │  👤      │  👤      │    Cards   │
│ │  On Misn │  Standby │  On Misn │  Off Duty│            │
│ │  65% Load│  20% Load│  80% Load│  0% Load │            │
│ └──────────┴──────────┴──────────┴──────────┘            │
│ ┌──────────┬──────────┬──────────┬──────────┐            │
│ │  Morgan  │  Sage    │  Jamie   │  Dakota  │            │
│ └──────────┴──────────┴──────────┴──────────┘            │
└────────────────────────────────────────────────────────────┘
```

**Key Elements:**

- **Search Bar:** Full-text search by name, role, skill
- **Filters:** Status (All, On Mission, Standing By, Off Duty), Role (Developer,
  Designer, etc.)
- **View Toggle:** Card view (default) / List view (table)
- **Agent Cards:** 4-column grid (see Component Inventory > Agent Card)
- **+ Recruit Button:** Primary CTA, opens agent creation modal

**Click Behavior:** Clicking agent card opens full Agent Profile (modal or
dedicated page)

**Responsive:**

- **Desktop:** 4 columns
- **Tablet:** 3 columns
- **Mobile:** 1 column, stacked

---

### 10.3 Mission/Goal Detail

**Purpose:** Deep-dive into a specific goal's missions, progress, and team

**Layout Structure:**

```
┌────────────────────────────────────────────────────────────┐
│ < Back to Goals                                        │
│                                                            │
│ Q1 Marketing Goal                                      │
│ Acme Corp • In Progress • Started Feb 1, 2026             │
│                                                            │
│ [Overview] [Missions] [Intel] [Team] [Settings]  ← Tabs   │
├────────────────────────────────────────────────────────────┤
│ MISSIONS TAB (Kanban View)                                │
│                                                            │
│ ┌─────────┬─────────┬─────────┬─────────┐                │
│ │ Todo    │ In Prog │ Review  │ Done    │                │
│ ├─────────┼─────────┼─────────┼─────────┤                │
│ │[Mission]│[Mission]│[Mission]│[Mission]│  ← Draggable   │
│ │[Mission]│[Mission]│         │[Mission]│    Mission     │
│ │[Mission]│         │         │[Mission]│    Cards       │
│ │         │         │         │[Mission]│                │
│ │ + Add   │         │         │         │                │
│ └─────────┴─────────┴─────────┴─────────┘                │
└────────────────────────────────────────────────────────────┘
```

**Key Elements:**

- **Breadcrumbs:** Back navigation
- **Goal Header:** Title, metadata, status badge, progress ring
- **Tabs:** Overview, Missions (Kanban), Intel, Team, Settings
- **Kanban Board:** 4 columns (Todo, In Progress, Review, Done), draggable
  mission cards
- **+ Add Mission:** Bottom of each column, opens mission creation modal

**Overview Tab (Alternative View):**

- Goal description (rich text)
- Key metrics (progress %, missions completed, agents assigned)
- Timeline visualization (Gantt chart)
- Recent activity feed

**Intel Tab:**

- Grid of knowledge/intel cards captured during this goal
- Search and filter capabilities

**Team Tab:**

- List of assigned agents with workload meters
- - Assign Agent button

**Responsive:**

- **Desktop:** 4-column Kanban
- **Tablet:** Horizontal scroll for Kanban (or switch to list view)
- **Mobile:** List view default (Kanban becomes impractical)

---

### 10.4 Knowledge Base Browser

**Purpose:** Search and explore all intel captured by agents

**Layout Structure:**

```
┌────────────────────────────────────────────────────────────┐
│ Intel • Your Organization's Knowledge Base                 │
│                                                            │
│ [Search: "What did we learn about..."]                     │
│ [Filter: Source] [Filter: Agent] [Filter: Date] [Sort]     │
├────────────────────────────────────────────────────────────┤
│ ┌──────────────────┬──────────────────┬──────────────────┐│
│ │ 💡 API Rate      │ 💡 User Testing  │ 💡 Deployment   ││
│ │ Limiting Strategies│ Feedback      │ Best Practices  ││
│ │                  │                  │                 ││
│ │ [Research]       │ [Manual]         │ [Research]      ││
│ │ Riley • 2d ago   │ Jordan • 5d ago  │ Casey • 1w ago  ││
│ └──────────────────┴──────────────────┴──────────────────┘│
│ ┌──────────────────┬──────────────────┬──────────────────┐│
│ │ 💡 Next intel... │ 💡 ...           │ 💡 ...          ││
│ └──────────────────┴──────────────────┴──────────────────┘│
│                                                            │
│ Showing 12 of 156 intel entries                            │
└────────────────────────────────────────────────────────────┘
```

**Key Elements:**

- **Semantic Search Bar:** Main interaction, natural language queries
- **Filters:** Source type (Research, Manual, Observation), Agent, Date range,
  Goal
- **Sort:** Relevance (default), Recent, Most Referenced
- **Knowledge Cards:** 3-column grid (see Component Inventory > Knowledge Card)
- **Pagination:** Load more / infinite scroll

**Click Behavior:** Clicking intel card opens full detail view (modal or
dedicated page) with:

- Full insight text
- Source mission/goal link
- Agent attribution
- Related intel (graph connections)
- Comments/discussion thread

**Responsive:**

- **Desktop:** 3 columns
- **Tablet:** 2 columns
- **Mobile:** 1 column

---

### 10.5 Client Profile

**Purpose:** View all goals, missions, and context for a specific client

**Layout Structure:**

```
┌────────────────────────────────────────────────────────────┐
│ < Back to Clients                                          │
│                                                            │
│ 🏢 Acme Corporation                                        │
│ Technology • Enterprise • Est. 1985                        │
│                                                            │
│ [Overview] [Goals] [Team] [Intel] [Settings]  ← Tabs  │
├────────────────────────────────────────────────────────────┤
│ OVERVIEW TAB                                               │
│                                                            │
│ About This Client                                          │
│ [Rich text description, industry context, key contacts...] │
│                                                            │
│ Active Goals (3)                                       │
│ ┌───────────────┬───────────────┬───────────────┐         │
│ │ Q1 Marketing  │ Website Redes │ Product Launch│         │
│ │ ◐ 45%         │ ◐ 70%         │ ◐ 20%         │         │
│ └───────────────┴───────────────┴───────────────┘         │
│                                                            │
│ Assigned Agents (5)                                        │
│ 👤 Riley  👤 Jordan  👤 Casey  ...                         │
│                                                            │
│ Recent Activity                                            │
│ • Mission #42 completed (2h ago)                           │
│ • New goal created (1d ago)                            │
└────────────────────────────────────────────────────────────┘
```

**Key Elements:**

- **Client Header:** Logo/icon, name, metadata (industry, size, established
  date)
- **Tabs:** Overview, Goals, Team, Intel, Settings
- **Overview Tab:** Description, active goals, assigned agents, recent activity
- **Goals Tab:** Full list/grid of all goals for this client
- **Team Tab:** Agents assigned to this client with workload meters
- **Intel Tab:** Client-scoped knowledge base (only intel from this client's
  goals)

**Responsive:**

- **Desktop:** 3-column goal grid
- **Tablet:** 2-column goal grid
- **Mobile:** 1-column, stacked sections

---

### 10.6 Settings

**Purpose:** Configure user preferences, HQ settings, integrations, billing

**Layout Structure:**

```
┌────────────────────────────────────────────────────────────┐
│ Settings                                                   │
│                                                            │
│ ┌──────────────┬─────────────────────────────────────────┐│
│ │ Profile      │ Profile Settings                        ││
│ │ Preferences  │                                         ││
│ │ Notifications│ Name: Ahmad Ashfaq                      ││
│ │ Team         │ Email: ahmad@example.com                ││
│ │ Integrations │ Avatar: [Upload]                        ││
│ │ Billing      │ Role: Owner                             ││
│ │ Danger Zone  │                                         ││
│ │              │ Timezone: Asia/Karachi                  ││
│ │              │                                         ││
│ │              │ [Save Changes]                          ││
│ └──────────────┴─────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

**Key Elements:**

- **Left Sidebar:** Section navigation (stacked links)
- **Right Panel:** Section-specific settings (forms, toggles, lists)
- **Profile:** Name, email, avatar, timezone, password
- **Preferences:** Dark mode toggle, language, date format
- **Notifications:** Email/Slack/Telegram notification preferences
- **Team:** Invite members, manage roles
- **Integrations:** Connect GitHub, Figma, etc.
- **Billing:** Subscription plan, payment method, usage
- **Danger Zone:** Delete account, leave HQ (red accents)

**Responsive:**

- **Desktop:** Side-by-side navigation + content
- **Mobile:** Stack navigation above content, or use tabs

---

### 10.7 Goal Creation Flow (Human + Agent Proposals)

**Purpose:** Create new goals, with support for both human-initiated and
agent-proposed goals

**Layout Structure (Modal/Sheet):**

#### **Step 1: Goal Details**

```
┌────────────────────────────────────────────────────────────┐
│ Create New Goal                                      [X]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Goal Title                                                 │
│ [Input: "Launch Q2 Marketing Goal"]                   │
│                                                            │
│ Description (Optional)                                     │
│ [Textarea: Natural language description of the goal...]   │
│                                                            │
│ Priority                                                   │
│ ( ) Low  (•) Medium  ( ) High  ( ) Urgent                 │
│                                                            │
│ Deadline (Optional)                                        │
│ [Date Picker: Mar 31, 2026]                               │
│                                                            │
│ Assign to Client (Optional)                               │
│ [Dropdown: Select client...]                              │
│                                                            │
│                                    [Cancel] [Create Goal] │
└────────────────────────────────────────────────────────────┘
```

#### **Step 2 (Agent-Proposed Goals Only): Human Approval**

If an agent proposes a goal, it enters a "Pending Approval" state:

```
┌────────────────────────────────────────────────────────────┐
│ 🤖 Agent-Proposed Goal                              [X]    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Proposed by: Riley (AI Developer)                         │
│ Reason: Test coverage dropped below 70%                   │
│                                                            │
│ Goal Title                                                 │
│ "Improve Test Coverage Across Core Modules"               │
│                                                            │
│ Justification                                              │
│ Riley's analysis shows that recent feature work reduced   │
│ test coverage from 85% to 68%. This increases risk for    │
│ regressions. Proposed goal aims to bring coverage back    │
│ above 80% within 2 weeks.                                 │
│                                                            │
│ Suggested Priority: High                                   │
│ Estimated Effort: 2 weeks, 3 agents                       │
│                                                            │
│ Your Decision:                                             │
│ [Approve] [Modify Scope] [Reject] [Comment]               │
└────────────────────────────────────────────────────────────┘
```

**Human Actions:**

- **Approve:** Goal is created and enters normal workflow
- **Modify Scope:** Opens edit mode to adjust title, priority, deadline
- **Reject:** Agent is notified, goal is discarded (with optional feedback
  comment)
- **Comment:** Opens discussion thread for clarification before deciding

**Key Elements:**

- Form fields: Title (required), Description (optional), Priority, Deadline,
  Client
- Agent proposals include: Proposing agent, Reason/Justification, Suggested
  priority/effort
- Approval workflow: Approve / Modify / Reject / Comment buttons
- Validation: Title required, priority defaults to Medium
- Confirmation: Toast notification on success

**Responsive:**

- **Desktop:** Modal (max-w-lg)
- **Mobile:** Full-screen sheet

---

## Summary

This UI/UX Design System establishes a comprehensive foundation for Cohortix's
visual language. Key decisions:

1. **Agent-first philosophy:** Agents are treated as teammates, not tools, with
   warm, human-centric design patterns.

2. **Clean, card-based layouts:** Inspired by Linear/Notion/ClickUp,
   prioritizing generous whitespace and scannable information hierarchy.

3. **Purple/violet brand identity:** Carried through from existing Tailwind
   preset, extended into a full semantic color system.

4. **Dark mode as first-class citizen:** Not an afterthought, with thoughtful
   color mappings and contrast ratios.

5. **Lucide icons:** Modern, consistent, and perfectly aligned with shadcn/ui
   components.

6. **8px spacing system:** Ensures visual consistency and developer ergonomics
   across all components.

7. **Purposeful motion:** Subtle, fast animations that guide attention without
   distracting.

8. **Responsive-first:** Every layout and component designed to gracefully adapt
   from mobile to desktop.

9. **Accessibility baked in:** WCAG AA contrast ratios, reduced motion support,
   semantic HTML patterns.

10. **Production-ready specs:** Every component includes precise dimensions,
    colors, spacing, and states for seamless handoff to developers.

---

**Next Steps:**

- Review with Ahmad for strategic alignment
- Share with Devi (AI Developer) for shadcn/ui implementation planning
- Create Figma/Storybook component library (if needed)
- Begin Phase 2 implementation (Agent Directory UI)

**Ready for Ahmad's review.** 🎨

— Lubna, UI Designer
