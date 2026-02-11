import { pgTable, uuid, varchar, text, timestamp, date, jsonb, integer, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

/**
 * Cohort Status Enum
 * - active: Cohort is actively running
 * - paused: Temporarily paused
 * - at-risk: Low engagement or issues detected
 * - completed: Finished/archived
 */
export const cohortStatusEnum = pgEnum('cohort_status', [
  'active',
  'paused',
  'at-risk',
  'completed',
]);

/**
 * Cohorts Table
 * 
 * A cohort is a group of AI allies (agents) working together.
 * Supports engagement tracking, status management, and multi-tenant isolation.
 */
export const cohorts = pgTable('cohorts', {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Multi-tenancy
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Core fields
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  status: cohortStatusEnum('status').default('active').notNull(),
  
  // Metrics (computed/cached values)
  // These are updated periodically or on member changes
  memberCount: integer('member_count').default(0).notNull(),
  engagementPercent: decimal('engagement_percent', { precision: 5, scale: 2 }).default('0').notNull(),
  
  // Dates
  startDate: date('start_date'),
  endDate: date('end_date'),
  
  // Audit fields
  // References auth.users table from Supabase Auth (not our users table)
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  
  // Optional settings (JSON)
  settings: jsonb('settings').default({}).notNull(),
});

// Inferred TypeScript types
export type Cohort = typeof cohorts.$inferSelect;
export type InsertCohort = typeof cohorts.$inferInsert;
export type UpdateCohort = Partial<InsertCohort>;
