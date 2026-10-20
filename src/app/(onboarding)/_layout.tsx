import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAppState } from '@/features/auth/use-app-state';

// D-004: profile first, then the taste (streaming sync or manual choice), then Home.
export default function OnboardingLayout() {
  const { t } = useTranslation();
  const appState = useAppState();

  return (
    <Stack>
      <Stack.Protected guard={appState === 'needsProfile'}>
        <Stack.Screen
          name="create-profile"
          options={{ title: t('onboarding.createProfileTitle') }}
        />
      </Stack.Protected>
      <Stack.Protected guard={appState === 'needsTaste'}>
        <Stack.Screen name="sync" options={{ title: t('onboarding.syncTitle') }} />
        <Stack.Screen name="taste" options={{ title: t('onboarding.tasteTitle') }} />
      </Stack.Protected>
    </Stack>
  );
}
