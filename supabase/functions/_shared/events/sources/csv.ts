// D-007/1: the team's spreadsheet (CSV) as an event source. It only converts the rows into the
// shared import shape (ImportedEvent); writing them to the database is the same for every source.
import { type EventKind, type ImportedEvent, importedEventSchema } from '../../contracts/events.ts';
import { type Genre, isGenre } from '../../contracts/genres.ts';
import { type LocalDateTime, isValidLocalDateTime, zonedTimeToInstant } from '../time-zone.ts';

/** The times in the CSV are Budapest wall-clock times (D-007/1: we start in Budapest). */
export const CSV_TIME_ZONE = 'Europe/Budapest';

export const CSV_COLUMNS = [
  'id',
  'title',
  'kind',
  'starts_at',
  'ends_at',
  'genres',
  'performers',
  'venue_id',
  'venue_name',
  'venue_address',
  'venue_lat',
  'venue_lng',
  'ticket_url',
] as const;
export type CsvColumn = (typeof CSV_COLUMNS)[number];

const OPTIONAL_COLUMNS: readonly CsvColumn[] = ['performers', 'ticket_url'];

/** Cells with several values (genres, performers) separate them with this. */
export const CSV_LIST_SEPARATOR = '|';

/** Accepted spellings of the event kinds, so the sheet can be filled in Hungarian too. */
const KIND_ALIASES: Record<string, EventKind> = {
  club: 'club',
  klub: 'club',
  bar: 'bar',
  bár: 'bar',
  concert: 'concert',
  koncert: 'concert',
  festival: 'festival',
  fesztival: 'festival',
  fesztivál: 'festival',
};

/** `row` is the spreadsheet row number: the header is row 1. */
export type CsvProblem =
  | { type: 'not_utf8' }
  | { type: 'empty' }
  | { type: 'missing_columns'; columns: CsvColumn[] }
  | { type: 'missing_value'; row: number; column: CsvColumn }
  | { type: 'invalid_value'; row: number; column: CsvColumn; value: string }
  | { type: 'nonexistent_time'; row: number; column: CsvColumn; value: string }
  | { type: 'ends_before_start'; row: number }
  | { type: 'duplicate_id'; row: number; firstRow: number; id: string }
  | { type: 'venue_mismatch'; row: number; firstRow: number; venueId: string }
  | { type: 'invalid_event'; row: number; details: string };

export type CsvImport = { events: ImportedEvent[]; problems: CsvProblem[] };

const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);
/** What a decoder puts in place of bytes that are not valid UTF-8. */
const REPLACEMENT_CHARACTER = String.fromCharCode(0xfffd);

/** Excel saves with `;` in Hungarian and with `,` in English; the header line tells which. */
export function detectDelimiter(text: string): ',' | ';' {
  let commas = 0;
  let semicolons = 0;
  let inQuotes = false;
  for (const char of text) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && (char === '\n' || char === '\r')) {
      break;
    } else if (!inQuotes && char === ',') {
      commas += 1;
    } else if (!inQuotes && char === ';') {
      semicolons += 1;
    }
  }
  return semicolons > commas ? ';' : ',';
}

/** RFC 4180: quoted cells may contain the delimiter, line breaks and doubled quotes. */
export function parseCsv(text: string, delimiter: ',' | ';' = detectDelimiter(text)): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (inQuotes) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell === '') {
      inQuotes = true;
    } else if (char === delimiter) {
      record.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') {
        index += 1;
      }
      record.push(cell);
      records.push(record);
      record = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell !== '' || record.length > 0) {
    record.push(cell);
    records.push(record);
  }
  return records;
}

const DATE_TIME_PATTERN =
  /^(\d{4})\s*[-.]\s*(\d{1,2})\s*[-.]\s*(\d{1,2})\.?(?:\s+|T)(\d{1,2}):(\d{2})(?::\d{2})?$/;

/** `2026-10-24 22:00`, or the way Hungarian Excel shows it: `2026. 10. 24. 22:00`. */
export function parseLocalDateTime(value: string): LocalDateTime | null {
  const match = DATE_TIME_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }
  const [, year, month, day, hour, minute] = match.map(Number);
  const local = { year, month, day, hour, minute } as LocalDateTime;
  return isValidLocalDateTime(local) ? local : null;
}

