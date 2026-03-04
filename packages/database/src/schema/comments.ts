import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  index,
  pgEnum,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { cohorts } from './cohorts';
import { scopeTypeEnum } from './scope-types';

export const commentAuthorTypeEnum = pgEnum('comment_author_type', ['user', 'agent']);

export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    scopeType: scopeTypeEnum('scope_type').default('personal').notNull(),
    scopeId: uuid('scope_id').notNull(),
    cohortId: uuid('cohort_id').references(() => cohorts.id, { onDelete: 'set null' }),

    entityType: varchar('entity_type', { length: 50 }).notNull(), // 'task', 'operation', 'mission'
    entityId: uuid('entity_id').notNull(),
    authorType: commentAuthorTypeEnum('author_type').default('user').notNull(),
    authorId: uuid('author_id').notNull(),
    mentionedAgentIds: uuid('mentioned_agent_ids').array().notNull().default([]),
    threadRootId: uuid('thread_root_id').references((): AnyPgColumn => comments.id, {
      onDelete: 'set null',
    }),
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
