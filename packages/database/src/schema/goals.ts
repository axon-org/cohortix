import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  date,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { visions } from './visions';

// Shared enum used across PPV hierarchy
export const ownerTypeEnum = pgEnum('owner_type', ['user', 'agent']);

// User-facing terminology: "Mission" (measurable goal)
// DB table remains 'missions' (created in 20260213 migration)
export const missionStatusEnum = pgEnum('mission_status', [
  'not_started',
  'active',
  'on_hold',
  'completed',
  'abandoned',
]);

export const goals = pgTable('missions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Linked vision (Missions serve Visions)
  visionId: uuid('vision_id').references(() => visions.id, { onDelete: 'set null' }),

  // Owner (who is responsible — human or agent)
  ownerType: ownerTypeEnum('owner_type').default('user').notNull(),
  ownerId: uuid('owner_id'),

  // Created by
  createdByType: ownerTypeEnum('created_by_type'),
  createdById: uuid('created_by_id'),

  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: missionStatusEnum('status').default('not_started').notNull(),
  priority: varchar('priority', { length: 50 }).default('medium'),

  // Progress (rolled up from operations)
  progress: integer('progress').default(0).notNull(),

  // Dates
  startDate: date('start_date'),
  targetDate: date('target_date'),
  completedDate: date('completed_date'),

  // OKR-style tracking
  successCriteria: jsonb('success_criteria').default([]).notNull(),
  keyResults: jsonb('key_results').default([]).notNull(),

  // Metadata
  metadata: jsonb('metadata').default({}).notNull(),
  orderIndex: integer('order_index').default(0).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

// Cohortix terminology aliases
export type Mission = Goal;
export type InsertMission = InsertGoal;
