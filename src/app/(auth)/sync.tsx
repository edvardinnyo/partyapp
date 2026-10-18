import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/app-button';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { useSessionStore } from '@/features/auth/session-store';

// F6 + D-001: connect a streaming service, or choose the taste manually instead.
export default function SyncScreen() {
  const { t } = useTranslation();
  const signIn = useSessionStore((state) => state.signIn);

  return (
    <Screen edges={['bottom']}>
      <Placeholder label={t('auth.syncPlaceholder')} phase={3} />
      <AppButton
        label={t('auth.chooseManually')}
        variant="secondary"
        onPress={() => router.push('/taste')}
      />
      <AppButton label={t('auth.continue')} onPress={signIn} />
    </Screen>
  );
}
