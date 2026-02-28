import { pgTable, uuid, numeric, timestamp, unique } from 'drizzle-orm/pg-core';
import { cohorts } from './cohorts';
import { agents } from './agents';
import { cohortMemberRoleEnum } from './cohort-member-role';

/**
 * Cohort Agent Members Table
 *
 * Links agents to cohorts with engagement tracking.
 */
export const cohortAgentMembers = pgTable(
  'cohort_agent_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    cohortId: uuid('cohort_id')
      .notNull()
      .references(() => cohorts.id, { onDelete: 'cascade' }),

    agentId: uuid('agent_id')
      .notNull()
      .references(() => agents.id, { onDelete: 'cascade' }),

    role: cohortMemberRoleEnum('role').default('member').notNull(),

    engagementScore: numeric('engagement_score', { precision: 5, scale: 2 }).default('0').notNull(),

    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueCohortAgent: unique().on(table.cohortId, table.agentId),
  })
);

export type CohortAgentMember = typeof cohortAgentMembers.$inferSelect;
export type InsertCohortAgentMember = typeof cohortAgentMembers.$inferInsert;
export type UpdateCohortAgentMember = Partial<InsertCohortAgentMember>;
