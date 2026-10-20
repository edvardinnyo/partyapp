/**
 * @jest-environment node
 */
import {
  type Accounts,
  type ApiBindings,
  type AvatarStorage,
  createApp,
  type NewProfile,
  PRIVACY_POLICY_VERSION,
  type ProfileRepository,
  type StoredProfile,
} from './app.ts';

const USER_ID = '7b6f1d2e-0000-4000-8000-000000000001';
const OTHER_USER_ID = '7b6f1d2e-0000-4000-8000-000000000002';
const NOW = new Date('2026-10-18T20:00:00Z');

function createFakes() {
  const rows = new Map<string, NewProfile & { tasteCompletedAt: Date | null }>();
  const files = new Set<string>();
  const deletedUsers: string[] = [];

  const toStored = (row: NewProfile & { tasteCompletedAt: Date | null }): StoredProfile => ({
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    avatarPath: row.avatarPath,
    tasteCompletedAt: row.tasteCompletedAt,
  });

  const profiles: ProfileRepository = {
    findById: async (userId) => {
      const row = rows.get(userId);
      return row ? toStored(row) : null;
    },
    isUsernameTaken: async (username) => [...rows.values()].some((r) => r.username === username),
    create: async (profile) => {
      if (rows.has(profile.id)) return 'profile_exists';
      if ([...rows.values()].some((r) => r.username === profile.username)) return 'username_taken';
      const row = { ...profile, tasteCompletedAt: null };
      rows.set(profile.id, row);
      return toStored(row);
    },
    markTasteCompleted: async (userId, at) => {
      const row = rows.get(userId);
      if (!row) return null;
      row.tasteCompletedAt = at;
      return toStored(row);
    },
    update: async (userId, { displayName, avatarPath }) => {
      const row = rows.get(userId);
      if (!row) return null;
      if (displayName !== undefined) row.displayName = displayName;
      if (avatarPath !== undefined) row.avatarPath = avatarPath;
      return toStored(row);
    },
  };

  const avatars: AvatarStorage = {
    createUploadUrl: async (path) => ({ path, token: 'upload-token' }),
    exists: async (path) => files.has(path),
    createSignedUrl: async (path) => `https://storage.test/${path}?signed`,
    remove: async (path) => {
      files.delete(path);
    },
    removeAll: async (userId) => {
      for (const path of [...files]) if (path.startsWith(`${userId}/`)) files.delete(path);
    },
  };

  const accounts: Accounts = {
    deleteUser: async (userId) => {
      deletedUsers.push(userId);
      rows.delete(userId);
    },
  };

  return { rows, files, deletedUsers, profiles, avatars, accounts };
}

function setup() {
  const fakes = createFakes();
  const app = createApp({ profiles: fakes.profiles, newId: () => 'file-1', now: () => NOW });
  const bindings: ApiBindings = {
    userId: USER_ID,
    avatars: fakes.avatars,
    accounts: fakes.accounts,
  };
  const request = (path: string, init?: RequestInit) => app.request(`/api${path}`, init, bindings);
  const post = (path: string, body?: unknown) =>
    request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const patch = (path: string, body?: unknown) =>
    request(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  return { ...fakes, request, post, patch };
}

const validProfile = {
  displayName: 'Fekete Olivér',
  username: 'oli.fekete',
  avatarPath: null,
  adultConfirmed: true,
  privacyAccepted: true,
};

describe('GET /api/me', () => {
  it('returns no profile before onboarding', async () => {
    const { request } = setup();

    const response = await request('/me');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ profile: null });
  });

  it('returns the profile with a signed avatar URL', async () => {
    const { request, post, files } = setup();
    files.add(`${USER_ID}/file-1.jpg`);
    await post('/profile', { ...validProfile, avatarPath: `${USER_ID}/file-1.jpg` });

    const body = await (await request('/me')).json();

    expect(body.profile).toEqual({
      id: USER_ID,
      username: 'oli.fekete',
      displayName: 'Fekete Olivér',
      avatarUrl: `https://storage.test/${USER_ID}/file-1.jpg?signed`,
      tasteCompleted: false,
    });
  });
});

describe('GET /api/usernames/:username', () => {
  it('rejects usernames that break the rules', async () => {
    const { request } = setup();

    for (const invalid of ['ab', 'a'.repeat(21), 'oli fekete', 'olí']) {
      const response = await request(`/usernames/${encodeURIComponent(invalid)}`);
      expect(response.status).toBe(400);
    }
  });

  it('reports availability case-insensitively', async () => {
    const { request, post } = setup();
    await post('/profile', validProfile);

    expect(await (await request('/usernames/Oli.Fekete')).json()).toEqual({ available: false });
    expect(await (await request('/usernames/oli_fekete')).json()).toEqual({ available: true });
  });
});

