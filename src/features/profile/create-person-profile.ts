import type { TFunction } from 'i18next';

import { MIN_TASTE_GENRES } from '@shared/contracts/genres';
import type { MeResponse } from '@shared/contracts/profile';
import type { PersonDraft } from '@/features/auth/registration-store';
import { api, ApiError } from '@/lib/api';

import { uploadAvatar } from './avatar-upload';

export class AvatarUploadError extends Error {}

/**
 * D-004 + D-009: creates a person's profile from what was typed (with the picture), then saves
 * the taste chosen before the email code. `tasteSaved` is false when there was no taste yet or
 * saving it failed; the taste step then asks again, with the genres filled in.
 */
export async function createPersonProfile(
  person: PersonDraft,
): Promise<{ me: MeResponse; tasteSaved: boolean }> {
  const avatarPath = person.avatar
    ? await uploadAvatar(person.avatar).catch(() => {
        throw new AvatarUploadError();
      })
    : null;
  const created = await api.createProfile({
    displayName: person.displayName,
    username: person.username,
    avatarPath,
    adultConfirmed: true,
    privacyAccepted: true,
  });
  if (person.genres.length < MIN_TASTE_GENRES) {
    return { me: created, tasteSaved: false };
  }
  try {
    return { me: await api.saveTaste(person.genres), tasteSaved: true };
  } catch {
    return { me: created, tasteSaved: false };
  }
}

/** The message for a profile that could not be created, as the form shows it. */
export function profileErrorMessage(error: unknown, t: TFunction): string {
  const code = error instanceof ApiError ? error.code : null;
  if (code === 'username_taken') {
    return t('onboarding.usernameTaken');
  }
  if (code === 'name_protected') {
    return t('partners.nameProtected');
  }
  if (error instanceof AvatarUploadError || code === 'invalid_avatar') {
    return t('onboarding.avatarUploadFailed');
  }
  if (code === 'network') {
    return t('common.networkError');
  }
  return t('common.genericError');
}
