import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/auth-store';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';

/** The signed-in user's own profile (`null` until onboarding creates it). */
export function useMyProfile() {
  const enabled = useAuthStore(
    (state) => state.status === 'signedIn' && !state.isRecoveringPassword,
  );
  return useQuery({ queryKey: queryKeys.me, queryFn: api.getMe, enabled });
}
