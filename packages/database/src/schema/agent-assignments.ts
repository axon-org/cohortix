import { pgTable, uuid, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { agents } from './agents';
import { missions as projects } from './missions'; // missions table (DB name: projects)
import { clients } from './clients';

export const agentProjectRoleEnum = pgEnum('agent_project_role', [
  'owner',
  'contributor',
  'viewer',
]);

// Project-level agent assignments
export const agentAssignments = pgTable(
  'agent_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    role: agentProjectRoleEnum('role').default('contributor').notNull(),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
    // References auth.users(id) from Supabase Auth
    assignedBy: uuid('assigned_by'),
  },
  (table) => ({
    agentIdx: index('idx_agent_assignments_agent').on(table.agentId),
    projectIdx: index('idx_agent_assignments_project').on(table.projectId),
  })
);

// Client-level agent assignments
export const agentClientAssignments = pgTable(
  'agent_client_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
    // References auth.users(id) from Supabase Auth
    assignedBy: uuid('assigned_by'),
  },
  (table) => ({
    agentIdx: index('idx_agent_client_assignments_agent').on(table.agentId),
    clientIdx: index('idx_agent_client_assignments_client').on(table.clientId),
  })
);

export type AgentAssignment = typeof agentAssignments.$inferSelect;
export type InsertAgentAssignment = typeof agentAssignments.$inferInsert;
export type AgentClientAssignment = typeof agentClientAssignments.$inferSelect;
export type InsertAgentClientAssignment = typeof agentClientAssignments.$inferInsert;
