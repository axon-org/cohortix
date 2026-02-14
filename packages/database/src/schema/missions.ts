import { pgTable, uuid, varchar, text, timestamp, date, jsonb, pgEnum, integer } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { workspaces } from './workspaces';
import { clients } from './clients';
import { goals, ownerTypeEnum } from './goals';

// Note: Table name remains 'projects' in database for backwards compatibility
// User-facing terminology: "Mission" (not "Project")
export const missionStatusEnum = pgEnum('project_status', ['planning', 'active', 'on_hold', 'completed', 'archived']);

export const missions = pgTable('projects', {
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
  status: missionStatusEnum('status').default('planning').notNull(),
  
  // Visual settings
  color: varchar('color', { length: 7 }), // Hex color
  icon: varchar('icon', { length: 50 }), // Icon name
  
  // Dates
  startDate: date('start_date'),
  targetDate: date('target_date'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  
  // Linked goal (Missions support Goals in PPV hierarchy)
  goalId: uuid('goal_id').references(() => goals.id, { onDelete: 'set null' }),
  
  settings: jsonb('settings').default({}).notNull(),
  position: integer('position').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Mission = typeof missions.$inferSelect;
export type InsertMission = typeof missions.$inferInsert;

// Re-export ownerTypeEnum for use in other schemas
export { ownerTypeEnum };

// Legacy aliases for backwards compatibility
export const projects = missions;
export const projectStatusEnum = missionStatusEnum;
export type Project = Mission;
export type InsertProject = InsertMission;
