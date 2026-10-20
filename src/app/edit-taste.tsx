import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type Genre, MIN_TASTE_GENRES } from '@shared/contracts/genres';
import { AppButton } from '@/components/app-button';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { GenrePicker } from '@/features/taste/genre-picker';
import { api } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';

// D-001/4: changing the taste later, from Settings; without a navbar, with a back arrow.
export default function EditTasteScreen() {
  const { t } = useTranslation();
  const chosen = useQuery({ queryKey: queryKeys.taste, queryFn: api.getTaste });
  const [edited, setEdited] = useState<Genre[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (chosen.isPending) {
    return (
      <Screen edges={['bottom']}>
        <ActivityIndicator />
      </Screen>
    );
  }

  const genres = edited ?? chosen.data ?? [];

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      queryClient.setQueryData(queryKeys.me, await api.saveTaste(genres));
      queryClient.setQueryData(queryKeys.taste, genres);
      router.back();
    } catch {
      setError(t('common.genericError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <GenrePicker value={genres} onChange={setEdited} />
      <FormMessage message={error} />
      <AppButton
        label={t('taste.save')}
        onPress={handleSave}
        loading={saving}
        disabled={saving || edited === null || genres.length < MIN_TASTE_GENRES}
      />
    </Screen>
  );
}
