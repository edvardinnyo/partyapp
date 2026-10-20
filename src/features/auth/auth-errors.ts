import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';

export type AuthErrorMessageKey =
  | 'auth.errors.invalidCredentials'
  | 'auth.errors.emailNotConfirmed'
  | 'auth.errors.invalidEmail'
  | 'auth.errors.weakPassword'
  | 'auth.errors.invalidCode'
  | 'auth.errors.rateLimited'
  | 'auth.errors.samePassword'
  | 'common.networkError'
  | 'common.genericError';

const MESSAGE_BY_CODE: Partial<Record<string, AuthErrorMessageKey>> = {
  invalid_credentials: 'auth.errors.invalidCredentials',
  email_not_confirmed: 'auth.errors.emailNotConfirmed',
  email_address_invalid: 'auth.errors.invalidEmail',
  validation_failed: 'auth.errors.invalidEmail',
  weak_password: 'auth.errors.weakPassword',
  otp_expired: 'auth.errors.invalidCode',
  over_email_send_rate_limit: 'auth.errors.rateLimited',
  over_request_rate_limit: 'auth.errors.rateLimited',
  same_password: 'auth.errors.samePassword',
};

/** Maps a Supabase Auth error to a UI string; anything unknown gets a generic message. */
export function authErrorMessageKey(error: unknown): AuthErrorMessageKey {
  if (isAuthRetryableFetchError(error)) {
    return 'common.networkError';
  }
  if (isAuthError(error) && error.code) {
    return MESSAGE_BY_CODE[error.code] ?? 'common.genericError';
  }
  return 'common.genericError';
}

export function isEmailNotConfirmed(error: unknown): boolean {
  return isAuthError(error) && error.code === 'email_not_confirmed';
}
