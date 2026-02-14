import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

/**
 * Profiles table - user profiles synced from Clerk
 * Note: User authentication is handled by Clerk
 * This table stores user profile information synced via webhook
 */
export const profiles = pgTable('profiles', {
  // Internal ID for foreign key relationships
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Clerk user ID - source of truth for authentication
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique(),
  
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  settings: jsonb('settings').default({}).notNull(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

// Alias for backwards compatibility
export const users = profiles;
export type User = Profile;
export type InsertUser = InsertProfile;
