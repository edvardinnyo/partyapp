import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/app-button';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';

// F6 + D-001: connect a streaming service, or choose the taste manually.
// D-004: for now the manual choice is the only option.
export default function SyncScreen() {
  const { t } = useTranslation();

  return (
    <Screen edges={['bottom']}>
      <Placeholder label={t('onboarding.syncPlaceholder')} phase={3} />
      <AppButton label={t('onboarding.chooseManually')} onPress={() => router.push('/taste')} />
    </Screen>
  );
}
