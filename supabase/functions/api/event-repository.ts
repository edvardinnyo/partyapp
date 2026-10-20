import { and, asc, eq, gt, lt, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { events, venues } from '../_shared/db/schema.ts';
import type { EventRepository, StoredEvent } from './app.ts';

const eventColumns = {
  id: events.id,
  title: events.title,
  kind: events.kind,
  startsAt: events.startsAt,
  endsAt: events.endsAt,
  genres: events.genres,
  performers: events.performers,
  venueName: venues.name,
  venueAddress: venues.address,
  venueLat: venues.lat,
  venueLng: venues.lng,
};

type EventRow = Omit<StoredEvent, 'venue'> & {
  venueName: string;
  venueAddress: string;
  venueLat: number;
  venueLng: number;
};

function toStoredEvent({ venueName, venueAddress, venueLat, venueLng, ...event }: EventRow) {
  const stored: StoredEvent = {
    ...event,
    venue: { name: venueName, address: venueAddress, lat: venueLat, lng: venueLng },
  };
  return stored;
}

/** A PostGIS point. The casts tell the database the parameter types (no prepared statements). */
function geographyPoint(lat: number, lng: number) {
  return sql`extensions.st_setsrid(extensions.st_makepoint(${lng}::double precision, ${lat}::double precision), 4326)::extensions.geography`;
}

export function createEventRepository(db: PostgresJsDatabase): EventRepository {
  return {
    async findNearby({ lat, lng, radiusKm, endsAfter, startsBefore, limit }) {
      const origin = geographyPoint(lat, lng);
      // Distances on the earth's surface, in metres; ST_DWithin uses the venues' spatial index.
      const distanceMetres = sql<number>`extensions.st_distance(${venues.location}, ${origin})`;
      const rows = await db
        .select({ ...eventColumns, distanceMetres: distanceMetres.mapWith(Number) })
        .from(events)
        .innerJoin(venues, eq(events.venueId, venues.id))
        .where(
          and(
            gt(events.endsAt, endsAfter),
            lt(events.startsAt, startsBefore),
            sql`extensions.st_dwithin(${venues.location}, ${origin}, ${radiusKm * 1000}::double precision)`,
          ),
        )
        .orderBy(distanceMetres, asc(events.startsAt), asc(events.id))
        .limit(limit);
      return rows.map(({ distanceMetres: metres, ...row }) => ({
        ...toStoredEvent(row),
        distanceKm: metres / 1000,
      }));
    },

    async findById(id) {
      const [row] = await db
        .select(eventColumns)
        .from(events)
        .innerJoin(venues, eq(events.venueId, venues.id))
        .where(eq(events.id, id))
        .limit(1);
      return row ? toStoredEvent(row) : null;
    },
  };
}
