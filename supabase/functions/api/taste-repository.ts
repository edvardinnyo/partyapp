import { asc, eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { profiles, tasteGenres, tasteProfiles } from '../_shared/db/schema.ts';
import type { TasteRepository } from './app.ts';

export function createTasteRepository(db: PostgresJsDatabase): TasteRepository {
  return {
    async getChosenGenres(userId) {
      const rows = await db
        .select({ genre: tasteGenres.genre })
        .from(tasteGenres)
        .where(eq(tasteGenres.userId, userId))
        .orderBy(asc(tasteGenres.position));
      return rows.map(({ genre }) => genre);
    },

    async getTopGenres(userId) {
      const [row] = await db
        .select({ topGenres: tasteProfiles.topGenres })
        .from(tasteProfiles)
        .where(eq(tasteProfiles.userId, userId))
        .limit(1);
      return row?.topGenres ?? [];
    },

    async getResult(userId) {
      const [row] = await db
        .select({ topGenres: tasteProfiles.topGenres, scores: tasteProfiles.genreScores })
        .from(tasteProfiles)
        .where(eq(tasteProfiles.userId, userId))
        .limit(1);
      return row ?? null;
    },

    async save(userId, genres, taste, at) {
      await db.transaction(async (tx) => {
        await tx.delete(tasteGenres).where(eq(tasteGenres.userId, userId));
        await tx
          .insert(tasteGenres)
          .values(genres.map((genre, position) => ({ userId, genre, position })));

        const profile = { topGenres: taste.topGenres, genreScores: taste.scores, computedAt: at };
        await tx
          .insert(tasteProfiles)
          .values({ userId, ...profile })
          .onConflictDoUpdate({ target: tasteProfiles.userId, set: profile });

        // Drizzle turns off postgres.js's own date serialisation, so a Date inside a raw `sql`
        // fragment (unlike a column value) must be passed as an ISO string with a cast.
        await tx
          .update(profiles)
          .set({
            tasteCompletedAt: sql`coalesce(${profiles.tasteCompletedAt}, ${at.toISOString()}::timestamptz)`,
            updatedAt: at,
          })
          .where(eq(profiles.id, userId));
      });
    },
  };
}
