import { pgTable, uuid, varchar, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { ownerTypeEnum } from './missions';

// User-facing terminology: "Domain" (Core life/expertise area - top of PPV pyramid)
// PPV Pro equivalent: "Pillars & Purpose"
export const domains = pgTable('domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Polymorphic owner (user or agent)
  ownerType: ownerTypeEnum('owner_type').notNull(),
  ownerId: uuid('owner_id').notNull(),

  // Created by (who defined this domain)
  createdByType: ownerTypeEnum('created_by_type').notNull(),
  createdById: uuid('created_by_id').notNull(),

  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),

  // Visual settings
  color: varchar('color', { length: 7 }), // Hex color
  icon: varchar('icon', { length: 50 }), // Icon name

  // Ordering
  orderIndex: integer('order_index').default(0).notNull(),

  // Metadata
  metadata: jsonb('metadata').default({}).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Domain = typeof domains.$inferSelect;
export type InsertDomain = typeof domains.$inferInsert;

// Legacy aliases for backwards compatibility
export const pillars = domains;
export type Pillar = Domain;
export type InsertPillar = InsertDomain;
