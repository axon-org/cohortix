##### DDR Template

**Location:** `docs/decisions/ddr-{number}-{title}.md`

```markdown
# DDR-{number}: {Title}

<!-- Purpose: [Why this doc exists] -->
<!-- Owner: @[agent-or-human] -->
<!-- Last Reviewed: YYYY-MM-DD -->
<!-- Read After: [prerequisite doc path] -->

> **Purpose:** Record a design decision and its rationale
> **Owner:** @[decision-maker]
> **Last Reviewed:** YYYY-MM-DD
> **Read After:** Design Brief or relevant spec

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Rejected | Deprecated | Superseded
**Deciders:** [Names of people/agents who made the decision]
**Consulted:** [Names of people/agents who were consulted]
**Informed:** [Names of people/agents who were informed]

---

## Context

[What is the issue motivating this decision? What factors are we considering? What constraints exist?]

## Decision

**We chose [X]**

[Describe the decision clearly and concisely. What exactly did we decide?]

## Rationale

**Because [Y]**

[Why did we make this decision? What data, user feedback, constraints, or principles led to this choice?]

## Rejected Alternatives

[List alternative approaches that were considered but not chosen, with brief explanation of why each was rejected]

**Alternative A: [Name]**
- **Pros:** [Benefits]
- **Cons:** [Drawbacks]
- **Why rejected:** [Reason]

**Alternative B: [Name]**
- **Pros:** [Benefits]
- **Cons:** [Drawbacks]
- **Why rejected:** [Reason]

## Consequences

**This means we accept:**
- [Positive consequence 1]
- [Positive consequence 2]

**Trade-offs:**
- [Negative consequence or limitation 1]
- [Negative consequence or limitation 2]

**Follow-up actions:**
- [Action item 1 with owner]
- [Action item 2 with owner]

---

## References

- [Link to user research, design files, technical docs, etc.]

---

**Status History:**
- YYYY-MM-DD: Proposed
- YYYY-MM-DD: Accepted
```

##### DDR Example: Color Palette

```markdown
# DDR-003: Blue-Focused Color Palette

**Date:** 2026-01-15  
**Status:** Accepted  
**Deciders:** Lubna (UI Designer), Ahmad (Product Lead)  
**Consulted:** Devi (AI Developer - accessibility validation)  
**Informed:** Development team

---

## Context

Cohortix needs a cohesive color palette for the design system. We conducted 3 rounds of mockups with different color schemes (purple, orange, monochrome, blue). User research was conducted with 12 target users (course creators in education and healthcare sectors).

Constraints:
- Must meet WCAG 2.2 AA accessibility standards (4.5:1 contrast ratio minimum)
- Should differentiate from major competitors (Notion=purple, Circle=warm tones)
- Target users associate certain colors with professionalism/trust

## Decision

**We chose a blue-focused color palette:**
- **Primary:** #2563EB (blue-600)
- **Secondary:** #10B981 (emerald-500)
- **Neutral:** Gray scale based on slate
- **Semantic:** Standard success/warning/error colors

## Rationale

**Because:**
1. **User Research:** 9 of 12 target users associated blue with "trust," "professional," and "calm"—key attributes for education/healthcare contexts
2. **Accessibility:** Blue provides 4.5:1+ contrast ratios across all shades (purple failed at lighter shades)
3. **Differentiation:** Blue distinguishes us from purple-heavy tools (Notion, Linear) and warm-toned tools (Circle, Mighty Networks)
4. **Versatility:** Blue works across both light and dark modes without losing brand identity
5. **Market Alignment:** Healthcare and education sectors favor blue (see: Coursera, Khan Academy, Mayo Clinic branding)

## Rejected Alternatives

**Alternative A: Purple (#8B5CF6)**
- **Pros:** Modern, aligns with Notion's success, energetic
- **Cons:** Too similar to existing tools (Notion, Linear, Discord), accessibility concerns at lighter shades
- **Why rejected:** User testing showed "too similar to Notion" feedback (7 of 12 users), failed WCAG AA at purple-300 level

**Alternative B: Orange (#F97316)**
- **Pros:** Energetic, friendly, high visibility
- **Cons:** User testing showed "too playful" for enterprise context, poor dark mode contrast
- **Why rejected:** Target users (education/healthcare) perceived orange as "informal" (10 of 12 users)

**Alternative C: Monochrome (Grays only)**
- **Pros:** Timeless, accessible, minimalist
- **Cons:** Failed to provide sufficient visual hierarchy in data-dense interfaces, lacked brand personality
- **Why rejected:** A/B testing showed 23% drop in user engagement compared to color options

## Consequences

**This means we accept:**
- All future UI components must use this palette (design tokens locked)
- No ad-hoc color additions without revisiting this DDR
- Dark mode uses same hue rotation, different lightness values
- Brand identity is now "blue-first" across marketing, product, docs

**Trade-offs:**
- We sacrifice "uniqueness" of warmer tones for trust/professionalism
- Blue may feel "corporate" to some users (acceptable per target persona)
- If we expand to children's education market, may need to revisit

**Follow-up actions:**
- [ ] Define full design token scale (50-900 for all colors) — Lubna, due Jan 20
- [ ] Update Figma design system with locked tokens — Lubna, due Jan 22
- [ ] Implement tokens in Tailwind config — Devi, due Jan 25
- [ ] Add CI/CD check to prevent hardcoded colors — Devi, due Jan 27

---

## References

- User research summary: docs/research/color-palette-testing-2026-01.md
- Figma mockups: [link to Figma file]
- Accessibility audit: docs/design/wcag-color-audit.md
- Competitor analysis: docs/research/competitor-color-analysis.md

---

**Status History:**
- 2026-01-10: Proposed (after user research)
- 2026-01-15: Accepted (team consensus)
```

