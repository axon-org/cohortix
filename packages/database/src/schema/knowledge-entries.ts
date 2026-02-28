import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { agents } from './agents';
import { operations as projects } from './operations';
import { clients } from './clients';
import { cohorts } from './cohorts';
import { scopeTypeEnum } from './scope-types';

export const knowledgeSourceTypeEnum = pgEnum('knowledge_source_type', [
  'task',
  'research',
  'manual',
  'conversation',
  'integration',
]);

export const knowledgeCategoryEnum = pgEnum('knowledge_category', [
  'technical',
  'strategic',
  'operational',
  'domain',
  'process',
  'other',
]);

export const knowledgeScopeLevelEnum = pgEnum('knowledge_scope_level', [
  'company',
  'client',
  'project',
]);

export const knowledgeEntries = pgTable(
  'knowledge_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    scopeType: scopeTypeEnum('scope_type').default('personal').notNull(),
    scopeId: uuid('scope_id'),
    cohortId: uuid('cohort_id').references(() => cohorts.id, { onDelete: 'set null' }),

    // Source agent (who learned this)
    agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'set null' }),

    // Source reference
    sourceType: knowledgeSourceTypeEnum('source_type').notNull(),
    sourceId: uuid('source_id'), // task_id, comment_id, etc.

    // Content
    title: varchar('title', { length: 500 }).notNull(),
    content: text('content').notNull(),
    summary: text('summary'), // AI-generated summary

    // Classification
    category: knowledgeCategoryEnum('category').default('other').notNull(),
    tags: jsonb('tags').default([]).notNull(),

    // Linked entities
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'set null' }),
    clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),

    // Knowledge Scoping (Company → Client → Project hierarchy)
    scopeLevel: knowledgeScopeLevelEnum('scope_level').default('company').notNull(),
    knowledgeScopeId: uuid('knowledge_scope_id'),

    // Memory Decay System
    relevanceScore: decimal('relevance_score', { precision: 3, scale: 2 }).default('1.0').notNull(),
    accessCount: integer('access_count').default(0).notNull(),
    lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
    helpfulCount: integer('helpful_count').default(0).notNull(),
    unhelpfulCount: integer('unhelpful_count').default(0).notNull(),
    decayDisabled: boolean('decay_disabled').default(false).notNull(),

    // Metadata
    metadata: jsonb('metadata').default({}).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    orgIdx: index('idx_knowledge_org').on(table.organizationId),
    agentIdx: index('idx_knowledge_agent').on(table.agentId),
    categoryIdx: index('idx_knowledge_category').on(table.organizationId, table.category),
    clientIdx: index('idx_knowledge_client').on(table.clientId),
    scopeIdx: index('idx_knowledge_scope').on(
      table.organizationId,
      table.scopeLevel,
      table.knowledgeScopeId
    ),
  })
);

export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;
export type InsertKnowledgeEntry = typeof knowledgeEntries.$inferInsert;
