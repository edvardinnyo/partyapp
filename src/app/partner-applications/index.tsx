import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { PartnerApplication } from '@shared/contracts/admin';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import {
  formatSubmittedAt,
  usePartnerApplications,
} from '@/features/admin/use-partner-applications';
import { useAppTheme } from '@/theme';

function ApplicationRow({ application }: { application: PartnerApplication }) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <Link href={`/partner-applications/${application.userId}`} asChild>
      <Pressable
        accessibilityRole="button"
        // Link asChild only accepts a flat style object.
        style={({ pressed }) =>
          StyleSheet.flatten([
            styles.row,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              opacity: pressed ? 0.7 : 1,
            },
          ])
        }
      >
        <Avatar uri={application.avatarUrl} size={48} />
        <View style={styles.rowText}>
          <AppText variant="subtitle">{application.displayName}</AppText>
          <AppText variant="muted">{application.companyName}</AppText>
          <AppText variant="muted">
            {t('admin.submittedAt', {
              date: formatSubmittedAt(application.submittedAt, i18n.language),
            })}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>
    </Link>
  );
}

// D-008/23: the team's list of partner applications waiting for a decision, oldest first.
// Opened from Settings, without a navbar.
export default function PartnerApplicationsScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const applications = usePartnerApplications();

  if (applications.isPending) {
    return (
      <Screen edges={['bottom']}>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (applications.isError) {
    return (
      <Screen edges={['bottom']}>
        <FormMessage message={t('common.genericError')} />
        <AppButton
          label={t('common.retry')}
          variant="secondary"
          onPress={() => void applications.refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      {applications.data.length === 0 ? (
        <AppText variant="muted">{t('admin.noApplications')}</AppText>
      ) : (
        applications.data.map((application) => (
          <ApplicationRow key={application.userId} application={application} />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
