/**
 * @jest-environment node
 */
import {
  type Accounts,
  type ApiBindings,
  type AvatarStorage,
  createApp,
  createPublicApp,
  type EventRepository,
  NEARBY_EVENTS_LIMIT,
  type NearbyEventsQuery,
  type NewPartner,
  type NewProfile,
  PARTNER_TERMS_VERSION,
  type PartnerApplicationNotice,
  type PartnerNotifier,
  type PartnerRepository,
  PRIVACY_POLICY_VERSION,
  type ProfileRepository,
  type SettingsRepository,
  type StoredEvent,
  type StoredPartner,
  type StoredProfile,
  type TasteRepository,
} from './app.ts';
import type { Genre } from '../_shared/contracts/genres.ts';
import type { UserSettings } from '../_shared/contracts/settings.ts';
import type { TasteResult } from '../_shared/taste/compute-taste.ts';

const USER_ID = '7b6f1d2e-0000-4000-8000-000000000001';
const OTHER_USER_ID = '7b6f1d2e-0000-4000-8000-000000000002';
const NOW = new Date('2026-10-18T20:00:00Z');

type ProfileRow = NewProfile & { tasteCompletedAt: Date | null };
type PartnerRow = StoredPartner & Omit<NewPartner, 'submittedAt'>;

