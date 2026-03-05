import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { cohorts } from './cohorts';

/**
 * Clone Foundation Table
 *
 * Stores Clone Foundation answers in Cohortix DB (source of truth)
 * before syncing to the engine. Links to user, not org — clone is personal.
 */
export const cloneFoundation = pgTable('clone_foundation', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Links to user, not org — clone is personal
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Structured clone data
  displayName: varchar('display_name', { length: 255 }).notNull(),
  values: jsonb('values').default([]).notNull(),
  decisionMaking: text('decision_making'),
  expertise: jsonb('expertise').default([]).notNull(),
  communicationStyle: text('communication_style'),
  aspirations: text('aspirations'),
  customFields: jsonb('custom_fields').default({}).notNull(),

  // Sync tracking
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  syncedToCohortId: uuid('synced_to_cohort_id').references(() => cohorts.id, {
    onDelete: 'set null',
  }),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Inferred TypeScript types
export type CloneFoundation = typeof cloneFoundation.$inferSelect;
export type InsertCloneFoundation = typeof cloneFoundation.$inferInsert;
