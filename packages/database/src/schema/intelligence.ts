import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, decimal, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { ownerTypeEnum } from './missions';

// User-facing terminology: "Intelligence" (Knowledge organized by topic)
// PPV Pro equivalent: "Topic Vault"
export const intelligence = pgTable('intelligence', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Polymorphic owner (human user or ally/agent)
  ownerType: ownerTypeEnum('owner_type').notNull(),
  ownerId: uuid('owner_id').notNull(),
  
  // Created by (who created this topic)
  createdByType: ownerTypeEnum('created_by_type').notNull(),
  createdById: uuid('created_by_id').notNull(),
  
  // Topic hierarchy (for nested topics)
  parentTopicId: uuid('parent_topic_id').references(() => intelligence.id, { onDelete: 'cascade' }),
  
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Topic summary (AI-generated from insights)
  summary: text('summary'),
  
  // Classification
  tags: jsonb('tags').default([]).notNull(),
  
  // Visual settings
  color: varchar('color', { length: 7 }), // Hex color
  icon: varchar('icon', { length: 50 }), // Icon name
  
  // Metrics
  insightCount: integer('insight_count').default(0).notNull(),
  relevanceScore: decimal('relevance_score', { precision: 3, scale: 2 }).default('1.0').notNull(),
  lastInsightAt: timestamp('last_insight_at', { withTimezone: true }),
  
  // Ordering
  orderIndex: integer('order_index').default(0).notNull(),
  
  // Metadata
  metadata: jsonb('metadata').default({}).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('idx_intelligence_org').on(table.organizationId),
  ownerIdx: index('idx_intelligence_owner').on(table.ownerType, table.ownerId),
  parentIdx: index('idx_intelligence_parent').on(table.parentTopicId),
}));

export type Intelligence = typeof intelligence.$inferSelect;
export type InsertIntelligence = typeof intelligence.$inferInsert;

// Legacy aliases for backwards compatibility
export const topics = intelligence;
export type Topic = Intelligence;
export type InsertTopic = InsertIntelligence;
