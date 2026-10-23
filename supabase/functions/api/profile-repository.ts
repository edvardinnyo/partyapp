import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { partners, profiles } from '../_shared/db/schema.ts';
import type { ProfileRepository, StoredProfile } from './app.ts';

const UNIQUE_VIOLATION = '23505';

export const storedProfileColumns = {
  id: profiles.id,
  username: profiles.username,
  displayName: profiles.displayName,
  avatarPath: profiles.avatarPath,
  tasteCompletedAt: profiles.tasteCompletedAt,
  accountType: profiles.accountType,
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

/** Turns a duplicate username or a second profile into the API's answer; rethrows the rest. */
export async function insertingProfile(
  insert: () => Promise<StoredProfile>,
): Promise<StoredProfile | 'username_taken' | 'profile_exists'> {
  try {
    return await insert();
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
      return insertingProfile(async () => {
        const [row] = await db.insert(profiles).values(profile).returning(storedProfileColumns);
        if (!row) {
          throw new Error('Profile insert returned no row');
        }
        return row;
      });
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

    async findProtectedNames() {
      // Few enough to check in full; a normalised, indexed name column can come with growth.
      return db
        .select({
          userId: profiles.id,
          username: profiles.username,
          displayName: profiles.displayName,
        })
        .from(profiles)
        .innerJoin(partners, eq(partners.userId, profiles.id))
        .where(eq(partners.status, 'approved'));
    },
  };
}
