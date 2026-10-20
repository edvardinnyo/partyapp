import { buildHomeGridRows } from './home-grid';

const events = (count: number) =>
  Array.from({ length: count }, (_, index) => ({ id: `e${index + 1}` }));

const shape = (count: number) =>
  buildHomeGridRows(events(count)).map((row) =>
    row.kind === 'ad' ? 'ad' : row.events.map(({ id }) => id).join(','),
  );

describe('buildHomeGridRows (F5, D-007/3)', () => {
  it('puts two events in a row', () => {
    expect(shape(3)).toEqual(['e1,e2', 'e3']);
    expect(shape(0)).toEqual([]);
  });

  it('adds a full-width banner after every 6 events, but only between events', () => {
    expect(shape(6)).toEqual(['e1,e2', 'e3,e4', 'e5,e6']);
    expect(shape(7)).toEqual(['e1,e2', 'e3,e4', 'e5,e6', 'ad', 'e7']);
    expect(shape(14)).toEqual([
      'e1,e2',
      'e3,e4',
      'e5,e6',
      'ad',
      'e7,e8',
      'e9,e10',
      'e11,e12',
      'ad',
      'e13,e14',
    ]);
  });

  it('gives every row a stable, unique key', () => {
    const keys = buildHomeGridRows(events(14)).map(({ key }) => key);

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys[3]).toBe('ad-6');
  });
});
