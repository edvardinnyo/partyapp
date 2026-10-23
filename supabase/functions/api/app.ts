// The API's routes and rules. Runtime-independent, so Jest can test it with fake dependencies;
// index.ts wires it to Supabase and the database.
import { Hono } from 'hono';

import {
  type PartnerDetails,
  partnerApplicationInputSchema,
  partnerResubmissionInputSchema,
} from '../_shared/contracts/partner.ts';
import {
  type AccountType,
  type ApiErrorCode,
  createProfileInputSchema,
  normalizeUsername,
  type PartnerStatus,
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
import {
  clashesWithProtectedNames,
  type ProtectedName,
} from '../_shared/partners/protected-names.ts';
import { type RecommendationTaste, scoreEvent } from '../_shared/recommendation/score-event.ts';
import {
  computeTaste,
  manualGenreSignals,
  type TasteResult,
} from '../_shared/taste/compute-taste.ts';

/** Version of the privacy notice users accept at sign-up. Bump it when the text changes. */
export const PRIVACY_POLICY_VERSION = 'draft-2026-10';

/** Version of the partner terms (D-008/12). Bump it when the text changes. */
export const PARTNER_TERMS_VERSION = 'draft-2026-10';

/** A safety limit for one map's worth of events (the nearest ones are kept). */
export const NEARBY_EVENTS_LIMIT = 500;

export type StoredProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
  tasteCompletedAt: Date | null;
  accountType: AccountType;
};

export type NewProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarPath: string | null;
  accountType: AccountType;
  /** Null for a partner: a company has no age (D-008). */
  adultConfirmedAt: Date | null;
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
  /** D-008/5: the names of approved partners, which nobody else may take. */
  findProtectedNames(): Promise<ProtectedName[]>;
}

export type StoredPartner = PartnerDetails & {
  status: PartnerStatus;
  bio: string | null;
  rejectionReason: string | null;
  submittedAt: Date;
};

export type NewPartner = PartnerDetails & {
  termsAcceptedAt: Date;
  termsVersion: string;
  submittedAt: Date;
};

export interface PartnerRepository {
  find(userId: string): Promise<StoredPartner | null>;
  /** Creates the public profile and the partner details together. */
  createApplication(
    profile: NewProfile,
    partner: NewPartner,
  ): Promise<StoredProfile | 'username_taken' | 'profile_exists'>;
  /** A rejected application corrected: pending again, with the new details. */
  resubmit(userId: string, displayName: string, details: PartnerDetails, at: Date): Promise<void>;
  updateBio(userId: string, bio: string | null, at: Date): Promise<void>;
}

export type PartnerApplicationNotice = {
  userId: string;
  accountEmail: string | null;
  displayName: string;
  username: string;
  details: PartnerDetails;
  submittedAt: Date;
  resubmission: boolean;
};

export interface PartnerNotifier {
  /** D-008/4: tells the team about a new or a corrected application. */
  applicationSubmitted(notice: PartnerApplicationNotice): Promise<void>;
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
  partners: PartnerRepository;
  partnerNotifier: PartnerNotifier;
  tastes: TasteRepository;
  settings: SettingsRepository;
  events: EventRepository;
  newId: () => string;
  now: () => Date;
};

