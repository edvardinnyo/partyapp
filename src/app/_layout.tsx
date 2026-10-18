import '@/i18n';

import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { useSessionStore } from '@/features/auth/session-store';
import { useAppTheme } from '@/theme';

export default function RootLayout() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const isSignedIn = useSessionStore((state) => state.isSignedIn);

  return (
    <ThemeProvider value={theme.navigation}>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(tabs)" />
          {/* F4, F7: an opened profile (own or other) has no navbar, so it sits above the tabs. */}
          <Stack.Screen
            name="profile/[id]"
            options={{ headerShown: true, title: t('profile.title') }}
          />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
