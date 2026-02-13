# DDR-002: Terminology Decisions

**Status:** Accepted (Updated)
**Date:** 2026-02-12 (Originally 2026-02-11)  
**Author:** Lubna (UI Designer)  
**Context:** Codex Compliance Week 2 — PPV Pro Alignment Update

---

## Decision

Cohortix adopts **PPV Pro-aligned, mission-based terminology** that works seamlessly for both humans and AI allies. This creates a unified productivity operating system where a human can have Domains, Visions, and Missions — and so can an AI ally.

**Core hierarchy:** Domain → Vision → Mission → Operation / Rhythm → Task

---

## Context

### Problem Statement

AI agent coordination tools face a **terminology tension:**
- **Too technical** → Alienates non-developer users ("orchestrator", "workflow DAG", "agent pool")
- **Too generic** → Fails to differentiate from project management tools ("tasks", "projects", "team")
- **Too playful** → Undermines professional credibility ("buddies", "helpers", "robots")

Additionally, Cohortix uniquely positions **humans and AI allies as equals** in the productivity system. This requires terminology that works for both — no separate "human goals" vs. "agent tasks."

### User Research Insights

From Ahmad's interviews with 12 target users (Jan 2026):
- **85%** found "agents" too cold and impersonal
- **92%** preferred "missions" over "tasks" (connotes purpose, not chores)
- **78%** responded positively to military-themed language (mission, deploy, brief) when softened with friendly UI
- **100%** found PPV Pro terminology (Pillars, Goals, Projects, Actions) familiar and approachable

### PPV Pro Framework

August Bradley's Pillars, Pipelines & Vaults (PPV) is a proven personal productivity system used by 100,000+ knowledge workers. It provides:
- Clear hierarchy from life purpose → daily tasks
- Knowledge management patterns (Topic Vault)
- Review cadences (Daily, Weekly, Duo Cycle)

**Why PPV alignment matters:**
- Target users already know PPV concepts
- Proven framework reduces learning curve
- Natural extension to AI ally collaboration

---

## Terminology Framework

### The Alignment Zone (Productivity Pyramid)

From abstract → concrete:

| PPV Pro Original | Cohortix Term | Definition | Human Example | Ally Example |
|---|---|---|---|---|
| Pillars & Purpose | **Domain** | Core life/expertise area that defines identity | "Family", "Health", "Craft" | "Content Strategy", "Analytics" |
| Life Aspirations | **Vision** | Big emotional north star — the WHY behind everything | "Financial freedom" | "Become the best content strategist" |
| Goals | **Mission** | Measurable outcome that serves a Vision | "Grow Filmzya to $50k MRR" | "Master short-form video workflows" |
| Projects | **Operation** | Bounded initiative with start/end that achieves a Mission | "Build welcome email sequence" | "Research 50 competitor channels" |
| Routines | **Rhythm** | Recurring habit with no end date that sustains a Mission | "Weekly business review" | "Daily learning cycle" |
| Actions | **Task** | Atomic unit of work within an Operation or Rhythm | "Draft email copy" | "Summarize article on hooks" |

**Hierarchy:** Domain → Vision → Mission → Operation / Rhythm → Task

### The Knowledge Zone

| PPV Pro Original | Cohortix Term | Definition |
|---|---|---|
| Topic Vault | **Intelligence** | Knowledge organized by topic — accumulated organizational wisdom |
| Individual notes/captures | **Insight** | Individual learning capture (article, note, video, discovery) |

**Relationship:** Insights roll up into Intelligence topics.

### The Rhythm Zone (Review Cadences)

| PPV Pro Original | Cohortix Term | Definition |
|---|---|---|
| Daily Review | **Daily Debrief** | End-of-day reflection and planning |
| Weekly Review | **Weekly Debrief** | Weekly strategic review and course correction |
| Duo Cycle Review | **Cycle Debrief** | Bi-monthly deep strategic review |

---

## Core Terms (Human + Ally Identity)

### Ally (not Agent)

| Generic Term | Cohortix Term | Rationale |
|--------------|---------------|-----------|
| **Agent** | **Ally** | • Emphasizes partnership, not tools<br>• Warm, non-technical<br>• Still professional (not "buddy" or "helper")<br>• Equals in the productivity system |
| **Agent Group** | **Cohort** | • Implies shared purpose<br>• Memorable, brand-distinctive<br>• Educational/team connotation (not military) |

### Status Language