/** Per-request values, resolved by index.ts after the caller's JWT is verified. */
export type ApiBindings = {
  userId: string;
  /** From the JWT; the team sees it with a partner application. */
  email: string | null;
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

export function createApp({
  profiles,
  partners,
  partnerNotifier,
  tastes,
  settings,
  events,
  newId,
  now,
}: ApiDeps) {
  const app = new Hono<{ Bindings: ApiBindings }>().basePath('/api');

  async function toProfile(stored: StoredProfile, avatars: AvatarStorage): Promise<Profile> {
    const partner = stored.accountType === 'partner' ? await partners.find(stored.id) : null;
    return {
      id: stored.id,
      username: stored.username,
      displayName: stored.displayName,
      avatarUrl: stored.avatarPath ? await avatars.createSignedUrl(stored.avatarPath) : null,
      tasteCompleted: stored.tasteCompletedAt !== null,
      // D-008/11: a partner has no taste.
      topGenres: stored.accountType === 'person' ? await tastes.getTopGenres(stored.id) : [],
      accountType: stored.accountType,
      verified: partner?.status === 'approved',
      partner: partner
        ? {
            status: partner.status,
            rejectionReason: partner.rejectionReason,
            companyName: partner.companyName,
            taxNumber: partner.taxNumber,
            contactName: partner.contactName,
            contactPhone: partner.contactPhone,
            address: partner.address,
            website: partner.website,
            bio: partner.bio,
          }
        : null,
    };
  }

  /** D-008/5: whether any of the names comes too close to a verified partner's. */
  async function isProtected(names: string[], userId: string) {
    return clashesWithProtectedNames(names, await profiles.findProtectedNames(), userId);
  }

  /** The application is saved either way; a failed email must not lose it. */
  async function notifyTeam(notice: PartnerApplicationNotice) {
    try {
      await partnerNotifier.applicationSubmitted(notice);
    } catch (error) {
      console.error('[partners] the application email could not be sent', error);
    }
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
    if (await profiles.isUsernameTaken(parsed.data)) {
      return c.json({ available: false, reason: 'taken' });
    }
    if (await isProtected([parsed.data], c.env.userId)) {
      return c.json({ available: false, reason: 'protected' });
    }
    return c.json({ available: true, reason: null });
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
    if (await isProtected([username, displayName], userId)) {
      return c.json(apiError('name_protected'), 409);
    }

    const acceptedAt = now();
    const created = await profiles.create({
      id: userId,
      username,
      displayName,
      avatarPath,
      accountType: 'person',
      adultConfirmedAt: acceptedAt,
      privacyAcceptedAt: acceptedAt,
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
    });
    if (created === 'username_taken' || created === 'profile_exists') {
      return c.json(apiError(created), 409);
    }
    return c.json({ profile: await toProfile(created, avatars) }, 201);
  });

  // D-008: a partner's first application creates its profile; the team is told by email and
  // decides. Until then the partner can sign in but cannot publish.
  app.post('/partner/application', async (c) => {
    const parsed = partnerApplicationInputSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(apiError('invalid_input'), 400);
    }
    const { displayName, username, avatarPath, ...input } = parsed.data;
    const details: PartnerDetails = {
      companyName: input.companyName,
      taxNumber: input.taxNumber,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      address: input.address,
      website: input.website,
    };
    const { userId, avatars } = c.env;

    if (avatarPath !== null && !(await isUsableAvatar(avatarPath, userId, avatars))) {
      return c.json(apiError('invalid_avatar'), 400);
    }
    if (await isProtected([username, displayName], userId)) {
      return c.json(apiError('name_protected'), 409);
    }

    const submittedAt = now();
    const created = await partners.createApplication(
      {
        id: userId,
        username,
        displayName,
        avatarPath,
        accountType: 'partner',
        adultConfirmedAt: null,
        privacyAcceptedAt: submittedAt,
        privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      },
      {
        ...details,
        termsAcceptedAt: submittedAt,
        termsVersion: PARTNER_TERMS_VERSION,
        submittedAt,
      },
    );
    if (created === 'username_taken' || created === 'profile_exists') {
      return c.json(apiError(created), 409);
    }
    await notifyTeam({
      userId,
      accountEmail: c.env.email,
      displayName,
      username,
      details,
      submittedAt,
      resubmission: false,
    });
    return c.json({ profile: await toProfile(created, avatars) }, 201);
  });

  // D-008/4: after a rejection the partner corrects the application and sends it again.
  app.put('/partner/application', async (c) => {
    const parsed = partnerResubmissionInputSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(apiError('invalid_input'), 400);
    }
    const { displayName, ...details } = parsed.data;
    const { userId, avatars } = c.env;

    const current = await profiles.findById(userId);
    if (!current) {
      return c.json(apiError('profile_missing'), 409);
    }
    const partner = current.accountType === 'partner' ? await partners.find(userId) : null;
    if (partner?.status !== 'rejected') {
      return c.json(apiError('forbidden'), 403);
    }
    if (await isProtected([displayName], userId)) {
      return c.json(apiError('name_protected'), 409);
    }

    const submittedAt = now();
    await partners.resubmit(userId, displayName, details, submittedAt);
    await notifyTeam({
      userId,
      accountEmail: c.env.email,
      displayName,
      username: current.username,
      details,
      submittedAt,
      resubmission: true,
    });
    const updated = await profiles.findById(userId);
    return c.json({ profile: updated ? await toProfile(updated, avatars) : null });
  });

  // D-006: edit the own profile after sign-up. The username stays fixed (D-004). A partner
  // changes its logo and introduction here; its public name belongs to the application (D-008).
  app.patch('/profile', async (c) => {
    const parsed = updateProfileInputSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) {
      return c.json(apiError('invalid_input'), 400);
    }
    const { displayName, avatarPath, bio } = parsed.data;
    const { userId, avatars } = c.env;

    const current = await profiles.findById(userId);
    if (!current) {
      return c.json(apiError('profile_missing'), 409);
    }
    const isPartner = current.accountType === 'partner';
    if ((isPartner && displayName !== undefined) || (!isPartner && bio !== undefined)) {
      return c.json(apiError('forbidden'), 403);
    }
    if (typeof avatarPath === 'string' && !(await isUsableAvatar(avatarPath, userId, avatars))) {
      return c.json(apiError('invalid_avatar'), 400);
    }
    if (displayName !== undefined && (await isProtected([displayName], userId))) {
      return c.json(apiError('name_protected'), 409);
    }

    const at = now();
    const updated = await profiles.update(userId, { displayName, avatarPath }, at);
    if (!updated) {
      return c.json(apiError('profile_missing'), 409);
    }
    if (bio !== undefined) {
      await partners.updateBio(userId, bio, at);
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
    const current = await profiles.findById(userId);
    if (!current) {
      return c.json(apiError('profile_missing'), 409);
    }
    // D-008/11: partners do not choose a taste.
    if (current.accountType === 'partner') {
      return c.json(apiError('forbidden'), 403);
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
