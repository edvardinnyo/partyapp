import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/app-button';
import { FormMessage } from '@/components/form-message';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { api } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';

// D-001: manual taste selection. Until phase 3 builds it, "Continue" completes the step.
export default function TasteScreen() {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setError(null);
    setSaving(true);
    try {
      // The protected routes open Home once the step is done.
      queryClient.setQueryData(queryKeys.me, await api.completeTaste());
    } catch {
      setError(t('common.genericError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <Placeholder label={t('onboarding.tastePlaceholder')} phase={3} />
      <FormMessage message={error} />
      <AppButton
        label={t('onboarding.continue')}
        onPress={handleContinue}
        loading={saving}
        disabled={saving}
      />
    </Screen>
  );
}
