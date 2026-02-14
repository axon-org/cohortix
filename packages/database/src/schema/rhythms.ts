import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { missions } from './missions';
import { ownerTypeEnum } from './missions';

// User-facing terminology: "Rhythm" (Recurring habit with no end date)
// PPV Pro equivalent: "Routines"
export const rhythmStatusEnum = pgEnum('rhythm_status', [
  'active',
  'paused',
  'completed',
  'archived',
]);
export const rhythmFrequencyEnum = pgEnum('rhythm_frequency', [
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'custom',
]);

export const rhythms = pgTable('rhythms', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Polymorphic owner (human user or ally/agent)
  ownerType: ownerTypeEnum('owner_type').notNull(),
  ownerId: uuid('owner_id').notNull(),

  // Created by (who established this rhythm)
  createdByType: ownerTypeEnum('created_by_type').notNull(),
  createdById: uuid('created_by_id').notNull(),

  // Linked mission (Rhythms support Missions in PPV hierarchy)
  missionId: uuid('mission_id')
    .notNull()
    .references(() => missions.id, { onDelete: 'cascade' }),

  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: rhythmStatusEnum('status').default('active').notNull(),

  // Recurrence pattern
  frequency: rhythmFrequencyEnum('frequency').notNull(),
  customFrequency: jsonb('custom_frequency'), // For complex patterns (e.g., "every 3 days")

  // Scheduling
  startDate: timestamp('start_date', { withTimezone: true }),
  nextOccurrence: timestamp('next_occurrence', { withTimezone: true }),

  // Checklist template (reusable steps for each occurrence)
  checklistTemplate: jsonb('checklist_template').default([]).notNull(),

  // Tracking
  completionCount: integer('completion_count').default(0).notNull(),
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastCompletedAt: timestamp('last_completed_at', { withTimezone: true }),

  // Visual settings
  color: varchar('color', { length: 7 }), // Hex color
  icon: varchar('icon', { length: 50 }), // Icon name

  // Metadata
  metadata: jsonb('metadata').default({}).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Rhythm = typeof rhythms.$inferSelect;
export type InsertRhythm = typeof rhythms.$inferInsert;

// Legacy aliases for backwards compatibility
export const routines = rhythms;
export const routineStatusEnum = rhythmStatusEnum;
export const routineFrequencyEnum = rhythmFrequencyEnum;
export type Routine = Rhythm;
export type InsertRoutine = InsertRhythm;
