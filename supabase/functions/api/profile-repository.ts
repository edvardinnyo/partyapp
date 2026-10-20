import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { profiles } from '../_shared/db/schema.ts';
import type { ProfileRepository } from './app.ts';

const UNIQUE_VIOLATION = '23505';

const storedProfileColumns = {
  id: profiles.id,
  username: profiles.username,
  displayName: profiles.displayName,
  avatarPath: profiles.avatarPath,
  tasteCompletedAt: profiles.tasteCompletedAt,
};

/** Returns the violated unique constraint's name, or null for any other error. */
function uniqueViolation(error: unknown): string | null {
  // Drizzle may wrap the driver's error, so look at the cause too.
  for (const candidate of [error, (error as { cause?: unknown } | null)?.cause]) {
    const pgError = candidate as { code?: string; constraint_name?: string } | null;
    if (pgError?.code === UNIQUE_VIOLATION) {
      return pgError.constraint_name ?? '';
    }
  }
  return null;
}

export function createProfileRepository(db: PostgresJsDatabase): ProfileRepository {
  return {
    async findById(userId) {
      const [row] = await db
        .select(storedProfileColumns)
        .from(profiles)
        .where(eq(profiles.id, userId))
        .limit(1);
      return row ?? null;
    },

    async isUsernameTaken(username) {
      const [row] = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.username, username))
        .limit(1);
      return row !== undefined;
    },

    async create(profile) {
      try {
        const [row] = await db.insert(profiles).values(profile).returning(storedProfileColumns);
        if (!row) {
          throw new Error('Profile insert returned no row');
        }
        return row;
      } catch (error) {
        const constraint = uniqueViolation(error);
        if (constraint === 'profiles_username_unique') {
          return 'username_taken';
        }
        if (constraint === 'profiles_pkey') {
          return 'profile_exists';
        }
        throw error;
      }
    },

    async markTasteCompleted(userId, at) {
      const [row] = await db
        .update(profiles)
        .set({ tasteCompletedAt: at, updatedAt: at })
        .where(eq(profiles.id, userId))
        .returning(storedProfileColumns);
      return row ?? null;
    },

    async update(userId, { displayName, avatarPath }, at) {
      const [row] = await db
        .update(profiles)
        .set({
          ...(displayName !== undefined ? { displayName } : {}),
          ...(avatarPath !== undefined ? { avatarPath } : {}),
          updatedAt: at,
        })
        .where(eq(profiles.id, userId))
        .returning(storedProfileColumns);
      return row ?? null;
    },
  };
}
