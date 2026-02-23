import { pgTable, uuid, numeric, timestamp, unique } from 'drizzle-orm/pg-core';
import { cohorts } from './cohorts';
import { agents } from './agents';

/**
 * Cohort Members Table
 *
 * Links agents to cohorts with engagement tracking.
 * This is a many-to-many join table with additional metrics.
 */
export const cohortMembers = pgTable(
  'cohort_members',
  {
    // Primary key
    id: uuid('id').primaryKey().defaultRandom(),

    // Foreign keys
    cohortId: uuid('cohort_id')
      .notNull()
      .references(() => cohorts.id, { onDelete: 'cascade' }),

    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),

    // Engagement metrics
    engagementScore: numeric('engagement_score', { precision: 5, scale: 2 }).default('0').notNull(),

    // Timestamps
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: prevent duplicate memberships
    uniqueCohortAgent: unique().on(table.cohortId, table.agentId),
  })
);

// Inferred TypeScript types
export type CohortMember = typeof cohortMembers.$inferSelect;
export type InsertCohortMember = typeof cohortMembers.$inferInsert;
export type UpdateCohortMember = Partial<InsertCohortMember>;
