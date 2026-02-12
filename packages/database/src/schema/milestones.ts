import { pgTable, uuid, varchar, text, timestamp, date, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { missions as projects } from './missions'; // missions table (DB name: projects)

export const milestoneStatusEnum = pgEnum('milestone_status', ['upcoming', 'active', 'completed', 'missed']);

export const milestones = pgTable('milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: milestoneStatusEnum('status').default('upcoming').notNull(),
  dueDate: date('due_date').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = typeof milestones.$inferInsert;
