export type Position = { lat: number; lng: number };

/** D-007/1: we start in Budapest. Without the user's position, distances count from its centre. */
export const LAUNCH_CITY_CENTER: Position = { lat: 47.4979, lng: 19.0402 };

/**
 * About 100 m, plenty for "within X km". The exact position never leaves the phone, and small
 * movements do not trigger new requests.
 */
export function roundPosition({ lat, lng }: Position): Position {
  return { lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000 };
}
