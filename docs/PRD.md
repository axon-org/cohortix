# Product Requirements Document (PRD): Cohortix

**Version:** 2.0 — PPV Pro Aligned
**Status:** Draft / Ready for Review  
**Date:** 2026-02-12 (Updated from 2026-02-05)
**Owner:** August (Mission Manager)  
**Stakeholders:** Ahmad (CEO), Idris (Architect), Alim (CEO Proxy)

---

## 1. Executive Summary
Cohortix is an **Allies-as-a-Service (AaaS)** platform designed to bridge the gap between human strategic direction and autonomous AI execution. While existing productivity tools (ClickUp, Linear, Notion) focus on human-to-human collaboration, Cohortix is built from the ground up to enable humans and AI allies to work together using a **unified PPV Pro-aligned productivity system**. The platform provides a central interface called **Mission Control** for managing Domains, Visions, Missions, Operations, and Tasks, with automated Intelligence capture and review Debriefs — eventually evolving into a multi-tenant SaaS for external organizations.

**Revolutionary concept:** Humans and allies use the SAME productivity hierarchy (Domain → Vision → Mission → Operation/Rhythm → Task).

---

## 2. Product Vision & Goals
### Vision
To create the world's first true "Agentic Operating System" where humans and AI allies collaborate as equals within a proven productivity framework (PPV Pro).

### Strategic Goals
- **Unified Visibility:** Provide a single source of truth for all human and ally activities via Mission Control.
- **Autonomous Execution:** Enable allies to break down Missions into Operations and Tasks without human hand-holding.
- **Equal Partnership:** Allies can have their own Domains, Visions, and Missions — not just execute human work.
- **Knowledge Persistence:** Automatically capture Insights and organize into Intelligence topics during work.
- **Multi-Tenant Scalability:** Build a foundation that supports multiple organizations (HQs), each with their own isolated ally workforce (cohort).
- **Platform Independence:** Transition from a Clawdbot-dependent UI to a standalone ally runtime environment.

---

## 3. User Personas
### 3.1 Human Users
*   **Ahmad (The Visionary/CEO):** Sets high-level Visions and Missions, monitors organizational health via Debriefs, provides strategic feedback.
*   **Organizational Admin:** Manages user access, multi-tenant settings (HQs), and ally provisioning (recruiting).
*   **External Clients (Future):** View-only or restricted access to track progress on their specific Missions.

### 3.2 AI Allies (Digital Teammates)
*   **Mission Manager Allies:** Receive Missions from humans, break them into Operations and Tasks, coordinate specialist allies.
*   **Specialist Allies (Dev, Design, Research):** Execute specific Tasks, report progress, contribute Insights to Intelligence.
*   **Autonomous Allies (Future):** Set their own Visions and Missions based on observations, propose work to humans.

### 3.3 System Entities
*   **The Orchestrator:** The backend logic that handles state transitions, dependency checking, and ally-to-ally communication.

---

## 4. Feature Specifications

### 4.1 Multi-Tenant Core & RBAC
- **Identity Isolation:** Users and data must be strictly scoped to a `TenantID` (HQ).
- **Role-Based Access Control (RBAC):**
    - `Owner`: Full access to billing, users, and all data.
    - `Manager`: Can create Missions, Operations, and manage allies.
    - `Contributor (Ally)`: Can update Tasks, add Insights, and view assigned Missions.
    - `Viewer`: Read-only access to specific Missions.
- **Invite System:** Admin-driven manual invite links for early-stage control.

### 4.2 Ally Directory & Management
- **Ally Profiles:** Visual cards containing:
  - Name, role, avatar
  - Status (Standing By / On Mission / Off Duty)
  - **Domains** (expertise areas, e.g., "Frontend Development", "Content Strategy")
  - **Active Visions** (long-term aspirations)
  - **Active Missions** (current measurable outcomes)
  - Expertise Badges (specific skills: "React", "Python", "Figma")
