import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  jsonb,
  integer,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { cohorts } from './cohorts';
import { actions } from './actions';
import { agents } from './agents';
import { comments } from './comments';

/**
 * Task Queue Status Enum
 * Queued tasks waiting for engine availability.
 */
export const taskQueueStatusEnum = pgEnum('task_queue_status', [
  'queued',
  'processing',
  'completed',
  'failed',
  'expired',
]);

/**
 * Task Queue Table
 *
 * Queues task executions when the engine is offline.
 * Drained FIFO when the engine reconnects.
 */
export const taskQueue = pgTable(
  'task_queue',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    cohortId: uuid('cohort_id')
      .notNull()
      .references(() => cohorts.id, { onDelete: 'cascade' }),

    taskId: uuid('task_id')
      .notNull()
      .references(() => actions.id, { onDelete: 'cascade' }),

    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),

    // The comment that triggered this execution (optional — could be direct assignment)
    commentId: uuid('comment_id').references(() => comments.id, {
      onDelete: 'set null',
    }),

    // Full prompt sent to the agent (includes task context)
    prompt: text('prompt').notNull(),

    // Session key for the gateway request
    sessionKey: varchar('session_key', { length: 255 }).notNull(),

    status: taskQueueStatusEnum('status').default('queued').notNull(),

    // Retry tracking
    attempts: integer('attempts').default(0).notNull(),
    maxAttempts: integer('max_attempts').default(3).notNull(),
    error: jsonb('error'),

    // Timestamps
    queuedAt: timestamp('queued_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
  },
  (table) => ({
    cohortStatusIdx: index('idx_task_queue_cohort_status').on(table.cohortId, table.status),
    queuedAtIdx: index('idx_task_queue_queued_at').on(table.queuedAt),
  })
);

// Inferred TypeScript types
export type TaskQueueItem = typeof taskQueue.$inferSelect;
export type InsertTaskQueueItem = typeof taskQueue.$inferInsert;
