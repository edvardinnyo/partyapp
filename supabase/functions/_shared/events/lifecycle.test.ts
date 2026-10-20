import { eventStatus, shownEventWindow, UPCOMING_WINDOW_DAYS } from './lifecycle.ts';

const startsAt = new Date('2026-10-24T20:00:00Z');
const endsAt = new Date('2026-10-25T04:00:00Z');

describe('eventStatus (PHASE0.md chapter 8)', () => {
  it('is upcoming before the start, live until the end, then closed', () => {
    expect(eventStatus(startsAt, endsAt, new Date('2026-10-24T19:59:59Z'))).toBe('upcoming');
    expect(eventStatus(startsAt, endsAt, startsAt)).toBe('live');
    expect(eventStatus(startsAt, endsAt, new Date('2026-10-25T00:30:00Z'))).toBe('live');
    expect(eventStatus(startsAt, endsAt, endsAt)).toBe('closed');
  });
});

describe('shownEventWindow (Q7)', () => {
  it('covers what is live now and what starts in the coming days', () => {
    const now = new Date('2026-10-20T12:00:00Z');

    const { endsAfter, startsBefore } = shownEventWindow(now);

    expect(endsAfter).toEqual(now);
    expect(startsBefore.getTime() - now.getTime()).toBe(UPCOMING_WINDOW_DAYS * 24 * 3600 * 1000);
  });
});
