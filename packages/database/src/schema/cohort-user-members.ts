import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core';
import { cohorts } from './cohorts';
import { users } from './users';
import { cohortMemberRoleEnum } from './cohort-member-role';

/**
 * Cohort User Members Table
 *
 * Links users to cohorts with roles.
 */
export const cohortUserMembers = pgTable(
  'cohort_user_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    cohortId: uuid('cohort_id')
      .notNull()
      .references(() => cohorts.id, { onDelete: 'cascade' }),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    role: cohortMemberRoleEnum('role').default('member').notNull(),

    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueCohortUser: unique().on(table.cohortId, table.userId),
  })
);

export type CohortUserMember = typeof cohortUserMembers.$inferSelect;
export type InsertCohortUserMember = typeof cohortUserMembers.$inferInsert;
export type UpdateCohortUserMember = Partial<InsertCohortUserMember>;
