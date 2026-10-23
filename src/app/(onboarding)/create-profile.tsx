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
import { Avatar } from '@/components/avatar';
import { Checkbox } from '@/components/checkbox';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { signOut } from '@/features/auth/actions';
import { uploadAvatar } from '@/features/profile/avatar-upload';
import { useAvatarPicker } from '@/features/profile/use-avatar-picker';
import { useUsernameField } from '@/features/profile/use-username-field';
import { api, ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';

class AvatarUploadError extends Error {}

// D-004: display name and username are required, the profile picture is optional; the 18+
// confirmation and the privacy notice acceptance are required for every new account.
export default function CreateProfileScreen() {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [acceptsPrivacy, setAcceptsPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { picked: avatar, choose: chooseAvatar, clear: clearAvatar } = useAvatarPicker(setError);
  const usernameField = useUsernameField();

  const canSubmit =
    displayNameSchema.safeParse(displayName).success &&
    usernameField.isAvailable &&
    isAdult &&
    acceptsPrivacy;

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    try {
      const avatarPath = avatar
        ? await uploadAvatar(avatar).catch(() => {
            throw new AvatarUploadError();
          })
        : null;
      const me = await api.createProfile({
        displayName: displayName.trim(),
        username: usernameField.username,
        avatarPath,
        adultConfirmed: true,
        privacyAccepted: true,
      });
      // The protected routes continue to the taste step.
      queryClient.setQueryData(queryKeys.me, me);
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.code === 'username_taken') {
        setError(t('onboarding.usernameTaken'));
        usernameField.recheck();
      } else if (submitError instanceof ApiError && submitError.code === 'name_protected') {
        setError(t('partners.nameProtected'));
      } else if (
        submitError instanceof AvatarUploadError ||
        (submitError instanceof ApiError && submitError.code === 'invalid_avatar')
      ) {
        setError(t('onboarding.avatarUploadFailed'));
      } else if (submitError instanceof ApiError && submitError.code === 'network') {
        setError(t('common.networkError'));
      } else {
        setError(t('common.genericError'));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen edges={['bottom']}>
      <View style={styles.avatar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.avatar')}
          onPress={chooseAvatar}
        >
          <Avatar uri={avatar?.uri} size={112} />
        </Pressable>
        {avatar ? (
          <AppButton label={t('onboarding.avatarRemove')} variant="link" onPress={clearAvatar} />
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
      <AppButton label={t('settings.signOut')} variant="link" onPress={() => void signOut()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
});
