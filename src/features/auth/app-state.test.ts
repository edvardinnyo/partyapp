import type { Profile } from '@shared/contracts/profile';

import { resolveAppState } from './app-state';

const profile: Profile = {
  id: 'user-1',
  username: 'oli',
  displayName: 'Oli',
  avatarUrl: null,
  tasteCompleted: true,
  topGenres: ['techno', 'house', 'pop'],
  accountType: 'person',
  verified: false,
  partner: null,
  isAdmin: false,
};

const signedIn = {
  authStatus: 'signedIn' as const,
  isRecoveringPassword: false,
  profileStatus: 'success' as const,
};

describe('resolveAppState', () => {
  it('waits for the stored session to load', () => {
    expect(
      resolveAppState({
        authStatus: 'loading',
        isRecoveringPassword: false,
        profileStatus: 'pending',
        profile: undefined,
      }),
    ).toBe('loading');
  });

  it('keeps signed-out users in the sign-in flow', () => {
    expect(
      resolveAppState({
        authStatus: 'signedOut',
        isRecoveringPassword: false,
        profileStatus: 'pending',
        profile: undefined,
      }),
    ).toBe('signedOut');
  });

  it('keeps a password reset in the sign-in flow until the new password is saved', () => {
    expect(resolveAppState({ ...signedIn, isRecoveringPassword: true, profile })).toBe('signedOut');
  });

  it('waits for the profile, and reports when it cannot be loaded', () => {
    expect(resolveAppState({ ...signedIn, profileStatus: 'pending', profile: undefined })).toBe(
      'loading',
    );
    expect(resolveAppState({ ...signedIn, profileStatus: 'error', profile: undefined })).toBe(
      'unavailable',
    );
  });

  it('walks through onboarding: profile first, then taste (D-004)', () => {
    expect(resolveAppState({ ...signedIn, profile: null })).toBe('needsProfile');
    expect(resolveAppState({ ...signedIn, profile: { ...profile, tasteCompleted: false } })).toBe(
      'needsTaste',
    );
  });

  it('opens the app once onboarding is done', () => {
    expect(resolveAppState({ ...signedIn, profile })).toBe('ready');
  });

  it('lets a partner in without a taste step, even before approval (D-008)', () => {
    const partner = { ...profile, accountType: 'partner', tasteCompleted: false, topGenres: [] };
    expect(resolveAppState({ ...signedIn, profile: partner })).toBe('ready');
  });
});
