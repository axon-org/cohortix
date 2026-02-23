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
import { operations } from './operations'; // Operations (bounded initiatives)
import { milestones } from './milestones';
import { ownerTypeEnum } from './missions';

// Note: Table name remains 'tasks' in database for backwards compatibility
// User-facing terminology: "Task" (atomic unit of work)
export const taskStatusEnum = pgEnum('task_status', [
  'backlog',
  'todo',
  'in_progress',
  'review',
  'done',
  'cancelled',
]);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);
export const assigneeTypeEnum = pgEnum('assignee_type', ['user', 'agent', 'unassigned']);

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => operations.id, { onDelete: 'set null' }), // References operations (projects table in DB) - optional for rhythm tasks
  rhythmId: uuid('rhythm_id'), // References rhythms table - added via migration (circular dependency)
  parentTaskId: uuid('parent_task_id').references((): AnyPgColumn => tasks.id, {
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
  status: taskStatusEnum('status').default('backlog').notNull(),
  priority: taskPriorityEnum('priority').default('medium').notNull(),

  // Dates
  dueDate: timestamp('due_date', { withTimezone: true }),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),

  // Ordering (for Kanban)
  orderIndex: integer('order_index').default(0).notNull(),
  position: integer('position').default(0).notNull(),

  // Estimation
  estimatedHours: decimal('estimated_hours', { precision: 6, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 6, scale: 2 }),

  // Tags and metadata
  tags: jsonb('tags').default([]).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Self-referencing relation for sub-tasks
export const tasksRelations = {
  parentTask: {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
  },
};

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// Legacy aliases for backwards compatibility (old "Action" terminology)
export const actions = tasks;
export const actionStatusEnum = taskStatusEnum;
export const actionPriorityEnum = taskPriorityEnum;
export const actionsRelations = tasksRelations;
export type Action = Task;
export type InsertAction = InsertTask;