/** Accepts both `47.4979` and the Hungarian `47,4979`. */
function parseCoordinate(value: string, limit: number): number | null {
  const number = Number(value.replace(',', '.'));
  return value !== '' && Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

function splitList(value: string): string[] {
  const items = value
    .split(CSV_LIST_SEPARATOR)
    .map((item) => item.trim())
    .filter((item) => item !== '');
  return [...new Set(items)];
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Converts the sheet; when anything is wrong, `problems` lists every issue with its row. */
export function eventsFromCsv(text: string): CsvImport {
  if (text.includes(REPLACEMENT_CHARACTER)) {
    return { events: [], problems: [{ type: 'not_utf8' }] };
  }
  const [header, ...rows] = parseCsv(text.startsWith(BYTE_ORDER_MARK) ? text.slice(1) : text);
  if (!header || header.every((name) => name.trim() === '')) {
    return { events: [], problems: [{ type: 'empty' }] };
  }

  const columnIndex = new Map(header.map((name, index) => [name.trim().toLowerCase(), index]));
  const missingColumns = CSV_COLUMNS.filter(
    (column) => !OPTIONAL_COLUMNS.includes(column) && !columnIndex.has(column),
  );
  if (missingColumns.length > 0) {
    return { events: [], problems: [{ type: 'missing_columns', columns: missingColumns }] };
  }

  const events: ImportedEvent[] = [];
  const problems: CsvProblem[] = [];
  const firstRowOfEvent = new Map<string, number>();
  const firstVenue = new Map<string, { row: number; details: string }>();

  rows.forEach((cells, index) => {
    const row = index + 2;
    if (cells.every((cell) => cell.trim() === '')) {
      return;
    }
    const rowProblems: CsvProblem[] = [];
    const cell = (column: CsvColumn) => (cells[columnIndex.get(column) ?? -1] ?? '').trim();
    const required = (column: CsvColumn) => {
      const value = cell(column);
      if (value === '') {
        rowProblems.push({ type: 'missing_value', row, column });
      }
      return value;
    };
    const invalid = (column: CsvColumn, value: string) =>
      rowProblems.push({ type: 'invalid_value', row, column, value });

    const id = required('id');
    const title = required('title');

    const kindValue = required('kind');
    const kind = KIND_ALIASES[kindValue.toLowerCase()];
    if (kindValue !== '' && !kind) {
      invalid('kind', kindValue);
    }

    const instantOf = (column: 'starts_at' | 'ends_at') => {
      const value = required(column);
      if (value === '') {
        return null;
      }
      const local = parseLocalDateTime(value);
      if (!local) {
        invalid(column, value);
        return null;
      }
      const instant = zonedTimeToInstant(local, CSV_TIME_ZONE);
      if (!instant) {
        rowProblems.push({ type: 'nonexistent_time', row, column, value });
      }
      return instant;
    };
    const startsAt = instantOf('starts_at');
    const endsAt = instantOf('ends_at');
    if (startsAt && endsAt && endsAt <= startsAt) {
      rowProblems.push({ type: 'ends_before_start', row });
    }

    const genres: Genre[] = [];
    for (const value of splitList(required('genres')).map((genre) => genre.toLowerCase())) {
      if (isGenre(value)) {
        genres.push(value);
      } else {
        invalid('genres', value);
      }
    }

    const venueId = required('venue_id');
    const venueName = required('venue_name');
    const venueAddress = required('venue_address');
    const coordinate = (column: 'venue_lat' | 'venue_lng', limit: number) => {
      const value = required(column);
      const parsed = parseCoordinate(value, limit);
      if (value !== '' && parsed === null) {
        invalid(column, value);
      }
      return parsed;
    };
    const lat = coordinate('venue_lat', 90);
    const lng = coordinate('venue_lng', 180);

    const ticketUrl = cell('ticket_url');
    if (ticketUrl !== '' && !isHttpUrl(ticketUrl)) {
      invalid('ticket_url', ticketUrl);
    }

    if (id !== '') {
      const firstRow = firstRowOfEvent.get(id);
      if (firstRow === undefined) {
        firstRowOfEvent.set(id, row);
      } else {
        rowProblems.push({ type: 'duplicate_id', row, firstRow, id });
      }
    }
    if (venueId !== '' && lat !== null && lng !== null) {
      // Every row repeats its venue's details; they must agree, or one of them is a typo.
      const details = JSON.stringify([venueName, venueAddress, lat, lng]);
      const first = firstVenue.get(venueId);
      if (!first) {
        firstVenue.set(venueId, { row, details });
      } else if (first.details !== details) {
        rowProblems.push({ type: 'venue_mismatch', row, firstRow: first.row, venueId });
      }
    }

    if (rowProblems.length > 0 || !kind || !startsAt || !endsAt || lat === null || lng === null) {
      problems.push(...rowProblems);
      return;
    }
    const parsed = importedEventSchema.safeParse({
      externalId: id,
      title,
      kind,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      venue: { externalId: venueId, name: venueName, address: venueAddress, lat, lng },
      genres,
      performers: splitList(cell('performers')),
      ticketUrl: ticketUrl === '' ? null : ticketUrl,
    });
    if (parsed.success) {
      events.push(parsed.data);
    } else {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      problems.push({ type: 'invalid_event', row, details });
    }
  });

  return { events: problems.length > 0 ? [] : events, problems };
}
