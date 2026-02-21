# Cohortix Documentation

> This README defines the folder hierarchy for all project documentation.
> Every file should live in its proper folder — no loose files at the root.

## Folder Structure

| Folder | Purpose | What goes here |
|--------|---------|----------------|
| `specs/` | Feature specifications | PRDs, API designs, database schemas, UI specs, feature implementation specs |
| `research/` | Research & exploration | Technology evaluations, feasibility studies, pricing/market research, stack analysis |
| `security/` | Security documentation | OWASP audits, CI/CD security gates, security architecture |
| `architecture/` | Architecture decisions | ADRs, tech stack docs, system integration patterns, observability |
| `plans/` | Execution plans & roadmaps | Migration runbooks, rollout plans, checklists, environment plans |
| `guides/` | Developer guides & setup | Quick-start, local/staging/production setup, workflows, terminology, folder structure |
| `sprints/` | Sprint planning & tracking | Sprint specs, backlogs, task assignments, stabilization plans |
| `test-plans/` | QA test plans | Test strategies per feature area |
| `decisions/` | Design decision records | DDRs for UI/UX and product decisions |
| `design/` | Design assets & references | Screenshots, mockups, brand guidelines |
| `archive/` | Completed/historical docs | Organized into subfolders (see below) |

### Archive Subfolders

| Subfolder | What goes here |
|-----------|----------------|
| `archive/audits/` | Completed security audits, code audits, QA checklists, tech debt logs |
| `archive/build-logs/` | Build reports, implementation summaries, task completion logs |
| `archive/migration-reports/` | Database migrations, schema changes, seed data, RLS implementations |
| `archive/sprint-reports/` | Sprint QA reports, sprint summaries, progress reviews, compliance reports |

## Root Files

Only these files live at the docs root:

- `README.md` — This file (folder conventions)
- `VISION.md` — Project vision and north star

**Everything else goes in a subfolder.**

## Conventions

### Where does my new file go?

| Creating... | Put it in... | Template |
|-------------|-------------|----------|
| Feature spec or PRD | `specs/` | `specs/TEMPLATE.md` |
| Research or evaluation | `research/` | — |
| Security audit or policy | `security/` | — |
| Architecture decision (ADR) | `architecture/` | `architecture/adr-000-template.md` |
| Migration or rollout plan | `plans/` | — |
| Developer guide or setup doc | `guides/` | — |
| Sprint plan or backlog | `sprints/` | — |
| Test plan | `test-plans/` | `test-plans/TEMPLATE.md` |
| Design decision (DDR) | `decisions/` | `decisions/ddr-000-template.md` |
| Design asset or mockup | `design/` | — |
| Completed/historical work | `archive/<subfolder>/` | — |

### Naming Conventions

- **Specs, plans, guides:** `UPPER-CASE-KEBAB.md` (e.g., `PRE-LAUNCH-CHECKLIST.md`)
- **Working docs:** `lower-case-kebab.md` (e.g., `sprint-4-spec.md`)
- **ADRs:** `adr-NNN-description.md` (e.g., `adr-001-tech-stack-selection.md`)
- **DDRs:** `DDR-NNN-description.md` (e.g., `DDR-001-color-palette-and-accessibility.md`)
- **Feature specs:** `COH-XX-description.md` (e.g., `COH-B1-COHORTS-SCHEMA-API.md`)

### When to Archive

Move a file to `archive/<subfolder>/` when:
- A sprint is completed → `archive/sprint-reports/`
- A migration is done → `archive/migration-reports/`
- An audit is finished → `archive/audits/`
- A build task is complete → `archive/build-logs/`
