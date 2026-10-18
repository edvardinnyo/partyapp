import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { confirmSignUp, resendSignUpCode } from '@/features/auth/actions';
import { authErrorMessageKey } from '@/features/auth/auth-errors';
import { useCooldown } from '@/features/auth/use-cooldown';
import {
  EMAIL_CODE_LENGTH,
  isValidCode,
  RESEND_COOLDOWN_SECONDS,
} from '@/features/auth/validation';

// D-004: the 6-digit code from the email confirms the address and signs the user in.
export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const { email = '', sent } = useLocalSearchParams<{ email?: string; sent?: string }>();
  const codeWasSent = sent === '1';
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState<'confirm' | 'resend' | null>(null);
  const cooldown = useCooldown(RESEND_COOLDOWN_SECONDS, codeWasSent);

  async function handleConfirm() {
    setError(null);
    setInfo(null);
    setBusy('confirm');
    try {
      await confirmSignUp(email, code);
    } catch (confirmError) {
      setError(t(authErrorMessageKey(confirmError)));
    } finally {
      setBusy(null);
    }
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    setBusy('resend');
    try {
      await resendSignUpCode(email);
      cooldown.start();
      setInfo(t('auth.codeSent'));
    } catch (resendError) {
      setError(t(authErrorMessageKey(resendError)));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <AppText>
        {codeWasSent
          ? t('auth.verifyIntro', { length: EMAIL_CODE_LENGTH, email })
          : t('auth.verifyIntroUnconfirmed', { email })}
      </AppText>
      <TextField
        label={t('auth.code')}
        value={code}
        onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={EMAIL_CODE_LENGTH}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
      />
      <FormMessage message={error} />
      <FormMessage message={info} tone="info" />
      <AppButton
        label={t('auth.confirm')}
        onPress={handleConfirm}
        loading={busy === 'confirm'}
        disabled={busy !== null || !isValidCode(code)}
      />
      <AppButton
        label={
          cooldown.remaining > 0
            ? t('auth.resendIn', { seconds: cooldown.remaining })
            : t('auth.resendCode')
        }
        variant="link"
        onPress={handleResend}
        disabled={busy !== null || cooldown.remaining > 0}
      />
    </Screen>
  );
}
