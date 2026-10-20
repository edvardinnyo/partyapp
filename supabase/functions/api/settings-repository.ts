import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { userSettings } from '../_shared/db/schema.ts';
import type { SettingsRepository } from './app.ts';

export function createSettingsRepository(db: PostgresJsDatabase): SettingsRepository {
  return {
    async find(userId) {
      const [row] = await db
        .select({ searchRadiusKm: userSettings.searchRadiusKm })
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);
      return row ?? null;
    },

    async save(userId, settings, at) {
      await db
        .insert(userSettings)
        .values({ userId, ...settings, updatedAt: at })
        .onConflictDoUpdate({ target: userSettings.userId, set: { ...settings, updatedAt: at } });
    },
  };
}
