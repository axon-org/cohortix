import { pgTable, uuid, timestamp, bigint, text, jsonb, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { tasks } from './tasks'; // Tasks (atomic work units)
import { agents } from './agents';

export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  agentId: uuid('agent_id')
    .notNull()
    .references(() => agents.id, { onDelete: 'cascade' }),
  
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  durationMs: bigint('duration_ms', { mode: 'number' }), // Calculated on end
  
  description: text('description'),
  metadata: jsonb('metadata').default({}).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  taskIdx: index('idx_time_entries_task').on(table.taskId),
  agentIdx: index('idx_time_entries_agent').on(table.agentId),
  startedIdx: index('idx_time_entries_started').on(table.startedAt),
}));

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;
