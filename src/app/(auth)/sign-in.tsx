import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { useSessionStore } from '@/features/auth/session-store';

// F6: signing in with an existing profile goes straight to Home; signing up continues to the sync.
export default function SignInScreen() {
  const { t } = useTranslation();
  const signIn = useSessionStore((state) => state.signIn);

  return (
    <Screen edges={['top', 'bottom']}>
      <AppText variant="title">{t('auth.welcome')}</AppText>
      <Placeholder label={t('auth.signInPlaceholder')} phase={2} />
      <AppButton label={t('auth.signIn')} onPress={signIn} />
      <AppButton
        label={t('auth.register')}
        variant="secondary"
        onPress={() => router.push('/sync')}
      />
    </Screen>
  );
}