function createFakes() {
  const rows = new Map<string, ProfileRow>();
  const partnerRows = new Map<string, PartnerRow>();
  const files = new Set<string>();
  const deletedUsers: string[] = [];
  const notices: PartnerApplicationNotice[] = [];

  const toStored = (row: ProfileRow): StoredProfile => ({
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    avatarPath: row.avatarPath,
    tasteCompletedAt: row.tasteCompletedAt,
    accountType: row.accountType,
  });

  const insertProfile = (profile: NewProfile) => {
    if (rows.has(profile.id)) return 'profile_exists' as const;
    if ([...rows.values()].some((r) => r.username === profile.username)) {
      return 'username_taken' as const;
    }
    const row = { ...profile, tasteCompletedAt: null };
    rows.set(profile.id, row);
    return toStored(row);
  };

  const profiles: ProfileRepository = {
    findById: async (userId) => {
      const row = rows.get(userId);
      return row ? toStored(row) : null;
    },
    isUsernameTaken: async (username) => [...rows.values()].some((r) => r.username === username),
    create: async (profile) => insertProfile(profile),
    update: async (userId, { displayName, avatarPath }) => {
      const row = rows.get(userId);
      if (!row) return null;
      if (displayName !== undefined) row.displayName = displayName;
      if (avatarPath !== undefined) row.avatarPath = avatarPath;
      return toStored(row);
    },
    findProtectedNames: async () =>
      [...partnerRows.entries()]
        .filter(([, partner]) => partner.status === 'approved')
        .map(([userId]) => {
          const row = rows.get(userId)!;
          return { userId, username: row.username, displayName: row.displayName };
        }),
  };

  const partners: PartnerRepository = {
    find: async (userId) => partnerRows.get(userId) ?? null,
    createApplication: async (profile, partner) => {
      const created = insertProfile(profile);
      if (typeof created !== 'string') {
        partnerRows.set(profile.id, {
          ...partner,
          status: 'pending',
          bio: null,
          rejectionReason: null,
        });
      }
      return created;
    },
    resubmit: async (userId, displayName, details, at) => {
      rows.get(userId)!.displayName = displayName;
      const partner = partnerRows.get(userId)!;
      Object.assign(partner, details, {
        status: 'pending',
        rejectionReason: null,
        submittedAt: at,
      });
    },
    updateBio: async (userId, bio) => {
      partnerRows.get(userId)!.bio = bio;
    },
  };

  const partnerNotifier: PartnerNotifier = {
    applicationSubmitted: async (notice) => {
      notices.push(notice);
    },
  };

  const chosenGenres = new Map<string, Genre[]>();
  const tasteResults = new Map<string, TasteResult>();
  const tastes: TasteRepository = {
    getChosenGenres: async (userId) => chosenGenres.get(userId) ?? [],
    getTopGenres: async (userId) => tasteResults.get(userId)?.topGenres ?? [],
    getResult: async (userId) => tasteResults.get(userId) ?? null,
    save: async (userId, genres, taste, at) => {
      chosenGenres.set(userId, [...genres]);
      tasteResults.set(userId, taste);
      const row = rows.get(userId);
      if (row && !row.tasteCompletedAt) row.tasteCompletedAt = at;
    },
  };

  const savedSettings = new Map<string, UserSettings>();
  const settings: SettingsRepository = {
    find: async (userId) => savedSettings.get(userId) ?? null,
    save: async (userId, value) => {
      savedSettings.set(userId, value);
    },
  };

  const storedEvents: (StoredEvent & { distanceKm: number })[] = [];
  const nearbyQueries: NearbyEventsQuery[] = [];
  const events: EventRepository = {
    findNearby: async (query) => {
      nearbyQueries.push(query);
      return storedEvents.filter(
        (event) =>
          event.distanceKm <= query.radiusKm &&
          event.endsAt > query.endsAfter &&
          event.startsAt < query.startsBefore,
      );
    },
    findById: async (id) => {
      const found = storedEvents.find((event) => event.id === id);
      if (!found) return null;
      const { distanceKm: _distance, ...event } = found;
      return event;
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

  return {
    rows,
    partnerRows,
    files,
    deletedUsers,
    notices,
    savedSettings,
    storedEvents,
    nearbyQueries,
    profiles,
    partners,
    partnerNotifier,
    tastes,
    settings,
    events,
    avatars,
    accounts,
  };
}

function setup() {
  const fakes = createFakes();
  const app = createApp({
    profiles: fakes.profiles,
    partners: fakes.partners,
    partnerNotifier: fakes.partnerNotifier,
    tastes: fakes.tastes,
    settings: fakes.settings,
    events: fakes.events,
    newId: () => 'file-1',
    now: () => NOW,
  });
  /** Requests as the given user; the email comes from the JWT in production. */
  const as = (userId: string) => {
    const bindings: ApiBindings = {
      userId,
      email: userId === USER_ID ? 'info@fogashaz.hu' : 'someone@example.com',
      avatars: fakes.avatars,
      accounts: fakes.accounts,
    };
    const request = (path: string, init?: RequestInit) =>
      app.request(`/api${path}`, init, bindings);
    const send = (method: string) => (path: string, body?: unknown) =>
      request(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    return { request, post: send('POST'), patch: send('PATCH'), put: send('PUT') };
  };
  return { ...fakes, ...as(USER_ID), as };
}

const validProfile = {
  displayName: 'Fekete Olivér',
  username: 'oli.fekete',
  avatarPath: null,
  adultConfirmed: true,
  privacyAccepted: true,
};

const validApplication = {
  displayName: 'Fogasház',
  username: 'fogashaz',
  avatarPath: null,
  companyName: 'Fogasház Kft.',
  taxNumber: '10773381244',
  contactName: 'Kiss Anna',
  contactPhone: '+36 30 123 4567',
  address: '1073 Budapest, Akácfa utca 51.',
  website: 'fogashaz.hu',
  termsAccepted: true,
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
      topGenres: [],
      accountType: 'person',
      verified: false,
      partner: null,
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

    expect(await (await request('/usernames/Oli.Fekete')).json()).toEqual({
      available: false,
      reason: 'taken',
    });
    expect(await (await request('/usernames/oli_fekete')).json()).toEqual({
      available: true,
      reason: null,
    });
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
      accountType: 'person',
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

describe('PUT /api/taste (D-001, D-005)', () => {
  it('needs a profile first', async () => {
    const { put } = setup();

    const response = await put('/taste', { genres: ['rock', 'techno', 'jazz'] });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'profile_missing' });
  });

  it('saves the choice in order, computes the top 3 and completes the taste step', async () => {
    const { post, put, request } = setup();
    await post('/profile', validProfile);

    const response = await put('/taste', { genres: ['rock', 'techno', 'jazz', 'pop'] });

    expect(response.status).toBe(200);
    const { profile } = await response.json();
    expect(profile).toMatchObject({ tasteCompleted: true, topGenres: ['rock', 'techno', 'jazz'] });
    expect(await (await request('/taste')).json()).toEqual({
      genres: ['rock', 'techno', 'jazz', 'pop'],
    });
  });

  it('replaces an earlier choice', async () => {
    const { post, put } = setup();
    await post('/profile', validProfile);
    await put('/taste', { genres: ['rock', 'techno', 'jazz'] });

    const { profile } = await (await put('/taste', { genres: ['house', 'edm', 'trance'] })).json();

    expect(profile.topGenres).toEqual(['house', 'edm', 'trance']);
  });

  it('rejects too few, too many, repeated and unknown genres', async () => {
    const { post, put } = setup();
    await post('/profile', validProfile);
    const eleven = [
      'techno',
      'house',
      'trance',
      'edm',
      'pop',
      'rock',
      'metal',
      'punk',
      'jazz',
      'folk',
      'retro',
    ];

    for (const genres of [
      ['rock', 'techno'],
      eleven,
      ['rock', 'rock', 'techno'],
      ['rock', 'techno', 'polka'],
    ]) {
      expect((await put('/taste', { genres })).status).toBe(400);
    }
    expect((await put('/taste')).status).toBe(400);
  });
});

describe('settings (Q6)', () => {
  it('returns the default radius until the user moves the slider', async () => {
    const { request } = setup();

    expect(await (await request('/settings')).json()).toEqual({
      settings: { searchRadiusKm: 25 },
    });
  });

  it('saves a radius between 1 and 200 km', async () => {
    const { post, put, request, savedSettings } = setup();
    await post('/profile', validProfile);

    const response = await put('/settings', { searchRadiusKm: 120 });

    expect(response.status).toBe(200);
    expect(savedSettings.get(USER_ID)).toEqual({ searchRadiusKm: 120 });
    expect(await (await request('/settings')).json()).toEqual({
      settings: { searchRadiusKm: 120 },
    });
  });

  it('rejects radii outside the slider and needs a profile', async () => {
    const { post, put } = setup();

    expect((await put('/settings', { searchRadiusKm: 30 })).status).toBe(409);

    await post('/profile', validProfile);
    for (const searchRadiusKm of [0, 201, 2.5, '30', undefined]) {
      expect((await put('/settings', { searchRadiusKm })).status).toBe(400);
    }
  });
});

const EVENT_ID = '0f8b1c2a-0000-4000-8000-000000000001';
const OTHER_EVENT_ID = '0f8b1c2a-0000-4000-8000-000000000002';
const DAY_MS = 24 * 3600 * 1000;

// NOW is 2026-10-18 20:00 UTC: this one has just started.
const technoNight: StoredEvent & { distanceKm: number } = {
  id: EVENT_ID,
  title: 'Minta Techno Éjszaka',
  kind: 'club',
  startsAt: new Date('2026-10-18T20:00:00Z'),
  endsAt: new Date('2026-10-19T04:00:00Z'),
  genres: ['techno', 'house'],
  performers: ['Minta DJ'],
  venue: { name: 'Minta Klub', address: '1072 Budapest, Minta utca 1.', lat: 47.5, lng: 19.06 },
  distanceKm: 1.23456,
};

describe('POST /api/events/nearby (F1, F5)', () => {
  it('scores the live and upcoming events within 200 km by the user’s taste', async () => {
    const { post, put, storedEvents, nearbyQueries } = setup();
    await post('/profile', validProfile);
    await put('/taste', { genres: ['techno', 'rock', 'jazz'] });
    storedEvents.push(technoNight, {
      ...technoNight,
      id: OTHER_EVENT_ID,
      genres: ['metal'],
      distanceKm: 150,
    });

    const response = await post('/events/nearby', { lat: 47.4979, lng: 19.0402 });

    expect(response.status).toBe(200);
    const { events } = await response.json();
    expect(events).toEqual([
      {
        id: EVENT_ID,
        title: 'Minta Techno Éjszaka',
        kind: 'club',
        startsAt: '2026-10-18T20:00:00.000Z',
        endsAt: '2026-10-19T04:00:00.000Z',
        venue: technoNight.venue,
        genres: ['techno', 'house'],
        distanceKm: 1.235,
        score: expect.any(Number),
      },
      expect.objectContaining({ id: OTHER_EVENT_ID, distanceKm: 150, score: 0 }),
    ]);
    // Techno is the favourite of three ordered genres (weights 1, 0.75, 0.5).
    expect(events[0].score).toBeCloseTo(1 / 2.25, 5);
    expect(nearbyQueries).toEqual([
      {
        lat: 47.4979,
        lng: 19.0402,
        radiusKm: 200,
        endsAfter: NOW,
        startsBefore: new Date(NOW.getTime() + 7 * DAY_MS),
        limit: NEARBY_EVENTS_LIMIT,
      },
    ]);
  });

  it('gives every event a zero score before the taste is chosen', async () => {
    const { post, storedEvents } = setup();
    storedEvents.push(technoNight);

    const { events } = await (await post('/events/nearby', { lat: 47.5, lng: 19 })).json();

    expect(events.map((event: { score: number }) => event.score)).toEqual([0]);
  });

  it('rejects a missing or impossible position', async () => {
    const { post } = setup();

    for (const body of [undefined, {}, { lat: 91, lng: 19 }, { lat: '47.5', lng: 19 }]) {
      expect((await post('/events/nearby', body)).status).toBe(400);
    }
  });
});

describe('GET /api/events/:id (Q8)', () => {
  it('returns the event page data with the performers', async () => {
    const { request, storedEvents } = setup();
    storedEvents.push(technoNight);

    const response = await request(`/events/${EVENT_ID}`);

    expect(response.status).toBe(200);
    expect((await response.json()).event).toEqual({
      id: EVENT_ID,
      title: 'Minta Techno Éjszaka',
      kind: 'club',
      startsAt: '2026-10-18T20:00:00.000Z',
      endsAt: '2026-10-19T04:00:00.000Z',
      venue: technoNight.venue,
      genres: ['techno', 'house'],
      performers: ['Minta DJ'],
    });
  });

  it('answers not_found for an unknown or malformed id', async () => {
    const { request } = setup();

    for (const id of [OTHER_EVENT_ID, 'not-an-id']) {
      const response = await request(`/events/${id}`);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'not_found' });
    }
  });
});

