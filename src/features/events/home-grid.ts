import { compareRecommended } from '@shared/recommendation/score-event';

/** F5 + D-007/3: two events per row, and a full-width ad banner after about every 6 events. */
export const HOME_GRID = { columns: 2, adEveryEvents: 6 } as const;

export type HomeGridRow<T> =
  { kind: 'events'; key: string; events: T[] } | { kind: 'ad'; key: string };

/** Splits the events into rows; a banner only goes between events, never after the last one. */
export function buildHomeGridRows<T extends { id: string }>(
  events: readonly T[],
  { columns, adEveryEvents }: { columns: number; adEveryEvents: number } = HOME_GRID,
): HomeGridRow<T>[] {
  const rows: HomeGridRow<T>[] = [];
  let sinceLastAd = 0;
  for (let start = 0; start < events.length; start += columns) {
    const rowEvents = events.slice(start, start + columns);
    rows.push({ kind: 'events', key: rowEvents.map(({ id }) => id).join('+'), events: rowEvents });
    sinceLastAd += rowEvents.length;
    if (sinceLastAd >= adEveryEvents && start + columns < events.length) {
      rows.push({ kind: 'ad', key: `ad-${start + columns}` });
      sinceLastAd = 0;
    }
  }
  return rows;
}

type HomeEvent = {
  id: string;
  startsAt: string;
  score: number;
  distanceKm: number;
  recommended: boolean;
};

/**
 * Which events the Home grid shows. People: the recommended ones, best match first (F1, Q7).
 * Partners have no taste (D-008/11): every event within the distance, the earliest first.
 */
export function selectHomeEvents<T extends HomeEvent>(
  events: readonly T[],
  { forPartner, radiusKm }: { forPartner: boolean; radiusKm: number },
): T[] {
  if (!forPartner) {
    return events.filter((event) => event.recommended).sort(compareRecommended);
  }
  return events
    .filter((event) => event.distanceKm <= radiusKm)
    .sort(
      (a, b) =>
        Date.parse(a.startsAt) - Date.parse(b.startsAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
}
