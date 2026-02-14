import { pgTable, uuid, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

/**
 * Profiles table - extends Supabase Auth users
 * Note: User authentication is handled by Supabase Auth (auth.users table)
 * This table stores additional profile information
 */
export const profiles = pgTable('profiles', {
  // References auth.users(id) - managed by Supabase Auth
  id: uuid('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  settings: jsonb('settings').default({}).notNull(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

// Alias for backwards compatibility
export const users = profiles;
export type User = Profile;
export type InsertUser = InsertProfile;
