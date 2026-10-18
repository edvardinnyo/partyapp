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
      <Stack.Screen name="sync" options={{ title: t('auth.syncTitle') }} />
      <Stack.Screen name="taste" options={{ title: t('auth.tasteTitle') }} />
    </Stack>
  );
}
