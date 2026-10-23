import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { PartnerInfo } from '@shared/contracts/profile';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/theme';

/**
 * D-008/4: on the partner's Home, where its events will be (D-008/8). While the application is
 * under review it says so; after a rejection it shows the reason and lets the partner correct it.
 */
export function PartnerStatusCard({ partner }: { partner: PartnerInfo }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  if (partner.status !== 'pending' && partner.status !== 'rejected') {
    return null;
  }
  const rejected = partner.status === 'rejected';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: rejected ? colors.danger : colors.border },
      ]}
    >
      <AppText variant="subtitle">
        {rejected ? t('partners.rejectedTitle') : t('partners.pendingTitle')}
      </AppText>
      <AppText variant="muted">
        {rejected && partner.rejectionReason
          ? t('partners.rejectedReason', { reason: partner.rejectionReason })
          : rejected
            ? t('partners.rejectedMessage')
            : t('partners.pendingMessage')}
      </AppText>
      {rejected ? (
        <AppButton
          label={t('partners.fixApplication')}
          variant="secondary"
          onPress={() => router.push('/edit-partner-application')}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
    marginTop: 8,
  },
});
