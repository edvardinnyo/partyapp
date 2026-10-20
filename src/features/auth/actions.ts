import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

import { useAuthStore } from './auth-store';

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    throw error;
  }
}

/**
 * D-004: Supabase emails a 6-digit code to confirm the address.
 * For an address that already has a confirmed account Supabase sends nothing and returns a user
 * without identities (so accounts cannot be enumerated); the app then points to signing in.
 */
export async function signUp(
  email: string,
  password: string,
): Promise<'codeSent' | 'accountExists'> {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) {
    throw error;
  }
  return data.user?.identities?.length === 0 ? 'accountExists' : 'codeSent';
}

export async function confirmSignUp(email: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: code,
    type: 'email',
  });
  if (error) {
    throw error;
  }
}

export async function resendSignUpCode(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
  if (error) {
    throw error;
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  if (error) {
    throw error;
  }
}

/** Verifies the recovery code, then saves the new password before the app opens. */
export async function resetPassword(email: string, code: string, newPassword: string) {
  const { setRecoveringPassword } = useAuthStore.getState();
  setRecoveringPassword(true);
  try {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: 'recovery',
    });
    if (error) {
      throw error;
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) {
      // Do not leave the user signed in with the old password still in place.
      await supabase.auth.signOut({ scope: 'local' });
      throw updateError;
    }
  } finally {
    setRecoveringPassword(false);
  }
}

/**
 * D-004: browser-based Google sign-in (works in Expo Go). The native button needs a development
 * build and comes later; the user sees the same button either way.
 */
export async function signInWithGoogle(): Promise<'signedIn' | 'cancelled'> {
  // Expo Go: exp://<host>/--/auth/callback; a build: nocturnal://auth/callback.
  const redirectTo = Linking.createURL('auth/callback');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      // Always show Google's account chooser, even when the browser is already signed in.
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) {
    throw error;
  }
  if (__DEV__) {
    // Expo Go's address changes with the network; Supabase only returns to an allow-listed URL
    // (Authentication → URL Configuration) and otherwise falls back to the Site URL.
    console.info(`[auth] Google sign-in redirect URL: ${redirectTo}`);
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (__DEV__) {
    console.info(`[auth] Google sign-in browser result: ${result.type}`);
  }
  if (result.type !== 'success') {
    return 'cancelled';
  }

  const params = new URL(result.url).searchParams;
  const oauthError = params.get('error_description') ?? params.get('error');
  if (oauthError) {
    throw new Error(oauthError);
  }
  const code = params.get('code');
  if (!code) {
    throw new Error('The OAuth redirect has no code');
  }
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    throw exchangeError;
  }
  return 'signedIn';
}

/** Signs out on this device. */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) {
    throw error;
  }
}

/** D-004: immediate and final; afterwards only the local session is left to clear. */
export async function deleteAccount(): Promise<void> {
  await api.deleteAccount();
  await supabase.auth.signOut({ scope: 'local' });
}
