import { pgTable, uuid, varchar, text, timestamp, customType, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

// Custom type for pgvector
const vector = customType<{ data: number[] }>({
  dataType() {
    return 'vector(1536)';
  },
});

export const insights = pgTable(
  'insights',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull(),
    content: text('content').notNull(),
    sourceType: varchar('source_type', { length: 50 }),
    sourceId: uuid('source_id'),
    /** Reference to an agent (AI agent in user-facing terminology) */
    allyId: uuid('ally_id'),
    tags: text('tags').array().notNull().default([]),
    embedding: vector('embedding'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('idx_insights_org').on(table.organizationId),
    /** Index for filtering insights by agent */
    agentIdx: index('idx_insights_ally').on(table.allyId),
  })
);

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = typeof insights.$inferInsert;
