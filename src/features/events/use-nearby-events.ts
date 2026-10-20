import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { EventSummary } from '@shared/contracts/events';
import { eventStatus, type EventStatus } from '@shared/events/lifecycle';
import { isRecommended } from '@shared/recommendation/score-event';
import { useEventsOrigin } from '@/features/location/location-store';
import { useSearchRadius } from '@/features/settings/use-search-radius';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { useNow } from '@/lib/use-now';

/** D-007/2: the events refresh in the background this often (besides the live updates). */
export const EVENTS_REFRESH_MS = 5 * 60_000;
/** How often "live" and "upcoming" labels are re-evaluated. */
const STATUS_TICK_MS = 30_000;

export type NearbyEvent = EventSummary & { status: EventStatus; recommended: boolean };

/**
 * F1, F5: every live and upcoming event around the user, as the map shows them, each marked
 * whether it is recommended (taste match within the search radius). Ended events drop out
 * without waiting for the next refresh.
 */
export function useNearbyEvents() {
  const { origin, isApproximate } = useEventsOrigin();
  const radius = useSearchRadius();
  const now = useNow(STATUS_TICK_MS);

  const query = useQuery({
    queryKey: queryKeys.nearbyEvents(origin?.lat ?? 0, origin?.lng ?? 0),
    queryFn: origin ? () => api.getNearbyEvents(origin) : skipToken,
    // Moving a little keeps the previous list on screen until the new one arrives.
    placeholderData: keepPreviousData,
    refetchInterval: EVENTS_REFRESH_MS,
  });

  const events = useMemo(() => {
    const at = new Date(now);
    return (query.data ?? []).flatMap((event): NearbyEvent[] => {
      const status = eventStatus(new Date(event.startsAt), new Date(event.endsAt), at);
      return status === 'closed'
        ? []
        : [{ ...event, status, recommended: isRecommended(event, radius.radiusKm) }];
    });
  }, [query.data, now, radius.radiusKm]);

  return {
    events,
    origin,
    isApproximate,
    radiusKm: radius.radiusKm,
    isReady: origin !== null && radius.isLoaded && query.data !== undefined,
    isError: query.isError && query.data === undefined,
    refetch: query.refetch,
  };
}
