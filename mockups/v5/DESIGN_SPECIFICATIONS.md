# Cohortix Mockup Design Specifications
**Version:** v5 - Monochrome (Linear.app Aesthetic)  
**Date:** February 11, 2026  
**Designer:** Lubna (UI Designer Agent)

## Design System

### Color Palette (STRICT - NO DEVIATIONS)
```
Background:     #0A0A0B (pure black)
Surface Cards:  #1A1A1E (dark gray)
Text Primary:   #F2F2F2 (white)
Text Secondary: #888888 (gray)
Borders:        #2A2A2E (subtle gray)

Status Colors (ONLY for tiny indicators):
- Active:   #10B981 (green)
- Paused:   #F59E0B (amber)
- At-Risk:  #EF4444 (red)
```

### Typography
```
Headings:   Inter/SF Pro Display, 24px, Weight 600
Body:       Inter/SF Pro Text, 14px, Weight 400
Labels:     Inter/SF Pro Text, 12px, Weight 500
Data:       SF Mono, 13px (for numbers/metrics)
```

### Spacing
```
Grid:       8px base
Padding:    16px (cards), 24px (containers), 32px (main sections)
Gap:        12px (elements), 16px (cards), 24px (sections)
```

### Effects
```
Card Shadow:    0 2px 8px rgba(0,0,0,0.4)
Glow Effect:    0 0 20px rgba(255,255,255,0.1) (white glow)
Border Radius:  8px (cards), 4px (buttons), 6px (inputs)
```

---

## Screen 1: Mission Control Dashboard (1440x900)

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  [Header: Mission Control]                     [User] │
├───────────┬─────────────────────────────────────────────────────┤
│           │ KPI Cards Grid (4 columns)                          │
│           ├─────────────────────────────────────────────────────┤
│ Nav       │ Health Trend Chart                                  │
│ Icons     ├─────────────────────────────────────────────────────┤
│ (white)   │ Activity Feed  │  Alerts Panel                      │
│           │                │                                     │
└───────────┴────────────────┴─────────────────────────────────────┘
```

### Component Breakdown

#### Sidebar (240px wide)
- **Background:** #0A0A0B
- **Logo area:** Top, 64px height
- **Navigation items:** White icons (24x24), no labels
  - Dashboard (home icon)
  - Cohorts (users icon)
  - Analytics (chart icon)
  - Settings (gear icon)
- **Hover state:** White glow effect
- **Active indicator:** Thin white line on left edge

#### Header Bar
- **Background:** #1A1A1E
- **Height:** 64px
- **Title:** "Mission Control" in white (#F2F2F2), 24px, weight 600
- **Right side:** User avatar (32x32, circular) + dropdown icon

#### KPI Cards (4 cards, equal width with gaps)
Each card:
- **Background:** #1A1A1E
- **Border radius:** 8px
- **Padding:** 20px
- **Shadow:** 0 2px 8px rgba(0,0,0,0.4)
- **Layout:** 
  - Label (top): 12px, #888, "Active Cohorts" / "Total Members" / "Avg Engagement" / "Conversions"
  - Value (center): 36px, #F2F2F2, "24" / "1,847" / "68%" / "342"
  - Trend indicator (bottom right): Tiny status dot (green/amber/red) + small arrow

#### Health Trend Chart
- **Background:** #1A1A1E
- **Height:** 280px
- **Chart type:** Line chart
- **Line color:** #F2F2F2 (white)
- **Grid lines:** #2A2A2E (subtle)
- **Data points:** White circles with glow
- **Labels:** #888, 12px
- **Title:** "Cohort Health Over Time" (top left, 16px, #F2F2F2)

#### Activity Feed (Left column, below chart)
- **Background:** #1A1A1E
- **Each item:**
  - Tiny status dot (green/amber/red)
  - Timestamp (#888, 11px)
  - Action text (#F2F2F2, 13px)
  - Entity name (#888, 13px)
- **Example:**
  - 🟢 "2m ago: Cohort 'Spring 2026' activated"
  - 🟡 "15m ago: Cohort 'Trial Q1' engagement dropped"

#### Alerts Panel (Right column, below chart)
- **Background:** #1A1A1E
- **Border left:** 2px solid #EF4444 (red accent for urgent)
- **Items:**
  - Priority indicator (red/amber dot)
  - Alert title (#F2F2F2, 14px, weight 500)
  - Description (#888, 12px)
  - Action button (text-only, white, hover: glow)

---

## Screen 2: Cohort Grid View (1440x900)

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ [Sidebar]  [Header: Cohorts]                             [User] │
├───────────┬─────────────────────────────────────────────────────┤
│           │ [Search] [Filters: Status▾ Date▾]          [+ New] │
│           ├─────────────────────────────────────────────────────┤
│ Nav       │ Data Table                                          │
│ Icons     │ ┌────────────────────────────────────────────────┐ │
│ (white)   │ │ Name    Status  Members  Engagement  Start   │ │
│           │ │ Spring  Active   342      72%         Jan 15 │ │
│           │ │ Q1      Paused   128      45%         Jan 22 │ │
│           │ │ Trial   At-Risk   89      23%         Feb 1  │ │
│           │ └────────────────────────────────────────────────┘ │
└───────────┴─────────────────────────────────────────────────────┘
```

