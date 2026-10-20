import type { SupabaseClient } from '@supabase/supabase-js';

import type { Accounts, AvatarStorage } from './app.ts';

const AVATAR_BUCKET = 'avatars';
const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Avatar storage backed by the private `avatars` bucket, using the admin (secret key) client. */
export function createAvatarStorage(admin: SupabaseClient): AvatarStorage {
  const bucket = admin.storage.from(AVATAR_BUCKET);

  return {
    async createUploadUrl(path) {
      const { data, error } = await bucket.createSignedUploadUrl(path);
      if (error) {
        throw error;
      }
      return { path: data.path, token: data.token };
    },

    async exists(path) {
      const separator = path.lastIndexOf('/');
      const folder = path.slice(0, separator);
      const fileName = path.slice(separator + 1);
      const { data, error } = await bucket.list(folder, { search: fileName, limit: 1 });
      if (error) {
        throw error;
      }
      return data.some((file) => file.name === fileName);
    },

    async createSignedUrl(path) {
      const { data, error } = await bucket.createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
      return error ? null : data.signedUrl;
    },

    async removeAll(userId) {
      const { data, error } = await bucket.list(userId, { limit: 1000 });
      if (error) {
        throw error;
      }
      if (data.length > 0) {
        const { error: removeError } = await bucket.remove(
          data.map((file) => `${userId}/${file.name}`),
        );
        if (removeError) {
          throw removeError;
        }
      }
    },
  };
}

export function createAccounts(admin: SupabaseClient): Accounts {
  return {
    async deleteUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) {
        throw error;
      }
    },
  };
}
