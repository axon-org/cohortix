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
import { domains } from './domains';
import { ownerTypeEnum } from './missions';

// User-facing terminology: "Vision" (Emotional north star - big WHY)
// PPV Pro equivalent: "Life Aspirations"
export const visionStatusEnum = pgEnum('vision_status', [
  'active',
  'on_hold',
  'achieved',
  'archived',
]);

export const visions = pgTable('visions', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Polymorphic owner (user or agent)
  ownerType: ownerTypeEnum('owner_type').notNull(),
  ownerId: uuid('owner_id').notNull(),

  // Created by (who defined this vision)
  createdByType: ownerTypeEnum('created_by_type').notNull(),
  createdById: uuid('created_by_id').notNull(),

  // Linked domain (Visions roll up to Domains)
  domainId: uuid('domain_id')
    .notNull()
    .references(() => domains.id, { onDelete: 'cascade' }),

  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),

  // Why this matters (emotional driver)
  whyStatement: text('why_statement'),

  status: visionStatusEnum('status').default('active').notNull(),

  // Visual settings
  color: varchar('color', { length: 7 }), // Hex color
  icon: varchar('icon', { length: 50 }), // Icon name

  // Ordering within domain
  orderIndex: integer('order_index').default(0).notNull(),

  // Achievement tracking (optional - visions are aspirational)
  achievedAt: timestamp('achieved_at', { withTimezone: true }),

  // Metadata
  metadata: jsonb('metadata').default({}).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Vision = typeof visions.$inferSelect;
export type InsertVision = typeof visions.$inferInsert;

// Legacy aliases for backwards compatibility
export const aspirations = visions;
export const aspirationStatusEnum = visionStatusEnum;
export type Aspiration = Vision;
export type InsertAspiration = InsertVision;
