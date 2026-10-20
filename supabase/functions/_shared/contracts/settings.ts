// Shared between the app (Metro/Jest) and the API Edge Function (Deno).
// Keep it free of runtime-specific imports: only `zod`.
import { z } from 'zod';

/** Q6: the search radius, set with the slider on the map; every recommendation uses it (F1). */
export const MIN_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 200;
export const DEFAULT_RADIUS_KM = 25;

export const userSettingsSchema = z.object({
  searchRadiusKm: z.number().int().min(MIN_RADIUS_KM).max(MAX_RADIUS_KM),
});
export type UserSettings = z.infer<typeof userSettingsSchema>;

/** Until the user moves the slider for the first time. */
export const DEFAULT_USER_SETTINGS: UserSettings = { searchRadiusKm: DEFAULT_RADIUS_KM };

// Lenient on purpose: an older app keeps working if the limits change later.
export const settingsResponseSchema = z.object({
  settings: z.object({ searchRadiusKm: z.number() }),
});
export type SettingsResponse = z.infer<typeof settingsResponseSchema>;
