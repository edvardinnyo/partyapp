import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type Genre, MIN_TASTE_GENRES } from '@shared/contracts/genres';
import { AppButton } from '@/components/app-button';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { signUp } from '@/features/auth/actions';
import { authErrorMessageKey } from '@/features/auth/auth-errors';
import { useRegistrationStore } from '@/features/auth/registration-store';
import { GenrePicker } from '@/features/taste/genre-picker';

// D-001 + D-005 + D-009: the taste is the registration's last step before the email code.
// Only then is the account created; the code confirms it, and the profile and taste follow.
export default function RegisterTasteScreen() {
  const { t } = useTranslation();
  const pending = useRegistrationStore((state) => state.pending);
  const person = pending?.accountType === 'person' ? pending : null;
  const [genres, setGenres] = useState<Genre[]>(person?.person.genres ?? []);
  const [error, setError] = useState<string | null>(null);
  const [accountExists, setAccountExists] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!person) {
    // Opened without the previous steps: start the registration over.
    return <Redirect href="/register" />;
  }

  async function handleContinue() {
    if (!person) {
      return;
    }
    setError(null);
    setAccountExists(false);
    setBusy(true);
    try {
      useRegistrationStore.getState().setGenres(genres);
      const result = await signUp(person.email, person.password, 'person');
      if (result === 'accountExists') {
        // After signing in, the profile and taste typed here are saved.
        setError(t('auth.accountExistsContinue'));
        setAccountExists(true);
        return;
      }
      router.replace({ pathname: '/verify-email', params: { email: person.email, sent: '1' } });
    } catch (signUpError) {
      setError(t(authErrorMessageKey(signUpError)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <GenrePicker value={genres} onChange={setGenres} />
      <FormMessage message={error} />
      {accountExists ? (
        <AppButton
          label={t('auth.signIn')}
          variant="secondary"
          onPress={() => router.dismissTo('/sign-in')}
        />
      ) : null}
      <AppButton
        label={t('auth.continueToCode')}
        onPress={handleContinue}
        loading={busy}
        disabled={busy || genres.length < MIN_TASTE_GENRES}
      />
    </Screen>
  );
}
