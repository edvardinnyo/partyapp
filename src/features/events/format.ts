// Event times in the phone's time zone and the UI language. The database keeps UTC instants.
import type { TFunction } from 'i18next';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 24-hour clock in English too: the app starts in Hungary. */
export function localeFor(language: string): string {
  return language === 'hu' ? 'hu-HU' : 'en-GB';
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Calendar days from today to `date` (0 = today, 1 = tomorrow), in local time. */
export function daysFromToday(date: Date, now: Date): number {
  // Rounding absorbs the 23- and 25-hour days when summer time starts or ends.
  return Math.round((startOfDay(date) - startOfDay(now)) / DAY_MS);
}

function time(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** For tiles: "Ma 22:00", "Holnap 21:00", "szombat 23:00" within the week, else the date. */
export function formatEventStart(startsAt: Date, now: Date, t: TFunction, language: string) {
  const locale = localeFor(language);
  const days = daysFromToday(startsAt, now);
  const at = time(startsAt, locale);
  if (days <= 0) {
    return t('events.today', { time: at });
  }
  if (days === 1) {
    return t('events.tomorrow', { time: at });
  }
  if (days < 7) {
    const weekday = startsAt.toLocaleDateString(locale, { weekday: 'long' });
    return t('events.weekdayAt', { weekday, time: at });
  }
  const date = startsAt.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  return t('events.dateAt', { date, time: at });
}

/** For the event page: "október 24., szombat 22:00 – október 25., vasárnap 05:00". */
export function formatEventTimeRange(startsAt: Date, endsAt: Date, t: TFunction, language: string) {
  const locale = localeFor(language);
  const day = (date: Date) =>
    date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
  const start = `${day(startsAt)} ${time(startsAt, locale)}`;
  const end =
    daysFromToday(endsAt, startsAt) === 0
      ? time(endsAt, locale)
      : `${day(endsAt)} ${time(endsAt, locale)}`;
  return t('events.timeRange', { start, end });
}
