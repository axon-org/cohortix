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
import { domains } from './domains';
// ownerTypeEnum is defined in goals.ts but we avoid circular import
// by using varchar for owner_type here (matches DB column type)

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

  // Linked domain (optional — Visions can roll up to Domains)
  domainId: uuid('domain_id').references(() => domains.id, { onDelete: 'set null' }),

  // Polymorphic owner (human only for visions)
  ownerType: varchar('owner_type', { length: 50 }).default('user').notNull(),
  ownerId: uuid('owner_id'),

  name: varchar('name', { length: 500 }).notNull(),
  description: text('description'),

  status: visionStatusEnum('status').default('active').notNull(),

  // Timeline fields for roadmap view
  targetDate: date('target_date'),
  reviewDate: date('review_date'), // Next quarterly review

  // Progress (rolled up from missions)
  progress: integer('progress').default(0),

  // Visual settings
  color: varchar('color', { length: 7 }),
  icon: varchar('icon', { length: 50 }),

  // Ordering
  orderIndex: integer('order_index').default(0).notNull(),

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
