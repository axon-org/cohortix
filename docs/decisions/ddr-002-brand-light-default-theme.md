# DDR-002: Brand-Light as Default Theme with Warm Indigo Primary

<!-- Purpose: Decision record for brand-light default theme and indigo brand color -->
<!-- Owner: Alim (CEO) -->
<!-- Last Reviewed: 2026-03-20 -->
<!-- Read After: docs/design/brand-identity.md -->

- **Date:** 2026-03-19
- **Status:** Accepted
- **Deciders:** Ahmad (CEO)
- **Consulted:** Lubna (UI Designer), Farhan (Graphic Designer)
- **Informed:** Sami (Frontend Developer)

## Context

Cohortix was forked from Mission Control with "Void" (dark, neon cyan) as the default theme. Ahmad's direction: the product should feel "made for everyday people" — minimal, approachable, like Trello. The current Void aesthetic is developer-targeted.

We needed to decide: what should the default theme be, and what primary color represents Cohortix?

## Decision

1. **New "brand-light" theme as default** — warm paper-like background (`hsl(40 30% 97%)`), not cold white
2. **Warm Indigo primary** (`hsl(248 50% 52%)` / `#6366F1`) — modern, trustworthy, not generic corporate blue
3. **Wordmark accent** — "Cohort" in slate dark + "ix" in indigo, reinforcing the brand color
4. **All 11 existing themes remain available** — Void stays as default dark option
5. **Users with Void saved in localStorage** continue seeing Void (no forced migration)

## Consequences

**Gains:**
- First impression is warm and approachable (matches Trello/Basecamp/Todoist feel)
- Indigo differentiates from corporate blue (Salesforce, Jira) while remaining professional
- Existing dark theme users unaffected

**Risks:**
- Light defaults may not appeal to developer-heavy early adopters
- Indigo primary needs WCAG AA verification across all surface combinations
- Status colors shifted from neon to soft — may reduce visibility in some contexts

**Follow-up actions:**
- [x] Implement brand-light theme (Phase 2A) — Sami
- [ ] WCAG contrast audit of brand-light — TBD
- [ ] Visual regression test across all 12 themes — TBD
