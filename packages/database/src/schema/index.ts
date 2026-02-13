// Core tables
export * from './organizations';
export * from './users';
export * from './org-memberships';
export * from './clients';
export * from './workspaces';

// Agents & AI (Allies in user-facing terminology)
export * from './agents';
export * from './agent-assignments';
export * from './cohorts'; // Groups of agents
export * from './cohort-members'; // Agent-to-cohort memberships

// PPV Pro Alignment Zone (The Pyramid): Domain → Vision → Mission → Operation/Rhythm → Task
// Domain = Core life/expertise area (DB table: domains)
// Vision = Emotional north star (DB table: visions)
// Mission = Measurable outcome (DB table: goals - legacy name)
// Operation = Bounded initiative (DB table: projects - legacy name)
// Rhythm = Recurring habit (DB table: rhythms)
// Task = Atomic work unit (DB table: tasks)
export * from './domains'; // User-facing: "Domain" (DB table: domains), includes legacy "Pillar" aliases
export * from './visions'; // User-facing: "Vision" (DB table: visions), includes legacy "Aspiration" aliases
export * from './missions'; // User-facing: "Mission" (DB table: goals), includes legacy "Goal" aliases
export * from './operations'; // User-facing: "Operation" (DB table: projects), includes legacy "Mission" aliases
export * from './rhythms'; // User-facing: "Rhythm" (DB table: rhythms), includes legacy "Routine" aliases
export * from './milestones';
export * from './tasks'; // User-facing: "Task" (DB table: tasks), includes legacy "Action" aliases
export * from './comments';
export * from './time-entries';

// Knowledge Zone (Intelligence & Insights)
export * from './intelligence'; // User-facing: "Intelligence" (DB table: intelligence), includes legacy "Topic" aliases
export * from './insights'; // User-facing: "Insight" (DB table: insights), includes legacy "Neurobit" aliases
export * from './knowledge-entries'; // Existing knowledge base (may merge with Intelligence later)

// Rhythm Zone (Review Cadences)
export * from './debriefs'; // User-facing: "Debrief" (DB table: debriefs), includes legacy "Review" aliases

// System
export * from './audit-logs';
