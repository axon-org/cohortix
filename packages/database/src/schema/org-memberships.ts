import { pgTable, uuid, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const orgRoleEnum = pgEnum('org_role', ['owner', 'admin', 'member', 'viewer']);

export const organizationMemberships = pgTable('organization_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  // References auth.users(id) from Supabase Auth
  userId: uuid('user_id').notNull(),
  role: orgRoleEnum('role').default('member').notNull(),
  permissions: jsonb('permissions').default({}).notNull(),
  invitedBy: uuid('invited_by'),
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type OrganizationMembership = typeof organizationMemberships.$inferSelect;
export type InsertOrganizationMembership = typeof organizationMemberships.$inferInsert;
