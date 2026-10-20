// Shared between the app (Metro/Jest), the API Edge Function (Deno) and the import script (Node).
// Keep it free of runtime-specific imports: only `zod` and other shared files.
import { z } from 'zod';

import { genreSchema } from './genres.ts';

/** F1: clubs, bars, concerts and festivals. */
export const EVENT_KINDS = ['club', 'bar', 'concert', 'festival'] as const;
export type EventKind = (typeof EVENT_KINDS)[number];
export const eventKindSchema = z.enum(EVENT_KINDS);

/**
 * Where the user is. It travels in the request body, never in the URL, so it cannot end up in
 * access logs; the app rounds it to about 100 m before sending it.
 */
export const nearbyEventsInputSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type NearbyEventsInput = z.infer<typeof nearbyEventsInputSchema>;

const venueSchema = z.object({
  name: z.string(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
});
export type EventVenue = z.infer<typeof venueSchema>;

// Kinds and genres travel as plain strings, so an older app keeps working when new ones appear.
export const eventSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  kind: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  venue: venueSchema,
  genres: z.array(z.string()),
  /** From the position the app sent. */
  distanceKm: z.number(),
  /** How well the event matches the user's taste (F1); 0 means no match. */
  score: z.number(),
});
export type EventSummary = z.infer<typeof eventSummarySchema>;
export const nearbyEventsResponseSchema = z.object({ events: z.array(eventSummarySchema) });

export const eventIdSchema = z.uuid();

export const eventDetailSchema = eventSummarySchema
  .omit({ distanceKm: true, score: true })
  .extend({ performers: z.array(z.string()) });
export type EventDetail = z.infer<typeof eventDetailSchema>;
export const eventDetailResponseSchema = z.object({ event: eventDetailSchema });

/**
 * D-007/1: the one shape every event source is converted into before it reaches the database —
 * the CSV import now, partner (ticket seller) feeds later. A new source needs only a converter
 * into this shape; the database side (`public.import_events`) stays the same.
 */
export const importedEventSchema = z
  .object({
    /** Stable within the source, so importing again updates the event instead of duplicating it. */
    externalId: z.string().trim().min(1).max(200),
    title: z.string().trim().min(1).max(200),
    kind: eventKindSchema,
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    venue: z.object({
      externalId: z.string().trim().min(1).max(200),
      name: z.string().trim().min(1).max(200),
      address: z.string().trim().min(1).max(300),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }),
    genres: z
      .array(genreSchema)
      .min(1)
      .refine((genres) => new Set(genres).size === genres.length),
    performers: z.array(z.string().trim().min(1).max(200)),
    /** D-007/4: the partner's ticket page, once tickets are sold through partners. */
    ticketUrl: z.httpUrl().nullable(),
  })
  .refine((event) => Date.parse(event.endsAt) > Date.parse(event.startsAt), {
    message: 'endsAt must be later than startsAt',
    path: ['endsAt'],
  });
export type ImportedEvent = z.infer<typeof importedEventSchema>;
