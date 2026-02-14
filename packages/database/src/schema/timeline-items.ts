import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { operations } from './operations';
import { ownerTypeEnum } from './missions';

/**
 * Operation Timeline Items: Activity log for operations (human + AI actions)
 * Operations Redesign feature
 */
export const timelineEventTypeEnum = pgEnum('timeline_event_type', [
  'created',
  'updated',
  'status_changed',
  'assigned',
  'task_completed',
  'note_added',
  'file_uploaded',
  'comment_added',
  'ai_action'
]);

export const operationTimelineItems = pgTable('operation_timeline_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => operations.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  eventType: timelineEventTypeEnum('event_type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  metadata: jsonb('metadata').default({}).notNull(),
  
  // Actor (human or AI)
  actorType: ownerTypeEnum('actor_type').notNull(),
  actorId: uuid('actor_id').notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type OperationTimelineItem = typeof operationTimelineItems.$inferSelect;
export type InsertOperationTimelineItem = typeof operationTimelineItems.$inferInsert;