##### DDR vs ADR: When to Use Which

| Scenario | Use ADR or DDR? | Example |
|----------|----------------|---------|
| Choosing database (Postgres vs Mongo) | **ADR** | Technical architecture |
| Defining API versioning strategy | **DDR** | API design pattern |
| Selecting deployment platform (Vercel vs AWS) | **ADR** | Infrastructure decision |
| Deciding navigation pattern (sidebar vs top nav) | **DDR** | UX design |
| Choosing ORM (Prisma vs Drizzle) | **ADR** | Technical tooling |
| Defining color palette | **DDR** | Visual design |
| Implementing authentication (JWT vs sessions) | **ADR** | Security architecture |
| Designing error message format | **DDR** | UX pattern |

**Rule of Thumb:** If engineers implement it without designers, it's an ADR. If designers decide it without engineers, it's a DDR. If it's collaborative, consider both or choose based on primary impact.

##### DDR Maintenance

**Status Lifecycle:**
1. **Proposed:** Draft DDR, seeking feedback
2. **Accepted:** Decision made, team aligned
3. **Rejected:** Proposal not adopted
4. **Deprecated:** Decision no longer relevant (e.g., feature removed)
5. **Superseded:** Replaced by newer DDR (link to replacement)

**When to Update:**
- Decision is reversed or modified → Create new DDR superseding old one
- New information invalidates rationale → Add addendum section
- Consequences change → Update consequences section with date

**Numbering:**
- Sequential: DDR-001, DDR-002, etc.
- Never reuse numbers (even if deprecated)
- Maintain index in `docs/decisions/README.md`

##### Integration with Development Workflow

**Before Implementation:**
1. Designer/PM drafts DDR for significant design decision
2. DDR reviewed in design sync or async via PR
3. Team discusses, may request changes
4. DDR marked "Accepted" → locked

**During Implementation:**
- Agents reference DDR when implementing related features
- Example: "Per DDR-003, using #2563EB for primary actions"

**After Implementation:**
- If implementation reveals issues with decision, update DDR with lessons learned
- Consider whether decision should be revised (new DDR superseding)

##### Enforcement Mechanisms

**Pull Request Template:**
```markdown
## Design Decisions

If this PR involves significant design choices, have you:
- [ ] Created or updated relevant DDR in `docs/decisions/`
- [ ] Linked DDR number in this PR description
- [ ] Consulted with design/product team
```

**CI/CD Check (Optional):**
```yaml
# Check for DDR reference in commits touching design files
- name: Check for DDR reference
  run: |
    if git diff --name-only HEAD~1 | grep -E "components/|styles/|design-tokens"; then
      if ! git log -1 --pretty=%B | grep -iE "ddr-[0-9]+"; then
        echo "Design files changed without DDR reference"
        echo "Please reference relevant DDR (e.g., 'Per DDR-003') or create new DDR"
        exit 1
      fi
    fi
```

---
