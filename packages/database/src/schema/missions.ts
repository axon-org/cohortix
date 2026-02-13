import { pgTable, uuid, varchar, text, timestamp, integer, date, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { clients } from './clients';

// Note: Table name remains 'goals' in database for backwards compatibility
// User-facing terminology: "Mission" (measurable outcome that serves a Vision)
export const missionStatusEnum = pgEnum('goal_status', ['not_started', 'in_progress', 'at_risk', 'completed', 'cancelled']);
export const ownerTypeEnum = pgEnum('owner_type', ['user', 'agent']);

export const missions = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  
  // PPV hierarchy link (Missions serve Visions)
  // NOTE: This field will be added via migration - circular dependency handled there
  // visionId: uuid('vision_id').references(() => visions.id, { onDelete: 'set null' }),
  
  // Owner (who is responsible)
  ownerType: ownerTypeEnum('owner_type').notNull(),
  ownerId: uuid('owner_id').notNull(),
  
  // Created by (who set the goal)
  createdByType: ownerTypeEnum('created_by_type').notNull(),
  createdById: uuid('created_by_id').notNull(),
  
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  status: missionStatusEnum('status').default('not_started').notNull(),
  
  // Progress tracking
  progressPercent: integer('progress_percent').default(0).notNull(),
  progressAutoCalculate: jsonb('progress_auto_calculate').default(true).notNull(),
  
  // Dates
  targetDate: date('target_date'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  
  // Key Results (OKR style - measurable outcomes)
  keyResults: jsonb('key_results').default([]).notNull(),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Mission = typeof missions.$inferSelect;
export type InsertMission = typeof missions.$inferInsert;

// Legacy aliases for backwards compatibility (old "Goal" terminology)
export const goals = missions;
export const goalStatusEnum = missionStatusEnum;
export type Goal = Mission;
export type InsertGoal = InsertMission;
