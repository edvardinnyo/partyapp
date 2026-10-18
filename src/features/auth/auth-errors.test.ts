import { AuthApiError, AuthRetryableFetchError } from '@supabase/supabase-js';

import { authErrorMessageKey, isEmailNotConfirmed } from './auth-errors';

function apiError(code: string) {
  return new AuthApiError('message', 400, code);
}

describe('authErrorMessageKey', () => {
  it('maps known Supabase error codes to UI strings', () => {
    expect(authErrorMessageKey(apiError('invalid_credentials'))).toBe(
      'auth.errors.invalidCredentials',
    );
    expect(authErrorMessageKey(apiError('otp_expired'))).toBe('auth.errors.invalidCode');
    expect(authErrorMessageKey(apiError('over_email_send_rate_limit'))).toBe(
      'auth.errors.rateLimited',
    );
  });

  it('reports network problems separately', () => {
    expect(authErrorMessageKey(new AuthRetryableFetchError('offline', 0))).toBe(
      'common.networkError',
    );
  });

  it('falls back to a generic message', () => {
    expect(authErrorMessageKey(apiError('something_new'))).toBe('common.genericError');
    expect(authErrorMessageKey(new Error('boom'))).toBe('common.genericError');
  });
});

describe('isEmailNotConfirmed', () => {
  it('recognises the unconfirmed-email error', () => {
    expect(isEmailNotConfirmed(apiError('email_not_confirmed'))).toBe(true);
    expect(isEmailNotConfirmed(apiError('invalid_credentials'))).toBe(false);
  });
});
