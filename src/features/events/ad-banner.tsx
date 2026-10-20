import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/theme';

/** D-007/3: a full-width ad slot between the events; a placeholder until the ad source is chosen. */
export function AdBanner() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <View
      accessible
      accessibilityLabel={t('home.ad')}
      style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <AppText variant="muted">{t('home.ad')}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 90,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
