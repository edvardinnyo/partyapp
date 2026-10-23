import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/app-text';
import { Screen } from '@/components/screen';
import { useAuthStore } from '@/features/auth/auth-store';
import { pendingRegistrationFor, useRegistrationStore } from '@/features/auth/registration-store';
import { createPersonProfile, profileErrorMessage } from '@/features/profile/create-person-profile';
import { PersonProfileForm } from '@/features/profile/person-profile-form';
import { queryClient, queryKeys } from '@/lib/query-client';
import { useAppTheme } from '@/theme';

// D-009: right after the email code, the profile and taste typed before it are saved
// automatically. Without them (Google sign-in, or signed in later) the person fills in the
// profile here; if saving fails, the form comes back with everything typed and the reason.
export default function CreateProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const email = useAuthStore((state) => state.email);
  const pending = useRegistrationStore((state) => state.pending);
  const own = pendingRegistrationFor(pending, email);
  const ownPending = own?.accountType === 'person' ? own : null;
  const [saving, setSaving] = useState(ownPending !== null);
  const [failure, setFailure] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ownPending || started.current) {
      return;
    }
    started.current = true;
    createPersonProfile(ownPending.person)
      .then(({ me, tasteSaved }) => {
        if (tasteSaved) {
          useRegistrationStore.getState().clear();
        }
        // The protected routes open Home, or the taste step with the genres filled in.
        queryClient.setQueryData(queryKeys.me, me);
      })
      .catch((error: unknown) => {
        setFailure(profileErrorMessage(error, t));
        setSaving(false);
      });
  }, [ownPending, t]);

  if (saving) {
    return (
      <Screen edges={['bottom']}>
        <ActivityIndicator color={colors.accent} />
        <AppText variant="muted">{t('onboarding.creatingProfile')}</AppText>
      </Screen>
    );
  }
  return <PersonProfileForm mode="create" initial={ownPending} initialError={failure} />;
}
