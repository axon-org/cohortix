import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { tasks } from './tasks'; // Tasks (atomic work units)
import { authorTypeEnum } from './audit-logs';

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  parentCommentId: uuid('parent_comment_id').references(() => comments.id, { onDelete: 'cascade' }),
  
  // Author
  authorType: authorTypeEnum('author_type').notNull(),
  authorId: uuid('author_id'), // NULL for system comments
  
  content: text('content').notNull(),
  contentHtml: text('content_html'), // Rendered HTML (for rich text)
  
  // Mentions
  mentions: jsonb('mentions').default([]).notNull(),
  
  // Attachments
  attachments: jsonb('attachments').default([]).notNull(),
  
  // Edit tracking
  editedAt: timestamp('edited_at', { withTimezone: true }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  taskIdx: index('idx_comments_task').on(table.taskId),
  parentIdx: index('idx_comments_parent').on(table.parentCommentId),
  authorIdx: index('idx_comments_author').on(table.authorType, table.authorId),
}));

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;
