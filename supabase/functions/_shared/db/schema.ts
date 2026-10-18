// Database schema, shared by the API Edge Function (Deno) and drizzle-kit (Node).
import { sql } from 'drizzle-orm';
import { check, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { authUsers } from 'drizzle-orm/supabase';

/**
 * One row per signed-up user, created after the email is confirmed (D-004).
 * RLS is enabled without policies: clients never read this table directly, only the API does.
 */
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id')
      .primaryKey()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    username: text('username').notNull().unique(),
    displayName: text('display_name').notNull(),
    avatarPath: text('avatar_path'),
    adultConfirmedAt: timestamp('adult_confirmed_at', { withTimezone: true }).notNull(),
    privacyAcceptedAt: timestamp('privacy_accepted_at', { withTimezone: true }).notNull(),
    privacyPolicyVersion: text('privacy_policy_version').notNull(),
    // Placeholder for the taste step until phase 3 stores the real taste profile.
    tasteCompletedAt: timestamp('taste_completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('profiles_username_format', sql`${table.username} ~ '^[a-z0-9._]{3,20}$'`),
    check('profiles_display_name_length', sql`char_length(${table.displayName}) between 1 and 50`),
  ],
).enableRLS();

export type ProfileRow = typeof profiles.$inferSelect;
