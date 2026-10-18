import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';

// D-004 + Q23 d: placeholder until the final privacy notice is written (ideally with a lawyer).
export default function PrivacyScreen() {
  const { t } = useTranslation();

  return (
    <Screen edges={['bottom']}>
      <AppText>{t('privacy.draft')}</AppText>
    </Screen>
  );
}
