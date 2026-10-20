// Database schema, shared by the API Edge Function (Deno) and drizzle-kit (Node).
import { sql } from 'drizzle-orm';
import {
  check,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { authUsers } from 'drizzle-orm/supabase';

import { GENRES } from '../contracts/genres.ts';
import type { GenreScore } from '../taste/compute-taste.ts';

/** D-005: the common genre list, shared with events later (Q3). */
export const genreEnum = pgEnum('genre', GENRES);

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
    // Set when the taste step is first completed (onboarding, D-004/5).
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

/** The manual choice (D-001, D-005): `position` 0 is the favourite. */
export const tasteGenres = pgTable(
  'taste_genres',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    genre: genreEnum('genre').notNull(),
    position: smallint('position').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.genre] }),
    unique('taste_genres_user_position_unique').on(table.userId, table.position),
  ],
).enableRLS();

/** The computed taste profile (F1). Listening history is never stored (D-005). */
export const tasteProfiles = pgTable('taste_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  topGenres: genreEnum('top_genres').array().notNull(),
  genreScores: jsonb('genre_scores').$type<GenreScore[]>().notNull(),
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull(),
}).enableRLS();
