import { pgTable, uuid, text, timestamp, varchar, jsonb, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 50 }).notNull(), // 'task', 'operation', 'mission'
    entityId: uuid('entity_id').notNull(),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    entityIdx: index('idx_comments_entity').on(table.entityType, table.entityId),
    orgIdx: index('idx_comments_org').on(table.organizationId),
  })
);

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;
