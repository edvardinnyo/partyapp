import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { queryKeys } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

/**
 * The database broadcasts on this public topic whenever events or venues change
 * (migration 20261020212612_events_import). The message carries no event data.
 */
export const EVENTS_CHANNEL = 'events';
/** One import sends several messages; they cause a single refresh. */
const REFRESH_DELAY_MS = 1000;

/** D-007/2: a new or changed event shows up right away on the Home grid and the map. */
export function useEventsLiveUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel(EVENTS_CHANNEL)
      .on('broadcast', { event: 'changed' }, () => {
        clearTimeout(timer);
        timer = setTimeout(
          () => void queryClient.invalidateQueries({ queryKey: queryKeys.events }),
          REFRESH_DELAY_MS,
        );
      })
      .subscribe();

    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
