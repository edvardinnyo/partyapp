import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { signIn, signInWithGoogle } from '@/features/auth/actions';
import { AppleSignInButton } from '@/features/auth/apple-sign-in-button';
import { authErrorMessageKey, isEmailNotConfirmed } from '@/features/auth/auth-errors';
import { isValidEmail } from '@/features/auth/validation';
import { useAppTheme } from '@/theme';

// F6 + D-004. After a successful sign-in the protected routes move on to onboarding or Home.
export default function SignInScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'password' | 'google' | null>(null);

  async function handleSignIn() {
    setError(null);
    setBusy('password');
    try {
      await signIn(email, password);
    } catch (signInError) {
      if (isEmailNotConfirmed(signInError)) {
        router.push({ pathname: '/verify-email', params: { email: email.trim() } });
      } else {
        setError(t(authErrorMessageKey(signInError)));
      }
    } finally {
      setBusy(null);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy('google');
    try {
      await signInWithGoogle();
    } catch (googleError) {
      setError(t(authErrorMessageKey(googleError)));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <AppText variant="title" style={styles.title}>
        {t('auth.welcome')}
      </AppText>
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
        autoComplete="current-password"
        textContentType="password"
      />
      <FormMessage message={error} />
      <AppButton
        label={t('auth.signIn')}
        onPress={handleSignIn}
        loading={busy === 'password'}
        disabled={busy !== null || !isValidEmail(email) || password.length === 0}
      />
      <AppButton
        label={t('auth.forgotPassword')}
        variant="link"
        onPress={() =>
          router.push({ pathname: '/forgot-password', params: { email: email.trim() } })
        }
      />
      <AppText variant="muted" style={styles.center}>
        {t('auth.or')}
      </AppText>
      <AppButton
        label={t('auth.google')}
        variant="secondary"
        icon={<Ionicons name="logo-google" size={18} color={colors.accent} />}
        onPress={handleGoogle}
        loading={busy === 'google'}
        disabled={busy !== null}
      />
      <AppleSignInButton />
      <View style={styles.register}>
        <AppText variant="muted">{t('auth.noAccount')}</AppText>
        <AppButton
          label={t('auth.register')}
          variant="link"
          onPress={() => router.push('/register')}
        />
      </View>
      <AppButton
        label={t('auth.privacyLink')}
        variant="link"
        onPress={() => router.push('/privacy')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginVertical: 16,
  },
  center: {
    textAlign: 'center',
  },
  register: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
