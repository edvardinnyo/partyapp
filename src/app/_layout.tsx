import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthListener } from '@/features/auth/auth-listener';
import { useAppState } from '@/features/auth/use-app-state';
import { usePreferencesStore } from '@/features/settings/preferences-store';
import { applyLanguagePreference } from '@/i18n';
import { queryClient } from '@/lib/query-client';
import { useAppTheme } from '@/theme';

// Keep the splash screen up until we know whether someone is signed in.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const appState = useAppState();
  const language = usePreferencesStore((state) => state.language);

  useAuthListener();

  useEffect(() => applyLanguagePreference(language), [language]);

  useEffect(() => {
    if (appState !== 'loading') {
      void SplashScreen.hideAsync();
    }
  }, [appState]);

  return (
    <ThemeProvider value={theme.navigation}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        {/* While the session loads, the splash screen covers the sign-in flow. */}
        <Stack.Protected guard={appState === 'signedOut' || appState === 'loading'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={appState === 'needsProfile' || appState === 'needsTaste'}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={appState === 'unavailable'}>
          <Stack.Screen name="unavailable" />
        </Stack.Protected>
        <Stack.Protected guard={appState === 'ready'}>
          <Stack.Screen name="(tabs)" />
          {/* F4, F7: an opened profile (own or other) has no navbar, so it sits above the tabs. */}
          <Stack.Screen
            name="profile/[id]"
            options={{ headerShown: true, title: t('profile.title') }}
          />
          {/* D-006: opened by tapping the own profile, without a navbar. */}
          <Stack.Screen
            name="edit-profile"
            options={{ headerShown: true, title: t('profile.edit') }}
          />
          {/* D-001/4: changing the taste, opened from Settings. */}
          <Stack.Screen
            name="edit-taste"
            options={{ headerShown: true, title: t('taste.editTitle') }}
          />
          {/* D-004: opened from the own profile, without a navbar, with a back arrow. */}
          <Stack.Screen
            name="settings"
            options={{ headerShown: true, title: t('settings.title') }}
          />
        </Stack.Protected>
        {/* Reachable before and after signing in (the sign-up asks to accept it). */}
        <Stack.Screen name="privacy" options={{ headerShown: true, title: t('privacy.title') }} />
      </Stack>
    </ThemeProvider>
  );
}
