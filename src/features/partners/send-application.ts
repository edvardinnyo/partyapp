import type { TFunction } from 'i18next';

import type { MeResponse } from '@shared/contracts/profile';
import { type PickedAvatar, uploadAvatar } from '@/features/profile/avatar-upload';
import { api, ApiError } from '@/lib/api';

import type { PartnerApplicationDraft } from './partner-signup-store';

export class LogoUploadError extends Error {}

/** Uploads the logo (if any), then sends the first application; needs a signed-in account. */
export async function sendPartnerApplication(
  draft: PartnerApplicationDraft,
  logo: PickedAvatar | null,
): Promise<MeResponse> {
  const avatarPath = logo
    ? await uploadAvatar(logo).catch(() => {
        throw new LogoUploadError();
      })
    : null;
  return api.submitPartnerApplication({
    ...draft,
    avatarPath,
    termsAccepted: true,
    privacyAccepted: true,
  });
}

/** The message for a failed application, as the form shows it. */
export function applicationErrorMessage(error: unknown, t: TFunction): string {
  const code = error instanceof ApiError ? error.code : null;
  if (code === 'username_taken') {
    return t('onboarding.usernameTaken');
  }
  if (code === 'name_protected') {
    return t('partners.nameProtected');
  }
  if (error instanceof LogoUploadError || code === 'invalid_avatar') {
    return t('onboarding.avatarUploadFailed');
  }
  if (code === 'network') {
    return t('common.networkError');
  }
  return t('common.genericError');
}
