import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/app-button';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { useSessionStore } from '@/features/auth/session-store';

// D-001: manual taste selection as an alternative to the streaming sync.
export default function TasteScreen() {
  const { t } = useTranslation();
  const signIn = useSessionStore((state) => state.signIn);

  return (
    <Screen edges={['bottom']}>
      <Placeholder label={t('auth.tastePlaceholder')} phase={3} />
      <AppButton label={t('auth.continue')} onPress={signIn} />
    </Screen>
  );
}