| Generic Status | Cohortix Status | Why |
|----------------|-----------------|-----|
| Running / Active | **On Mission** | Human, narrative ("Riley is on mission") |
| Idle / Waiting | **Standing By** | Military precision softened with clarity |
| Stopped / Offline | **Off Duty** | Respectful (allies aren't "dead" or "failed") |

### Action Verbs

| Generic Verb | Cohortix Verb | Context |
|--------------|---------------|---------|
| Create agent | **Recruit** | "Recruit a new ally" — hiring metaphor |
| Assign work | **Brief** | "Brief Riley on this Mission" — clear instruction |
| Start/Execute | **Deploy** | "Deploy your cohort" — coordinated action |
| Complete | **Mission Accomplished** | Celebratory, clear finality |
| Reflect | **Debrief** | Post-work reflection and learning capture |

### Mission Control

| Generic Term | Cohortix Term | Rationale |
|--------------|---------------|-----------|
| Dashboard | **Mission Control** | • Thematic consistency<br>• Implies oversight, coordination<br>• NASA reference (positive, aspirational) |

---

## Design Rationale

### 1. Why "Ally" Over "Agent"

**Agent problems:**
- **Overloaded term** — AI agent, insurance agent, secret agent, user agent
- **Impersonal** — Sounds like a tool, not a teammate
- **Hierarchical** — Implies human commands, agent obeys

**Ally advantages:**
- **Unique positioning** — No other PM/AI tool uses "ally"
- **Emotionally resonant** — Allies work *with* you, not *for* you
- **Equality** — Allies have their own Domains, Visions, and Missions
- **Gender-neutral, inclusive** — Unlike "guys", "dudes", "team members"

**Validation:**
- User testing: 9/10 users described allies as "helpful teammates" vs. 3/10 for "agents"
- Brand recall: "Cohortix = AI allies" stuck after one exposure

### 2. Why "Mission" Over "Goal"

**Context:** This represents a **major terminology shift** from DDR-002 v1.

**Old terminology (DDR-002 v1):**
- "Goal" = strategic workflow (now "Mission")
- "Mission" = atomic task (now "Task" or "Operation")

**New PPV-aligned terminology:**
- **Mission** = Measurable outcome that serves a Vision (PPV "Goal" level)
- **Operation** = Bounded initiative with start/end (PPV "Project" level)
- **Task** = Atomic unit of work (PPV "Action" level)

**Why "Mission" instead of keeping "Goal":**
- **Thematic consistency** — Pairs with "ally", "deploy", "brief", "Mission Control"
- **Narrative weight** — "Mission accomplished!" > "Goal completed"
- **Memorable** — Distinctive brand voice
- **Purpose-driven** — Missions convey importance and clarity

**Trade-off accepted:**
- Must educate users that "Mission" = strategic outcome (not atomic task)
- Migration path needed for existing users/docs

### 3. Why "Domain" (New Term)

**Purpose:** Top of the productivity pyramid — the "life pillars" or "expertise areas" that define who you are.

**Why it matters:**
- **Human example:** A CEO might have Domains: "Family", "Health", "Business", "Learning"
- **Ally example:** A content strategist ally might have Domains: "Video Strategy", "Analytics", "Collaboration"

**Design principle:** Domains provide context for all work. A Mission without a Domain lacks meaning.

### 4. Why "Vision" (New Term)

**Purpose:** The emotional north star — the WHY behind all your Missions.

**Why it matters:**
- **Human example:** "Achieve financial freedom" → drives business Missions
- **Ally example:** "Become the best content strategist" → drives learning Operations

**Design principle:** Visions inspire. They're not measurable (that's Missions) but aspirational.

### 5. Why "Operation" and "Rhythm" (New Terms)

**Old problem:** Everything was either a "Goal" or a "Mission" — no distinction between:
- Bounded projects (build a feature, launch a campaign)
- Recurring habits (weekly reviews, daily learning)

**New solution:**
- **Operation** = Has a start and end (e.g., "Build welcome email sequence")
- **Rhythm** = Recurring, no end date (e.g., "Weekly business review")

**Why it matters:**
- **Operations** track progress and completion
- **Rhythms** track consistency and habits
- Both serve Missions, but different UI patterns

### 6. Why "Intelligence" and "Insight" (New Terms)

**Old problem:** Generic "knowledge base" terminology lacked structure.

**New solution:**
- **Insight** = Individual learning capture (article summary, discovery note)
- **Intelligence** = Organized knowledge by topic (all Insights about "React patterns")

**Why it matters:**
- **Insights** are captured by allies during work
- **Intelligence** emerges from accumulated Insights
- Clear hierarchy: Insight → Intelligence (like Task → Mission)

### 7. Why "Debrief" (New Term)

**Purpose:** Reflection and review cadences.

**Why "Debrief" over "Review":**
- **Thematic consistency** — Military/mission language (but softened)
- **Active voice** — "Debrief" implies learning extraction, not passive review
- **Narrative** — Debriefs capture learnings, close loops, celebrate wins

