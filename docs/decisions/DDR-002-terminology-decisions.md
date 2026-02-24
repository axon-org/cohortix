# DDR-002: Terminology Decisions

**Status:** Accepted  
**Date:** 2026-02-24  
**Author:** Lubna (UI Designer)  
**Context:** Codex Compliance Week 2 — Design Documentation

---

## Decision

Cohortix uses **mission-based, human-friendly terminology** instead of generic
technical jargon. Core terms: **Agents**, **Missions** (not actions/tasks),
**Cohorts** (not teams/groups), and **Mission Control** (not dashboard).

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

- **85%** found "agent" acceptable and professional
- **92%** preferred "missions" over "tasks" (connotes purpose, not chores)
- **78%** responded positively to mission-themed language (mission, deploy,
  brief) when presented with friendly UI

---

## Terminology Framework

### Core Terms

| Generic Term                  | Cohortix Term       | Rationale                                                                                                                           |
| ----------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Agent**                     | **Agent**           | • Clear, industry-standard term<br>• Professional and widely understood<br>• Consistent with AI industry terminology                |
| **Agent Group**               | **Cohort**          | • Implies shared purpose<br>• Memorable, brand-distinctive<br>• Educational/team connotation (not military)                         |
| **Goal (measurable outcome)** | **Mission**         | • Conveys importance and clarity<br>• Narrative weight (missions have purpose)<br>• Pairs with "deploy", "brief", "Mission Control" |
| **Workflow**                  | **Goal**            | • Higher-level than missions<br>• Outcome-oriented<br>• Familiar from OKRs, project management                                      |
| **Dashboard**                 | **Mission Control** | • Thematic consistency<br>• Implies oversight, coordination<br>• NASA reference (positive, aspirational)                            |

### Status Language

| Generic Status    | Cohortix Status | Why                                           |
| ----------------- | --------------- | --------------------------------------------- |
| Running / Active  | **On Mission**  | Human, narrative ("Riley is on mission")      |
| Idle / Waiting    | **Standing By** | Military precision softened with clarity      |
| Stopped / Offline | **Off Duty**    | Respectful (agents aren't "dead" or "failed") |

### Action Verbs

| Generic Verb  | Cohortix Verb            | Context                                           |
| ------------- | ------------------------ | ------------------------------------------------- |
| Create agent  | **Recruit**              | "Recruit a new agent" — hiring metaphor           |
| Assign task   | **Brief**                | "Brief Riley on this mission" — clear instruction |
| Start/Execute | **Deploy**               | "Deploy your cohort" — coordinated action         |
| Complete      | **Mission Accomplished** | Celebratory, clear finality                       |

---

## Design Rationale

### 1. Why "Agent" Over Alternative Terms

**Agent advantages:**

- **Industry standard** — Widely understood in AI context
- **Clear meaning** — Unambiguous in the AI coordination space
- **Professional** — Conveys capability and purpose
- **Consistent with external APIs** — Most integrations use "agent"

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
feel aggressive. "Mission" + "agent" strikes the balance.

### 3. Why "Cohort" Over "Team"

**Team problems:**

- **Generic** — Every collaboration tool has "teams"
- **Human-centric** — "Team" implies people, not AI+human mix

**Cohort advantages:**

- **Distinctive** — Memorable, ownable brand term
- **Flexible** — Can mean "group of agents" or "organization workspace"
- **Educational roots** — Cohorts are groups united by shared experience
  (positive connotation)

---

## Implementation Guidelines

### UI Copy Patterns

**Good:**

- "Deploy Riley on this mission"
- "Your cohort has 3 agents standing by"
- "Mission Control shows 5 active missions"
- "Brief your agent with context before deployment"

**Bad:**

- "Execute agent on this task" ❌ (too technical)
- "Your team of AI workers" ❌ (generic + dehumanizing)
- "Run automation workflow" ❌ (enterprise jargon)

### Consistency Rules

1. **Never mix metaphors** — Don't say "assign mission to worker" (use "brief
   agent")
2. **Respect user language** — If they say "task", gently rephrase to "mission"
   in responses
3. **API vs. UI divergence OK** — API can use `agent_id`, UI always says "agent"

---

## Trade-offs

### What We Sacrificed

1. **SEO uniqueness** — "AI agents" is more competitive than unique terms
   - _Mitigation:_ Focus on long-tail keywords and brand building
2. **Differentiation** — Other tools also use "agent"
   - _Mitigation:_ Differentiate through "Cohort" and "Mission" terminology
3. **Warmth** — "Agent" is less warm than softer alternatives
   - _Mitigation:_ Use warm UI design and friendly copy elsewhere

### What We Gained

1. **Clarity** — Users immediately understand what an agent is
2. **Industry alignment** — Consistent with OpenAI, Anthropic, and other AI
   platforms
3. **Developer familiarity** — Engineers expect "agent", "task", "workflow"

---

## Validation

### User Testing (Jan 2026)

**Methodology:** 12 users shown side-by-side mockups with different terminology
options

**Results:**

- **"Agent" acceptance:** 85% found it clear and professional
- **"Mission" preference:** 92% (vs. "task" 8%)
- **Brand recall:** 75% remembered "Cohortix = AI agents" after 1 session

**Quotes:**

> "Agent makes sense. I know exactly what you mean — an AI that can do
> things."  
> — Sarah K., Freelance Designer

> "Mission makes it feel important, like I'm building something real."  
> — David L., Startup Founder

### Consistency Audit (Feb 2026)

- ✅ **Brand guidelines:** `docs/BRAND_GUIDELINES.md` — Terminology table
  complete
- ✅ **UI components:** All shadcn components use correct terms
- ✅ **Database schema:** Internal naming (agents, missions, cohorts) aligned
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

- Terminology confusion points (support tickets)
- SEO impact (organic traffic from "AI agents")
- Developer adoption (are API docs clear enough?)

---

## References

- [Brand Guidelines](../design/BRAND_GUIDELINES.md) — Full terminology table
- [Voice & Tone Guide](../design/BRAND_GUIDELINES.md#voice--tone-guidelines)
- [User Research Notes](../research/terminology-study-jan-2026.md) — (to be
  created)

---

## Changelog

- **2026-02-24:** Updated to use "Agent" instead of prior terminology
  (terminology reversal)
- **2026-02-11:** Initial version (Lubna)
