import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { signOut } from '@/features/auth/actions';
import { useMyProfile } from '@/features/profile/use-my-profile';

// Shown when signed in but the own profile cannot be loaded (e.g. offline at startup).
export default function UnavailableScreen() {
  const { t } = useTranslation();
  const me = useMyProfile();

  return (
    <Screen edges={['top', 'bottom']}>
      <AppText variant="subtitle">{t('unavailable.title')}</AppText>
      <AppText variant="muted">{t('unavailable.message')}</AppText>
      <AppButton
        label={t('common.retry')}
        onPress={() => void me.refetch()}
        loading={me.isFetching}
        disabled={me.isFetching}
      />
      <AppButton label={t('settings.signOut')} variant="link" onPress={() => void signOut()} />
    </Screen>
  );
}
