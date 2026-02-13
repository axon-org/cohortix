# Cohortix Terminology — Authoritative Reference

**Status:** APPROVED by Ahmad (2026-02-12)
**Based on:** PPV Pro by August Bradley, adapted for Cohortix's dual human+agent model

---

## Core Principle

**Humans and Agents use the SAME terminology.** There is no separate vocabulary. Every entity (human or ally) can have the full PPV stack.

---

## Alignment Zone (The Pyramid)

From abstract → concrete:

| PPV Pro Original | Cohortix Term | Definition | Human Example | Agent Example |
|---|---|---|---|---|
| Pillars & Purpose | **Domain** | Core life/expertise area that defines who you are | "Family", "Health", "Craft" | "Content Strategy", "Analytics" |
| Life Aspirations | **Vision** | Big emotional north star — the WHY behind everything | "Financial freedom" | "Become the best content strategist" |
| Goals | **Mission** | Measurable outcome that serves a Vision | "Grow Filmzya to $50k MRR" | "Master short-form video workflows" |
| Projects | **Operation** | Bounded initiative with start/end that achieves a Mission | "Build welcome email sequence" | "Research 50 competitor channels" |
| Routines | **Rhythm** | Recurring habit with no end date that sustains a Mission | "Weekly business review" | "Daily learning cycle" |
| Actions | **Task** | Atomic unit of work within an Operation or Rhythm | "Draft email copy" | "Summarize article on hooks" |

**Hierarchy:** Domain → Vision → Mission → Operation / Rhythm → Task

---

## Knowledge Zone

| PPV Pro Original | Cohortix Term | Definition |
|---|---|---|
| Topic Vault | **Intelligence** | Knowledge organized by topic — the accumulated wisdom |
| NeuroBits | **Insight** | Individual learning capture (article, note, video, discovery) |

**Relationship:** Insights roll up into Intelligence topics.

---

## Rhythm Zone (Review Cadences)

| PPV Pro Original | Cohortix Term | Definition |
|---|---|---|
| Daily Review | **Daily Debrief** | End-of-day reflection and planning |
| Weekly Review | **Weekly Debrief** | Weekly strategic review and course correction |
| Duo Cycle Review | **Cycle Debrief** | Bi-monthly deep strategic review |

---

## Cohortix-Only Terms (No PPV Equivalent)

| Term | Definition |
|---|---|
| **Ally** | AI teammate with its own full PPV stack (Domains, Visions, Missions, etc.) |
| **Cohort** | Group of Allies working together on related Missions |
| **Mission Control** | Central dashboard for coordination and oversight |

---

## Status Language

| Status | Meaning |
|---|---|
| **On Mission** | Actively working |
| **Standing By** | Idle, ready for work |
| **Off Duty** | Offline / disabled |

## Action Verbs

| Verb | Context |
|---|---|
| **Recruit** | Create/add a new Ally |
| **Brief** | Give an Ally context for a Mission |
| **Deploy** | Start a Mission or Operation |
| **Debrief** | Reflect and review |
| **Mission Accomplished** | Completion |

---

## API vs UI Naming

- **UI** always uses Cohortix terms (Ally, Mission, Task, etc.)
- **API** may use technical equivalents internally (agent_id, etc.) but public-facing API should prefer Cohortix terms
- **Database** should align with Cohortix terms where practical

---

## Terminology Correction Protocol

All agents MUST use these terms consistently. If a human (including Ahmad) uses incorrect terminology, gently correct them. Example:

> Ahmad: "Can you create a new task for the agent?"
> Correct response: "I'll brief the Ally on a new Mission!" (naturally rephrase)

---

## Migration from Old Terms

| Old Term (DDR-002 v1) | New Term | Notes |
|---|---|---|
| Goal (as workflow) | Mission | "Goal" was previously used for what is now "Mission" |
| Mission (as task) | Operation | "Mission" previously meant atomic task, now means measurable outcome |
| — | Domain | NEW — top of pyramid |
| — | Vision | NEW — emotional north star |
| — | Rhythm | NEW — recurring habits |
| — | Task | Replaces old "Mission" as atomic work unit |
| — | Intelligence | NEW — knowledge system |
| — | Insight | NEW — learning captures |
| — | Debrief | NEW — review cadences |

⚠️ **Breaking change:** "Mission" shifted meaning from "atomic task" to "measurable outcome" (PPV Goal-level). "Task" now means atomic work. All code, UI copy, and docs must reflect this.

---

*Last updated: 2026-02-12*
*Approved by: Ahmad Ashfaq*
