// The API's routes and rules. Runtime-independent, so Jest can test it with fake dependencies;
// index.ts wires it to Supabase and the database.
import { Hono } from 'hono';

import {
  type ApiErrorCode,
  createProfileInputSchema,
  normalizeUsername,
  type Profile,
  updateProfileInputSchema,
  usernameSchema,
} from '../_shared/contracts/profile.ts';
import {
  type EventDetail,
  eventIdSchema,
  type EventSummary,
  type EventVenue,
  nearbyEventsInputSchema,
} from '../_shared/contracts/events.ts';
import { type Genre, tasteInputSchema } from '../_shared/contracts/genres.ts';
import {
  DEFAULT_USER_SETTINGS,
  MAX_RADIUS_KM,
  type UserSettings,
  userSettingsSchema,
} from '../_shared/contracts/settings.ts';
import { shownEventWindow } from '../_shared/events/lifecycle.ts';
import { type RecommendationTaste, scoreEvent } from '../_shared/recommendation/score-event.ts';
import {
  computeTaste,
  manualGenreSignals,
  type TasteResult,
} from '../_shared/taste/compute-taste.ts';

/** Version of the privacy notice users accept at sign-up. Bump it when the text changes. */
export const PRIVACY_POLICY_VERSION = 'draft-2026-10';

/** A safety limit for one map's worth of events (the nearest ones are kept). */
export const NEARBY_EVENTS_LIMIT = 500;

export type StoredProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
  tasteCompletedAt: Date | null;
};

export type NewProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
  adultConfirmedAt: Date;
  privacyAcceptedAt: Date;
  privacyPolicyVersion: string;
};

export interface ProfileRepository {
  findById(userId: string): Promise<StoredProfile | null>;
  isUsernameTaken(username: string): Promise<boolean>;
  create(profile: NewProfile): Promise<StoredProfile | 'username_taken' | 'profile_exists'>;
  update(
    userId: string,
    changes: { displayName?: string; avatarPath?: string | null },
    at: Date,
  ): Promise<StoredProfile | null>;
}

export interface TasteRepository {
  /** The manual choice, favourite first. */
  getChosenGenres(userId: string): Promise<Genre[]>;
  getTopGenres(userId: string): Promise<Genre[]>;
  /** The computed taste profile, or null before the taste step. */
  getResult(userId: string): Promise<TasteResult | null>;
  /** Replaces the choice and the profile, and marks the taste step as done. */
  save(userId: string, genres: readonly Genre[], taste: TasteResult, at: Date): Promise<void>;
}

export interface SettingsRepository {
  /** Null until the user changes a setting for the first time. */
  find(userId: string): Promise<UserSettings | null>;
  save(userId: string, settings: UserSettings, at: Date): Promise<void>;
}

export type StoredEvent = {
  id: string;
  title: string;
  kind: string;
  startsAt: Date;
  endsAt: Date;
  genres: string[];
  performers: string[];
  venue: EventVenue;
};

export type NearbyEventsQuery = {
  lat: number;
  lng: number;
  radiusKm: number;
  /** Live or upcoming: ends after this… */
  endsAfter: Date;
  /** …and starts before this. */
  startsBefore: Date;
  limit: number;
};

export interface EventRepository {
  /** The events in the time range within `radiusKm` of the point, nearest first. */
  findNearby(query: NearbyEventsQuery): Promise<(StoredEvent & { distanceKm: number })[]>;
  findById(id: string): Promise<StoredEvent | null>;
}

export interface AvatarStorage {
  createUploadUrl(path: string): Promise<{ path: string; token: string }>;
  exists(path: string): Promise<boolean>;
  createSignedUrl(path: string): Promise<string | null>;
  remove(path: string): Promise<void>;
  removeAll(userId: string): Promise<void>;
}

export interface Accounts {
  deleteUser(userId: string): Promise<void>;
}

export type ApiDeps = {
  profiles: ProfileRepository;
  tastes: TasteRepository;
  settings: SettingsRepository;
  events: EventRepository;
  newId: () => string;
  now: () => Date;
};

/** Per-request values, resolved by index.ts after the caller's JWT is verified. */
export type ApiBindings = {
  userId: string;
  avatars: AvatarStorage;
  accounts: Accounts;
};

function apiError(error: ApiErrorCode) {
  return { error };
}

/** An uploaded avatar the user may use: in their own folder, and actually there. */
async function isUsableAvatar(path: string, userId: string, avatars: AvatarStorage) {
  return path.startsWith(`${userId}/`) && !path.includes('..') && (await avatars.exists(path));
}

function toEventBase(event: StoredEvent) {
  return {
    id: event.id,
    title: event.title,
    kind: event.kind,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt.toISOString(),
    venue: event.venue,
    genres: event.genres,
  };
}

