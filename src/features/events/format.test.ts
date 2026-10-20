import type { TFunction } from 'i18next';

import { daysFromToday, formatEventStart, formatEventTimeRange } from './format';

// Echoes the key and the values, so the tests do not depend on the translations.
const t = ((key: string, values: Record<string, string>) =>
  `${key}(${Object.values(values).join('|')})`) as unknown as TFunction;

// Local times (the phone's time zone), so the tests work in any zone.
const now = new Date(2026, 9, 20, 21, 30); // Tuesday 20 October 2026, 21:30

describe('daysFromToday', () => {
  it('counts calendar days, not 24-hour periods', () => {
    expect(daysFromToday(new Date(2026, 9, 20, 23, 59), now)).toBe(0);
    expect(daysFromToday(new Date(2026, 9, 21, 0, 30), now)).toBe(1);
    // Across the end of summer time (25 October), a day has 25 hours.
    expect(daysFromToday(new Date(2026, 9, 26, 1, 0), now)).toBe(6);
  });
});

describe('formatEventStart (event tiles)', () => {
  it('says today, tomorrow, the weekday, then the date', () => {
    expect(formatEventStart(new Date(2026, 9, 20, 23, 0), now, t, 'hu')).toBe(
      'events.today(23:00)',
    );
    expect(formatEventStart(new Date(2026, 9, 21, 22, 0), now, t, 'hu')).toBe(
      'events.tomorrow(22:00)',
    );
    expect(formatEventStart(new Date(2026, 9, 24, 22, 0), now, t, 'en')).toBe(
      'events.weekdayAt(Saturday|22:00)',
    );
    expect(formatEventStart(new Date(2026, 9, 30, 9, 5), now, t, 'en')).toBe(
      'events.dateAt(30 Oct|09:05)',
    );
  });
});

describe('formatEventTimeRange (event page)', () => {
  it('names the end day only when the event runs past midnight', () => {
    expect(
      formatEventTimeRange(new Date(2026, 9, 24, 19, 0), new Date(2026, 9, 24, 23, 30), t, 'en'),
    ).toBe('events.timeRange(Saturday 24 October 19:00|23:30)');
    expect(
      formatEventTimeRange(new Date(2026, 9, 24, 22, 0), new Date(2026, 9, 25, 5, 0), t, 'en'),
    ).toBe('events.timeRange(Saturday 24 October 22:00|Sunday 25 October 05:00)');
  });
});
