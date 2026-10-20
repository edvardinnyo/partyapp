// Shared between the app (Metro/Jest) and the API Edge Function (Deno).
// Keep it free of runtime-specific imports: only `zod`.
import { z } from 'zod';

/**
 * D-005: the common genre list for users' taste and, later, for events (Q3).
 * The order is the display order. Labels live in the app's i18n files under `genres.<slug>`.
 * Adding a genre needs a database migration too (the `genre` enum).
 */
export const GENRES = [
  'techno',
  'house',
  'drum-and-bass',
  'trance',
  'hardstyle',
  'bass-dubstep',
  'edm',
  'hip-hop-rap',
  'rnb-soul',
  'pop',
  'rock',
  'metal',
  'punk',
  'indie-alternative',
  'jazz',
  'funk-disco',
  'reggae-dancehall',
  'latin-reggaeton',
  'classical',
  'folk',
  'mulatos',
  'retro',
] as const;
export type Genre = (typeof GENRES)[number];

export function isGenre(value: string): value is Genre {
  return (GENRES as readonly string[]).includes(value);
}

/** D-001: at least 3 and at most 10 genres. */
export const MIN_TASTE_GENRES = 3;
export const MAX_TASTE_GENRES = 10;

export const genreSchema = z.enum(GENRES);

/** The manual choice, in the user's order: the first is the favourite (D-005). */
export const tasteInputSchema = z.object({
  genres: z
    .array(genreSchema)
    .min(MIN_TASTE_GENRES)
    .max(MAX_TASTE_GENRES)
    .refine((genres) => new Set(genres).size === genres.length),
});
export type TasteInput = z.infer<typeof tasteInputSchema>;

// Responses carry plain strings, so an older app keeps working when a genre is added later.
export const tasteResponseSchema = z.object({ genres: z.array(z.string()) });
