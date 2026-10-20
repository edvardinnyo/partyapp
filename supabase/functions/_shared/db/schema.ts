// Database schema, shared by the API Edge Function (Deno) and drizzle-kit (Node).
import { sql } from 'drizzle-orm';
import {
  check,
  customType,
  doublePrecision,
  index,
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

import { EVENT_KINDS } from '../contracts/events.ts';
import { GENRES } from '../contracts/genres.ts';
import { DEFAULT_RADIUS_KM, MAX_RADIUS_KM, MIN_RADIUS_KM } from '../contracts/settings.ts';
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

/** Q6: the search radius set with the slider; a missing row means the defaults. */
export const userSettings = pgTable(
  'user_settings',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    searchRadiusKm: smallint('search_radius_km').notNull().default(DEFAULT_RADIUS_KM),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      'user_settings_search_radius_range',
      sql`${table.searchRadiusKm} between ${sql.raw(String(MIN_RADIUS_KM))} and ${sql.raw(String(MAX_RADIUS_KM))}`,
    ),
  ],
).enableRLS();

export const eventKindEnum = pgEnum('event_kind', EVENT_KINDS);

/** A PostGIS point on the earth's surface (WGS 84); distances on it are in metres. */
const geographyPoint = customType<{ data: string; driverData: string }>({
  dataType: () => 'extensions.geography(Point,4326)',
});

/**
 * D-007/1: venues and events come from sources (the team's CSV now, partner feeds later), always
 * through `public.import_events`. `source` + `external_id` identify a row within its source.
 */
export const venues = pgTable(
  'venues',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    source: text('source').notNull(),
    externalId: text('external_id').notNull(),
    name: text('name').notNull(),
    address: text('address').notNull(),
    lat: doublePrecision('lat').notNull(),
    lng: doublePrecision('lng').notNull(),
    // Derived from lat/lng, for the distance search (F1: within the user's radius).
    location: geographyPoint('location').generatedAlwaysAs(
      sql`extensions.st_setsrid(extensions.st_makepoint("lng", "lat"), 4326)::extensions.geography`,
    ),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('venues_source_external_id_unique').on(table.source, table.externalId),
    check('venues_lat_range', sql`${table.lat} between -90 and 90`),
    check('venues_lng_range', sql`${table.lng} between -180 and 180`),
    index('venues_location_idx').using('gist', table.location),
  ],
).enableRLS();

/** The status (upcoming, live, closed) is never stored: it follows from the times (PHASE0.md 8). */
export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    source: text('source').notNull(),
    externalId: text('external_id').notNull(),
    venueId: uuid('venue_id')
      .notNull()
      .references(() => venues.id, { onDelete: 'restrict' }),
    title: text('title').notNull(),
    kind: eventKindEnum('kind').notNull(),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    genres: genreEnum('genres').array().notNull(),
    performers: text('performers')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** D-007/4: the partner's ticket page, once tickets are sold through partners. */
    ticketUrl: text('ticket_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('events_source_external_id_unique').on(table.source, table.externalId),
    check('events_ends_after_start', sql`${table.endsAt} > ${table.startsAt}`),
    check('events_has_genre', sql`cardinality(${table.genres}) > 0`),
    index('events_ends_at_idx').on(table.endsAt),
    index('events_venue_id_idx').on(table.venueId),
  ],
).enableRLS();
