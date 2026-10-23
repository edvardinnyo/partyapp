import { useEffect } from 'react';

import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

import { useAuthStore } from './auth-store';

/** Keeps the auth store in sync with Supabase, including the session restored at startup. */
export function useAuthListener() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    // Supabase emits INITIAL_SESSION right away with the stored session (or null).
    // Only synchronous work here: awaiting Supabase calls inside this callback can deadlock.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      const isPartner = session?.user.user_metadata?.account_type === 'partner';
      setUser(session?.user.id ?? null, isPartner ? 'partner' : 'person');
      if (event === 'SIGNED_OUT') {
        // Never show the previous user's data to the next one.
        queryClient.removeQueries();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [setUser]);
}
