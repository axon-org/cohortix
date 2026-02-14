import { pgTable, uuid, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { operations } from './operations';
import { ownerTypeEnum } from './missions';

/**
 * Workstreams: Task grouping by phase/epic within operations
 * Operations Redesign feature
 */
export const workstreams = pgTable('workstreams', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => operations.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  position: integer('position').default(0).notNull(),
  
  // Progress tracking
  totalTasks: integer('total_tasks').default(0).notNull(),
  completedTasks: integer('completed_tasks').default(0).notNull(),
  
  // Creator
  createdByType: ownerTypeEnum('created_by_type').notNull(),
  createdById: uuid('created_by_id').notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Workstream = typeof workstreams.$inferSelect;
export type InsertWorkstream = typeof workstreams.$inferInsert;