### Component Breakdown

#### Sidebar
- Same as Screen 1
- "Cohorts" icon active with white left border

#### Header Bar
- Same structure as Screen 1
- Title: "Cohorts"

#### Search & Filter Bar
- **Background:** #0A0A0B
- **Height:** 56px
- **Search input:**
  - Background: #1A1A1E
  - Border: 1px solid #2A2A2E
  - Placeholder: "Search cohorts..." (#888)
  - Icon: Search glass (white)
  - Width: 320px
- **Filter dropdowns:**
  - Background: #1A1A1E
  - Text: #F2F2F2
  - Chevron down icon
  - Hover: subtle white glow
- **New button (right):**
  - Background: #F2F2F2 (white)
  - Text: #0A0A0B (black)
  - Icon: Plus
  - Hover: slight opacity change

#### Data Table
- **Background:** #1A1A1E
- **Header row:**
  - Background: #0A0A0B
  - Text: #888, 12px, uppercase, weight 600
  - Sortable columns: chevron icons
- **Data rows:**
  - Background: #1A1A1E
  - Border bottom: 1px solid #2A2A2E
  - Height: 56px
  - Hover: Background #202025 (slightly lighter)
  - Text: #F2F2F2, 14px
- **Status chips:**
  - Pill shape (border-radius: 12px)
  - Active: bg #10B981 (green), text #F2F2F2
  - Paused: bg #F59E0B (amber), text #0A0A0B (dark for contrast)
  - At-Risk: bg #EF4444 (red), text #F2F2F2
  - Font size: 11px, weight 600, padding: 4px 12px
- **Column widths:**
  - Name: 30%
  - Status: 15%
  - Members: 15%
  - Engagement: 20%
  - Start Date: 20%

#### Interactions
- **Row hover:** Subtle highlight (#202025)
- **Row click:** Navigate to detail view
- **Checkbox (left of name):** For bulk actions
- **Sort:** Click column headers

---

## Design Principles Applied

1. **MONOCHROME FIRST** - Zero colored accents except status indicators
2. **High Contrast** - #F2F2F2 on #0A0A0B for primary text
3. **Subtle Depth** - Card shadows and hover states for hierarchy
4. **White Glow** - Premium feel through subtle luminosity
5. **Minimalism** - Every pixel serves a purpose
6. **Information Density** - Enterprise SaaS standard (not sparse, not crowded)
7. **Accessibility** - WCAG 2.2 AA contrast ratios maintained

---

## Google Stitch Prompts (Optimized)

### Prompt 1: Mission Control
```
Create a premium desktop web dashboard (1440x900) for Cohortix Mission Control. MONOCHROME dark theme exactly like Linear.app — pure black background (#0A0A0B), white text (#F2F2F2), dark gray surface cards (#1A1A1E). NO colored accent — black and white with subtle grays only. White glow effects. Left sidebar with white icons. 4 KPI cards, health trend chart with white/gray line, activity feed, alerts panel. Only color for status indicators (green=active, amber=paused, red=at-risk). Clean minimal high-contrast SaaS dashboard.
```

### Prompt 2: Cohort Grid
```
Create a premium desktop data table (1440x900) for Cohortix Cohorts. MONOCHROME dark theme like Linear.app — pure black background, white text, dark gray rows. NO colored accent. Search bar, filters, data table with columns (Name, Status, Members, Engagement, Start Date). Status chips only color: green Active, amber Paused, red At-Risk. Monochrome aesthetic. High contrast. Production SaaS.
```

---

## Notes for Implementation
- Export from Stitch at 2x resolution for retina displays
- Verify all contrast ratios before final export
- Status colors are the ONLY exception to monochrome rule
- Glow effects should be subtle (10-15% opacity max)
- Test dark mode rendering on different displays
