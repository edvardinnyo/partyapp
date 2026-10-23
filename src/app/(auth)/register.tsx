import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { signUp } from '@/features/auth/actions';
import { authErrorMessageKey } from '@/features/auth/auth-errors';
import { isValidEmail, isValidPassword, PASSWORD_MIN_LENGTH } from '@/features/auth/validation';

// F6 + D-004: email and password; the address is confirmed with a code on the next screen.
export default function RegisterScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleRegister() {
    setError(null);
    setBusy(true);
    try {
      const result = await signUp(email, password);
      if (result === 'accountExists') {
        setError(t('auth.accountExists'));
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
      <TextField
        label={t('auth.email')}
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
        label={t('auth.register')}
        onPress={handleRegister}
        loading={busy}
        disabled={busy || !isValidEmail(email) || !isValidPassword(password)}
      />
      {/* D-008/1: companies and organisers register as partners. */}
      <View style={styles.partner}>
        <AppText variant="muted">{t('partners.prompt')}</AppText>
        <AppButton
          label={t('partners.registerLink')}
          variant="link"
          onPress={() => router.replace('/partner-register')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  partner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
});
