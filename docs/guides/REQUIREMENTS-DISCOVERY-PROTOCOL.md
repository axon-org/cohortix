# Requirements Discovery Protocol

## Cohortix — Ask Before You Build

**Version:** 1.0 (Based on Codex v1.2)  
**Status:** Mandatory  
**Compliance Level:** Required for ALL feature work  
**Last Updated:** February 11, 2026

---

## TL;DR

**NO CODE WITHOUT DISCOVERY.**

Before writing ANY implementation code for a new feature:

1. **Ask 3-5 questions** from the 5 categories below
2. **Summarize your understanding** back to the requester
3. **Create a spec** in `docs/specs/` (use template)
4. **Get approval** from requester or PM
5. **Then** start implementation

**Why?** Asking 5 questions upfront saves 2+ days of rework. The cost-benefit is
2,820% in your favor.

---

## When Discovery Is Required

### ✅ MANDATORY Discovery (Standard or Deep)

- New features (greenfield work)
- User-facing changes (UI, UX, terminology)
- Cross-system integrations
- Database schema changes
- Security/auth modifications
- Multi-tenant isolation logic

### 🟡 LIGHT Discovery (1-2 questions)

- Bug fixes with clear reproduction steps
- Following an existing pattern (e.g., "add new status like the 5 existing
  ones")
- Documentation updates
- Dependency updates

### ❌ NO Discovery Needed

- Typo fixes
- Formatting changes
- Already approved in existing spec

**When in doubt, use Standard Discovery (3-5 questions).**

---

## The 5 Question Categories

Ask at least **one question from each category** (total 3-5 questions minimum).

### Category A: Intent & Goals (ALWAYS START HERE)

**Purpose:** Understand the "why" before the "what."

**Questions to ask:**

1. What problem does this solve?
2. Who is this for? (User persona)
3. What does success look like?
4. Why now? (Priority/urgency)

**Example:**

> Agent: "Before I build the export feature, let me understand the goal. What
> problem does this solve? Who will use it? What does success look like?"

> Human: "Users need CSV exports of their analytics data. Customer support gets
> 10 requests/day for this. Success = users can download CSV in one click
> without contacting support."

---

### Category B: Scope & Boundaries

**Purpose:** Define what IS and IS NOT part of this iteration.

**Questions to ask:**

1. What is IN scope for this iteration?
2. What is explicitly OUT of scope?
3. Are there existing solutions or patterns we should follow/avoid?
4. What is the MVP vs. the full vision?

**Example:**

> Agent: "Should this handle pagination, or start with returning all results?
> Are we building for 100 users or 100,000 users right now? Is there an existing
> API pattern I should follow?"

> Human: "Start simple. Return all results for now. We have 200 active users,
> expecting 500 by end of quarter. Follow the pattern in `users_controller.rb`
> for consistency."

---

### Category C: Technical Constraints

**Purpose:** Understand implementation boundaries.

**Questions to ask:**

1. Any specific tech requirements or restrictions?
2. What systems does this integrate with?
3. Any performance or scale requirements?
4. Data sensitivity or compliance concerns?

**Example:**

> Agent: "Are there technical constraints? Does this need to integrate with our
> existing auth system? Any performance requirements? Is this handling sensitive
> data?"

> Human: "Must use our JWT auth middleware. Should respond in <500ms at p95. No
> PII involved, just aggregate analytics. Follow our standard Postgres
> connection pooling pattern."

---

### Category D: Edge Cases & Error Scenarios

**Purpose:** Understand failure modes.

**Questions to ask:**

1. What happens when X fails?
2. What are the edge cases you're worried about?
3. How should errors be communicated to users?
4. Any known gotchas from past attempts?

**Example:**

> Agent: "What should happen if the export takes longer than expected? What if a
> user tries to export while another export is in progress? How should errors be
> shown?"

> Human: "Show progress indicator if >2 seconds. Only one export at a time per
> user. If it fails, show user-friendly message and log the actual error for
> debugging."

---

### Category E: Acceptance Criteria

**Purpose:** Define "done."

**Questions to ask:**

1. How will we know this is done?
2. What does "good enough" look like vs. perfect?
3. Who needs to approve or review this?
4. Any deadline or timeline constraints?

**Example:**

> Agent: "How will we know this feature is complete? What is the minimum quality
> bar? Who needs to review this before it ships? Is there a deadline?"

> Human: "Done when users can download CSV from analytics page, unit tests pass,
> and you've tested with real data. Good enough = works for typical use case.
> Needs code review from backend team lead. Soft deadline is end of this
> sprint."

---

## Discovery Conversation Flow

**Step 1:** Agent receives task

**Step 2:** Agent categorizes task type (Standard, Light, or skip discovery)

**Step 3:** Agent asks Phase 1 questions (Intent & Goals — ALWAYS START HERE)

**Step 4:** Based on answers, agent asks targeted follow-ups from relevant
categories

**Step 5:** Agent summarizes understanding back to human

> "Here's what I understand: [summary]. Correct?"

**Step 6:** Human confirms or corrects

**Step 7:** Agent produces spec draft (`docs/specs/NNN-feature-name.md`)

**Step 8:** Human approves spec → implementation begins

**Step 9:** NO CODE BEFORE STEP 8

---

## Task-Specific Question Sets

### New API Endpoint

- What data does this endpoint return/accept?
- Who will consume this API?
- What is expected request volume?
- Should this follow REST conventions or existing API patterns?
- What authentication/authorization applies?

### New UI Component/Page

- Who is the user?
- What user task does this support?
- What devices/screen sizes must this support?
- Are there accessibility requirements?
- Is there an existing design or Figma mockup?
- What happens when data is loading or empty?

### Integration with External Service

- What is the third-party service?
- What data are we sending/receiving?
- How do we handle rate limits, timeouts, or outages?
- Is there a sandbox or test environment?
- What are the security implications?
- Do we need retry logic or circuit breakers?

### Bug Fix (LIGHT DISCOVERY)

- What are the exact reproduction steps?
- What is expected vs. actual behavior?
- Is this affecting production users right now?
- Are there error logs or stack traces?
- What is the blast radius?

### Refactoring

- Why refactor this now?
- What is the scope?
- Must behavior stay exactly the same or can we improve it?
- What is the testing strategy to prevent regressions?
- Are there performance or maintainability goals?

---

## Anti-Patterns to Avoid

### ❌ The "Silent Builder"

**Behavior:** Agent receives "Build a dashboard," says "On it!", and generates
500 lines of code.  
**Outcome:** Dashboard shows wrong data, uses wrong chart library, ignores
user's actual need.  
**Fix:** Always ask "Who is this for?" and "What problem does it solve?" before
writing code.

### ❌ The "Interrogator"

**Behavior:** Agent asks 15 questions in a single turn, covering every
theoretical edge case.  
**Outcome:** Human gets overwhelmed and says "Just figure it out."  
**Fix:** Batch questions (max 3-4 per turn). Start high-level (Goals), then
drill down (Tech/Edge cases).

### ❌ The "Lazy Reader"

**Behavior:** Agent asks "What database are we using?" when it's in the
README.  
**Outcome:** Wastes human time.  
**Fix:** Read the codebase first (README, CLAUDE.md, existing code). Only ask
about _decisions_ or _intent_, not facts already documented.

### ❌ The "Yes-Man"

**Behavior:** Human says "Make it fast." Agent says "Okay."  
**Outcome:** "Fast" meant <100ms API response; Agent optimized for React render
speed.  
**Fix:** Clarify subjective terms. "By 'fast', do you mean UI responsiveness or
API latency? Do we have a specific target in milliseconds?"

### ❌ The "Silent Misunderstanding"

**Behavior:** Agent asks questions, gets answers, immediately starts coding.  
**Outcome:** Agent misinterpreted an answer but human doesn't know until code is
shipped.  
**Fix:** **Always summarize back.** "Based on your answers, here's my plan..."
This is the cheapest safety net.

---

## Integration with Spec-Driven Development

Discovery answers populate the Feature Spec:

| Discovery Category        | Maps to Spec Section                                       |
| ------------------------- | ---------------------------------------------------------- |
| **Intent & Goals**        | **1. Overview & Problem Statement**                        |
| **Scope & Boundaries**    | **2. Requirements (Functional)**                           |
| **Technical Constraints** | **2. Requirements (Non-Functional)** + **3. Architecture** |
| **Edge Cases & Errors**   | **3. Architecture / Error Handling**                       |
| **Acceptance Criteria**   | **4. Acceptance Criteria** + **Testing**                   |

---

## Enforcement

**Starting Week 2 (Feb 18, 2026):**

- All PRs for new features MUST link to an approved spec
- All specs MUST show evidence of discovery (questions asked + answers received)
- PRs without discovery evidence will be rejected

**PM will review:**

- % of PRs following Requirements Discovery Protocol
- Quality of discovery (depth of questions)
- Rework rate (features rebuilt due to unclear requirements)

---

## Examples of Good Discovery

### Example 1: Export Feature

**Agent asks:**

> "Before I implement the export feature, let me understand:
>
> 1. What problem does this solve?
> 2. Who will use this?
> 3. What format(s) should we support (CSV, JSON, Excel)?
> 4. Are there performance constraints (e.g., max file size)?
> 5. How should we handle large exports (>10k rows)?"

**Human answers:**

> "Users need to download their analytics data for offline analysis. Primary
> users are power users analyzing 100-1000 rows in Excel. Start with CSV only.
> Max 10k rows for MVP (99% of users are <1k rows). For large exports, show
> 'processing' message and email download link when ready."

**Agent summarizes:**

> "Got it! I'll build:
>
> - CSV export button on analytics page
> - Sync download for <1k rows (instant)
> - Async job + email for 1k-10k rows
> - Error message for >10k rows ('contact support')
>
> Correct?"

**Human:** "Perfect. Go ahead."

---

### Example 2: New Dashboard Widget

**Agent asks:**

> "For the 'Active Agents' widget:
>
> 1. What defines 'active'? (Last seen <24h? Currently working on action?)
> 2. Should this update in real-time or on page refresh?
> 3. What should happen if zero agents are active?
> 4. Any specific design or can I follow existing widget pattern?"

**Human answers:**

> "Active = currently assigned to in-progress action. Real-time updates
> (Supabase Realtime). Show '0 active agents' message if none. Follow existing
> 'Active Missions' widget pattern (same card style, sparkline chart)."

**Agent summarizes:**

> "Understood. Active Agents widget shows:
>
> - Count of agents assigned to in-progress actions
> - Real-time updates via Supabase Realtime
> - Sparkline showing last 7 days trend
> - '0 active agents' message if none
> - Matches existing widget design
>
> I'll create spec at `docs/specs/012-active-agents-widget.md`. Correct?"

**Human:** "Yes, proceed with spec."

---

## Quick Reference Card

**Print this and keep it visible:**

```
┌─────────────────────────────────────────────────────────┐
│         REQUIREMENTS DISCOVERY PROTOCOL                 │
│              (Codex v1.2 Compliant)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ⚠️  NO CODE WITHOUT DISCOVERY                          │
│                                                         │
│  Before implementing ANY new feature:                   │
│                                                         │
│  1. Ask 3-5 questions from 5 categories:                │
│     ✓ Intent & Goals                                    │
│     ✓ Scope & Boundaries                                │
│     ✓ Technical Constraints                             │
│     ✓ Edge Cases & Errors                               │
│     ✓ Acceptance Criteria                               │
│                                                         │
│  2. Summarize your understanding                        │
│                                                         │
│  3. Create spec (docs/specs/NNN-name.md)                │
│                                                         │
│  4. Get approval                                        │
│                                                         │
│  5. THEN start implementation                           │
│                                                         │
│  Why? 5 minutes of questions saves 2+ days of rework.  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## References

- **Full Codex:** `~/clawd/research/devprotocol-v1/THE-AXON-CODEX-v1.2.md`
- **Spec Template:** `~/Projects/cohortix/docs/specs/TEMPLATE.md`
- **AGENTS.md:** `~/Projects/cohortix/AGENTS.md` (contains this as mandatory
  workflow)

---

_This protocol is mandatory for all AI agents working on Cohortix. Compliance
enforced starting Week 2 (Feb 18, 2026)._
