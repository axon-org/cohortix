import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { operations } from './operations';
import { ownerTypeEnum } from './missions';

/**
 * Operation Notes: Project notes with types (document, pinned, important)
 * Operations Redesign feature
 */
export const noteTypeEnum = pgEnum('note_type', ['document', 'pinned', 'important']);
export const noteStatusEnum = pgEnum('note_status', ['processing', 'completed']);

export const operationNotes = pgTable('operation_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => operations.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  noteType: noteTypeEnum('note_type').default('document').notNull(),
  status: noteStatusEnum('status').default('processing').notNull(),
  
  // Creator
  createdByType: ownerTypeEnum('created_by_type').notNull(),
  createdById: uuid('created_by_id').notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type OperationNote = typeof operationNotes.$inferSelect;
export type InsertOperationNote = typeof operationNotes.$inferInsert;
