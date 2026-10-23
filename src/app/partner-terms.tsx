import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';

// D-008/12: placeholder until the partner terms are written with a lawyer (RELEASE_CHECKLIST).
export default function PartnerTermsScreen() {
  const { t } = useTranslation();

  return (
    <Screen edges={['bottom']}>
      <AppText>{t('partners.termsDraft')}</AppText>
    </Screen>
  );
}
