import { useMyProfile } from '@/features/profile/use-my-profile';

import { type AppState, resolveAppState } from './app-state';
import { useAuthStore } from './auth-store';

export function useAppState(): AppState {
  const authStatus = useAuthStore((state) => state.status);
  const isRecoveringPassword = useAuthStore((state) => state.isRecoveringPassword);
  const me = useMyProfile();

  return resolveAppState({
    authStatus,
    isRecoveringPassword,
    profileStatus: me.status,
    profile: me.data?.profile,
  });
}
