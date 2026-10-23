import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/features/auth/auth-store';
import { pendingRegistrationFor, useRegistrationStore } from '@/features/auth/registration-store';
import { useAppState } from '@/features/auth/use-app-state';

// D-004: profile first, then the taste (streaming sync or manual choice), then Home.
// D-008: a partner fills in its application instead, and has no taste step.
export default function OnboardingLayout() {
  const { t } = useTranslation();
  const appState = useAppState();
  const email = useAuthStore((state) => state.email);
  const storedIntent = useAuthStore((state) => state.accountIntent);
  const pending = useRegistrationStore((state) => state.pending);
  // The registration just finished on this phone knows best which onboarding comes next.
  const accountIntent = pendingRegistrationFor(pending, email)?.accountType ?? storedIntent;

  return (
    <Stack>
      <Stack.Protected guard={appState === 'needsProfile' && accountIntent === 'person'}>
        <Stack.Screen
          name="create-profile"
          options={{ title: t('onboarding.createProfileTitle') }}
        />
      </Stack.Protected>
      <Stack.Protected guard={appState === 'needsProfile' && accountIntent === 'partner'}>
        <Stack.Screen
          name="partner-application"
          options={{ title: t('partners.applicationTitle') }}
        />
      </Stack.Protected>
      <Stack.Protected guard={appState === 'needsTaste'}>
        <Stack.Screen name="sync" options={{ title: t('onboarding.syncTitle') }} />
        <Stack.Screen name="taste" options={{ title: t('onboarding.tasteTitle') }} />
      </Stack.Protected>
    </Stack>
  );
}
