import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  displayNameSchema,
  DISPLAY_NAME_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
} from '@shared/contracts/profile';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { Checkbox } from '@/components/checkbox';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { signOut } from '@/features/auth/actions';
import { type PendingRegistration, useRegistrationStore } from '@/features/auth/registration-store';
import { isValidEmail, isValidPassword, PASSWORD_MIN_LENGTH } from '@/features/auth/validation';
import { queryClient, queryKeys } from '@/lib/query-client';

import { createPersonProfile, profileErrorMessage } from './create-person-profile';
import { useAvatarPicker } from './use-avatar-picker';
import { useUsernameField } from './use-username-field';

type PersonPending = Extract<PendingRegistration, { accountType: 'person' }>;

type PersonProfileFormProps =
  /** D-009: signed out, before the taste and the email code, which come next. */
  | { mode: 'signup' }
  /** Signed in without a profile (Google, or a registration continued); may restore a draft. */
  | { mode: 'create'; initial?: PersonPending | null; initialError?: string | null };

// D-004: display name and username are required, the profile picture is optional; the 18+
// confirmation and the privacy notice acceptance are required for every new account.
export function PersonProfileForm(props: PersonProfileFormProps) {
  const { t } = useTranslation();
  const draft = props.mode === 'create' ? props.initial?.person : undefined;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState(draft?.displayName ?? '');
  const [isAdult, setIsAdult] = useState(draft !== undefined);
  const [acceptsPrivacy, setAcceptsPrivacy] = useState(draft !== undefined);
  const [error, setError] = useState<string | null>(
    props.mode === 'create' ? (props.initialError ?? null) : null,
  );
  const [saving, setSaving] = useState(false);
  const avatar = useAvatarPicker(setError, draft?.avatar ?? null);
  const usernameField = useUsernameField(draft?.username ?? '');

  const canSubmit =
    (props.mode !== 'signup' || (isValidEmail(email) && isValidPassword(password))) &&
    displayNameSchema.safeParse(displayName).success &&
    usernameField.isAvailable &&
    isAdult &&
    acceptsPrivacy;

  async function handleSubmit() {
    setError(null);
    const person = {
      displayName: displayName.trim(),
      username: usernameField.username,
      avatar: avatar.picked,
      genres: draft?.genres ?? [],
    };
    if (props.mode === 'signup') {
      // Nothing is sent yet: the taste comes next, and the email code last.
      useRegistrationStore.getState().setPending({
        accountType: 'person',
        email: email.trim().toLowerCase(),
        password,
        person,
      });
      router.push('/register-sync');
      return;
    }
    setSaving(true);
    try {
      const { me, tasteSaved } = await createPersonProfile(person);
      if (tasteSaved) {
        useRegistrationStore.getState().clear();
      }
      // The protected routes continue to the taste step, or to Home if the taste is saved.
      queryClient.setQueryData(queryKeys.me, me);
    } catch (submitError) {
      setError(profileErrorMessage(submitError, t));
      usernameField.recheck();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      {props.mode === 'signup' ? (
        <>
          <AppText variant="muted">{t('auth.codeComesLast')}</AppText>
          <AppText variant="subtitle">{t('auth.signInDetails')}</AppText>
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
          <AppText variant="subtitle">{t('onboarding.profileSection')}</AppText>
        </>
      ) : null}
      <View style={styles.avatar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.avatar')}
          onPress={avatar.choose}
        >
          <Avatar uri={avatar.picked?.uri} size={112} />
        </Pressable>
        {avatar.picked ? (
          <AppButton label={t('onboarding.avatarRemove')} variant="link" onPress={avatar.clear} />
        ) : null}
      </View>
      <TextField
        label={t('onboarding.displayName')}
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={DISPLAY_NAME_MAX_LENGTH}
        autoComplete="name"
        textContentType="name"
      />
      <TextField
        label={t('onboarding.username')}
        value={usernameField.input}
        onChangeText={usernameField.setInput}
        maxLength={USERNAME_MAX_LENGTH}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        error={usernameField.error}
        hint={usernameField.hint}
        hintTone={usernameField.hintTone}
      />
      <Checkbox label={t('onboarding.adultConfirm')} checked={isAdult} onChange={setIsAdult} />
      <Checkbox
        label={t('onboarding.privacyAccept')}
        checked={acceptsPrivacy}
        onChange={setAcceptsPrivacy}
      />
      <AppButton
        label={t('onboarding.readPrivacy')}
        variant="link"
        onPress={() => router.push('/privacy')}
      />
      <FormMessage message={error} />
      <AppButton
        label={t('onboarding.continue')}
        onPress={handleSubmit}
        loading={saving}
        disabled={saving || !canSubmit}
      />
      {props.mode === 'create' ? (
        <AppButton label={t('settings.signOut')} variant="link" onPress={() => void signOut()} />
      ) : (
        // D-008/1: companies and organisers register as partners.
        <View style={styles.partner}>
          <AppText variant="muted">{t('partners.prompt')}</AppText>
          <AppButton
            label={t('partners.registerLink')}
            variant="link"
            onPress={() => router.replace('/partner-register')}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  partner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
});
