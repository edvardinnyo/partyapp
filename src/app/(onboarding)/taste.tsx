import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type Genre, MIN_TASTE_GENRES } from '@shared/contracts/genres';
import { AppButton } from '@/components/app-button';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { GenrePicker } from '@/features/taste/genre-picker';
import { api } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';

// D-001 + D-005: the manual taste choice, required before Home (D-004/5).
export default function TasteScreen() {
  const { t } = useTranslation();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setError(null);
    setSaving(true);
    try {
      // The protected routes open Home once the taste profile exists.
      queryClient.setQueryData(queryKeys.me, await api.saveTaste(genres));
      queryClient.setQueryData(queryKeys.taste, genres);
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
