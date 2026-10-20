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
      <Stack.Screen name="verify-email" options={{ title: t('auth.verifyTitle') }} />
      <Stack.Screen name="forgot-password" options={{ title: t('auth.forgotTitle') }} />
    </Stack>
  );
}