describe('POST /api/profile', () => {
  it('creates the profile and records the 18+ and privacy acceptance', async () => {
    const { post, rows } = setup();

    const response = await post('/profile', validProfile);

    expect(response.status).toBe(201);
    expect(rows.get(USER_ID)).toMatchObject({
      username: 'oli.fekete',
      displayName: 'Fekete Olivér',
      adultConfirmedAt: NOW,
      privacyAcceptedAt: NOW,
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
    });
  });

  it('requires both the 18+ confirmation and the privacy acceptance', async () => {
    const { post } = setup();

    expect((await post('/profile', { ...validProfile, adultConfirmed: false })).status).toBe(400);
    expect((await post('/profile', { ...validProfile, privacyAccepted: false })).status).toBe(400);
    expect((await post('/profile')).status).toBe(400);
  });

  it('only accepts an uploaded avatar from the user’s own folder', async () => {
    const { post, files } = setup();
    files.add(`${OTHER_USER_ID}/file-1.jpg`);

    const foreign = await post('/profile', {
      ...validProfile,
      avatarPath: `${OTHER_USER_ID}/file-1.jpg`,
    });
    const missing = await post('/profile', {
      ...validProfile,
      avatarPath: `${USER_ID}/missing.jpg`,
    });

    expect(foreign.status).toBe(400);
    expect(await foreign.json()).toEqual({ error: 'invalid_avatar' });
    expect(missing.status).toBe(400);
  });

  it('rejects a taken username and a second profile', async () => {
    const { post, rows } = setup();
    rows.set(OTHER_USER_ID, {
      id: OTHER_USER_ID,
      username: 'taken.name',
      displayName: 'Other',
      avatarPath: null,
      adultConfirmedAt: NOW,
      privacyAcceptedAt: NOW,
      privacyPolicyVersion: PRIVACY_POLICY_VERSION,
      tasteCompletedAt: null,
    });

    const taken = await post('/profile', { ...validProfile, username: 'taken.name' });
    await post('/profile', validProfile);
    const second = await post('/profile', { ...validProfile, username: 'another.one' });

    expect(taken.status).toBe(409);
    expect(await taken.json()).toEqual({ error: 'username_taken' });
    expect(second.status).toBe(409);
    expect(await second.json()).toEqual({ error: 'profile_exists' });
  });
});

describe('POST /api/profile/avatar-upload', () => {
  it('issues an upload URL inside the user’s own folder', async () => {
    const { post } = setup();

    const body = await (await post('/profile/avatar-upload')).json();

    expect(body).toEqual({ path: `${USER_ID}/file-1.jpg`, token: 'upload-token' });
  });
});

describe('PATCH /api/profile (D-006)', () => {
  it('needs an existing profile', async () => {
    const { patch } = setup();

    const response = await patch('/profile', { displayName: 'Oli' });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'profile_missing' });
  });

  it('changes the display name but never the username', async () => {
    const { post, patch, rows } = setup();
    await post('/profile', validProfile);

    const response = await patch('/profile', { displayName: 'Oli', username: 'other.name' });

    expect(response.status).toBe(200);
    expect(rows.get(USER_ID)).toMatchObject({ displayName: 'Oli', username: 'oli.fekete' });
  });

  it('replaces the picture and deletes the old file', async () => {
    const { post, patch, files } = setup();
    files.add(`${USER_ID}/old.jpg`);
    files.add(`${USER_ID}/new.jpg`);
    await post('/profile', { ...validProfile, avatarPath: `${USER_ID}/old.jpg` });

    const body = await (await patch('/profile', { avatarPath: `${USER_ID}/new.jpg` })).json();

    expect(body.profile.avatarUrl).toBe(`https://storage.test/${USER_ID}/new.jpg?signed`);
    expect([...files]).toEqual([`${USER_ID}/new.jpg`]);
  });

  it('removes the picture', async () => {
    const { post, patch, files } = setup();
    files.add(`${USER_ID}/old.jpg`);
    await post('/profile', { ...validProfile, avatarPath: `${USER_ID}/old.jpg` });

    const body = await (await patch('/profile', { avatarPath: null })).json();

    expect(body.profile.avatarUrl).toBeNull();
    expect([...files]).toEqual([]);
  });

  it('rejects a picture outside the own folder and an empty change', async () => {
    const { post, patch, files } = setup();
    files.add(`${OTHER_USER_ID}/file.jpg`);
    await post('/profile', validProfile);

    const foreign = await patch('/profile', { avatarPath: `${OTHER_USER_ID}/file.jpg` });
    const empty = await patch('/profile', {});
    const blankName = await patch('/profile', { displayName: '   ' });

    expect(foreign.status).toBe(400);
    expect(await foreign.json()).toEqual({ error: 'invalid_avatar' });
    expect(empty.status).toBe(400);
    expect(blankName.status).toBe(400);
  });
});

describe('POST /api/onboarding/taste', () => {
  it('needs a profile first', async () => {
    const { post } = setup();

    const response = await post('/onboarding/taste');

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'profile_missing' });
  });

  it('marks the taste step as done', async () => {
    const { post } = setup();
    await post('/profile', validProfile);

    const body = await (await post('/onboarding/taste')).json();

    expect(body.profile.tasteCompleted).toBe(true);
  });
});

describe('DELETE /api/account', () => {
  it('removes the avatars and deletes the user', async () => {
    const { request, post, files, deletedUsers } = setup();
    files.add(`${USER_ID}/file-1.jpg`);
    files.add(`${OTHER_USER_ID}/file-1.jpg`);
    await post('/profile', { ...validProfile, avatarPath: `${USER_ID}/file-1.jpg` });

    const response = await request('/account', { method: 'DELETE' });

    expect(response.status).toBe(204);
    expect(deletedUsers).toEqual([USER_ID]);
    expect([...files]).toEqual([`${OTHER_USER_ID}/file-1.jpg`]);
  });
});

describe('errors', () => {
  it('hides internal errors behind a generic code', async () => {
    const { request, profiles } = setup();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    profiles.findById = async () => {
      throw new Error('database is down');
    };

    const response = await request('/me');

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'internal' });
  });
});
