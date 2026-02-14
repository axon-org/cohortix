import { pgTable, uuid, varchar, text, timestamp, date, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { workspaces } from './workspaces';
import { clients } from './clients';
import { missions, ownerTypeEnum } from './missions';

// Note: Table name remains 'projects' in database for backwards compatibility
// User-facing terminology: "Operation" (bounded initiative with start/end)
export const operationStatusEnum = pgEnum('project_status', [
  'planning',
  'active',
  'on_hold',
  'completed',
  'archived',
]);

export const operations = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'set null' }),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),

  // Polymorphic owner (can be user or agent/ally)
  ownerType: ownerTypeEnum('owner_type').default('user').notNull(),
  ownerId: uuid('owner_id').notNull(),

  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  description: text('description'),
  status: operationStatusEnum('status').default('planning').notNull(),

  // Visual settings
  color: varchar('color', { length: 7 }), // Hex color
  icon: varchar('icon', { length: 50 }), // Icon name

  // Dates
  startDate: date('start_date'),
  targetDate: date('target_date'),
  completedAt: timestamp('completed_at', { withTimezone: true }),

  // Linked mission (Operations support Missions in PPV hierarchy)
  missionId: uuid('goal_id').references(() => missions.id, { onDelete: 'set null' }), // DB column: goal_id

  settings: jsonb('settings').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Operation = typeof operations.$inferSelect;
export type InsertOperation = typeof operations.$inferInsert;

// Legacy aliases for backwards compatibility (old "Project" and "Mission" terminology)
export const projects = operations;
export const projectStatusEnum = operationStatusEnum;
export type Project = Operation;
export type InsertProject = InsertOperation;
