import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { useAuthStore } from '@/features/auth/auth-store';
import { pendingRegistrationFor, useRegistrationStore } from '@/features/auth/registration-store';
import { PartnerApplicationForm } from '@/features/partners/partner-application-form';
import {
  applicationErrorMessage,
  sendPartnerApplication,
} from '@/features/partners/send-application';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useAppTheme } from '@/theme';

// D-008/22: right after the email code, the application typed before it is sent automatically.
// Without one (signed in later, or on another phone) the partner fills in the form here; if
// sending fails, the form comes back with everything typed and the reason.
export default function PartnerApplicationScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const email = useAuthStore((state) => state.email);
  const pending = useRegistrationStore((state) => state.pending);
  const own = pendingRegistrationFor(pending, email);
  const ownPending = own?.accountType === 'partner' ? own : null;
  const [sending, setSending] = useState(ownPending !== null);
  const [failure, setFailure] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ownPending || started.current) {
      return;
    }
    started.current = true;
    sendPartnerApplication(ownPending.partner, ownPending.logo)
      .then((me) => {
        useRegistrationStore.getState().clear();
        // The protected routes continue to Home, with the "under review" notice.
        queryClient.setQueryData(queryKeys.me, me);
      })
      .catch((error: unknown) => {
        setFailure(applicationErrorMessage(error, t));
        setSending(false);
      });
  }, [ownPending, t]);

  if (sending) {
    return (
      <Screen edges={['bottom']}>
        <ActivityIndicator color={colors.accent} />
        <AppText variant="muted">{t('partners.sending')}</AppText>
      </Screen>
    );
  }
  return <PartnerApplicationForm mode="create" initial={ownPending} initialError={failure} />;
}
