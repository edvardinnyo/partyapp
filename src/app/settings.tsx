import type { ReactNode } from 'react';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { isPartnerProfile } from '@shared/contracts/profile';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { FormMessage } from '@/components/form-message';
import { ListRow } from '@/components/list-row';
import { Screen } from '@/components/screen';
import { SegmentedControl } from '@/components/segmented-control';
import { deleteAccount, signOut } from '@/features/auth/actions';
import { useMyProfile } from '@/features/profile/use-my-profile';
import { usePreferencesStore } from '@/features/settings/preferences-store';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="subtitle">{title}</AppText>
      {children}
    </View>
  );
}

// D-004: opened from the own profile, without a navbar; the header's back arrow returns there.
export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = usePreferencesStore((state) => state.theme);
  const language = usePreferencesStore((state) => state.language);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);
  const profile = useMyProfile().data?.profile;
  const [busy, setBusy] = useState<'signOut' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: 'signOut' | 'delete') {
    setError(null);
    setBusy(action);
    try {
      await (action === 'signOut' ? signOut() : deleteAccount());
    } catch {
      setError(t('common.genericError'));
      setBusy(null);
    }
  }

  function confirmDelete() {
    Alert.alert(t('settings.deleteConfirmTitle'), t('settings.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteConfirm'),
        style: 'destructive',
        onPress: () => void run('delete'),
      },
    ]);
  }

  return (
    <Screen edges={['bottom']}>
      <Section title={t('settings.theme')}>
        <SegmentedControl
          options={[
            { value: 'system', label: t('settings.themeSystem') },
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
          ]}
          value={theme}
          onChange={setTheme}
        />
      </Section>
      <Section title={t('settings.language')}>
        <SegmentedControl
          options={[
            { value: 'system', label: t('settings.languageSystem') },
            { value: 'hu', label: t('settings.languageHu') },
            { value: 'en', label: t('settings.languageEn') },
          ]}
          value={language}
          onChange={setLanguage}
        />
      </Section>
      {/* D-008/11: partners have no taste. */}
      {profile && isPartnerProfile(profile) ? null : (
        <Section title={t('settings.taste')}>
          <ListRow label={t('settings.editTaste')} href="/edit-taste" />
        </Section>
      )}
      {/* D-008/23: only the team's accounts review partner applications. */}
      {profile?.isAdmin ? (
        <Section title={t('admin.section')}>
          <ListRow label={t('admin.applications')} href="/partner-applications" />
        </Section>
      ) : null}
      <Section title={t('settings.account')}>
        <FormMessage message={error} />
        <AppButton
          label={t('settings.signOut')}
          variant="secondary"
          onPress={() => void run('signOut')}
          loading={busy === 'signOut'}
          disabled={busy !== null}
        />
        <AppButton
          label={t('settings.deleteAccount')}
          variant="destructive"
          onPress={confirmDelete}
          loading={busy === 'delete'}
          disabled={busy !== null}
        />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
    marginBottom: 8,
  },
});
