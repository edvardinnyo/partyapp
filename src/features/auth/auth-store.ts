import { create } from 'zustand';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthState = {
  status: AuthStatus;
  userId: string | null;
  /** True while a password reset turns the recovery session into a new password (D-004). */
  isRecoveringPassword: boolean;
  setUser: (userId: string | null) => void;
  setRecoveringPassword: (value: boolean) => void;
};

/** Mirror of the Supabase session, kept up to date by useAuthListener. */
export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',
  userId: null,
  isRecoveringPassword: false,
  setUser: (userId) => set({ status: userId ? 'signedIn' : 'signedOut', userId }),
  setRecoveringPassword: (isRecoveringPassword) => set({ isRecoveringPassword }),
}));
