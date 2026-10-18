import { create } from 'zustand';

type SessionState = {
  isSignedIn: boolean;
  signIn: () => void;
};

/**
 * Placeholder session until real authentication arrives in phase 2.
 * It lives in memory only, so restarting the app returns to the sign-in screen.
 */
export const useSessionStore = create<SessionState>()((set) => ({
  isSignedIn: false,
  signIn: () => set({ isSignedIn: true }),
}));