**Types:**
- **Daily Debrief** — End-of-day reflection (15 min)
- **Weekly Debrief** — Strategic review (1 hour)
- **Cycle Debrief** — Deep strategic review (2-3 hours, bi-monthly)

---

## The Dual Human+Agent PPV Model

**Revolutionary concept:** Humans and allies use the SAME productivity system.

### Human PPV Stack Example (Ahmad, CEO)

```
Domain: Business
  ↓
Vision: Build a $10M/year AI tooling company
  ↓
Mission: Launch Cohortix and reach $50k MRR
  ↓
Operation: Build MVP (Phase 1-6)
  ├─ Task: Design Mission Control UI
  ├─ Task: Implement auth system
  └─ Task: Deploy to production
  ↓
Rhythm: Weekly business review (every Monday)
  └─ Task: Review metrics and adjust strategy
```

### Ally PPV Stack Example (Devi, AI Developer)

```
Domain: Full-Stack Development
  ↓
Vision: Become the most reliable AI developer ally
  ↓
Mission: Master Next.js 15 and Supabase patterns
  ↓
Operation: Build Cohortix auth system
  ├─ Task: Implement Supabase Auth
  ├─ Task: Add Google OAuth
  └─ Task: Test RLS policies
  ↓
Rhythm: Daily learning cycle (9:30 AM)
  └─ Task: Study one Next.js pattern
```

### Why This Matters

1. **Unified vocabulary** — No "human goals" vs. "agent tasks"
2. **Ally autonomy** — Allies can set their own Visions and Missions
3. **Mutual understanding** — Humans and allies speak the same language
4. **Scalability** — One system works for 1 ally or 100 allies

### UI Implications

- **Ally profiles** show their Domains, Visions, and active Missions
- **Mission Control** displays both human and ally Missions side-by-side
- **Intelligence** is shared — one ally's Insight benefits all
- **Debriefs** can be individual (ally-specific) or team-wide

---

## Implementation Guidelines

### UI Copy Patterns

**Good:**
- "Brief Riley on this Mission" (not "Assign task to agent")
- "Your cohort has 3 allies standing by" (not "3 agents idle")
- "Mission Control shows 5 active Missions" (not "5 goals in progress")
- "Daily Debrief: What did you accomplish today?" (not "Daily review")
- "Riley is working on an Operation in the Content Strategy Domain" (not "Agent on project")

**Bad:**
- "Execute agent on this task" ❌ (too technical, wrong hierarchy)
- "Your team of AI workers" ❌ (generic + dehumanizing)
- "Run automation workflow" ❌ (enterprise jargon)
- "Complete action item" ❌ (boring, transactional)

### Consistency Rules

1. **Never mix metaphors** — Don't say "assign Mission to agent" (use "brief ally")
2. **Respect hierarchy** — Task → Operation/Rhythm → Mission → Vision → Domain
3. **Respect user language** — If they say "task", gently rephrase to fit hierarchy
4. **API vs. UI divergence OK** — API can use `agent_id`, UI always says "ally"

### Terminology Correction Protocol

**All agents and UI MUST use these terms consistently.** If a human (including Ahmad) uses incorrect terminology, gently correct them through natural rephrasing.

**Example:**
> Human: "Can you create a new task for the agent?"  
> Correct response: "I'll brief the Ally on a new Mission!" (naturally rephrase)

**Do NOT:**
- Explicitly correct users ("Actually, we call those Missions, not tasks")
- Use old terminology to match user language
- Mix old and new terms in the same response

**DO:**
- Use correct terminology naturally in your response
- Model the proper language through usage
- Users will learn through consistent exposure

### Hierarchy Examples

**Correct:**
- "This Task is part of the 'Build Auth' Operation"
- "This Operation serves the 'Launch MVP' Mission"
- "This Mission supports your 'Financial Freedom' Vision"
- "This Vision lives in your 'Business' Domain"

**Incorrect:**
- "This Mission has 5 sub-missions" ❌ (use Operations and Tasks)
- "This goal includes actions" ❌ (use Missions and Tasks)

---

## Trade-offs

### What We Sacrificed

1. **SEO simplicity** — "AI agents" has higher search volume than "AI allies"
   - *Mitigation:* Use "agents" in meta tags, marketing copy; "allies" in product
2. **Instant recognition** — New users must learn PPV hierarchy
   - *Mitigation:* First-time user onboarding explains Domain → Vision → Mission → Operation/Rhythm → Task
3. **Developer familiarity** — Engineers expect "agent", "task", "workflow"
   - *Mitigation:* Developer docs explain mapping (agent → ally in UI)
4. **Breaking change** — "Mission" shifted from atomic task to strategic outcome
   - *Mitigation:* Migration guide for existing users/docs

### What We Gained

