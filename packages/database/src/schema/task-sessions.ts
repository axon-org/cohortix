import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { tasks } from './tasks';
import { agents } from './agents';
import { cohorts } from './cohorts';
import { scopeTypeEnum } from './scope-types';

export const taskSessionStatusEnum = pgEnum('task_session_status', [
  'running',
  'completed',
  'failed',
  'cancelled',
]);

export const taskSessions = pgTable(
  'task_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),
    cohortId: uuid('cohort_id').references(() => cohorts.id, { onDelete: 'set null' }),
    scopeType: scopeTypeEnum('scope_type').default('personal').notNull(),
    scopeId: uuid('scope_id').notNull(),
    gatewaySessionId: text('gateway_session_id'),
    status: taskSessionStatusEnum('status').default('running').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    error: jsonb('error'),
  },
  (table) => ({
    taskIdx: index('idx_task_sessions_task').on(table.taskId),
    agentIdx: index('idx_task_sessions_agent').on(table.agentId),
    cohortIdx: index('idx_task_sessions_cohort').on(table.cohortId),
    statusIdx: index('idx_task_sessions_status').on(table.status),
    scopeIdx: index('idx_task_sessions_scope').on(table.scopeType, table.scopeId),
  })
);

export type TaskSession = typeof taskSessions.$inferSelect;
export type InsertTaskSession = typeof taskSessions.$inferInsert;
