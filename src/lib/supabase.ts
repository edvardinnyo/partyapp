import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { encryptedStorage } from '@/lib/encrypted-storage';
import { env } from '@/lib/env';
import { installWebCrypto } from '@/lib/web-crypto';

// Before the client exists: PKCE needs a secure random verifier and a SHA-256 challenge.
installWebCrypto(globalThis);

// The app talks to Supabase directly only for Auth, Realtime and Storage uploads (Q2);
// every other data access goes through the API Edge Function (see src/lib/api.ts).
export const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    storage: encryptedStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// Refresh the session only while the app is in the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});
