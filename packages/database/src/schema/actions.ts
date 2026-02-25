import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  jsonb,
  pgEnum,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { operations as missions } from './operations';
import { milestones } from './milestones';
import { ownerTypeEnum } from './goals';

// Note: Table name remains 'tasks' in database for backwards compatibility
// User-facing terminology: "Action" (not "Task")
export const actionStatusEnum = pgEnum('task_status', [
  'backlog',
  'todo',
  'in_progress',
  'review',
  'done',
  'cancelled',
]);
export const actionPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);
export const assigneeTypeEnum = pgEnum('assignee_type', ['user', 'agent', 'unassigned']);

export const actions = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => missions.id, { onDelete: 'cascade' }), // References missions table
  parentTaskId: uuid('parent_task_id').references((): AnyPgColumn => actions.id, {
    onDelete: 'cascade',
  }),
  milestoneId: uuid('milestone_id').references(() => milestones.id, { onDelete: 'set null' }),

  // Polymorphic assignee (user or agent)
  assigneeType: assigneeTypeEnum('assignee_type').default('unassigned').notNull(),
  assigneeId: uuid('assignee_id'), // NULL if unassigned

  // Creator
  createdByType: ownerTypeEnum('created_by_type').notNull(),
  createdById: uuid('created_by_id').notNull(),

  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  status: actionStatusEnum('status').default('backlog').notNull(),
  priority: actionPriorityEnum('priority').default('medium').notNull(),

  // Dates
  dueDate: timestamp('due_date', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),

  // Ordering (for Kanban)
  orderIndex: integer('order_index').default(0).notNull(),

  // Estimation
  estimatedHours: decimal('estimated_hours', { precision: 6, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 6, scale: 2 }),

  // Tags and metadata
  tags: jsonb('tags').default([]).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Self-referencing relation for sub-actions
export const actionsRelations = {
  parentAction: {
    fields: [actions.parentTaskId],
    references: [actions.id],
  },
};

export type Action = typeof actions.$inferSelect;
export type InsertAction = typeof actions.$inferInsert;

// Legacy aliases for backwards compatibility
export const tasks = actions;
export const taskStatusEnum = actionStatusEnum;
export const taskPriorityEnum = actionPriorityEnum;
export const tasksRelations = actionsRelations;
export type Task = Action;
export type InsertTask = InsertAction;
