import { create } from 'zustand';

import type { AccountType } from '@shared/contracts/profile';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthState = {
  status: AuthStatus;
  userId: string | null;
  /**
   * D-008/3: the account type chosen at registration (partner or person), until the profile
   * exists; it decides which onboarding opens.
   */
  accountIntent: AccountType;
  /** True while a password reset turns the recovery session into a new password (D-004). */
  isRecoveringPassword: boolean;
  setUser: (userId: string | null, accountIntent?: AccountType) => void;
  setRecoveringPassword: (value: boolean) => void;
};

/** Mirror of the Supabase session, kept up to date by useAuthListener. */
export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',
  userId: null,
  accountIntent: 'person',
  isRecoveringPassword: false,
  setUser: (userId, accountIntent = 'person') =>
    set({ status: userId ? 'signedIn' : 'signedOut', userId, accountIntent }),
  setRecoveringPassword: (isRecoveringPassword) => set({ isRecoveringPassword }),
}));
