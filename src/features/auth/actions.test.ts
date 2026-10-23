import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';

import { confirmSignUp, signInWithGoogle } from './actions';
import { useRegistrationStore } from './registration-store';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn(),
      exchangeCodeForSession: jest.fn(),
      verifyOtp: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

jest.mock('@/lib/api', () => ({ api: {} }));

jest.mock('expo-linking', () => ({
  createURL: (path: string) => `exp://example.exp.direct/--/${path}`,
}));

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

const auth = jest.mocked(supabase.auth);
const openAuthSession = jest.mocked(WebBrowser.openAuthSessionAsync);

describe('signInWithGoogle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'info').mockImplementation(() => {});
    auth.signInWithOAuth.mockResolvedValue({
      data: { provider: 'google', url: 'https://auth.example/authorize' },
      error: null,
    } as never);
  });

  it('always asks Google to show the account chooser', async () => {
    openAuthSession.mockResolvedValue({ type: 'cancel' as WebBrowser.WebBrowserResultType });

    await signInWithGoogle();

    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: {
        redirectTo: 'exp://example.exp.direct/--/auth/callback',
        skipBrowserRedirect: true,
        queryParams: { prompt: 'select_account' },
      },
    });
  });

  it('reports a cancelled browser session', async () => {
    openAuthSession.mockResolvedValue({ type: 'cancel' as WebBrowser.WebBrowserResultType });

    expect(await signInWithGoogle()).toBe('cancelled');
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('exchanges the returned code for a session', async () => {
    openAuthSession.mockResolvedValue({
      type: 'success',
      url: 'exp://example.exp.direct/--/auth/callback?code=one-time-code',
    });
    auth.exchangeCodeForSession.mockResolvedValue({ data: {}, error: null } as never);

    expect(await signInWithGoogle()).toBe('signedIn');
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('one-time-code');
  });

  it('surfaces an error returned by the provider', async () => {
    openAuthSession.mockResolvedValue({
      type: 'success',
      url: 'exp://example.exp.direct/--/auth/callback?error=access_denied&error_description=Denied',
    });

    await expect(signInWithGoogle()).rejects.toThrow('Denied');
  });
});

describe('confirmSignUp (D-008/22, D-009)', () => {
  const pending = {
    accountType: 'partner' as const,
    email: 'info@fogashaz.hu',
    password: 'new-password',
    partner: {
      displayName: 'Fogasház',
      username: 'fogashaz',
      companyName: 'Fogasház Kft.',
      taxNumber: '12345676-2-42',
      contactName: 'Kiss Anna',
      contactPhone: '+36 30 123 4567',
      address: '1073 Budapest, Akácfa utca 51.',
      website: null,
    },
    logo: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    auth.verifyOtp.mockResolvedValue({ data: {}, error: null } as never);
    auth.updateUser.mockResolvedValue({ data: {}, error: null } as never);
    useRegistrationStore.setState({ pending });
  });

  it('applies the latest password and account type once the code proves the address', async () => {
    await confirmSignUp('Info@Fogashaz.hu ', '123456');

    expect(auth.updateUser).toHaveBeenCalledWith({ data: { account_type: 'partner' } });
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-password' });
    // The password is not kept after it is used; the rest waits for the application.
    expect(useRegistrationStore.getState().pending).toMatchObject({
      password: '',
      partner: { companyName: 'Fogasház Kft.' },
    });
  });

  it('accepts that the password is already the same', async () => {
    auth.updateUser
      .mockResolvedValueOnce({ data: {}, error: null } as never)
      .mockResolvedValueOnce({
        data: {},
        error: { code: 'same_password' },
      } as never);

    await expect(confirmSignUp('info@fogashaz.hu', '123456')).resolves.toBeUndefined();
  });

  it('leaves other accounts alone and fails on a wrong code', async () => {
    await confirmSignUp('someone@example.com', '123456');
    expect(auth.updateUser).not.toHaveBeenCalled();

    auth.verifyOtp.mockResolvedValue({ data: {}, error: new Error('invalid code') } as never);
    await expect(confirmSignUp('info@fogashaz.hu', '000000')).rejects.toThrow('invalid code');
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
});
