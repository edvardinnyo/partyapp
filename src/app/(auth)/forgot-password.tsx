import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { requestPasswordReset, resetPassword } from '@/features/auth/actions';
import { authErrorMessageKey } from '@/features/auth/auth-errors';
import { useCooldown } from '@/features/auth/use-cooldown';
import {
  EMAIL_CODE_LENGTH,
  isValidCode,
  isValidEmail,
  isValidPassword,
  PASSWORD_MIN_LENGTH,
  RESEND_COOLDOWN_SECONDS,
} from '@/features/auth/validation';

// D-004: password reset with an emailed code, in two steps on one screen.
export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ email?: string }>();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cooldown = useCooldown(RESEND_COOLDOWN_SECONDS, false);

  async function handleSendCode() {
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(email);
      cooldown.start();
      setStep('code');
    } catch (sendError) {
      setError(t(authErrorMessageKey(sendError)));
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    setError(null);
    setBusy(true);
    try {
      // On success the protected routes open the app.
      await resetPassword(email, code, newPassword);
    } catch (resetError) {
      setError(t(authErrorMessageKey(resetError)));
    } finally {
      setBusy(false);
    }
  }

  if (step === 'email') {
    return (
      <Screen edges={['bottom']}>
        <AppText>{t('auth.forgotIntro')}</AppText>
        <TextField
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <FormMessage message={error} />
        <AppButton
          label={t('auth.sendCode')}
          onPress={handleSendCode}
          loading={busy}
          disabled={busy || !isValidEmail(email)}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['bottom']}>
      <AppText>{t('auth.resetIntro', { email: email.trim() })}</AppText>
      <TextField
        label={t('auth.code')}
        value={code}
        onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={EMAIL_CODE_LENGTH}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
      />
      <TextField
        label={t('auth.newPassword')}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        hint={t('auth.passwordHint', { min: PASSWORD_MIN_LENGTH })}
      />
      <FormMessage message={error} />
      <AppButton
        label={t('auth.savePassword')}
        onPress={handleSave}
        loading={busy}
        disabled={busy || !isValidCode(code) || !isValidPassword(newPassword)}
      />
      <AppButton
        label={
          cooldown.remaining > 0
            ? t('auth.resendIn', { seconds: cooldown.remaining })
            : t('auth.resendCode')
        }
        variant="link"
        onPress={handleSendCode}
        disabled={busy || cooldown.remaining > 0}
      />
    </Screen>
  );
}
