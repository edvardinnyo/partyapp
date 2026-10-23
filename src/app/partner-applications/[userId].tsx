import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type PartnerDecisionInput, REJECTION_REASON_MAX_LENGTH } from '@shared/contracts/admin';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import {
  formatSubmittedAt,
  usePartnerApplications,
} from '@/features/admin/use-partner-applications';
import { api, ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useAppTheme } from '@/theme';

/** One of the details to check; selectable, so it can be copied into a registry search. */
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <AppText variant="muted">{label}</AppText>
      <AppText selectable>{value}</AppText>
    </View>
  );
}

// D-008/23: one application with everything the team checks. Approving makes the partner
// verified; a rejection needs a reason, which the partner sees in the app and in the email.
export default function PartnerApplicationScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const applications = usePartnerApplications();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<PartnerDecisionInput['decision'] | null>(null);

  if (applications.isPending) {
    return (
      <Screen edges={['bottom']}>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  const application = applications.data?.find((item) => item.userId === userId);
  if (!application) {
    return (
      <Screen edges={['bottom']}>
        {applications.isError ? (
          <>
            <FormMessage message={t('common.genericError')} />
            <AppButton
              label={t('common.retry')}
              variant="secondary"
              onPress={() => void applications.refetch()}
            />
          </>
        ) : (
          // Decided meanwhile, here or on another phone.
          <AppText variant="muted">{t('admin.alreadyDecided')}</AppText>
        )}
      </Screen>
    );
  }

  const decide = async (decision: PartnerDecisionInput) => {
    setError(null);
    setBusy(decision.decision);
    try {
      await api.decidePartnerApplication(application.userId, decision);
      router.back();
      void queryClient.invalidateQueries({ queryKey: queryKeys.partnerApplications });
    } catch (decideError) {
      if (decideError instanceof ApiError && decideError.code === 'not_found') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.partnerApplications });
        setError(t('admin.alreadyDecided'));
      } else if (decideError instanceof ApiError && decideError.code === 'network') {
        setError(t('common.networkError'));
      } else {
        setError(t('common.genericError'));
      }
      setBusy(null);
    }
  };

  const confirmApprove = () => {
    Alert.alert(
      t('admin.approveConfirmTitle'),
      t('admin.approveConfirmMessage', { name: application.displayName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('admin.approve'), onPress: () => void decide({ decision: 'approve' }) },
      ],
    );
  };

  const sendRejection = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError(t('admin.rejectionReasonRequired'));
      return;
    }
    void decide({ decision: 'reject', reason: trimmed });
  };

  return (
    <Screen edges={['bottom']}>
      <View style={styles.header}>
        <Avatar uri={application.avatarUrl} size={72} />
        <View style={styles.headerText}>
          <AppText variant="subtitle">{application.displayName}</AppText>
          <AppText variant="muted">@{application.username}</AppText>
        </View>
      </View>

      <AppText variant="subtitle">{t('admin.company')}</AppText>
      <Detail label={t('partners.companyName')} value={application.companyName} />
      <Detail label={t('partners.taxNumber')} value={application.taxNumber} />
      <Detail label={t('partners.contactName')} value={application.contactName} />
      <Detail label={t('partners.contactPhone')} value={application.contactPhone} />
      <Detail label={t('partners.address')} value={application.address} />
      <Detail label={t('admin.website')} value={application.website ?? t('common.emptyValue')} />
      <Detail
        label={t('admin.accountEmail')}
        value={application.accountEmail ?? t('common.emptyValue')}
      />
      <AppText variant="muted">
        {t('admin.submittedAt', {
          date: formatSubmittedAt(application.submittedAt, i18n.language),
        })}
      </AppText>
      <AppText variant="muted">{t('admin.checks')}</AppText>

      <FormMessage message={error} />
      {rejecting ? (
        <>
          <TextField
            label={t('admin.rejectionReason')}
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              setReasonError(null);
            }}
            maxLength={REJECTION_REASON_MAX_LENGTH}
            multiline
            autoFocus
            error={reasonError}
            hint={t('admin.rejectionReasonHint')}
          />
          <AppButton
            label={t('admin.sendRejection')}
            variant="destructive"
            onPress={sendRejection}
            loading={busy === 'reject'}
            disabled={busy !== null}
          />
          <AppButton
            label={t('common.cancel')}
            variant="link"
            onPress={() => setRejecting(false)}
            disabled={busy !== null}
          />
        </>
      ) : (
        <View style={styles.actions}>
          <AppButton
            label={t('admin.approve')}
            onPress={confirmApprove}
            loading={busy === 'approve'}
            disabled={busy !== null}
          />
          <AppButton
            label={t('admin.reject')}
            variant="destructive"
            onPress={() => setRejecting(true)}
            disabled={busy !== null}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  detail: {
    gap: 2,
  },
  actions: {
    gap: 12,
    marginTop: 4,
  },
});
