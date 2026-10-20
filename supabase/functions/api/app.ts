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
import { type Genre, tasteInputSchema } from '../_shared/contracts/genres.ts';
import {
  computeTaste,
  manualGenreSignals,
  type TasteResult,
} from '../_shared/taste/compute-taste.ts';

/** Version of the privacy notice users accept at sign-up. Bump it when the text changes. */
export const PRIVACY_POLICY_VERSION = 'draft-2026-10';

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
  /** Replaces the choice and the profile, and marks the taste step as done. */
  save(userId: string, genres: readonly Genre[], taste: TasteResult, at: Date): Promise<void>;
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

export function createApp({ profiles, tastes, newId, now }: ApiDeps) {
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
