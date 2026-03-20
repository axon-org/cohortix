# Research: Approachable PM Tools
**Author:** Lubna (UI Designer Agent)  
**Date:** 2025-07-14  
**Purpose:** Competitive research — what makes PM tools feel "made for everyday people"

---

## Summary

The core pattern across approachable PM tools: **restraint in complexity, generosity in whitespace, warmth in color.** They feel like notebooks or whiteboards, not dashboards or terminals. The contrast with developer/power-user tools (Linear, Jira, Cohortix's current Void theme) is stark.

---

## Tool-by-Tool Analysis

### 🟦 Trello (Primary Reference)
**Feel:** Playful board game. Tasks are cards, columns are lists.

- **Color:** Uses a single brand blue (`#0052CC`). Cards use pastel label colors (soft red, yellow, green, purple, blue) — never saturated.
- **Typography:** Inter/system-sans, 14px base, generous line-height. NO monospace anywhere visible.
- **Visual density:** LOW. Large card surfaces, generous padding (16-24px internal), lots of breathing room.
- **Icon style:** Filled, rounded, 20px. Simple metaphors (checkmark, pencil, person). Never detailed or technical.
- **Whitespace:** Cards have ~16px internal padding. Column gutters 8px. Background is always behind white/colored cards.
- **Friendly patterns:** Drag-and-drop is primary UX. Emoji reactions. Cover images on cards. Power-ups are additive (not shown by default).
- **What makes it approachable:** Everything is a physical metaphor. Power features hidden behind menus.

---

### 🏕️ Basecamp
**Feel:** A calm, structured team intranet. Like a company bulletin board.

- **Color:** Brand green (`#1D7A42`), warm gray backgrounds (`#F5F4EF` — almost paper), high contrast black text. Minimal color use — only for CTAs.
- **Typography:** Larger than typical — 16-18px body. High contrast. Very readable.
- **Visual density:** VERY LOW. Massive whitespace. Sections separated by thick visual breaks, not borders.
- **Whitespace:** Extreme. 40-60px section padding. Content feels spacious and unhurried.
- **Friendly patterns:** "Campfire" for chat (informal). "Message board" instead of "tickets." Intentionally limits features (no Gantt, no sprints). "We won't add X" is a design principle.
- **What makes it approachable:** Intentional omission of "enterprise" concepts. Everything named in plain English. No jargon.

---

### ✅ Todoist
**Feel:** A premium, calm personal assistant.

- **Color:** Brand red (`#DB4035`) used sparingly. Background white/very light gray. Priority colors are pastel — never competing.
- **Typography:** Inter, 14px. Clean, precise. Excellent hierarchy with weight variation (400/600).
- **Visual density:** MEDIUM-LOW. Dense enough to show many tasks but never overwhelming.
- **Friendly patterns:** Natural language date parsing. Karma/points gamification. Recurring tasks in plain English.
- **What makes it approachable:** Natural language everywhere. Complexity hidden behind "Filters & Labels."

---

### 🗒️ Notion
**Feel:** A blank canvas. A powerful notebook that doesn't look powerful.

- **Color:** Barely any! Default is white bg, black text. Brand is essentially black + white.
- **Typography:** `ui-sans-serif` (system font), 16px, generous line-height (1.7). Feels like a word processor.
- **Visual density:** LOW to MEDIUM. Block-based layout — everything has breathing room.
- **Friendly patterns:** Slash commands (discoverable, not required). Templates gallery. Database views (list/board/calendar/gallery) — same data, different lenses.
- **What makes it approachable:** Starts empty and invites. You can use it as a note and never discover databases. Power is opt-in.

---

### 📅 Monday.com
**Feel:** Colorful, spreadsheet-like, visual. More enterprise but still approachable.

- **Color:** Very colorful. Each status has a color (green/yellow/red/purple/orange). Background white.
- **Typography:** Inter/Poppins, 13-14px, tight for data density.
- **Visual density:** MEDIUM-HIGH. Color coding makes scanning fast.
- **Friendly patterns:** Status labels are colored pills. Automations explained in plain English ("When X happens, do Y").
- **What makes it approachable:** Color coding does the cognitive work. No need to read every status.

---

### Counter-example: Linear (developer tool, NOT approachable)
- Obsidian dark, high information density, command palette first
- Monospace for IDs, technical terminology (cycles, triage, SLA)
- Target: dev teams who love vim. Beautiful but intimidating to non-devs.

---

## Key Findings: The Approachability Formula

### 1. Color Philosophy
| Principle | Implementation |
|-----------|----------------|
| Single brand color | Used only for CTAs and active states |
| Neutral backgrounds | White or warm gray — never pure black or high-chroma dark |
| Status colors are soft | Pastels or muted versions, not saturated neon |
| Color is semantic | Color = status/priority/category — not decoration |
| No competing colors | Max 2-3 colors visible at once in typical view |

### 2. Typography
| Principle | Implementation |
|-----------|----------------|
| Humanist sans-serif | Inter, Helvetica, system-ui — never cold geometric fonts |
| 14-16px base | Never smaller for body content |
| Weight for hierarchy | 400 body, 500-600 labels, 700 only for page titles |
| No monospace in body | Reserved for code blocks only |
| High contrast | Text at 4.5:1+ contrast minimum |

### 3. Visual Density
- Start sparse, let users increase density — never the reverse
- Sidebar: compact (32-40px rows). Main content: generous (48px+ rows)
- Minimum 8px between interactive elements, 16px+ internal card padding

### 4. Icon Style
- Rounded corners, consistent stroke weight (1.5-2px for line icons)
- 16-20px inline, 24px navigation
- Filled for primary actions, line for secondary

### 5. Interaction Patterns
- Drag and drop where spatial metaphor applies (kanban)
- Natural language for dates and durations
- Inline editing — no modal for simple edits
- Progressive disclosure — advanced features accessible but not visible by default
- Empty states that guide, not intimidate

---

## Implications for Cohortix

### What Cohortix Does Well
- Clean CSS variable system with semantic naming
- Comprehensive theme support (11 themes)
- Status colors already defined semantically (success/warning/info/destructive)

### What Needs to Change for "Everyday People"
1. **Default theme should be light** — All 9 current dark themes are developer preferences. Everyday people default to light mode (Todoist, Notion, Trello, Basecamp are all light by default).
2. **Reduce visual density** — Need a "comfortable" density mode as default.
3. **Typography** — Inter is correct. JetBrains Mono must stay code-only.
4. **Color** — "Void" aesthetic (deep dark + neon cyan) is beautiful but niche. Brand needs a warm, approachable primary color for the default theme.
5. **Whitespace** — Need generous defaults. Add "compact" mode for power users.

---

*Research complete. See brand-identity.md for conclusions.*
