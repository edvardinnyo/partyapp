// Shared between the app (Metro/Jest) and the API Edge Function (Deno).
// Keep it free of runtime-specific imports: only `zod`.
import { z } from 'zod';

/** D-004: 3–20 characters; lowercase letters, digits, dot and underscore. */
export const USERNAME_PATTERN = /^[a-z0-9._]{3,20}$/;
export const USERNAME_MAX_LENGTH = 20;
export const DISPLAY_NAME_MAX_LENGTH = 50;

/** D-008/3: decided at registration, never changed afterwards. */
export const ACCOUNT_TYPES = ['person', 'partner'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

/** D-008/4: a partner publishes events only after the team approves the application. */
export const PARTNER_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type PartnerStatus = (typeof PARTNER_STATUSES)[number];

/** D-008: the partner's short introduction on the profile. */
export const PARTNER_BIO_MAX_LENGTH = 500;

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

/** An empty introduction removes it. */
const bioSchema = z
  .string()
  .trim()
  .max(PARTNER_BIO_MAX_LENGTH)
  .transform((bio) => (bio === '' ? null : bio));

/**
 * Editing after sign-up (D-006): any of the fields; `avatarPath: null` removes the picture.
 * Partners change their logo and introduction here; their public name belongs to the
 * application (D-008), people have no introduction.
 */
export const updateProfileInputSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    avatarPath: z.string().min(1).nullable().optional(),
    bio: bioSchema.nullable().optional(),
  })
  .refine(
    (input) =>
      input.displayName !== undefined || input.avatarPath !== undefined || input.bio !== undefined,
  );
export type UpdateProfileInput = z.input<typeof updateProfileInputSchema>;

/** The own partner data; only the partner and the team see it (D-008). */
export const partnerInfoSchema = z.object({
  status: z.string(),
  rejectionReason: z.string().nullable(),
  companyName: z.string(),
  taxNumber: z.string(),
  contactName: z.string(),
  contactPhone: z.string(),
  address: z.string(),
  website: z.string().nullable(),
  bio: z.string().nullable(),
});
export type PartnerInfo = z.infer<typeof partnerInfoSchema>;

// Types and statuses travel as plain strings, so an older app keeps working if new ones appear.
export const profileSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  tasteCompleted: z.boolean(),
  /** F1: the top 3 genres, best first (slugs from genres.ts). */
  topGenres: z.array(z.string()),
  accountType: z.string(),
  /** D-008/5: an approved partner, shown with the "verified partner" badge. */
  verified: z.boolean(),
  /** Only in the own profile of a partner. */
  partner: partnerInfoSchema.nullable(),
});
export type Profile = z.infer<typeof profileSchema>;

export function isPartnerProfile(profile: Pick<Profile, 'accountType'>): boolean {
  return profile.accountType === 'partner';
}

export const meResponseSchema = z.object({ profile: profileSchema.nullable() });
export type MeResponse = z.infer<typeof meResponseSchema>;

/** `protected`: too close to a verified partner's name (D-008/5). */
export const usernameAvailabilitySchema = z.object({
  available: z.boolean(),
  reason: z.string().nullable().optional(),
});

export const avatarUploadSchema = z.object({ path: z.string(), token: z.string() });
export type AvatarUpload = z.infer<typeof avatarUploadSchema>;

export const API_ERROR_CODES = [
  'invalid_input',
  'username_taken',
  'name_protected',
  'profile_exists',
  'profile_missing',
  'invalid_avatar',
  'forbidden',
  'not_found',
  'internal',
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];
export const apiErrorSchema = z.object({ error: z.enum(API_ERROR_CODES) });
