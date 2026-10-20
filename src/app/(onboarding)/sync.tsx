import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { useAppTheme } from '@/theme';

// F6 + D-001: connect a streaming service, or choose the taste manually.
// D-005: the Spotify sync is postponed, so it is shown as coming soon.
export default function SyncScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <Screen edges={['bottom']}>
      <AppText>{t('onboarding.syncIntro')}</AppText>
      <AppButton
        label={t('onboarding.spotifySoon')}
        variant="secondary"
        icon={<Ionicons name="musical-notes-outline" size={18} color={colors.accent} />}
        disabled
        onPress={() => {}}
      />
      <AppButton label={t('onboarding.chooseManually')} onPress={() => router.push('/taste')} />
    </Screen>
  );
}
