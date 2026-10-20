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
  usernameAvailabilitySchema,
} from '@shared/contracts/profile';
import { supabase } from '@/lib/supabase';

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode | 'network',
    readonly status?: number,
  ) {
    super(`API error: ${code}`);
  }
}

type Method = 'GET' | 'POST' | 'DELETE';

/** Calls the `api` Edge Function; supabase-js adds the signed-in user's token. */
async function call<T>(
  path: string,
  method: Method,
  schema: z.ZodType<T>,
  body?: Record<string, unknown>,
) {
  const { data, error } = await supabase.functions.invoke(`api/${path}`, { method, body });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const parsed = apiErrorSchema.safeParse(await error.context.json().catch(() => null));
      throw new ApiError(parsed.success ? parsed.data.error : 'internal', error.context.status);
    }
    throw new ApiError('network');
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

  completeTaste: (): Promise<MeResponse> => call('onboarding/taste', 'POST', meResponseSchema),

  deleteAccount: async (): Promise<void> => {
    await call('account', 'DELETE', z.unknown());
  },
};
