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
export * from './cohort-member-role';
export * from './cohort-user-members';
export * from './cohort-agent-members';

// PPV Hierarchy: Domain → Vision → Mission → Operation → Task
export * from './scope-types';
export * from './domains'; // Life pillars (top of PPV pyramid)
export * from './visions'; // Life aspirations (emotional north stars)
export * from './goals'; // Missions (measurable goals, DB table: missions)
// Note: operations.ts is the canonical schema for DB table 'projects'
// missions.ts is a legacy alias file — we skip re-exporting it to avoid
// duplicate Mission/missionStatusEnum conflicts with goals.ts
export * from './operations'; // Operations (bounded initiatives, DB table: projects)
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
