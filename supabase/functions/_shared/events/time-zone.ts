// Wall-clock times of a time zone ↔ instants, with the runtime's built-in time zone data (Intl).
// Event sources give local times (Budapest); the database stores instants (UTC).

export type LocalDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

/** How far `timeZone` is ahead of UTC at `instant`, in minutes (Budapest: 60 or 120). */
export function timeZoneOffsetMinutes(instant: number, timeZone: string): number {
  const parts = formatterFor(timeZone).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((candidate) => candidate.type === type)?.value);
  const wallClockAsUtc = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );
  // The formatted time has no milliseconds, so compare it with the instant's whole second.
  return Math.round((wallClockAsUtc - Math.floor(instant / 1000) * 1000) / MINUTE_MS);
}

/** False for dates that do not exist, such as 30 February. */
export function isValidLocalDateTime({ year, month, day, hour, minute }: LocalDateTime): boolean {
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getUTCHours() === hour &&
    date.getUTCMinutes() === minute
  );
}

/**
 * The instant when the clocks of `timeZone` show `local`. Returns null when that time does not
 * exist (it is skipped when summer time starts). A time that happens twice (when summer time
 * ends) gives the earlier instant.
 */
export function zonedTimeToInstant(local: LocalDateTime, timeZone: string): Date | null {
  if (!isValidLocalDateTime(local)) {
    return null;
  }
  const wallClockAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  // The offsets a day before and a day after cover any change of offset around this time.
  const offsets = new Set([
    timeZoneOffsetMinutes(wallClockAsUtc - DAY_MS, timeZone),
    timeZoneOffsetMinutes(wallClockAsUtc + DAY_MS, timeZone),
  ]);
  const [earliest] = [...offsets]
    .map((offset) => wallClockAsUtc - offset * MINUTE_MS)
    .filter(
      (instant) =>
        timeZoneOffsetMinutes(instant, timeZone) * MINUTE_MS === wallClockAsUtc - instant,
    )
    .sort((a, b) => a - b);
  return earliest === undefined ? null : new Date(earliest);
}
