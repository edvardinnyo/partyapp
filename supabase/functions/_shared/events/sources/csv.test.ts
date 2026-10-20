import {
  CSV_COLUMNS,
  detectDelimiter,
  eventsFromCsv,
  parseCsv,
  parseLocalDateTime,
} from './csv.ts';

const HEADER = CSV_COLUMNS.join(',');

type Row = Partial<Record<(typeof CSV_COLUMNS)[number], string>>;

const baseRow: Row = {
  id: 'ev-1',
  title: 'Minta Techno Éjszaka',
  kind: 'club',
  starts_at: '2026-10-24 22:00',
  ends_at: '2026-10-25 05:00',
  genres: 'techno|house',
  performers: 'Minta DJ|Minta Live',
  venue_id: 'minta-klub',
  venue_name: 'Minta Klub',
  venue_address: '1072 Budapest, Minta utca 1.',
  venue_lat: '47.4979',
  venue_lng: '19.0402',
  ticket_url: '',
};

function csvOf(...rows: Row[]) {
  const lines = rows.map((row) =>
    CSV_COLUMNS.map((column) => {
      const value = row[column] ?? '';
      return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
    }).join(','),
  );
  return [HEADER, ...lines].join('\r\n');
}

describe('parseCsv', () => {
  it('reads quoted cells with delimiters, quotes and line breaks', () => {
    expect(parseCsv('a,b\n"x, y","say ""hi""\nthere"\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"\nthere'],
    ]);
  });

  it('detects the semicolon of Hungarian Excel', () => {
    expect(detectDelimiter('id;title;kind\n1;2;3')).toBe(';');
    expect(detectDelimiter('id,title,kind')).toBe(',');
    expect(parseCsv('a;b\r\n1,5;2\r\n')).toEqual([
      ['a', 'b'],
      ['1,5', '2'],
    ]);
  });
});

describe('parseLocalDateTime', () => {
  it('accepts the ISO-like and the Hungarian Excel format', () => {
    const expected = { year: 2026, month: 10, day: 24, hour: 22, minute: 0 };
    expect(parseLocalDateTime('2026-10-24 22:00')).toEqual(expected);
    expect(parseLocalDateTime('2026. 10. 24. 22:00')).toEqual(expected);
    expect(parseLocalDateTime('2026-10-24T22:00:00')).toEqual(expected);
  });

  it('rejects other formats and impossible dates', () => {
    expect(parseLocalDateTime('24/10/2026 22:00')).toBeNull();
    expect(parseLocalDateTime('2026-10-24')).toBeNull();
    expect(parseLocalDateTime('2026-02-30 22:00')).toBeNull();
  });
});

describe('eventsFromCsv (D-007/1)', () => {
  it('converts a row into the shared import shape, with Budapest times in UTC', () => {
    const { events, problems } = eventsFromCsv(csvOf(baseRow));

    expect(problems).toEqual([]);
    expect(events).toEqual([
      {
        externalId: 'ev-1',
        title: 'Minta Techno Éjszaka',
        kind: 'club',
        startsAt: '2026-10-24T20:00:00.000Z',
        endsAt: '2026-10-25T04:00:00.000Z',
        venue: {
          externalId: 'minta-klub',
          name: 'Minta Klub',
          address: '1072 Budapest, Minta utca 1.',
          lat: 47.4979,
          lng: 19.0402,
        },
        genres: ['techno', 'house'],
        performers: ['Minta DJ', 'Minta Live'],
        ticketUrl: null,
      },
    ]);
  });

  it('reads a Hungarian Excel export: semicolons, decimal commas, BOM, Hungarian kinds', () => {
    const header = CSV_COLUMNS.join(';');
    const row =
      'ev-1;Minta;Koncert;2026. 10. 24. 20:00;2026. 10. 24. 23:00;Rock | Pop;;' +
      'minta-hely;Minta Hely;Budapest;47,5;19,05;';
    const text = `${String.fromCharCode(0xfeff)}${header}\r\n${row}\r\n;;;;;;;;;;;;\r\n`;

    const { events, problems } = eventsFromCsv(text);

    expect(problems).toEqual([]);
    expect(events[0]).toMatchObject({
      kind: 'concert',
      genres: ['rock', 'pop'],
      performers: [],
      venue: { lat: 47.5, lng: 19.05 },
    });
  });

  it('lists every problem with its spreadsheet row and imports nothing', () => {
    const { events, problems } = eventsFromCsv(
      csvOf(
        baseRow,
        { ...baseRow, id: 'ev-2', kind: 'disco', genres: 'techno|polka', venue_lat: 'north' },
        { ...baseRow, id: 'ev-3', title: '', ends_at: '2026-10-24 21:00' },
        { ...baseRow, id: 'ev-4', starts_at: '2026-03-29 02:30', ends_at: '2026-03-29 05:00' },
      ),
    );

    expect(events).toEqual([]);
    expect(problems).toEqual([
      { type: 'invalid_value', row: 3, column: 'kind', value: 'disco' },
      { type: 'invalid_value', row: 3, column: 'genres', value: 'polka' },
      { type: 'invalid_value', row: 3, column: 'venue_lat', value: 'north' },
      { type: 'missing_value', row: 4, column: 'title' },
      { type: 'ends_before_start', row: 4 },
      { type: 'nonexistent_time', row: 5, column: 'starts_at', value: '2026-03-29 02:30' },
    ]);
  });

  it('catches a repeated event id and a venue whose details differ', () => {
    const { problems } = eventsFromCsv(
      csvOf(baseRow, { ...baseRow, title: 'Másik' }, { ...baseRow, id: 'ev-2', venue_lat: '47.5' }),
    );

    expect(problems).toEqual([
      { type: 'duplicate_id', row: 3, firstRow: 2, id: 'ev-1' },
      { type: 'venue_mismatch', row: 4, firstRow: 2, venueId: 'minta-klub' },
    ]);
  });

  it('rejects a ticket link that is not a web address', () => {
    const { problems } = eventsFromCsv(csvOf({ ...baseRow, ticket_url: 'javascript:alert(1)' }));

    expect(problems).toEqual([
      { type: 'invalid_value', row: 2, column: 'ticket_url', value: 'javascript:alert(1)' },
    ]);
  });

  it('reports missing columns, an empty file and a file that is not UTF-8', () => {
    expect(eventsFromCsv('id,title\n1,x').problems).toEqual([
      {
        type: 'missing_columns',
        columns: [
          'kind',
          'starts_at',
          'ends_at',
          'genres',
          'venue_id',
          'venue_name',
          'venue_address',
          'venue_lat',
          'venue_lng',
        ],
      },
    ]);
    expect(eventsFromCsv('').problems).toEqual([{ type: 'empty' }]);
    expect(eventsFromCsv(`${HEADER}\nF${String.fromCharCode(0xfffd)}`).problems).toEqual([
      { type: 'not_utf8' },
    ]);
  });
});
