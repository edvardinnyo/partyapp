import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export const unstable_settings = {
  initialRouteName: 'sign-in',
};

// Q21: no navbar before signing in.
export default function AuthLayout() {
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ title: t('auth.registerTitle') }} />
      {/* D-009: the registration's taste steps, before the email code. */}
      <Stack.Screen name="register-sync" options={{ title: t('onboarding.syncTitle') }} />
      <Stack.Screen name="register-taste" options={{ title: t('onboarding.tasteTitle') }} />
      <Stack.Screen name="partner-register" options={{ title: t('partners.registerTitle') }} />
      <Stack.Screen name="verify-email" options={{ title: t('auth.verifyTitle') }} />
      <Stack.Screen name="forgot-password" options={{ title: t('auth.forgotTitle') }} />
    </Stack>
  );
}