describe('partner applications (D-008)', () => {
  it('creates a partner profile without a taste step and tells the team', async () => {
    const { post, request, partnerRows, notices } = setup();

    const response = await post('/partner/application', validApplication);

    expect(response.status).toBe(201);
    const { profile } = await response.json();
    expect(profile).toMatchObject({
      username: 'fogashaz',
      displayName: 'Fogasház',
      accountType: 'partner',
      verified: false,
      topGenres: [],
      partner: {
        status: 'pending',
        rejectionReason: null,
        companyName: 'Fogasház Kft.',
        taxNumber: '10773381-2-44',
        website: 'https://fogashaz.hu',
        bio: null,
      },
    });
    expect(partnerRows.get(USER_ID)).toMatchObject({
      termsAcceptedAt: NOW,
      termsVersion: PARTNER_TERMS_VERSION,
      submittedAt: NOW,
    });
    expect(notices).toEqual([
      {
        userId: USER_ID,
        accountEmail: 'info@fogashaz.hu',
        displayName: 'Fogasház',
        username: 'fogashaz',
        details: {
          companyName: 'Fogasház Kft.',
          taxNumber: '10773381-2-44',
          contactName: 'Kiss Anna',
          contactPhone: '+36 30 123 4567',
          address: '1073 Budapest, Akácfa utca 51.',
          website: 'https://fogashaz.hu',
        },
        submittedAt: NOW,
        resubmission: false,
      },
    ]);
    expect((await (await request('/me')).json()).profile.accountType).toBe('partner');
  });

  it('needs both acceptances and checks the details', async () => {
    const { post, notices } = setup();

    for (const invalid of [
      { ...validApplication, termsAccepted: false },
      { ...validApplication, privacyAccepted: false },
      { ...validApplication, taxNumber: '12345678-2-44' },
      { ...validApplication, contactPhone: 'none' },
    ]) {
      expect((await post('/partner/application', invalid)).status).toBe(400);
    }
    expect(notices).toEqual([]);
  });

  it('keeps the application when the email cannot be sent', async () => {
    const { post, partnerNotifier, partnerRows } = setup();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    partnerNotifier.applicationSubmitted = async () => {
      throw new Error('mail is down');
    };

    const response = await post('/partner/application', validApplication);

    expect(response.status).toBe(201);
    expect(partnerRows.get(USER_ID)?.status).toBe('pending');
  });

  it('lets only a rejected partner send a corrected application', async () => {
    const { post, put, partnerRows, notices, rows } = setup();
    await post('/partner/application', validApplication);
    const correction = {
      displayName: 'Fogasház Budapest',
      companyName: 'Fogasház Kft.',
      taxNumber: '10773381-2-44',
      contactName: 'Kiss Anna',
      contactPhone: '+36 30 765 4321',
      address: '1073 Budapest, Akácfa utca 51.',
      website: null,
    };

    expect((await put('/partner/application', correction)).status).toBe(403);

    Object.assign(partnerRows.get(USER_ID)!, {
      status: 'rejected',
      rejectionReason: 'Hibás adószám',
    });
    const response = await put('/partner/application', correction);

    expect(response.status).toBe(200);
    expect((await response.json()).profile.partner).toMatchObject({
      status: 'pending',
      rejectionReason: null,
      contactPhone: '+36 30 765 4321',
      website: null,
    });
    expect(rows.get(USER_ID)?.displayName).toBe('Fogasház Budapest');
    expect(notices.map((notice) => notice.resubmission)).toEqual([false, true]);
  });

  it('keeps people and partners to their own settings', async () => {
    const { post, put, patch, as } = setup();
    await post('/partner/application', validApplication);
    await as(OTHER_USER_ID).post('/profile', validProfile);

    // D-008/11: no taste for a partner; its public name belongs to the application.
    expect((await put('/taste', { genres: ['rock', 'techno', 'jazz'] })).status).toBe(403);
    expect((await patch('/profile', { displayName: 'Másik név' })).status).toBe(403);
    const withBio = await patch('/profile', { bio: '  Klub a VII. kerületben.  ' });
    expect((await withBio.json()).profile.partner.bio).toBe('Klub a VII. kerületben.');
    // People have no introduction.
    expect((await as(OTHER_USER_ID).patch('/profile', { bio: 'Szia' })).status).toBe(403);
  });
});

