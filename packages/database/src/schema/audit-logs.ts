import { pgTable, uuid, varchar, timestamp, jsonb, pgEnum, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const authorTypeEnum = pgEnum('author_type', ['user', 'agent', 'system']);

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  
  // Actor
  actorType: authorTypeEnum('actor_type').notNull(),
  actorId: uuid('actor_id'), // NULL for system actions
  
  // Action
  action: varchar('action', { length: 100 }).notNull(), // 'create', 'update', 'delete', etc.
  
  // Resource
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: uuid('resource_id').notNull(),
  
  // Change details
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  
  // Request context
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: varchar('user_agent', { length: 500 }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  orgIdx: index('idx_audit_logs_org').on(table.organizationId),
  resourceIdx: index('idx_audit_logs_resource').on(table.resourceType, table.resourceId),
  actorIdx: index('idx_audit_logs_actor').on(table.actorType, table.actorId),
  createdIdx: index('idx_audit_logs_created').on(table.createdAt),
  actionIdx: index('idx_audit_logs_action').on(table.action),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
