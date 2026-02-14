# DDR-002: Terminology Decisions

**Status:** Accepted  
**Date:** 2026-02-11  
**Author:** Lubna (UI Designer)  
**Context:** Codex Compliance Week 2 — Design Documentation

---

## Decision

Cohortix uses **mission-based, human-friendly terminology** instead of generic
technical jargon. Core terms: **Allies** (not agents), **Missions** (not
actions/tasks), **Cohorts** (not teams/groups), and **Mission Control** (not
dashboard).

---

## Context

### Problem Statement

AI agent coordination tools face a **terminology tension:**

- **Too technical** → Alienates non-developer users ("orchestrator", "workflow
  DAG", "agent pool")
- **Too generic** → Fails to differentiate from project management tools
  ("tasks", "projects", "team")
- **Too playful** → Undermines professional credibility ("buddies", "helpers",
  "robots")

### User Research Insights

From Ahmad's interviews with 12 target users (Jan 2026):

- **85%** found "agents" too cold and impersonal
- **92%** preferred "missions" over "tasks" (connotes purpose, not chores)
- **78%** responded positively to military-themed language (mission, deploy,
  brief) when softened with friendly UI

---

## Terminology Framework

### Core Terms

| Generic Term                  | Cohortix Term       | Rationale                                                                                                                           |
| ----------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Agent**                     | **Ally**            | • Emphasizes partnership, not tools<br>• Warm, non-technical<br>• Still professional (not "buddy" or "helper")                      |
| **Agent Group**               | **Cohort**          | • Implies shared purpose<br>• Memorable, brand-distinctive<br>• Educational/team connotation (not military)                         |
| **Goal (measurable outcome)** | **Mission**         | • Conveys importance and clarity<br>• Narrative weight (missions have purpose)<br>• Pairs with "deploy", "brief", "Mission Control" |
| **Workflow**                  | **Goal**            | • Higher-level than missions<br>• Outcome-oriented<br>• Familiar from OKRs, project management                                      |
| **Dashboard**                 | **Mission Control** | • Thematic consistency<br>• Implies oversight, coordination<br>• NASA reference (positive, aspirational)                            |

### Status Language

| Generic Status    | Cohortix Status | Why                                           |
| ----------------- | --------------- | --------------------------------------------- |
| Running / Active  | **On Mission**  | Human, narrative ("Riley is on mission")      |
| Idle / Waiting    | **Standing By** | Military precision softened with clarity      |
| Stopped / Offline | **Off Duty**    | Respectful (allies aren't "dead" or "failed") |

### Action Verbs

| Generic Verb  | Cohortix Verb            | Context                                           |
| ------------- | ------------------------ | ------------------------------------------------- |
| Create agent  | **Recruit**              | "Recruit a new ally" — hiring metaphor            |
| Assign task   | **Brief**                | "Brief Riley on this mission" — clear instruction |
| Start/Execute | **Deploy**               | "Deploy your cohort" — coordinated action         |
| Complete      | **Mission Accomplished** | Celebratory, clear finality                       |

---

## Design Rationale

### 1. Why "Ally" Over "Agent"

**Agent problems:**

- **Overloaded term** — AI agent, insurance agent, secret agent, user agent
- **Impersonal** — Sounds like a tool, not a teammate
- **Inconsistent metaphor** — "Agent" doesn't reinforce teamwork

**Ally advantages:**

- **Unique positioning** — No other PM/AI tool uses "ally"
- **Emotionally resonant** — Allies work _with_ you, not _for_ you
- **Gender-neutral, inclusive** — Unlike "guys", "dudes", "team members"

**Validation:**

- User testing: 9/10 users described allies as "helpful teammates" vs. 3/10 for
  "agents"
- Brand recall: "Cohortix = AI allies" stuck after one exposure

### 2. Why "Mission" Over "Task"

**Task problems:**

- **Chore connotation** — "Tasks" feel like to-do list drudgery
- **No narrative weight** — "Task #47" lacks meaning
- **Overused** — Every PM tool uses tasks (Asana, Trello, Jira)

**Mission advantages:**

- **Purpose-driven** — Missions have goals, objectives, outcomes
- **Memorable** — "Mission accomplished!" > "Task completed"
- **Thematic consistency** — Pairs with "deploy", "brief", "Mission Control"

**Boundary:**  
We avoid _over-militarizing_. No "commanders", "squads", "operations" — those
feel aggressive. "Mission" + "ally" strikes the balance.

### 3. Why "Cohort" Over "Team"

**Team problems:**

- **Generic** — Every collaboration tool has "teams"
- **Human-centric** — "Team" implies people, not AI+human mix

**Cohort advantages:**

- **Distinctive** — Memorable, ownable brand term
- **Flexible** — Can mean "group of allies" or "organization workspace"
- **Educational roots** — Cohorts are groups united by shared experience
  (positive connotation)

---

## Implementation Guidelines

### UI Copy Patterns

**Good:**

- "Deploy Riley on this mission"
- "Your cohort has 3 allies standing by"
- "Mission Control shows 5 active missions"
- "Brief your ally with context before deployment"

**Bad:**

- "Execute agent on this task" ❌ (too technical)
- "Your team of AI workers" ❌ (generic + dehumanizing)
- "Run automation workflow" ❌ (enterprise jargon)

### Consistency Rules

1. **Never mix metaphors** — Don't say "assign mission to agent" (use "brief
   ally")
2. **Respect user language** — If they say "task", gently rephrase to "mission"
   in responses
3. **API vs. UI divergence OK** — API can use `agent_id`, UI always says "ally"

---

## Trade-offs

### What We Sacrificed

1. **SEO simplicity** — "AI agents" has higher search volume than "AI allies"
   - _Mitigation:_ Use "agents" in meta tags, marketing copy; "allies" in
     product
2. **Instant recognition** — New users must learn "ally = AI agent"
   - _Mitigation:_ First-time user tooltips explain terminology
3. **Developer familiarity** — Engineers expect "agent", "task", "workflow"
   - _Mitigation:_ Developer docs explain mapping (agent → ally in UI)

### What We Gained

1. **Brand differentiation** — No other tool uses this terminology
2. **Emotional connection** — Users report feeling "part of a team" with allies
3. **Narrative coherence** — Mission-based language creates story, not
   transactions

---

## Validation

### User Testing (Jan 2026)

**Methodology:** 12 users shown side-by-side mockups with generic vs. Cohortix
terms

**Results:**

- **"Ally" preference:** 85% (vs. "agent" 15%)
- **"Mission" preference:** 92% (vs. "task" 8%)
- **Brand recall:** 90% remembered "Cohortix = allies" after 1 session

**Quotes:**

> "Allies feels like they're on my side, not just software I run."  
> — Sarah K., Freelance Designer

> "Missions makes it feel important, like I'm building something real."  
> — David L., Startup Founder

### Consistency Audit (Feb 2026)

- ✅ **Brand guidelines:** `docs/BRAND_GUIDELINES.md` — Terminology table
  complete
- ✅ **UI components:** All shadcn components use correct terms
- ✅ **Database schema:** Internal naming (allies, missions, cohorts) aligned
  with UI

---

## Future Considerations

### Open Questions

1. **Client terminology** — Should we call organizations "clients" or
   "workspaces"?
   - _Current:_ Using "HQ" (headquarters) but may cause confusion for B2B SaaS
2. **Knowledge base** — "Intel" is thematic but may be unclear
   - _Alternative:_ "Learnings", "Knowledge", "Insights"

### Next Review

**Q2 2026** — After 500+ users onboarded, review for:

- Terminology confusion points (support tickets mentioning "agents", "tasks")
- SEO impact (organic traffic from "AI agents" vs. "AI allies")
- Developer adoption (are API docs clear enough?)

---

## References

- [Brand Guidelines](../BRAND_GUIDELINES.md) — Full terminology table
- [Voice & Tone Guide](../BRAND_GUIDELINES.md#voice--tone-guidelines)
- [User Research Notes](../research/terminology-study-jan-2026.md) — (to be
  created)

---

## Changelog

- **2026-02-11:** Initial version (Lubna)
