# AI-First Project Management Tools Research
*Date: 2026-02-14*

Research into hierarchy structures, card data, and AI features of leading "AI-first" and modern project management tools.

## 1. Linear
**URL:** [linear.app](https://linear.app)

### Hierarchy Structure
*   **Initiatives:** High-level goals or roadmaps (formerly Roadmaps). Group projects together.
*   **Projects:** Features or large units of work with a clear end date.
*   **Issues:** Individual tasks.
*   **Sub-issues:** Breakdown of issues (though Linear encourages keeping issues atomic).
*   **Cycles:** Time-boxed sprints (e.g., 2 weeks) that group issues across projects.

### Card Data (Issues)
*   **Core:** ID (e.g., ENG-123), Title.
*   **Status:** Workflow state (Backlog, Todo, In Progress, Done, Canceled).
*   **Assignee:** Owner of the issue.
*   **Priority:** No Priority, Low, Medium, High, Urgent.
*   **Estimate:** T-shirt sizes or points.
*   **Labels:** Categorization tags.
*   **Project:** Link to parent project.
*   **Cycle:** Current cycle assignment.
*   **Context:** Linked PRs, Branch names, Attachments.

### AI Features
*   **Triage Intelligence:** Auto-assigns issues, applies labels, and detects duplicates based on historical patterns.
*   **AI Agents:** "Artificial teammates" that can handle technical tasks, code generation, and end-to-end issue resolution.
*   **AI Search:** Semantic search across issues and docs.
*   **Pulse:** AI-generated daily/weekly summaries of project progress.

### Best Patterns
*   **"Cycles" not "Sprints":** Automated, time-boxed periods that don't require manual start/stop overhead.
*   **Keyboard-first UI:** Card design is minimal to support rapid triage via shortcuts.
*   **Status as Source of Truth:** PRs automatically update issue status.

---

## 2. Asana
**URL:** [asana.com](https://asana.com)

### Hierarchy Structure
*   **Goals:** Company-wide objectives.
*   **Portfolios:** Collections of projects to track status.
*   **Projects:** Collections of tasks.
*   **Tasks:** Individual units of work.
*   **Subtasks:** Breakdown of tasks.

### Card Data (Tasks)
*   **Core:** Title, Assignee, Due Date.
*   **Custom Fields:** Highly flexible typed fields (Dropdown, Text, Number, Date, People). Used for Priority, Cost, Stage, etc.
*   **Dependencies:** Blocked by / Blocking.
*   **Projects:** A task can live in multiple projects (multi-homing).
*   **Tags:** Loose categorization.
*   **Collaborators:** People following the task.

### AI Features (Asana Intelligence)
*   **Smart Summaries:** Summarizes long comment threads and task descriptions.
*   **Smart Status:** Generates project status updates based on task activity.
*   **Smart Answers:** Q&A about projects ("Is this on track?").
*   **Smart Workflow Gallery:** AI-suggested automations and rules.

### Best Patterns
*   **Multi-homing:** Cards existing in multiple contexts (e.g., "Design Sprint" project AND "Marketing Launch" project) keeps teams aligned without duplication.
*   **Structured Metadata:** Heavy reliance on Custom Fields for process control.

---

## 3. Plane
**URL:** [plane.so](https://plane.so)

### Hierarchy Structure
*   **Workspace:** Top-level container.
*   **Projects:** Distinct streams of work.
*   **Cycles:** Time-boxed sprints.
*   **Modules:** Functional groups or epics (e.g., "Authentication", "Billing").
*   **Issues:** Tasks.
*   **Sub-issues:** Nested tasks.

### Card Data (Issues)
*   **Core:** ID, Title, State (Customizable workflow).
*   **Priority:** Urgent, High, Medium, Low, None.
*   **Assignee:** Owner.
*   **Cycle & Module:** Linkage to time and scope.
*   **Properties:** Custom fields.
*   **Estimates:** Points.

### AI Features (Plane Intelligence)
*   **"Ask your workspace":** Natural language queries across all issues and docs.
*   **Noise Reduction:** AI filters relevant signals from activity.
*   **Automated Triage:** Suggestions for properties and assignment.

### Best Patterns
*   **Cycles + Modules:** clearly separates "When" (Cycle) from "What" (Module).
*   **Switching:** Built to be a drop-in replacement for Jira/Linear with importers.

---

## 4. ClickUp
**URL:** [clickup.com](https://clickup.com)

### Hierarchy Structure
*   **Workspace** > **Space** > **Folder** > **List** > **Task**.
*   **Nested Subtasks:** Up to 7 levels deep.
*   **Goals:** High-level objectives linked to tasks.

### Card Data (Tasks)
*   **Core:** Status (Custom per List), Assignee, Due Date.
*   **Custom Fields:** Extensive field types including Formulas and Progress Bars.
*   **Sprint Points:** Estimation.
*   **Time Tracking:** Built-in timer and estimates.
*   **Relationships:** Linking tasks to docs, other tasks, or dependencies.

### AI Features (ClickUp Brain)
*   **AI Knowledge Manager:** Answers questions from docs, tasks, and chats.
*   **AI Project Manager:** Automates updates, summaries, and subtask creation.
*   **AI Writer:** Generates content and emails.
*   **Standups:** AI generates daily standup summaries for team members.

### Best Patterns
*   **Everything is a Task:** High flexibility, but can get complex.
*   **Nested Hierarchy:** Allows very granular breakdown of massive projects.

---

## 5. Notion
**URL:** [notion.so](https://notion.so)

### Hierarchy Structure
*   **Database:** The container (Projects DB, Tasks DB).
*   **Page:** The item (Task/Project). Can contain anything (text, images, sub-databases).
*   **Relations:** Links parent Projects to child Tasks.

### Card Data (Page Properties)
*   **Properties:** Fully user-defined (Status, Date, Person, Relation, Rollup, Formula).
*   **Content:** The "card" opens into a full document.

### AI Features (Notion AI)
*   **Autofill:** AI fills database properties (e.g., summary, sentiment, tags) based on page content.
*   **Q&A:** Chat with your workspace.
*   **Writing:** Generative text assistance.

### Best Patterns
*   **Database Properties as UI:** The card *is* the data schema.
*   **Docs + Tasks:** Seamless transition from planning (doc) to execution (task).

---

## 6. Monday.com
**URL:** [monday.com](https://monday.com)

### Hierarchy Structure
*   **Workspace** > **Board** > **Group** > **Item** > **Subitem**.

### Card Data (Item)
*   **Columns:** The "card" is a row, and data are columns.
*   **Types:** Status, People, Date, Timeline, Numbers, Formula, Rating, Files.
*   **Updates:** Chat/activity log attached to the item.

### AI Features
*   **AI Assistant:** Generates items from ideas.
*   **AI Agents:** Specialized agents for Sales, Dev, etc.
*   **Formula Builder:** AI writes complex formulas.

### Best Patterns
*   **Grid First:** The primary view is a spreadsheet-like grid, making data density high.
*   **Visual Status:** Colorful status columns ("Stuck", "Done", "Working on it") give instant visual health checks.

---

## 7. Shortcut
**URL:** [shortcut.com](https://shortcut.com)

### Hierarchy Structure
*   **Objectives:** Strategic goals.
*   **Epics:** Large features.
*   **Stories:** Tasks (Feature, Bug, Chore).
*   **Iterations:** Sprints.

### Card Data (Stories)
*   **Type:** Feature, Bug, Chore (icon coded).
*   **Points:** Complexity estimate.
*   **Workflow State:** Unscheduled, Ready for Dev, In Dev, Review, Done.
*   **Owners:** Assignees.
*   **Epic Link:** Parent feature.

### AI Features (Korey)
*   **Agentic Work:** Scopes tasks, writes PRs.
*   **Summaries:** Progress tracking.

### Best Patterns
*   **Story Types:** Explicitly distinguishing Bugs vs. Features at the card level.
*   **Epic-Centric:** Strong focus on the "Epic" as the primary unit of value delivery.

---

## Summary of Patterns

| Feature | Best Practice Pattern |
| :--- | :--- |
| **Hierarchy** | **3-4 Levels Max:** Goal/Initiative → Project/Epic → Task/Issue → (Subtask). |
| **Sprints** | **"Cycles" or "Iterations":** Automated, time-boxed periods decoupled from projects. |
| **Card UI** | **Minimalist Front:** Show ID, Title, Assignee, Priority, Status. Hide complexities (dates, labels) unless critical. |
| **AI Usage** | **Triage & Synthesis:** AI is best used for *cleaning* (auto-assign, dedupe) and *summarizing* (daily digests), not just generating text. |
| **Context** | **Dev Integration:** Status updates driven by PR/Code activity, not manual clicks. |
