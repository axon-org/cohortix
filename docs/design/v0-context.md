# v0 Generation Context — Cohortix

<!-- Purpose: Pre-flight design reference for v0 mockup generation -->
<!-- Owner: Lubna (UI Designer) -->
<!-- Created: 2026-03-25 -->
<!-- Read Before: ANY v0 prompt generation -->

## Active Theme: Brand-Light (warm paper + indigo)

### Token Values (exact — use these, not approximations)

| Token | Value | Usage |
|-------|-------|-------|
| Page Background | `hsl(40, 30%, 97%)` | Warm paper white canvas |
| Card/Surface BG | `#FFFFFF` (pure white) | Cards, panels, modals |
| Primary Accent | `hsl(248, 50%, 52%)` / `#6C5CE7` | Buttons, active states, links, focus rings |
| Primary Hover | `hsl(248, 55%, 46%)` | Button hover, link hover |
| Primary Subtle | `hsl(248, 100%, 97%)` | Light tint backgrounds for badges, tags |
| Text Primary | `hsl(240, 10%, 16%)` / `#1A1A2E` | Headings, main text |
| Text Secondary | `hsl(240, 6%, 28%)` | Descriptions, labels |
| Text Muted | `hsl(240, 4%, 52%)` / `#888899` | Placeholders, timestamps, meta |
| Border Default | `hsl(240, 8%, 88%)` / `#E8E8EC` | Card borders, input borders |
| Border Subtle | `#F0F0F3` | Internal dividers between list items |
| Sidebar BG | `#1E1E2D` | Dark navy/charcoal (desaturated purple-navy) |
| Sidebar Text | `#A0A0B0` | Nav items inactive |
| Sidebar Active | `#6C5CE7` bg pill + white text | Active nav item highlight |
| Sidebar Sections | `#666680` uppercase, 11px, semibold, tracked | "PROJECT", "WORKSPACE" labels |
| Success | `hsl(148, 50%, 42%)` / `#22C55E` | Online, done, positive deltas |
| Warning | `hsl(38, 85%, 50%)` / `#F59E0B` | Idle, retry, amber alerts |
| Error | `hsl(4, 75%, 52%)` / `#EF4444` | Critical, overdue, destructive |
| Info | `#3B82F6` | Informational badges |

### Typography

| Usage | Size | Weight | Color |
|-------|------|--------|-------|
| Page title | 24-28px | Bold (700) | `#1A1A2E` |
| Section header (in card) | 16-18px | Semibold (600) | `#1A1A2E` |
| Card title / item name | 14-15px | Medium (500) | `#222233` |
| Body text | 14px | Regular (400) | `#444455` |
| Secondary/meta | 12-13px | Regular (400) | `#888899` |
| Small labels/tags | 11-12px | Medium (500) | `#555566` |
| Large metrics | 32-40px | Bold (700) | `#1A1A2E` |

- **Font:** Inter (primary), JetBrains Mono (monospace)
- **Spacing grid:** 8px base (4px for fine-tuning)

## Required Layout Elements

### Sidebar (MUST include on every screen)
- **Width:** ~200-210px, fixed left, full viewport height
- **BG:** Dark navy `#1E1E2D`
- **Top:** Cohortix logo (purple/indigo circle icon + "Cohortix" wordmark in white)
- **Nav items:** Icon (outline, 18-20px) + label, ~40-44px row height, 16-20px left padding
- **Active item:** `#6C5CE7` filled rounded pill behind item, white text + icon
- **Section labels:** Uppercase, 11px, semibold, tracked, `#666680`
- **Sections:** Overview, Dashboard, Task Board, Agents / Communications: Chat, Channels, Inbox / Tools: Skills, Memory / System: Settings
- **Badge counts:** Small pill badges on items like Inbox, Messages (muted purple bg, white text)
- **Bottom:** User profile — avatar circle (32px) + name (white, 14px) + role (muted, 12px)

### Top Header Bar
- **Height:** 56-64px, white or canvas bg, spans content area width
- **Left:** Page title (24-28px bold) or breadcrumb for detail screens
- **Right:** Search bar (rounded, light gray bg) + notification bell (with optional red dot) + user avatar circle

### Card Styling
- **BG:** Pure white `#FFFFFF`
- **Border-radius:** 12px (consistent everywhere)
- **Shadow:** Very subtle `0 1px 3px rgba(0,0,0,0.04)` — barely visible
- **Border:** `1px solid #E8E8EC`
- **Padding:** 20-24px internal
- **Accent borders:** 3-4px `#6C5CE7` top or left edge for featured/selected cards

## Approved Screens (new screens MUST match these)
- **Dashboard:** https://demo-kzmimklc6gvpv3joebm5.vusercontent.net — [v0 editor](https://v0.app/chat/m4idTPxj8rS)
- **Task Board:** https://demo-kzmo44cwmcdayr8m8or6.vusercontent.net — [v0 editor](https://v0.app/chat/dVjHZ3hebPP)
- **Agent Detail:** https://demo-kzmp1f92m59ld4f54c42.vusercontent.net — [v0 editor](https://v0.app/chat/oih2C6SMaCS)
- **Screenshots:** `docs/design/mockups/approved-direction/` (dashboard.png, task-board.png, agent-detail.png)

## Style Block (append to every v0 prompt)

```
Style requirements (MUST follow exactly):
- Font: Inter for all text
- Page background: hsl(40, 30%, 97%) warm paper white
- Cards: pure white #FFFFFF, 12px border-radius, very subtle shadow (0 1px 3px rgba(0,0,0,0.04)), 1px solid #E8E8EC border, 20-24px internal padding
- Primary accent: #6C5CE7 indigo for buttons, active states, links, accent borders
- Text: #1A1A2E headings (bold), #444455 body, #888899 muted/secondary
- LEFT SIDEBAR (must include): 200px wide, #1E1E2D dark navy bg, full height. Top: purple circle icon + "Cohortix" wordmark in white. Nav items with outline icons + labels, active item has #6C5CE7 pill highlight. Section labels uppercase 11px tracked #666680. Bottom: user avatar + name + role.
- Sidebar nav items: Overview, Dashboard, Task Board, Agents, Chat, Channels, Inbox, Skills, Memory, Settings
- Top header: 56px height, white bg, page title left, search + bell + avatar right
- Status colors: green #22C55E (success), amber #F59E0B (warning), red #EF4444 (error), blue #3B82F6 (info)
- Avatars: colored circle backgrounds with white initials
- Use React + Next.js App Router + Tailwind CSS + shadcn/ui components
```

## Anti-Patterns

- ❌ Cool gray backgrounds (`#F5F5F7`, `#F8F9FA`) — use warm `hsl(40, 30%, 97%)`
- ❌ Hex approximations — use exact values from this file
- ❌ No sidebar — every screen MUST have the sidebar
- ❌ Generic icons — use Lucide icon set consistently
- ❌ Flat/borderless cards — always include subtle border + shadow
- ❌ Pure black text — use warm near-black `#1A1A2E`
