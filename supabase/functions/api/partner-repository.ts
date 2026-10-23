import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { partners, profiles } from '../_shared/db/schema.ts';
import type { PartnerRepository } from './app.ts';
import { insertingProfile, storedProfileColumns } from './profile-repository.ts';

const storedPartnerColumns = {
  status: partners.status,
  companyName: partners.companyName,
  taxNumber: partners.taxNumber,
  contactName: partners.contactName,
  contactPhone: partners.contactPhone,
  address: partners.address,
  website: partners.website,
  bio: partners.bio,
  rejectionReason: partners.rejectionReason,
  submittedAt: partners.submittedAt,
};

export function createPartnerRepository(db: PostgresJsDatabase): PartnerRepository {
  return {
    async find(userId) {
      const [row] = await db
        .select(storedPartnerColumns)
        .from(partners)
        .where(eq(partners.userId, userId))
        .limit(1);
      return row ?? null;
    },

    async createApplication(profile, partner) {
      return insertingProfile(() =>
        db.transaction(async (tx) => {
          const [row] = await tx.insert(profiles).values(profile).returning(storedProfileColumns);
          if (!row) {
            throw new Error('Profile insert returned no row');
          }
          await tx.insert(partners).values({ userId: profile.id, ...partner });
          return row;
        }),
      );
    },

    async resubmit(userId, displayName, details, at) {
      await db.transaction(async (tx) => {
        await tx
          .update(profiles)
          .set({ displayName, updatedAt: at })
          .where(eq(profiles.id, userId));
        await tx
          .update(partners)
          .set({
            ...details,
            status: 'pending',
            submittedAt: at,
            decidedAt: null,
            rejectionReason: null,
            updatedAt: at,
          })
          .where(eq(partners.userId, userId));
      });
    },

    async updateBio(userId, bio, at) {
      await db.update(partners).set({ bio, updatedAt: at }).where(eq(partners.userId, userId));
    },
  };
}
