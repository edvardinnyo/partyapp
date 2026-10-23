import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type Genre, MIN_TASTE_GENRES } from '@shared/contracts/genres';
import { AppButton } from '@/components/app-button';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { useAuthStore } from '@/features/auth/auth-store';
import { pendingRegistrationFor, useRegistrationStore } from '@/features/auth/registration-store';
import { GenrePicker } from '@/features/taste/genre-picker';
import { api } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';

// D-001 + D-005: the manual taste choice, required before Home (D-004/5). D-009: genres chosen
// before the email code are filled in, if they could not be saved right after it.
export default function TasteScreen() {
  const { t } = useTranslation();
  const email = useAuthStore((state) => state.email);
  const [genres, setGenres] = useState<Genre[]>(() => {
    const own = pendingRegistrationFor(useRegistrationStore.getState().pending, email);
    return own?.accountType === 'person' ? own.person.genres : [];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setError(null);
    setSaving(true);
    try {
      // The protected routes open Home once the taste profile exists.
      queryClient.setQueryData(queryKeys.me, await api.saveTaste(genres));
      queryClient.setQueryData(queryKeys.taste, genres);
      useRegistrationStore.getState().clear();
    } catch {
      setError(t('common.genericError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <GenrePicker value={genres} onChange={setGenres} />
      <FormMessage message={error} />
      <AppButton
        label={t('onboarding.continue')}
        onPress={handleContinue}
        loading={saving}
        disabled={saving || genres.length < MIN_TASTE_GENRES}
      />
    </Screen>
  );
}
