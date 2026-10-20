import type { Profile } from '@shared/contracts/profile';

import type { AuthStatus } from './auth-store';

export type AppState =
  'loading' | 'signedOut' | 'needsProfile' | 'needsTaste' | 'ready' | 'unavailable';

type AppStateInput = {
  authStatus: AuthStatus;
  isRecoveringPassword: boolean;
  profileStatus: 'pending' | 'error' | 'success';
  profile: Profile | null | undefined;
};

/**
 * Decides which part of the app the user may see: the sign-in flow, the onboarding steps
 * (profile, then taste — D-004), or the app itself with Home first (F5).
 */
export function resolveAppState({
  authStatus,
  isRecoveringPassword,
  profileStatus,
  profile,
}: AppStateInput): AppState {
  if (authStatus === 'loading') {
    return 'loading';
  }
  // A password reset signs the user in before the new password is saved;
  // they stay in the sign-in flow until it is.
  if (authStatus === 'signedOut' || isRecoveringPassword) {
    return 'signedOut';
  }
  if (profileStatus === 'pending') {
    return 'loading';
  }
  if (profileStatus === 'error') {
    return 'unavailable';
  }
  if (!profile) {
    return 'needsProfile';
  }
  return profile.tasteCompleted ? 'ready' : 'needsTaste';
}
