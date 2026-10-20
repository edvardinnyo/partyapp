// Shared between the app (Metro/Jest) and the API Edge Function (Deno).
// Keep it free of runtime-specific imports: only `zod`.
import { z } from 'zod';

/** D-004: 3–20 characters; lowercase letters, digits, dot and underscore. */
export const USERNAME_PATTERN = /^[a-z0-9._]{3,20}$/;
export const USERNAME_MAX_LENGTH = 20;
export const DISPLAY_NAME_MAX_LENGTH = 50;

/** Usernames are case-insensitive, so they are stored and compared in lowercase. */
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export const usernameSchema = z.string().regex(USERNAME_PATTERN);
export const displayNameSchema = z.string().trim().min(1).max(DISPLAY_NAME_MAX_LENGTH);

export const createProfileInputSchema = z.object({
  displayName: displayNameSchema,
  username: usernameSchema,
  avatarPath: z.string().min(1).nullable(),
  // D-004: the 18+ confirmation and the privacy notice acceptance are both required.
  adultConfirmed: z.literal(true),
  privacyAccepted: z.literal(true),
});
export type CreateProfileInput = z.infer<typeof createProfileInputSchema>;

/** Editing after sign-up (D-006): any of the fields; `avatarPath: null` removes the picture. */
export const updateProfileInputSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    avatarPath: z.string().min(1).nullable().optional(),
  })
  .refine((input) => input.displayName !== undefined || input.avatarPath !== undefined);
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

export const profileSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  tasteCompleted: z.boolean(),
});
export type Profile = z.infer<typeof profileSchema>;

export const meResponseSchema = z.object({ profile: profileSchema.nullable() });
export type MeResponse = z.infer<typeof meResponseSchema>;

export const usernameAvailabilitySchema = z.object({ available: z.boolean() });

export const avatarUploadSchema = z.object({ path: z.string(), token: z.string() });
export type AvatarUpload = z.infer<typeof avatarUploadSchema>;

export const API_ERROR_CODES = [
  'invalid_input',
  'username_taken',
  'profile_exists',
  'profile_missing',
  'invalid_avatar',
  'internal',
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];
export const apiErrorSchema = z.object({ error: z.enum(API_ERROR_CODES) });
