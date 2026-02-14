# Cohortix Card & Hierarchy Recommendations
*Based on analysis of Linear, Asana, Plane, and others.*

## 1. Recommended Hierarchy
**Aligning with "Missions" terminology:**

1.  **Mission (Goal/Initiative):**
    *   *Analogue:* Linear Initiative, Asana Goal.
    *   *Purpose:* High-level objective (e.g., "Launch Q3 Marketing Campaign").
    *   *View:* Roadmap / Portfolio view.

2.  **Operation (Project/Epic):**
    *   *Analogue:* Linear Project, Shortcut Epic.
    *   *Purpose:* A deliverable unit of work with a clear end state.
    *   *Card Type:* "Op Card".

3.  **Task (Issue):**
    *   *Analogue:* Linear Issue, Plane Issue.
    *   *Purpose:* Atomic unit of work.
    *   *Card Type:* "Task Card".

## 2. Card Design Recommendations

### A. The "Op Card" (Operation/Project)
*Designed for high-level tracking and health monitoring.*

**Front of Card (List/Board View):**
*   **Header:** Operation Icon + Title.
*   **Health Indicator:** Traffic light (Green/Yellow/Red) based on AI analysis of underlying tasks.
*   **Progress:** Mini sparkline or progress bar (% tasks done).
*   **Owner:** Avatar of the "Op Lead".
*   **Target Date:** "Due in 3 days" or specific date.
*   **Mission Tag:** Pill badge linking to parent Mission.

**Back of Card (Detail View):**
*   **AI Summary:** "3 tasks blocked, 5 completed yesterday. On track." (Auto-generated daily).
*   **Docs/Specs:** Linked spec document.
*   **Team:** List of contributors.

### B. The "Task Card" (Atomic Work)
*Designed for execution and speed.*

**Front of Card (List/Board View):**
*   **ID:** Short ID (e.g., OPS-102) for quick reference.
*   **State:** Checkbox or Status Icon (Todo, In Progress, Done).
*   **Title:** Clear, action-oriented text.
*   **Priority:** Icon only (High = Red arrow, Low = Blue arrow).
*   **Assignee:** Avatar.
*   **Cycle/Sprint:** Pill badge (e.g., "Cycle 4").

**Contextual Decorators (Show only if present):**
*   **Blocked:** Red "Blocked" icon if dependencies aren't met.
*   **PR/Code:** Small GitHub/GitLab icon if a branch is linked.
*   **AI Triage:** "✨" icon if AI auto-assigned or prioritized this.

## 3. AI Features to Implement ("Cohortix Intelligence")

1.  **Smart Triage:**
    *   Auto-assign incoming tasks based on "Op" ownership.
    *   Auto-label based on description keywords.

2.  **Health Pulse:**
    *   Instead of manual status updates, AI analyzes the activity log (comments, commits, task completions) of an Operation and sets the Health (On Track / At Risk) automatically.

3.  **Auto-Context:**
    *   When a user clicks a card, show "Related Ops" or "Duplicate Tasks" instantly to prevent silos.

4.  **Generative Subtasks:**
    *   "Break this down": One-click AI action to turn a vague one-liner into a checklist of subtasks.

## 4. Visual Style Guide
*   **Minimalism:** Remove borders, use whitespace for separation.
*   **Information Density:** High density in List view (power users), Card density in Board view (visual planning).
*   **Keyboard First:** Ensure every card action (assign, change status, open) has a single-key shortcut (like Linear).
