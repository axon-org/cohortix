import { pgTable, uuid, timestamp, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { cohorts } from './cohorts';

/**
 * Engine Event Type Enum
 * Tracks engine connection lifecycle for debugging and dashboards.
 */
export const engineEventTypeEnum = pgEnum('engine_event_type', [
  'connected',
  'disconnected',
  'health_check_failed',
  'health_check_recovered',
  'auth_failed',
  'token_rotated',
  'agent_synced',
  'clone_synced',
  'queue_drained',
  'version_checked',
]);

/**
 * Engine Events Table
 *
 * Tracks engine connection lifecycle events for debugging and dashboards.
 */
export const engineEvents = pgTable(
  'engine_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    cohortId: uuid('cohort_id')
      .notNull()
      .references(() => cohorts.id, { onDelete: 'cascade' }),

    eventType: engineEventTypeEnum('event_type').notNull(),
    metadata: jsonb('metadata').default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    cohortCreatedIdx: index('idx_engine_events_cohort_created').on(table.cohortId, table.createdAt),
    eventTypeIdx: index('idx_engine_events_type').on(table.eventType),
  })
);

// Inferred TypeScript types
export type EngineEvent = typeof engineEvents.$inferSelect;
export type InsertEngineEvent = typeof engineEvents.$inferInsert;
