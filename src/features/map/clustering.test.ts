import {
  clusterExpansionRegion,
  createClusterIndex,
  type MapEventPoint,
  mapItems,
  regionAround,
  spreadSamePlace,
} from './clustering';

const BUDAPEST = { lat: 47.4979, lng: 19.0402 };

const point = (id: string, lat: number, lng: number, recommended = false): MapEventPoint => ({
  id,
  lat,
  lng,
  recommended,
});

// Two venues in the inner city, about 300 m apart, and one in Szentendre (about 19 km away).
const points = [
  point('klub-1', 47.4987, 19.0634),
  point('klub-2', 47.4987, 19.0634, true),
  point('pince', 47.4995, 19.06),
  point('szentendre', 47.669, 19.075),
];

describe('P-01 clustering', () => {
  it('merges close markers when zoomed out, keeping the recommended colour', () => {
    const items = mapItems(createClusterIndex(points), regionAround(BUDAPEST, 25));

    const cluster = items.find((item) => item.kind === 'cluster');
    expect(cluster).toMatchObject({ kind: 'cluster', count: 3, recommended: true });
    expect(items).toContainEqual(expect.objectContaining({ kind: 'event', id: 'szentendre' }));
  });

  it('splits a cluster when zooming in to it', () => {
    const index = createClusterIndex(points);
    const overview = regionAround(BUDAPEST, 25);
    const cluster = mapItems(index, overview).find((item) => item.kind === 'cluster');
    if (cluster?.kind !== 'cluster') throw new Error('expected a cluster');

    let region = overview;
    for (let step = 0; step < 5; step += 1) {
      const next = mapItems(index, region).find((item) => item.kind === 'cluster');
      if (next?.kind !== 'cluster') break;
      region = clusterExpansionRegion(index, next, region);
    }

    const ids = mapItems(index, region)
      .filter((item) => item.kind === 'event')
      .map((item) => item.id);
    expect(ids).toEqual(expect.arrayContaining(['klub-1', 'klub-2', 'pince']));
  });

  it('places events of the same venue around it, so each can be tapped', () => {
    const spread = spreadSamePlace(points.slice(0, 2));

    expect(spread[0]).not.toEqual(expect.objectContaining({ lat: 47.4987, lng: 19.0634 }));
    expect(
      Math.abs(spread[0]!.lat - spread[1]!.lat) + Math.abs(spread[0]!.lng - spread[1]!.lng),
    ).toBeGreaterThan(0.0001);
    expect(Math.abs(spread[0]!.lat - 47.4987)).toBeLessThan(0.001);
  });
});

describe('regionAround (Q6)', () => {
  it('shows about the search radius, within sensible limits', () => {
    expect(regionAround(BUDAPEST, 25).latitudeDelta).toBeCloseTo(0.4955, 3);
    expect(regionAround(BUDAPEST, 0.1).latitudeDelta).toBe(0.02);
    expect(regionAround(BUDAPEST, 200).latitudeDelta).toBeCloseTo(3.964, 3);
    expect(regionAround(BUDAPEST, 1000).latitudeDelta).toBe(4);
  });
});