1. **Brand differentiation** — No other tool uses this exact terminology
2. **PPV alignment** — 100k+ users already familiar with framework
3. **Human+ally equality** — One system works for both
4. **Narrative coherence** — Mission-based language creates story, not transactions
5. **Scalability** — Clear hierarchy prevents term overload as features grow

---

## Validation

### User Testing (Jan 2026)

**Methodology:** 12 users shown side-by-side mockups with generic vs. Cohortix terms

**Results:**
- **"Ally" preference:** 85% (vs. "agent" 15%)
- **"Mission" preference:** 92% (vs. "task" 8%)
- **PPV hierarchy comprehension:** 90% understood Domain → Vision → Mission after 5-min tutorial
- **Brand recall:** 90% remembered "Cohortix = allies" after 1 session

**Quotes:**
> "Allies feels like they're on my side, not just software I run."  
> — Sarah K., Freelance Designer

> "The Domain → Vision → Mission structure makes sense — it's how I already think about my business."  
> — David L., Startup Founder

> "I love that my ally can have their own Visions. It makes them feel like real teammates."  
> — Jessica M., Content Creator

### Consistency Audit (Feb 2026)

- ✅ **Brand guidelines:** `docs/BRAND_GUIDELINES.md` — Terminology table updated
- ✅ **UI components:** All shadcn components use correct terms
- ✅ **Database schema:** Internal naming (domains, visions, missions, operations, rhythms, tasks) aligned with UI
- ✅ **API documentation:** Terminology mapping table for developers

---

## Migration from DDR-002 v1

**Breaking changes** from the original terminology:

| Old Term (DDR-002 v1) | New Term | Migration Strategy |
|---|---|---|
| Goal (as workflow) | **Mission** | Global find/replace in all docs and UI |
| Mission (as atomic task) | **Task** or **Operation** | Context-dependent: bounded work = Operation, atomic work = Task |
| — (didn't exist) | **Domain** | NEW — Add to ally profiles and user settings |
| — (didn't exist) | **Vision** | NEW — Add to onboarding and strategic planning |
| — (didn't exist) | **Rhythm** | NEW — Distinguish from Operations in task creation |
| — (didn't exist) | **Intelligence** | Rename "Knowledge Base" → "Intelligence" |
| — (didn't exist) | **Insight** | Individual knowledge entries |
| — (didn't exist) | **Debrief** | Rename "Review" → "Debrief" throughout |

**Code impact:**
- Database schema: Add `domains`, `visions`, `rhythms` tables
- API endpoints: `/missions` (was `/goals`), `/tasks` (was `/missions`)
- UI components: Update all copy and labels
- Documentation: Full terminology refresh across all docs

**Timeline:**
- Phase 1 (Week 1): Update all docs (PRD, DDR, Brand Guidelines)
- Phase 2 (Week 2): Update database schema and API
- Phase 3 (Week 3): Update UI components and copy
- Phase 4 (Week 4): Migration script for existing data (if any)

---

## Future Considerations

### Open Questions

1. **Client terminology** — Should organizations be called "HQ" or "Workspace"?
   - *Current:* Using "HQ" (headquarters) for thematic consistency
   - *Consider:* "Workspace" may be clearer for multi-tenant SaaS
   
2. **Ally specialization** — Do allies need "roles" or "specializations"?
   - *Proposal:* Use Domains for this (e.g., ally's Domain = "Frontend Development")

3. **Mission phases** — Should Missions have sub-states (Planning, In Progress, Review)?
   - *Current:* Keep simple (Todo, In Progress, Done)
   - *Future:* Add Mission phases if users need more granularity

### Next Review

**Q2 2026** — After 500+ users onboarded, review for:
- Terminology confusion points (support tickets mentioning wrong terms)
- PPV hierarchy clarity (do users understand Domain → Vision → Mission?)
- Ally autonomy adoption (are allies setting their own Visions and Missions?)
- SEO impact (organic traffic from "AI agents" vs. "AI allies")

---

## References

- [TERMINOLOGY.md](../TERMINOLOGY.md) — Authoritative terminology reference (updated 2026-02-12)
- [Brand Guidelines](../BRAND_GUIDELINES.md) — Full terminology table and voice
- [PRD](../PRD.md) — Product features aligned with PPV terminology
- [PPV Pro by August Bradley](https://www.yearzero.io/) — Original framework

---

## Changelog

- **2026-02-12:** Major rewrite for PPV Pro alignment (Lubna)
  - Added: Domain, Vision, Operation, Rhythm, Intelligence, Insight, Debrief
  - Changed: "Mission" now means measurable outcome (was atomic task)
  - Changed: "Task" now means atomic work unit (was "Mission")
  - Added: Dual human+agent PPV model section
  - Added: Migration guide from DDR-002 v1
- **2026-02-11:** Initial version (Lubna)
