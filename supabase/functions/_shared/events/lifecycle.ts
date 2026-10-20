// Event lifecycle (PHASE0.md chapter 8): the status is always derived from the times, so it can
// never get stuck. What happens after closing (grace period, archive) comes in phase 6 (Q12).

export type EventStatus = 'upcoming' | 'live' | 'closed';

/** Q7 + D-007/3: upcoming events are shown this far ahead. */
export const UPCOMING_WINDOW_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

export function eventStatus(startsAt: Date, endsAt: Date, now: Date): EventStatus {
  if (now < startsAt) {
    return 'upcoming';
  }
  return now < endsAt ? 'live' : 'closed';
}

/** The time range whose events the Home grid and the map show: live now or starting soon. */
export function shownEventWindow(now: Date): { endsAfter: Date; startsBefore: Date } {
  return { endsAfter: now, startsBefore: new Date(now.getTime() + UPCOMING_WINDOW_DAYS * DAY_MS) };
}
