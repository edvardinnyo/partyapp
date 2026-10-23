import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { signUp } from '@/features/auth/actions';
import { authErrorMessageKey } from '@/features/auth/auth-errors';
import { isValidEmail, isValidPassword, PASSWORD_MIN_LENGTH } from '@/features/auth/validation';

// D-008/1: companies register here, with email and password only (no Google): the business
// address is part of the check. The code screen and the rest of the flow are shared.
export default function PartnerRegisterScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleRegister() {
    setError(null);
    setBusy(true);
    try {
      const result = await signUp(email, password, 'partner');
      if (result === 'accountExists') {
        setError(t('partners.accountExists'));
        return;
      }
      router.replace({ pathname: '/verify-email', params: { email: email.trim(), sent: '1' } });
    } catch (signUpError) {
      setError(t(authErrorMessageKey(signUpError)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <AppText variant="muted">{t('partners.registerIntro')}</AppText>
      <TextField
        label={t('partners.businessEmail')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        hint={t('auth.passwordHint', { min: PASSWORD_MIN_LENGTH })}
      />
      <FormMessage message={error} />
      <AppButton
        label={t('partners.registerButton')}
        onPress={handleRegister}
        loading={busy}
        disabled={busy || !isValidEmail(email) || !isValidPassword(password)}
      />
    </Screen>
  );
}