describe('protected partner names (D-008/5)', () => {
  async function withApprovedPartner() {
    const context = setup();
    await context.as(OTHER_USER_ID).post('/partner/application', {
      ...validApplication,
      displayName: 'Akvárium Klub',
      username: 'akvarium',
    });
    context.partnerRows.get(OTHER_USER_ID)!.status = 'approved';
    return context;
  }

  it('reports a name too close to a verified partner as unavailable', async () => {
    const { request } = await withApprovedPartner();

    expect(await (await request('/usernames/akvarium')).json()).toEqual({
      available: false,
      reason: 'taken',
    });
    expect(await (await request('/usernames/akvarium.official')).json()).toEqual({
      available: false,
      reason: 'protected',
    });
    expect(await (await request('/usernames/oli.fekete')).json()).toEqual({
      available: true,
      reason: null,
    });
  });

  it('stops people and other partners from taking it', async () => {
    const { post, patch } = await withApprovedPartner();

    const person = await post('/profile', { ...validProfile, displayName: 'Akvárium klub' });
    expect(person.status).toBe(409);
    expect(await person.json()).toEqual({ error: 'name_protected' });

    expect((await post('/profile', validProfile)).status).toBe(201);
    expect((await patch('/profile', { displayName: 'AkvariumKlub' })).status).toBe(409);
  });

  it('protects only approved partners', async () => {
    const { request, partnerRows } = await withApprovedPartner();
    partnerRows.get(OTHER_USER_ID)!.status = 'pending';

    expect(await (await request('/usernames/akvarium.official')).json()).toEqual({
      available: true,
      reason: null,
    });
  });
});

describe('GET /api/public/usernames/:username (D-008/22)', () => {
  it('answers without a signed-in user, protected names included', async () => {
    const { as, profiles, partnerRows } = setup();
    await as(OTHER_USER_ID).post('/partner/application', {
      ...validApplication,
      displayName: 'Akvárium Klub',
      username: 'akvarium',
    });
    partnerRows.get(OTHER_USER_ID)!.status = 'approved';
    const publicApp = createPublicApp({ profiles });
    const check = async (username: string) =>
      (await publicApp.request(`/api/public/usernames/${encodeURIComponent(username)}`)).json();

    expect(await check('akvarium')).toEqual({ available: false, reason: 'taken' });
    expect(await check('akvarium.official')).toEqual({ available: false, reason: 'protected' });
    expect(await check('fogashaz')).toEqual({ available: true, reason: null });
    expect((await publicApp.request('/api/public/usernames/ab')).status).toBe(400);
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
