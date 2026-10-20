// P-01: nearby markers merge into numbered clusters and split up when zooming in.
import type { Region } from 'react-native-maps';
import Supercluster from 'supercluster';

import type { Position } from '@/features/location/position';

export type MapEventPoint = { id: string; lat: number; lng: number; recommended: boolean };

export type MapItem =
  | { kind: 'event'; id: string; lat: number; lng: number; recommended: boolean }
  | { kind: 'cluster'; id: number; lat: number; lng: number; count: number; recommended: boolean };

/** Markers closer than this (in map pixels) merge. */
const CLUSTER_RADIUS = 40;
/** From the next zoom level on, nothing is clustered. */
export const CLUSTER_MAX_ZOOM = 17;
/** Events at the same venue are placed around it, about 20 m apart, so each can be tapped. */
const SAME_PLACE_SPREAD_DEGREES = 0.0002;

type PointProperties = { id: string; recommended: boolean };
type ClusterProperties = { recommended: boolean };

export function spreadSamePlace(points: readonly MapEventPoint[]): MapEventPoint[] {
  const byPlace = new Map<string, MapEventPoint[]>();
  for (const point of points) {
    const key = `${point.lat},${point.lng}`;
    byPlace.set(key, [...(byPlace.get(key) ?? []), point]);
  }
  return [...byPlace.values()].flatMap((group) =>
    group.length === 1
      ? group
      : group.map((point, index) => {
          const angle = (2 * Math.PI * index) / group.length;
          const lngScale = Math.cos((point.lat * Math.PI) / 180);
          return {
            ...point,
            lat: point.lat + SAME_PLACE_SPREAD_DEGREES * Math.sin(angle),
            lng: point.lng + (SAME_PLACE_SPREAD_DEGREES * Math.cos(angle)) / lngScale,
          };
        }),
  );
}

export function createClusterIndex(points: readonly MapEventPoint[]) {
  const index = new Supercluster<PointProperties, ClusterProperties>({
    radius: CLUSTER_RADIUS,
    maxZoom: CLUSTER_MAX_ZOOM,
    // P-01: a cluster has the recommended colour if any of its events is recommended.
    map: ({ recommended }) => ({ recommended }),
    reduce: (merged, { recommended }) => {
      merged.recommended = merged.recommended || recommended;
    },
  });
  index.load(
    spreadSamePlace(points).map(({ id, lat, lng, recommended }) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [lng, lat] },
      properties: { id, recommended },
    })),
  );
  return index;
}

export type ClusterIndex = ReturnType<typeof createClusterIndex>;

/** The web-map zoom level that shows this much longitude across the screen. */
export function regionZoom(region: Region): number {
  return Math.max(0, Math.min(20, Math.log2(360 / region.longitudeDelta)));
}

/** The visible area plus a margin, so markers do not pop in at the edges while panning. */
function regionBounds(region: Region): [number, number, number, number] {
  const halfLng = region.longitudeDelta * 0.75;
  const halfLat = region.latitudeDelta * 0.75;
  return [
    Math.max(-180, region.longitude - halfLng),
    Math.max(-90, region.latitude - halfLat),
    Math.min(180, region.longitude + halfLng),
    Math.min(90, region.latitude + halfLat),
  ];
}

export function mapItems(index: ClusterIndex, region: Region): MapItem[] {
  return index.getClusters(regionBounds(region), regionZoom(region)).map((feature): MapItem => {
    const [lng = 0, lat = 0] = feature.geometry.coordinates;
    const { properties } = feature;
    if ('cluster_id' in properties) {
      return {
        kind: 'cluster',
        id: properties.cluster_id,
        lat,
        lng,
        count: properties.point_count,
        recommended: properties.recommended,
      };
    }
    return { kind: 'event', id: properties.id, lat, lng, recommended: properties.recommended };
  });
}

/** Centred on the cluster, zoomed in to where it splits up. */
export function clusterExpansionRegion(
  index: ClusterIndex,
  cluster: { id: number; lat: number; lng: number },
  current: Region,
): Region {
  const zoom = Math.min(index.getClusterExpansionZoom(cluster.id), CLUSTER_MAX_ZOOM + 1);
  const longitudeDelta = 360 / 2 ** zoom;
  return {
    latitude: cluster.lat,
    longitude: cluster.lng,
    longitudeDelta,
    latitudeDelta: longitudeDelta * (current.latitudeDelta / current.longitudeDelta),
  };
}

/** A view of about `radiusKm` around the centre (Q6: the slider's distance). */
export function regionAround(center: Position, radiusKm: number): Region {
  const latitudeDelta = Math.min(Math.max((radiusKm * 2.2) / 111, 0.02), 4);
  return {
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta,
    longitudeDelta: latitudeDelta / Math.cos((center.lat * Math.PI) / 180),
  };
}
