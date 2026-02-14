import { pgTable, uuid, varchar, text, timestamp, bigint, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { operations } from './operations';
import { ownerTypeEnum } from './missions';

/**
 * Operation Files: File metadata for operation attachments
 * Operations Redesign feature
 */
export const fileTypeEnum = pgEnum('file_type', ['pdf', 'zip', 'figma', 'image', 'generic']);

export const operationFiles = pgTable('operation_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => operations.id, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 255 }).notNull(),
  fileType: fileTypeEnum('file_type').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(), // Size in bytes
  storagePath: text('storage_path').notNull(), // Path in Supabase Storage
  mimeType: varchar('mime_type', { length: 100 }),
  
  // Uploader
  uploadedByType: ownerTypeEnum('uploaded_by_type').notNull(),
  uploadedById: uuid('uploaded_by_id').notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type OperationFile = typeof operationFiles.$inferSelect;
export type InsertOperationFile = typeof operationFiles.$inferInsert;
