import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { intelligence } from './intelligence';
import { ownerTypeEnum } from './missions';

// User-facing terminology: "Insight" (Individual learning capture)
// PPV Pro equivalent: "NeuroBits"
export const insightSourceTypeEnum = pgEnum('insight_source_type', [
  'article',
  'book',
  'video',
  'conversation',
  'experience',
  'research',
  'course',
  'other',
]);

export const insights = pgTable('insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Polymorphic owner (human user or ally/agent)
  ownerType: ownerTypeEnum('owner_type').notNull(),
  ownerId: uuid('owner_id').notNull(),
  
  // Created by (who captured this insight)
  createdByType: ownerTypeEnum('created_by_type').notNull(),
  createdById: uuid('created_by_id').notNull(),
  
  // Linked intelligence topic (Insights roll up to Intelligence)
  intelligenceId: uuid('intelligence_id')
    .references(() => intelligence.id, { onDelete: 'set null' }),
  
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  
  // Source information
  sourceType: insightSourceTypeEnum('source_type').notNull(),
  sourceUrl: text('source_url'),
  sourceTitle: varchar('source_title', { length: 500 }),
  sourceAuthor: varchar('source_author', { length: 255 }),
  
  // Key takeaway (AI-generated or manual)
  keyTakeaway: text('key_takeaway'),
  
  // Classification
  tags: jsonb('tags').default([]).notNull(),
  
  // Related insights (for concept mapping)
  relatedInsightIds: jsonb('related_insight_ids').default([]).notNull(),
  
  // Metadata
  metadata: jsonb('metadata').default({}).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('idx_insights_org').on(table.organizationId),
  ownerIdx: index('idx_insights_owner').on(table.ownerType, table.ownerId),
  intelligenceIdx: index('idx_insights_intelligence').on(table.intelligenceId),
  sourceTypeIdx: index('idx_insights_source_type').on(table.sourceType),
}));

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = typeof insights.$inferInsert;

// Legacy aliases for backwards compatibility
export const neurobits = insights;
export const neurobitSourceTypeEnum = insightSourceTypeEnum;
export type Neurobit = Insight;
export type InsertNeurobit = InsertInsight;
