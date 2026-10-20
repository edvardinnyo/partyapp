import { timeZoneOffsetMinutes, zonedTimeToInstant } from './time-zone.ts';

const BUDAPEST = 'Europe/Budapest';

const at = (year: number, month: number, day: number, hour: number, minute = 0) =>
  zonedTimeToInstant({ year, month, day, hour, minute }, BUDAPEST)?.toISOString() ?? null;

describe('Budapest wall-clock times → instants', () => {
  it('uses UTC+2 in summer and UTC+1 in winter', () => {
    expect(at(2026, 7, 1, 22)).toBe('2026-07-01T20:00:00.000Z');
    expect(at(2026, 11, 20, 22, 30)).toBe('2026-11-20T21:30:00.000Z');
  });

  it('handles a night across midnight and the change of summer time', () => {
    // Summer time ends on 25 October 2026 at 03:00 (clocks go back to 02:00).
    expect(at(2026, 10, 24, 22)).toBe('2026-10-24T20:00:00.000Z');
    expect(at(2026, 10, 25, 5)).toBe('2026-10-25T04:00:00.000Z');
  });

  it('takes the earlier instant for the hour that happens twice', () => {
    expect(at(2026, 10, 25, 2, 30)).toBe('2026-10-25T00:30:00.000Z');
  });

  it('rejects the hour skipped when summer time starts', () => {
    // 29 March 2026: clocks jump from 02:00 to 03:00.
    expect(at(2026, 3, 29, 2, 30)).toBeNull();
    expect(at(2026, 3, 29, 3)).toBe('2026-03-29T01:00:00.000Z');
  });

  it('rejects dates that do not exist', () => {
    expect(at(2026, 2, 30, 20)).toBeNull();
    expect(at(2026, 13, 1, 20)).toBeNull();
    expect(at(2026, 10, 24, 24)).toBeNull();
  });
});

describe('timeZoneOffsetMinutes', () => {
  it('reports the offset at an instant', () => {
    expect(timeZoneOffsetMinutes(Date.parse('2026-07-01T12:00:00Z'), BUDAPEST)).toBe(120);
    expect(timeZoneOffsetMinutes(Date.parse('2026-12-01T12:00:00Z'), BUDAPEST)).toBe(60);
  });
});
