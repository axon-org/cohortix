import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  bigint,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const agentStatusEnum = pgEnum('agent_status', [
  'active',
  'idle',
  'busy',
  'offline',
  'error',
]);

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  externalId: varchar('external_id', { length: 255 }), // ID in external runtime (e.g., Clawdbot)
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  avatarUrl: text('avatar_url'),
  role: varchar('role', { length: 255 }), // e.g., "AI Developer", "UI Designer"
  description: text('description'),
  status: agentStatusEnum('status').default('idle').notNull(),
  capabilities: jsonb('capabilities').default([]).notNull(), // ["coding", "design", "research"]

  // Runtime configuration (Clawdbot now, custom later)
  runtimeType: varchar('runtime_type', { length: 50 }).default('clawdbot').notNull(),
  runtimeConfig: jsonb('runtime_config').default({}).notNull(),

  // Metrics
  totalTasksCompleted: integer('total_tasks_completed').default(0).notNull(),
  totalTimeWorkedMs: bigint('total_time_worked_ms', { mode: 'number' }).default(0).notNull(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),

  settings: jsonb('settings').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;
