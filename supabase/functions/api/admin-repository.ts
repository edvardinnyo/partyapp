import { and, asc, eq, type SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { authUsers } from 'drizzle-orm/supabase';

import { admins, partners, profiles } from '../_shared/db/schema.ts';
import type { AdminRepository } from './app.ts';

const applicationColumns = {
  userId: partners.userId,
  displayName: profiles.displayName,
  username: profiles.username,
  avatarPath: profiles.avatarPath,
  accountEmail: authUsers.email,
  companyName: partners.companyName,
  taxNumber: partners.taxNumber,
  contactName: partners.contactName,
  contactPhone: partners.contactPhone,
  address: partners.address,
  website: partners.website,
  submittedAt: partners.submittedAt,
};

/** The company details with the public profile and the account's email address. */
function selectApplications(db: Pick<PostgresJsDatabase, 'select'>, where: SQL) {
  return db
    .select(applicationColumns)
    .from(partners)
    .innerJoin(profiles, eq(profiles.id, partners.userId))
    .leftJoin(authUsers, eq(authUsers.id, partners.userId))
    .where(where);
}

export function createAdminRepository(db: PostgresJsDatabase): AdminRepository {
  return {
    async isAdmin(userId) {
      const [row] = await db
        .select({ userId: admins.userId })
        .from(admins)
        .where(eq(admins.userId, userId))
        .limit(1);
      return row !== undefined;
    },

    async pendingApplications() {
      return selectApplications(db, eq(partners.status, 'pending')).orderBy(
        asc(partners.submittedAt),
      );
    },

    async decide(userId, { approved, reason }, at) {
      return db.transaction(async (tx) => {
        // The status condition makes a second, concurrent decision find nothing.
        const [decided] = await tx
          .update(partners)
          .set({
            status: approved ? 'approved' : 'rejected',
            rejectionReason: reason,
            decidedAt: at,
            updatedAt: at,
          })
          .where(and(eq(partners.userId, userId), eq(partners.status, 'pending')))
          .returning({ userId: partners.userId });
        if (!decided) {
          return null;
        }
        const [application] = await selectApplications(tx, eq(partners.userId, userId));
        return application ?? null;
      });
    },
  };
}