export function createApp({ profiles, tastes, settings, events, newId, now }: ApiDeps) {
  const app = new Hono<{ Bindings: ApiBindings }>().basePath('/api');

  async function toProfile(stored: StoredProfile, avatars: AvatarStorage): Promise<Profile> {
    return {
      id: stored.id,
      username: stored.username,
      displayName: stored.displayName,
      avatarUrl: stored.avatarPath ? await avatars.createSignedUrl(stored.avatarPath) : null,
      tasteCompleted: stored.tasteCompletedAt !== null,
      topGenres: await tastes.getTopGenres(stored.id),
    };
  }

  app.get('/me', async (c) => {
    const stored = await profiles.findById(c.env.userId);
    return c.json({ profile: stored ? await toProfile(stored, c.env.avatars) : null });
  });

  app.get('/usernames/:username', async (c) => {
    const parsed = usernameSchema.safeParse(normalizeUsername(c.req.param('username')));
    if (!parsed.success) {
      return c.json(apiError('invalid_input'), 400);
    }
    return c.json({ available: !(await profiles.isUsernameTaken(parsed.data)) });
  });

  app.post('/profile/avatar-upload', async (c) => {
    // Every user writes only below their own folder; the file name is never chosen by the client.
    const upload = await c.env.avatars.createUploadUrl(`${c.env.userId}/${newId()}.jpg`);
    return c.json(upload);
  });

  app.post('/profile', async (c) => {
    const parsed = createProfileInputSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(apiError('invalid_input'), 400);
    }
    const { displayName, username, avatarPath } = parsed.data;
    const { userId, avatars } = c.env;

    if (avatarPath !== null && !(await isUsableAvatar(avatarPath, userId, avatars))) {
      return c.json(apiError('invalid_avatar'), 400);
    }

    const acceptedAt = now();
    const created = await profiles.create({
      id: userId,
      username,
      displayName,
      avatarPath,
      adultConfirmedAt: acceptedAt,
      privacyAcceptedAt: acceptedAt,
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
    });
    if (created === 'username_taken' || created === 'profile_exists') {
      return c.json(apiError(created), 409);
    }
    return c.json({ profile: await toProfile(created, avatars) }, 201);
  });

  // D-006: edit the own profile after sign-up. The username stays fixed (D-004).
  app.patch('/profile', async (c) => {
    const parsed = updateProfileInputSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(apiError('invalid_input'), 400);
    }
    const { displayName, avatarPath } = parsed.data;
    const { userId, avatars } = c.env;

    const current = await profiles.findById(userId);
    if (!current) {
      return c.json(apiError('profile_missing'), 409);
    }
    if (typeof avatarPath === 'string' && !(await isUsableAvatar(avatarPath, userId, avatars))) {
      return c.json(apiError('invalid_avatar'), 400);
    }

    const updated = await profiles.update(userId, { displayName, avatarPath }, now());
    if (!updated) {
      return c.json(apiError('profile_missing'), 409);
    }
    // A replaced or removed picture is deleted right away, so no orphaned files stay behind.
    if (avatarPath !== undefined && current.avatarPath && current.avatarPath !== avatarPath) {
      await avatars.remove(current.avatarPath);
    }
    return c.json({ profile: await toProfile(updated, avatars) });
  });

  app.get('/taste', async (c) => {
    return c.json({ genres: await tastes.getChosenGenres(c.env.userId) });
  });

  // D-001, D-005: the manual choice in the user's order; saving it computes the taste profile
  // and completes the onboarding taste step.
  app.put('/taste', async (c) => {
    const parsed = tasteInputSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(apiError('invalid_input'), 400);
    }
    const { userId, avatars } = c.env;
    if (!(await profiles.findById(userId))) {
      return c.json(apiError('profile_missing'), 409);
    }

    const { genres } = parsed.data;
    await tastes.save(userId, genres, computeTaste({ manual: manualGenreSignals(genres) }), now());

    const updated = await profiles.findById(userId);
    return c.json({ profile: updated ? await toProfile(updated, avatars) : null });
  });

  app.get('/settings', async (c) => {
    return c.json({ settings: (await settings.find(c.env.userId)) ?? DEFAULT_USER_SETTINGS });
  });

  // Q6: the search radius, set with the slider on the map.
  app.put('/settings', async (c) => {
    const parsed = userSettingsSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(apiError('invalid_input'), 400);
    }
    if (!(await profiles.findById(c.env.userId))) {
      return c.json(apiError('profile_missing'), 409);
    }
    await settings.save(c.env.userId, parsed.data, now());
    return c.json({ settings: parsed.data });
  });

  // F1, F5: every live or upcoming event within the slider's maximum, as the map shows all of
  // them; each with its distance and taste score. The app picks the recommended ones with the
  // user's radius, so moving the slider needs no new request. POST keeps the position out of URLs.
  app.post('/events/nearby', async (c) => {
    const parsed = nearbyEventsInputSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(apiError('invalid_input'), 400);
    }
    const tasteResult = await tastes.getResult(c.env.userId);
    const taste: RecommendationTaste = {
      topGenres: tasteResult?.topGenres ?? [],
      genreScores: tasteResult?.scores ?? [],
      favouriteArtists: [],
    };

    const found = await events.findNearby({
      ...parsed.data,
      ...shownEventWindow(now()),
      radiusKm: MAX_RADIUS_KM,
      limit: NEARBY_EVENTS_LIMIT,
    });
    const summaries: EventSummary[] = found.map(({ distanceKm, ...event }) => ({
      ...toEventBase(event),
      distanceKm: Math.round(distanceKm * 1000) / 1000,
      score: scoreEvent(event, taste),
    }));
    return c.json({ events: summaries });
  });

  // Q8: the event page.
  app.get('/events/:id', async (c) => {
    const id = eventIdSchema.safeParse(c.req.param('id'));
    const event = id.success ? await events.findById(id.data) : null;
    if (!event) {
      return c.json(apiError('not_found'), 404);
    }
    const detail: EventDetail = { ...toEventBase(event), performers: event.performers };
    return c.json({ event: detail });
  });

  // D-004: immediate and final. The profile row goes with the auth user (ON DELETE CASCADE).
  app.delete('/account', async (c) => {
    await c.env.avatars.removeAll(c.env.userId);
    await c.env.accounts.deleteUser(c.env.userId);
    return c.body(null, 204);
  });

  app.onError((error, c) => {
    // Log only the error itself: never request bodies or tokens.
    console.error(error);
    return c.json(apiError('internal'), 500);
  });

  return app;
}
