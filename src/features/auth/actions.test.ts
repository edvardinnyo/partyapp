import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';

import { signInWithGoogle } from './actions';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: jest.fn(),
      exchangeCodeForSession: jest.fn(),
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
