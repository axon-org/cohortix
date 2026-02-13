import { pgTable, uuid, varchar, text, timestamp, date, integer, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { ownerTypeEnum } from './missions';

// User-facing terminology: "Debrief" (Review entries - daily/weekly/cycle)
// PPV Pro equivalent: "Daily/Weekly/Duo Cycle Review"
export const debriefTypeEnum = pgEnum('debrief_type', ['daily', 'weekly', 'cycle']); // cycle = bi-monthly
export const debriefStatusEnum = pgEnum('debrief_status', ['draft', 'completed', 'archived']);

export const debriefs = pgTable('debriefs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Polymorphic owner (human user or ally/agent)
  ownerType: ownerTypeEnum('owner_type').notNull(),
  ownerId: uuid('owner_id').notNull(),
  
  // Created by (who conducted the debrief)
  createdByType: ownerTypeEnum('created_by_type').notNull(),
  createdById: uuid('created_by_id').notNull(),
  
  // Debrief metadata
  type: debriefTypeEnum('type').notNull(),
  status: debriefStatusEnum('status').default('draft').notNull(),
  
  // Date range covered
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  
  title: varchar('title', { length: 500 }).notNull(),
  
  // Structured reflection
  wins: text('wins'), // What went well
  challenges: text('challenges'), // What was difficult
  learnings: text('learnings'), // What was learned
  nextSteps: text('next_steps'), // Action items
  
  // Metrics snapshot (optional - from missions/operations)
  metricsSnapshot: jsonb('metrics_snapshot').default({}).notNull(),
  
  // Mood/energy tracking (optional - 1-10 scale)
  mood: integer('mood'), // 1 (low) to 10 (high)
  energy: integer('energy'), // 1 (exhausted) to 10 (energized)
  
  // Tags and notes
  tags: jsonb('tags').default([]).notNull(),
  notes: text('notes'),
  
  // Metadata
  metadata: jsonb('metadata').default({}).notNull(),
  
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('idx_debriefs_org').on(table.organizationId),
  ownerIdx: index('idx_debriefs_owner').on(table.ownerType, table.ownerId),
  typeIdx: index('idx_debriefs_type').on(table.type),
  periodIdx: index('idx_debriefs_period').on(table.periodStart, table.periodEnd),
}));

export type Debrief = typeof debriefs.$inferSelect;
export type InsertDebrief = typeof debriefs.$inferInsert;

// Legacy aliases for backwards compatibility
export const reviews = debriefs;
export const reviewTypeEnum = debriefTypeEnum;
export const reviewStatusEnum = debriefStatusEnum;
export type Review = Debrief;
export type InsertReview = InsertDebrief;
