# Cohortix Brand Identity

<!-- Purpose: Brand identity definition — colors, typography, voice, positioning -->
<!-- Owner: Lubna (UI Designer) -->
<!-- Last Reviewed: 2026-03-20 -->
<!-- Read After: docs/design/research-approachable-pm-tools.md -->
**Author:** Lubna (UI Designer Agent)  
**Date:** 2025-07-14  
**Phase:** Codex Phase 3 — Design & UX, Step 1 — Brand Identity  
**Status:** Draft v1 — Pending Ahmad Review

---

## Brand Positioning

**Cohortix** is a project management and agent orchestration dashboard for teams who want power without complexity.

> **Brand promise:** "The dashboard your whole team will actually use."

The keyword Ahmad set: **minimal, approachable, made for everyday people.**

---

## Brand Feel

### Core Adjectives
| Primary | Secondary |
|---------|-----------|
| Friendly | Confident |
| Clear | Modern |
| Calm | Capable |
| Approachable | Trustworthy |

### Anti-adjectives (what we are NOT)
- Intimidating (not like Jira)
- Sterile (not like Google Workspace)
- Hyped (not like a SaaS landing page)
- Developer-only (not like Linear in default state)

### Analogy
Cohortix should feel like **a well-designed physical notebook that happens to be software** — the kind of tool a thoughtful designer would carry. Clean. Structured. Inviting.

---

## Color Direction

### The Challenge
Cohortix has 11 themes (9 dark, 2 light). Ahmad wants MINIMAL. The brand must work as the **default/primary theme** while the existing theme system remains available.

### Decision: "Paper" theme becomes the brand default

The existing `paper` theme already exists in the codebase with a warm, approachable palette:
- Background: `hsl(40 40% 95%)` — warm off-white, like good paper
- Text: `hsl(30 10% 15%)` — warm near-black (not cold pure black)
- Primary: `hsl(43 80% 28%)` — amber-gold (book binding, pen ink)
- Surfaces: warm gray scale

This palette embodies "approachable" better than any cold blue or neon accent.

**However:** The paper theme needs refinement for brand use:
- Current primary `hsl(43 80% 28%)` is too yellow-brown for modern UI. Recommend shift to a warm slate/indigo for interactive elements, with warm neutrals as the backdrop.
- Alternative: Keep amber as a warm accent but use a warm indigo `hsl(248 55% 52%)` as the primary interactive color — friendly but not corporate-blue.

### Recommended Brand Color System

```
Brand Primary:    hsl(248 50% 52%)   — Warm Indigo (Cohortix Blue-Violet)
Brand Accent:     hsl(43 80% 45%)    — Warm Amber (highlight, badges)
Background:       hsl(40 30% 97%)    — Near-white warm paper
Surface:          hsl(40 25% 93%)    — Warm gray card
Text:             hsl(240 10% 16%)   — Warm near-black
Muted text:       hsl(240 5% 52%)    — Warm medium gray
Border:           hsl(240 8% 88%)    — Subtle warm border
```

**Status colors (soft, friendly):**
```
Success:  hsl(148 50% 42%)   — Soft forest green (not neon mint)
Warning:  hsl(38 85% 50%)    — Warm amber (natural warning)
Error:    hsl(4 75% 52%)     — Soft tomato red (not aggressive)
Info:     hsl(220 65% 55%)   — Soft blue (informational, calm)
```

### Theme System Relationship
- **Default:** New brand light theme (warm indigo + paper)
- **Light alternate:** Existing "paper" theme (warm amber focus)
- **Dark themes:** All 9 existing themes remain unchanged, available in theme switcher
- **Theme switcher position:** Secondary feature — not the first thing new users see

---

## Typography

### Current Stack
- **Sans:** Inter — ✅ Keep. Inter is the gold standard for approachable UI.
- **Mono:** JetBrains Mono — ✅ Keep, but restrict to code blocks, terminal, IDs only.

### Recommendation: Keep Inter + JetBrains Mono

**Why Inter is right for "everyday people":**
- Designed by Rasmus Andersson specifically for UI/screen readability
- Used by Notion, Linear, Vercel, GitHub, and countless approachable SaaS tools
- Humanist letterforms — feels warm, not mechanical
- Excellent ligatures for interface labels
- Free, well-maintained, variable font available

**Typography scale for brand:**
| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Page title (h1) | 24px | 700 | 1.3 |
| Section title (h2) | 18px | 600 | 1.4 |
| Card title (h3) | 15px | 600 | 1.4 |
| Body / labels | 14px | 400 | 1.5 |
| Small / captions | 12px | 400 | 1.4 |
| Code / IDs | 13px JetBrains | 400 | 1.5 |

**Note:** NO monospace in regular UI text. JetBrains Mono strictly for: code blocks, terminal output, task IDs, timestamps, metrics.

---

## Brand Voice

### Tone: Friendly-Professional

Think: *a smart, helpful colleague who knows their stuff but never talks down to you.*

| Situation | Brand Voice |
|-----------|-------------|
| Empty state | "No tasks yet. Add your first one?" |
| Success action | "Done! Task moved to completed." |
| Error | "That didn't work. Try again or refresh." |
| Onboarding | "Let's set up your first project — takes about 2 minutes." |
| Feature discovery | "Pro tip: You can drag cards between columns." |

### Voice Principles
1. **Plain English first** — No jargon unless the user's context requires it
2. **Positive framing** — "Add first task" not "No tasks found"
3. **Confident brevity** — Short sentences. Active voice.
4. **Human warmth** — Contractions are fine ("you're", "it's", "let's")
5. **No corporate speak** — Not "leverage", "utilize", "synergize"

### Examples
| ❌ Don't | ✅ Do |
|---------|-------|
| "Task resource assignment failed" | "Couldn't assign this task. Try again?" |
| "No records found" | "Nothing here yet" |
| "Utilize the filter functionality" | "Use filters to find tasks faster" |
| "Action completed successfully" | "Done ✓" |
| "Please verify your credentials" | "Wrong password. Try again?" |

---

## Logo & Visual Identity

*(Out of scope for this phase — needs separate design work)*

**Direction notes for when this is tackled:**
- Wordmark or simple icon + wordmark
- Icon concept: cohesion, connection, orchestration (not typical PM clichés like checkmarks or boards)
- Should work in both the warm light brand theme AND dark themes
- SVG only — must be crisp at all sizes

---

## Summary: The Cohortix Design Principles

1. **Minimal by default** — Show what's needed now. Progressive disclosure for power features.
2. **Warm, not cold** — Warm neutrals over clinical whites. Soft colors over neon.
3. **Generous whitespace** — Padding as a feature. Never cram.
4. **Humanist typography** — Inter for everything. Mono only for code/data.
5. **Semantic color** — Color communicates meaning (status, priority). Not decoration.
6. **Plain language** — Name things what they are. Talk like a human.
7. **Theme-aware** — Brand works in light mode by default; all 11 themes remain for users who want them.

---

*Next: token-architecture.md — implementing these decisions in the token system.*
