// Core tables
export * from './organizations';
export * from './users';
export * from './org-memberships';
export * from './clients';
export * from './workspaces';

// Agents & AI
export * from './agents';
export * from './agent-assignments';
export * from './cohorts'; // Groups of agents
export * from './cohort-members'; // Agent-to-cohort memberships

// PPV Hierarchy: Domain → Vision → Mission → Operation/Rhythm → Task
export * from './goals';
// Note: Both missions.ts and projects.ts export the same types with legacy aliases
// Only export from missions.ts to avoid duplicate exports
export * from './missions'; // User-facing: "Missions" (DB table: projects)
export * from './milestones';

// Actions (User-facing: "Actions", DB table: tasks)
// Note: Both actions.ts and tasks.ts export the same types with legacy aliases
// Only export from actions.ts to avoid duplicate exports
export * from './actions';
export * from './comments';
export * from './activity-log';
export * from './insights';
export * from './time-entries';

// Knowledge Base
export * from './knowledge-entries';

// System
export * from './audit-logs';
