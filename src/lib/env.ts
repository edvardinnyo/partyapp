// Expo inlines EXPO_PUBLIC_* variables at build time, so they have to be read by their full names.
// These values are public by design; secrets never go into EXPO_PUBLIC_* variables.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
      'Copy .env.example to .env, fill it in and restart the dev server.',
  );
}

export const env = { supabaseUrl, supabasePublishableKey };