- **Workload Meter:** Real-time visualization of an ally's current Task load and efficiency.
- **Ally Identity System:** Unique IDs for allies across the platform to track history and performance even if renamed.
- **Ally PPV Stack:** Each ally has their own full productivity system:
  - Domains (what they specialize in)
  - Visions (what they aspire to become)
  - Missions (what they're achieving)
  - Operations (bounded projects they're executing)
  - Rhythms (recurring habits they maintain)
  - Tasks (atomic work units they complete)

### 4.3 The Alignment Zone (Productivity Hierarchy)

**Core hierarchy:** Domain → Vision → Mission → Operation / Rhythm → Task

#### 4.3.1 Domains
- **Definition:** Core life/expertise areas that define identity
- **Examples:**
  - Human: "Family", "Health", "Business", "Learning"
  - Ally: "Content Strategy", "Full-Stack Development", "Analytics"
- **Features:**
  - Create/edit/archive Domains
  - Assign Domains to users and allies
  - Domain-based filtering in Mission Control
  - Domain health metrics (activity level, Mission completion rate)
- **UI:**
  - Domain cards with icon, color, description
  - "Add Domain" flow with templates
  - Domain selector in Mission/Operation/Rhythm creation

#### 4.3.2 Visions
- **Definition:** Big emotional north stars — the WHY behind everything
- **Examples:**
  - Human: "Achieve financial freedom", "Build a $10M company"
  - Ally: "Become the best content strategist", "Master full-stack patterns"
- **Features:**
  - Create/edit Visions linked to Domains
  - Track Missions that serve each Vision
  - Vision dashboard showing progress toward aspirational goals
  - Vision health: Are you working on it? (activity indicator)
- **UI:**
  - Inspirational vision cards with imagery
  - "Why This Matters" description field
  - Vision → Mission connection visualization

#### 4.3.3 Missions
- **Definition:** Measurable outcomes that serve a Vision (replaces "Goal" from v1)
- **Examples:**
  - Human: "Grow Filmzya to $50k MRR", "Launch Cohortix MVP"
  - Ally: "Master Next.js 15 patterns", "Complete 50 content audits"
- **Features:**
  - Create Missions linked to Visions and Domains
  - Success criteria and measurable outcomes
  - Timeline and milestones
  - Mission status: Planning, Active, Blocked, Accomplished
  - Mission health meter (on track / at risk / blocked)
  - Automatic breakdown into Operations and Tasks
- **UI:**
  - Mission cards with progress indicators
  - Mission detail view with Operations/Tasks breakdown
  - Mission timeline (Gantt-style visualization)

#### 4.3.4 Operations
- **Definition:** Bounded initiatives with start/end that achieve a Mission (replaces "Project" from v1)
- **Examples:**
  - Human: "Build welcome email sequence", "Launch marketing campaign"
  - Ally: "Research 50 competitor channels", "Build auth system"
- **Features:**
  - Create Operations linked to Missions
  - Start/end dates, milestones
  - Task breakdown and assignment
  - Operation status: Todo, In Progress, Review, Done
  - Dependencies (Operation B cannot start until Operation A is Done)
- **UI:**
  - Operation cards in Kanban board
  - Operation detail with task list
  - Dependency visualization

#### 4.3.5 Rhythms
- **Definition:** Recurring habits with no end date that sustain a Mission (new feature)
- **Examples:**
  - Human: "Weekly business review", "Daily standup"
  - Ally: "Daily learning cycle", "Weekly skill assessment"
- **Features:**
  - Create Rhythms linked to Missions
  - Recurrence patterns (daily, weekly, monthly)
  - Consistency tracking (streak counter)
  - Rhythm status: Active, Paused, Skipped
  - Task templates for each occurrence
- **UI:**
  - Rhythm cards with consistency indicators
  - Calendar view for scheduled occurrences
  - "Complete today's Rhythm" quick actions

#### 4.3.6 Tasks
- **Definition:** Atomic unit of work within an Operation or Rhythm (replaces "Mission" from v1)
- **Examples:**
  - "Draft email copy", "Implement login form", "Summarize article"
- **Features:**
  - Create Tasks within Operations or Rhythms
  - Rich text descriptions, attachments
  - Task status: Todo, In Progress, Review, Done
  - Assignment to humans or allies
  - Time estimates and tracking
  - Checklist support (sub-tasks)
- **UI:**
  - Task cards in Kanban or list view
  - Quick task creation (inline add)
  - Drag-and-drop between statuses

### 4.4 Views (Mission Control)

Mission Control is the central dashboard for all work visibility.

- **Dashboard View:** High-level overview
  - Active Missions across all Domains
  - Operations in progress
  - Today's Rhythms (consistency check)
  - Recent Insights added to Intelligence
  - Ally status overview (On Mission / Standing By / Off Duty)
  
- **Kanban Board:** Primary view for Operation and Task management
  - Columns: Todo, In Progress, Review, Done
  - Swimlanes by Domain or Ally
  - Drag-and-drop for status changes
  
- **List View:** High-density table for bulk management
  - Filtering by Domain, Vision, Mission, Ally, Status
  - Sorting by priority, due date, creation date
  - Bulk actions (assign, change status, archive)
  
- **Timeline (Gantt):** Visualizing Mission and Operation schedules
  - Mission swimlanes with Operations
  - Dependency chains
  - Milestone markers
  - Today indicator

- **Domains View:** Domain-centric organization
  - All Visions, Missions, Operations within each Domain
  - Domain health metrics
  
- **Visions View:** Vision-centric progress tracking
  - All Missions serving each Vision
  - Progress toward aspirational goals

- **Rhythms View:** Habit tracking and consistency
  - Calendar view of Rhythm occurrences
  - Streak tracking
  - "Complete today's Rhythms" checklist

### 4.5 The Knowledge Zone (Intelligence & Insights)

#### 4.5.1 Automated Insight Capture
- **Insight Definition:** Individual learning capture (article, note, video, discovery)
- **Automatic Capture:** Every time an ally completes a Task, Operation, or Rhythm occurrence, it can add an Insight
- **Manual Capture:** Humans and allies can manually add Insights anytime
- **Insight Fields:**
  - Title, description (Markdown)
  - Source (Task/Operation/Mission that generated it)
  - Related Intelligence topics (tags)
  - Ally/human attribution
  - Timestamp
  - Helpful/unhelpful feedback

#### 4.5.2 Intelligence Organization
- **Intelligence Definition:** Knowledge organized by topic — accumulated organizational wisdom
- **Automatic Rollup:** Insights automatically tagged and organized into Intelligence topics
- **Intelligence Topics:** Semantic categories (e.g., "React Patterns", "Marketing Strategies", "Client X Brand Guidelines")
- **Intelligence Features:**
  - Semantic search (natural language queries)
  - Topic browsing and filtering
  - Related topics and concept linking
  - Intelligence health: freshness, usage, relevance

#### 4.5.3 Semantic Search
- **Natural Language Queries:** "What did we learn about Vercel deployment issues?"
- **Context-Aware Results:** Prioritize recent, relevant, highly-rated Insights
- **Source Linking:** Every Insight links back to the original Task/Operation/Mission/Ally
- **Cross-HQ Isolation:** Intelligence is strictly scoped to HQ (multi-tenant safe)

#### 4.5.4 Intelligence Linking
- **Bidirectional Links:** Insights link to Intelligence topics, topics link back to Insights
- **Mission Context:** Missions can reference relevant Intelligence
- **Ally Learning:** Allies can "study" Intelligence topics to improve expertise

### 4.6 The Rhythm Zone (Debriefs & Reviews)

Structured reflection and review cadences aligned with PPV Pro.

#### 4.6.1 Daily Debrief
- **When:** End of day (user-configurable time)
- **Duration:** ~15 minutes
- **Prompts:**
  - What did I accomplish today?
  - What did I learn? (auto-suggest Insights to capture)
  - What's blocking me?
  - What's the priority for tomorrow?
- **Features:**
  - Automatic completion summary (Tasks done, Operations progressed)
  - Insight capture flow
  - Tomorrow's Task planning
  - Streak tracking (consecutive days completed)

#### 4.6.2 Weekly Debrief
- **When:** End of week (e.g., Sunday evening)
- **Duration:** ~1 hour
- **Prompts:**
  - What Missions progressed this week?
  - What Operations were completed?
  - What Rhythms did I maintain? (consistency check)
  - What Intelligence did I add?
  - What do I need to adjust next week?
- **Features:**
  - Week summary dashboard (metrics, charts)
  - Mission health review (on track / at risk)
  - Rhythm consistency report
  - Next week's priorities

#### 4.6.3 Cycle Debrief
- **When:** Bi-monthly (every 2 months)
- **Duration:** ~2-3 hours
- **Prompts:**
  - Are my Visions still aligned with my Domains?
  - Which Missions should I prioritize?
  - Which Operations are stalled? (archive or reactivate)
  - What Intelligence themes emerged?
  - What Rhythms should I start/stop?
- **Features:**
  - Strategic review dashboard
  - Vision alignment check
  - Mission portfolio review
  - Domain health analysis
  - Ally performance review

### 4.7 Communications & Notifications
- **Threaded Comments:** Discussions on Tasks, Operations, Missions with support for Markdown and code blocks.
- **@Mentions:** Ability to tag allies or humans to trigger notifications.
- **Activity Feed:** Real-time stream of updates (Task completed, Insight added, Mission status changed).
- **Clawdbot Integration:** Syncing notifications to external channels (Telegram/Slack).
- **Notification Settings:** Per-user preferences for notification frequency and channels.

### 4.8 Bidirectional Mission Setting

Allies can propose Missions, not just execute them.

- **Ally-Proposed Missions:** Allies can propose Missions based on observations:
  - Example: "Test coverage dropped below 70% — proposing Mission to improve testing"
  - Example: "Performance regression detected — proposing optimization Mission"
  - Example: "Documentation gaps identified — proposing documentation Mission"
- **Approval Workflow:** Human approval/rejection/modification of ally-proposed Missions
  - Pending state until human review
  - Comment thread for discussion
  - Ability to modify scope/priority before approval
- **Mission Source Tracking:** Every Mission tagged as `human-initiated` or `ally-initiated`
- **Ally Justification:** Allies must provide rationale and evidence for proposals
- **Proactivity Metrics:** Track % of Missions proposed by allies vs. humans

### 4.9 Living Knowledge Base

Intelligence grows continuously, not just on Task completion.

- **Continuous Knowledge Building:** Allies actively build knowledge during work
  - Real-time Insight capture during Operations
  - Ability to update/refine existing Insights
  - Knowledge deprecation when outdated (mark as obsolete)
- **Knowledge Graph:** Relationships between concepts
  - Concepts linked by type (depends-on, related-to, contradicts, supersedes)
  - Visual graph exploration (future v2.0)
  - Bi-directional relationships
- **Knowledge Evolution:** Insight entries have versions
  - Track changes over time
  - See who updated what and when
  - Rollback to previous versions
- **Cross-Ally Learning:** One ally's Intelligence benefits others
  - Shared Intelligence pool per HQ
  - Ally attribution for contributions
  - Knowledge relevance scoring based on usage
- **Smart Knowledge Suggestions:** System suggests relevant Intelligence during Operations
  - Context-aware recommendations
  - "Other allies found this useful" patterns

### 4.10 Ally Evolution System

Allies grow expertise over time through structured learning.

- **Learning Materials:** Allies consume structured training content
  - Course ingestion (markdown, video, documentation)
  - Book/article processing
  - Internal best practices documentation
- **Daily Evolution Sessions:** Scheduled learning + reflection
  - Morning learning block (30 min) — can be a Rhythm
  - Evening reflection (15 min) — Daily Debrief
  - Weekly deep-dive sessions — Weekly Debrief
- **Expertise Growth Tracking:** Measurable skill improvement
  - Skill matrix per ally (0-100 proficiency)
  - Expertise domains (frontend, backend, DevOps, etc.)
  - Historical growth charts
  - Competency milestones
- **Learning Paths:** Structured progression for allies
  - Beginner → Intermediate → Expert tracks
  - Prerequisites and dependencies
  - Recommended next courses
- **Self-Improvement Protocols:** Allies identify gaps
  - Performance analysis triggers learning
  - "I struggled with X, seeking training" behavior
  - Human can assign specific learning objectives
- **Learning as Rhythms:** Allies can have "Daily Learning" Rhythms
  - Consistent 30-min learning blocks
  - Streak tracking
  - Integration with Daily Debrief

### 4.11 Client Management & Scoped Knowledge
- **Client Entity:** Organizations can manage multiple clients
  - Client profiles with industry, contact info, metadata
  - Client-specific Missions, Operations, and Tasks
  - Client assignment to allies (allies work on specific client accounts)
  - Segregated Intelligence per client
- **Scoped Knowledge Base Architecture:** Three-tier knowledge scoping
  - **Company-level Intelligence:** Available to all allies (e.g., "How we deploy apps")
  - **Client-level Intelligence:** Only for allies assigned to that client (e.g., "Client X's brand guidelines")
  - **Mission-level Intelligence:** Specific to a Mission within a client (e.g., "Mission Y's API structure")
  - RLS policies ensure allies only access Intelligence for clients they're assigned to
- **Knowledge Retrieval with Scope Resolution:** Smart scope hierarchy
  - Ally searches Intelligence → System checks Mission → Client → Company layers
  - Most specific Intelligence surfaced first
  - Prevents knowledge leakage between clients
- **Memory Decay System (Schema Support in Phase 1, Active in Phase 2):**
  - **Relevance Scoring:** Insight entries have `relevance_score` (0.0-1.0, default 1.0)
  - **Access Tracking:** Track `access_count`, `last_accessed_at` for usage patterns
  - **Helpfulness Signals:** `helpful_count`, `unhelpful_count` from ally feedback
  - **Decay Prevention:** `decay_disabled` boolean for evergreen Intelligence
  - **Phase 1:** Schema fields present, not actively decaying
  - **Phase 2:** Background jobs reduce relevance over time for unused Intelligence

---

## 5. User Stories

| Role | Requirement | Benefit |
| :--- | :--- | :--- |
| **Human CEO** | As Ahmad, I want to set a "Vision" in my Business Domain. | So that all my Missions align with my long-term aspirations. |
| **Human CEO** | As Ahmad, I want to create a "Mission" with measurable outcomes. | So that I can track progress toward my Visions. |
| **Human CEO** | As Ahmad, I want to see a "Health Meter" for each Mission. | So that I can instantly identify which Missions are blocked or at risk. |
| **AI Ally** | As a PM Ally, I want to break down a Mission into Operations and Tasks. | So that I can coordinate specialist allies effectively. |
| **AI Ally** | As an Ally, I want to have my own Domains and Visions. | So that I can grow as a specialist and propose relevant work. |
| **AI Ally** | As an Ally, I want to propose Missions based on my observations. | So that I can proactively suggest improvements (e.g., "test coverage dropped, proposing Mission to fix it"). |
| **Human CEO** | As Ahmad, I want to approve/reject/modify ally-proposed Missions. | So that I maintain strategic control while benefiting from ally insights. |
| **Admin** | As an Admin, I want to invite a new HQ (organization). | So that we can begin scaling the platform as a SaaS. |
| **Human User** | As a user, I want to search the Intelligence with semantic understanding. | So that I can leverage past ally findings with context and relationships. |
| **AI Ally** | As an Ally, I want to build and refine Intelligence continuously. | So that my expertise grows over time, not just on Task completion. |
| **AI Ally** | As an Ally, I want to maintain a "Daily Learning" Rhythm. | So that I systematically improve my capabilities. |
| **Human CEO** | As Ahmad, I want to track ally expertise growth over time. | So that I can see measurable ROI on ally evolution. |
| **Human User** | As a user, I want to complete a Daily Debrief. | So that I can reflect on my day and plan tomorrow. |
| **Human CEO** | As Ahmad, I want to conduct a Weekly Debrief. | So that I can review Mission health and adjust strategy. |
| **Human User** | As a user, I want to track my Rhythm consistency. | So that I can build sustainable habits (e.g., weekly reviews). |
| **Human Admin** | As an Admin, I want to create and manage client profiles. | So that I can organize work by client and maintain client-specific context. |
| **Human Manager** | As a Manager, I want to assign allies to specific clients. | So that allies only access Intelligence and Missions for clients they work on. |
| **AI Ally** | As an Ally, I want to search Intelligence scoped to my assigned clients. | So that I only see relevant Intelligence for the clients I'm working with. |
| **Human CEO** | As Ahmad, I want to ensure client data remains segregated. | So that sensitive client information never leaks between accounts. |
| **AI Ally** | As an Ally, I want Intelligence to decay over time if unused. | So that outdated information doesn't pollute my search results (Phase 2). |

---

## 6. Acceptance Criteria

### Feature: Mission-to-Operation Conversion
- Given a Mission input, the system must prompt an Ally to generate at least 3 Operations.
- The resulting Operations must be linked to the Mission ID.

### Feature: Domain-Based Organization
- Every Vision must belong to a Domain.
- Every Mission must belong to a Vision (and inherit its Domain).
- Filtering by Domain must show all child entities (Visions, Missions, Operations, Tasks).

### Feature: Rhythm Consistency Tracking
- Rhythms must track completion streaks.
- Missing a Rhythm occurrence must break the streak.
- Users can "skip" a Rhythm without breaking the streak (e.g., planned vacation).

### Feature: RBAC Isolation
- A user from HQ A must receive a 403 error if attempting to access a Mission ID belonging to HQ B via direct URL.

### Feature: Insight Capture
- A Task cannot be marked as "Done" until optional "Learnings" field is reviewed (prompt for Insight, allow skip).
- Insights must link back to source Task/Operation/Mission.

### Feature: Ally PPV Stack
- Ally profiles must display their Domains, Visions, and active Missions.
- Allies must be able to propose new Missions within their Domains.

### Feature: Debrief Flows
- Daily Debrief must show completed Tasks and prompt for Insights.
- Weekly Debrief must show Mission health and Rhythm consistency.
- Cycle Debrief must show Vision alignment and strategic review prompts.

---

## 7. Non-Functional Requirements
- **Performance:** Mission Control page load time < 1.5s; Semantic search results in < 2s.
- **Security:** Data encryption at rest and in transit (AES-256, TLS 1.3).
- **Scalability:** Architecture must support up to 1,000 concurrent allies per HQ.
- **Reliability:** 99.9% uptime for the UI and API layer.
- **Auditability:** Every change to a Task, Operation, or Mission must be logged with a timestamp and Actor ID.

---

## 8. Technical Constraints
- **Frontend:** Must use Next.js 15 for SEO, performance, and Server Components.
- **Database:** Supabase PostgreSQL with pgvector extension for embeddings and semantic search.
- **Authentication:** Supabase Auth with email + Google OAuth + magic links.
- **Realtime:** Supabase Realtime for live database subscriptions (WebSocket-based).
- **Row-Level Security:** Native PostgreSQL RLS for multi-tenant isolation.
- **Orchestration:** Initial version will interface with Clawdbot API; must be abstracted to allow for a custom runtime in v3.0.
- **Deployment:** Vercel (Frontend/API) and Supabase (Database/Auth/Realtime/Storage).

---

## 9. MVP Scope (v1.0)

| In Scope | Out of Scope |
| :--- | :--- |
| Auth & Invite System (Manual) | Public Self-Signup |
| Ally Directory (Profiles/Status/Domains/Visions) | Ally Training/Fine-tuning UI |
| **Domains & Visions** | Advanced Vision Templates |
| **Missions (replaces Goals)** | Complex Automated Missions (e.g., Zapier-style) |
| **Operations (replaces Projects) & Tasks** | Native Mobile Apps (Web only) |
| **Rhythms (recurring habits)** | Advanced Rhythm Analytics |
| Kanban Board, List View, Timeline | Calendar View (future) |
| Threaded Comments & @Mentions | Real-time Video/Voice Chat |
| **Daily/Weekly/Cycle Debriefs** | AI-Powered Debrief Recommendations |
| **Bidirectional Mission Setting (Human + Ally proposals)** | Automated Mission Approval |
| **Living Intelligence (Graph relationships)** | Visual Knowledge Graph UI (v2.0) |
| **Insight Versioning & Evolution** | Advanced Analytics/BI Dashboards |
| **Cross-Ally Intelligence Sharing** | Intelligence Marketplace |
| **Basic Ally Evolution (Learning materials ingestion)** | Third-party Integrations (GitHub/Figma) |
| **Expertise Tracking (Skill matrix)** | AI-Powered Learning Recommendations |
| **Daily Evolution Rhythms** | Advanced Learning Path Recommendations |
| **Client Management (Profiles, Assignment, RLS)** | Client-level Billing & Usage Analytics |
| **Scoped Intelligence (Company/Client/Mission layers)** | Visual Intelligence Scope Explorer |
| **Memory Decay Schema Fields (not active)** | Active Memory Decay Pipeline |
| Clawdbot Notification Sync | Real-time Collaboration Features |

---

## 10. Success Metrics

### Ally Autonomy & Proactivity
- **Ally Autonomy Rate:** % of Operations created by allies vs. humans (Target: > 80%).
- **Ally Proactivity Rate:** % of Missions proposed by allies vs. humans (Target: > 30%).
- **Mission Approval Rate:** % of ally-proposed Missions approved by humans (Target: > 60%).

### Knowledge & Learning
- **Time to Information:** Average time a human takes to find a historical Insight (Target: < 10 seconds).
- **Intelligence Reuse Rate:** % of Operations where allies reference existing Intelligence (Target: > 50%).
- **Knowledge Graph Growth:** Number of Insights + relationships added per week.
- **Ally Expertise Growth:** Average skill proficiency increase per ally per month (Target: +5 points).
- **Evolution Session Completion:** % of scheduled evolution Rhythms completed (Target: > 90%).
- **Learning ROI:** Correlation between learning hours and Task success rate.

### Productivity & Execution
- **Mission Velocity:** Average time from Mission creation to Mission completion.
- **Operation Velocity:** Average time from Operation creation to Operation completion.
- **Rhythm Consistency:** Average streak length for user and ally Rhythms (Target: > 30 days).
- **Debrief Completion Rate:** % of Daily/Weekly Debriefs completed (Target: > 80% daily, > 90% weekly).

### Client & Multi-Tenancy
- **Client Segregation Compliance:** % of Intelligence access attempts correctly scoped (Target: 100%).
- **Intelligence Scope Distribution:** Ratio of company/client/mission-level Insights.
- **Intelligence Relevance (Phase 2):** Average relevance score of accessed Intelligence (Target: > 0.7).
- **Memory Decay Efficiency (Phase 2):** % reduction in search time due to irrelevant Intelligence removal (Target: > 20%).

### Engagement
- **Daily Active Users (DAU)** and **Daily Active Allies (DAA)**.
- **Average session duration** in Mission Control.
- **Feature adoption rates** (Domains, Visions, Rhythms, Debriefs).

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Ally Hallucinations** | High | Implementation of a "Human-in-the-loop" review step for critical Operation structures. |
| **Multi-tenant Data Leak** | Critical | Strict Row-Level Security (RLS) in the database and automated security testing. |
| **API Rate Limits (LLMs)** | Medium | Implement robust queuing and caching layers for ally communications. |
| **High Latency** | Low | Optimized database indexing and edge-cached frontend. |
| **PPV Hierarchy Confusion** | Medium | First-time user onboarding with clear Domain → Vision → Mission → Operation/Rhythm → Task tutorial. |
| **Terminology Migration** | Medium | Migration guide and global find/replace scripts for "Goal" → "Mission", "Mission" → "Task/Operation". |

---

## 12. Dependencies
- **Clawdbot API:** For current ally execution and messaging.
- **OpenAI/Anthropic API:** For core intelligence and Insight summarization.
- **Vector DB Provider:** For semantic search functionality (pgvector).
- **Design System:** Needs a finalized UI kit (ClickUp-inspired) before frontend dev starts.
- **TERMINOLOGY.md:** Authoritative reference for all naming decisions.

---

## 13. Quality Gates (From NeuroEngine Audit Patterns)

*Informed by NeuroEngine senior dev audit learnings — establish quality bars early*

### Pre-Phase-2 Checklist (Before Core Development)

| Category | Requirement | Status |
|----------|-------------|--------|
| **Security** | Secrets in environment variables only (no hardcoded) | ☐ |
| **Security** | RLS-equivalent HQ isolation implemented | ☐ |
| **Security** | JWT validation via JWKS pattern ready | ☐ |
| **Architecture** | Service layer pattern established | ☐ |
| **Architecture** | Error taxonomy defined and implemented | ☐ |
| **CI/CD** | Automated tests run on every PR | ☐ |
| **CI/CD** | Type checking enforced | ☐ |
| **CI/CD** | Linting enforced | ☐ |
| **Documentation** | Root README with quick start guide | ☐ |
| **Documentation** | API documentation started | ☐ |

### Phase Completion Gates

**Phase 1 (Foundation) Verification:**
- [ ] User can sign up and sign in
- [ ] Protected routes reject unauthenticated users
- [ ] HQ context is properly scoped
- [ ] CI/CD pipeline deploys successfully

**Phase 2 (Ally Directory) Verification:**
- [ ] Ally profiles display correctly with Domains and Visions
- [ ] Ally status updates in real-time
- [ ] Multi-tenant isolation verified (User A cannot see User B's allies)
- [ ] Service layer handles all business logic (not route handlers)

**Phase 3 (Alignment Zone) Verification:**
- [ ] Domains, Visions, Missions, Operations, Rhythms, Tasks can all be created
- [ ] Hierarchy is enforced (Mission requires Vision, Operation requires Mission)
- [ ] Dependencies work (Operation B blocked until Operation A is Done)
- [ ] Audit logs capture all changes

**Phase 4 (Mission Control Views) Verification:**
- [ ] Kanban board drag-and-drop works for Operations and Tasks
- [ ] Timeline view renders Mission and Operation dependencies
- [ ] List view supports filtering by Domain, Vision, Mission, Ally, Status
- [ ] Performance: Mission Control loads in <1.5s

**Phase 5 (Intelligence) Verification:**
- [ ] Insights are created on Task completion (with skip option)
- [ ] Semantic search returns relevant Insights
- [ ] Insights link back to source Task/Operation/Mission/Ally
- [ ] Embedding strategy validated (relevant results)

**Phase 6 (Debriefs) Verification:**
- [ ] Daily Debrief prompts user for Insights and tomorrow's priorities
- [ ] Weekly Debrief shows Mission health and Rhythm consistency
- [ ] Cycle Debrief shows Vision alignment and strategic review

### Pre-Launch Quality Bar

| Metric | Target | Measurement |
|--------|--------|-------------|
| Test Coverage | >70% critical paths | Vitest coverage report |
| Type Coverage | 100% strict mode | TypeScript compiler |
| API Response P95 | <100ms | Vercel Analytics |
| Page Load (LCP) | <2.5s | Core Web Vitals |
| Error Rate | <1% | Sentry dashboard |
| Security Scan | No critical issues | GitHub Dependabot |

---

## 14. Technical Decisions

*Key architectural choices — see ARCHITECTURAL_DECISIONS.md for full rationale*

### Adopted from NeuroEngine Analysis

| Pattern | Application in Cohortix | Priority |
|---------|------------------------|----------|
| **JWKS JWT Validation** | API key validation, service auth, webhooks | Phase 1 |
| **Cursor Pagination** | All list endpoints (Missions, Allies, Activity) | Phase 2 |
| **Cost Tracking Schema** | Per-ally/Mission/Operation LLM cost attribution | Phase 2 |
| **Error Taxonomy** | Consistent API error responses | Phase 1 |
| **Service Layer** | Clean separation: Route → Service → Repository | Phase 1 |
| **Planning Methodology** | ROADMAP/STATE/MISSION files | Immediate |
| **CI/CD from Day 1** | GitHub Actions for test/lint/deploy | Phase 1 |
| **SSE Streaming** | Real-time ally activity feeds | Phase 4 |

### Adapted for Cohortix Context

| Pattern | Adaptation | Rationale |
|---------|------------|-----------|
| **Supabase RLS** | Drizzle ORM + HQ context middleware | Using Neon, not Supabase |
| **Design System Checkpoints** | Phase 2/4/6 checkpoints (not 4/5) | Different UI complexity curve |
| **GraphRAG** | pgvector only (no Neo4j) | Simpler Intelligence requirements |

### Skipped (Not Applicable)

- Marketplace/Monetization (v3.0+ scope)
- Content Ingestion Pipeline (no PDF/YouTube processing)
- Notion-like UI (ops/console aesthetic instead)

---

## 15. Terminology Migration Guide

**Breaking changes** from PRD v1.0:

| Old Term (v1.0) | New Term (v2.0) | Context |
|---|---|---|
| Goal (strategic workflow) | **Mission** | High-level measurable outcome |
| Project | **Operation** | Bounded initiative with start/end |
| Mission (atomic task) | **Task** | Atomic unit of work |
| — (didn't exist) | **Domain** | Core life/expertise area |
| — (didn't exist) | **Vision** | Big emotional north star |
| — (didn't exist) | **Rhythm** | Recurring habit |
| Knowledge Base | **Intelligence** | Organized knowledge by topic |
| Knowledge Entry | **Insight** | Individual learning capture |
| Review | **Debrief** | Reflection and review cadence |

**Code migration:**
- Database: Rename `goals` → `missions`, `missions` → `tasks` or `operations`
- API: Update endpoints `/goals` → `/missions`, `/missions` → `/tasks`
- UI: Global find/replace for all copy

---

## 16. Future Vision: Ally Marketplace (v3.0 / v4.0)

*Added: 2026-02-05 — Per Ahmad's strategic direction*

### Overview

The platform will evolve to include an **Ally Marketplace** where AI allies can be:
- **Sold** — One-time purchase of ally templates/configurations
- **Rented** — Hourly/daily/monthly ally-as-a-service
- **Mission-based hiring** — Pay-per-Mission ally execution

### Why This Matters

This transforms Cohortix from a "PM tool for your allies" into a **full Ally Economy platform**:
- Organizations can monetize their specialized allies
- Users can hire expert allies without building them
- Creates network effects and platform stickiness

### Marketplace Features (Future)

1. **Ally Listings**
   - Ally profiles with capabilities, ratings, reviews
   - Specialization tags (Development, Design, Research, etc.)
   - Performance metrics (Missions completed, success rate)
   - **Ally Domains and Visions displayed**

2. **Pricing Models**
   - Subscription (monthly access to ally)
   - Pay-per-Mission (usage-based)
   - One-time purchase (ally template/configuration)

3. **Ally Transactions**
   - Secure handoff of ally access
   - Escrow for Mission-based work
   - Revenue sharing with ally creators

4. **Quality Assurance**
   - Ally certification/verification
   - Performance guarantees
   - Dispute resolution

### Architectural Implications

This future vision requires:
- Ally portability (allies can work across HQs)
- Billing/payment infrastructure
- Ally identity that persists across HQs
- Marketplace search and discovery
- Rating/review system

### Versioning

| Version | Milestone |
|---------|-----------|
| v1.0 | Core PPV productivity platform |
| v2.0 | Ally recruitment and evolution within platform |
| v3.0 | Ally Marketplace (listings, discovery) |
| v4.0 | Full Ally Economy (payments, rentals, transactions) |

---

*This is the north star. Every architectural decision should consider: "Does this support the Ally Marketplace future?"*

---

## Changelog

- **2026-02-12:** Major PPV Pro alignment update (v2.0)
  - Added: Domain, Vision, Operation, Rhythm, Intelligence, Insight, Debrief
  - Changed: "Goal" → "Mission" (strategic outcome)
  - Changed: "Mission" → "Task" or "Operation" (atomic/bounded work)
  - Added: Dual human+agent PPV model throughout
  - Updated: All user stories, acceptance criteria, success metrics
  - Added: Terminology migration guide
- **2026-02-05:** Initial version (v1.0) — August

---

*Created by August (Mission Manager Ally)*
*PPV Pro Alignment by Lubna (UI Designer)*
