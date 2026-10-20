import { FunctionsHttpError } from '@supabase/supabase-js';
import { z } from 'zod';

import {
  type ApiErrorCode,
  apiErrorSchema,
  type AvatarUpload,
  avatarUploadSchema,
  type CreateProfileInput,
  type MeResponse,
  meResponseSchema,
  type UpdateProfileInput,
  usernameAvailabilitySchema,
} from '@shared/contracts/profile';
import {
  type EventDetail,
  eventDetailResponseSchema,
  type EventSummary,
  type NearbyEventsInput,
  nearbyEventsResponseSchema,
} from '@shared/contracts/events';
import { type Genre, isGenre, tasteResponseSchema } from '@shared/contracts/genres';
import { settingsResponseSchema, type UserSettings } from '@shared/contracts/settings';
import { supabase } from '@/lib/supabase';

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode | 'network',
    readonly status?: number,
  ) {
    super(`API error: ${code}`);
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Calls the `api` Edge Function; supabase-js adds the signed-in user's token. */
async function call<T>(
  path: string,
  method: Method,
  schema: z.ZodType<T>,
  body?: Record<string, unknown>,
) {
  const { data, error } = await supabase.functions.invoke(`api/${path}`, { method, body });
  if (error) {
    const apiError =
      error instanceof FunctionsHttpError
        ? await (async () => {
            const parsed = apiErrorSchema.safeParse(await error.context.json().catch(() => null));
            return new ApiError(
              parsed.success ? parsed.data.error : 'internal',
              error.context.status,
            );
          })()
        : new ApiError('network');
    if (__DEV__) {
      // Only the route and the error code: never request bodies or tokens.
      console.warn(`[api] ${method} ${path} failed: ${apiError.code} (${apiError.status ?? '-'})`);
    }
    throw apiError;
  }
  return schema.parse(data);
}

export const api = {
  getMe: (): Promise<MeResponse> => call('me', 'GET', meResponseSchema),

  isUsernameAvailable: async (username: string): Promise<boolean> =>
    (await call(`usernames/${encodeURIComponent(username)}`, 'GET', usernameAvailabilitySchema))
      .available,

  createAvatarUpload: (): Promise<AvatarUpload> =>
    call('profile/avatar-upload', 'POST', avatarUploadSchema),

  createProfile: (input: CreateProfileInput): Promise<MeResponse> =>
    call('profile', 'POST', meResponseSchema, input),

  updateProfile: (input: UpdateProfileInput): Promise<MeResponse> =>
    call('profile', 'PATCH', meResponseSchema, input),

  /** The manual choice, favourite first; genres this app version does not know are skipped. */
  getTaste: async (): Promise<Genre[]> =>
    (await call('taste', 'GET', tasteResponseSchema)).genres.filter(isGenre),

  saveTaste: (genres: Genre[]): Promise<MeResponse> =>
    call('taste', 'PUT', meResponseSchema, { genres }),

  deleteAccount: async (): Promise<void> => {
    await call('account', 'DELETE', z.unknown());
  },

  getSettings: async (): Promise<UserSettings> =>
    (await call('settings', 'GET', settingsResponseSchema)).settings,

  saveSettings: async (settings: UserSettings): Promise<UserSettings> =>
    (await call('settings', 'PUT', settingsResponseSchema, settings)).settings,

  /** F1, F5: live and upcoming events around the position, each with its distance and score. */
  getNearbyEvents: async (position: NearbyEventsInput): Promise<EventSummary[]> =>
    (await call('events/nearby', 'POST', nearbyEventsResponseSchema, position)).events,

  getEvent: async (id: string): Promise<EventDetail> =>
    (await call(`events/${encodeURIComponent(id)}`, 'GET', eventDetailResponseSchema)).event,
};
