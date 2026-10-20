import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  displayNameSchema,
  DISPLAY_NAME_MAX_LENGTH,
  type UpdateProfileInput,
} from '@shared/contracts/profile';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { uploadAvatar } from '@/features/profile/avatar-upload';
import { useAvatarPicker } from '@/features/profile/use-avatar-picker';
import { useMyProfile } from '@/features/profile/use-my-profile';
import { api, ApiError } from '@/lib/api';
import { queryClient, queryKeys } from '@/lib/query-client';

// D-006: opened by tapping the own profile (like Instagram's "Edit profile"), without a navbar.
// The profile picture and the display name can change; the username stays fixed (D-004).
export default function EditProfileScreen() {
  const { t } = useTranslation();
  const profile = useMyProfile().data?.profile;
  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [removesAvatar, setRemovesAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const avatarPicker = useAvatarPicker(setError);

  if (!profile) {
    return null;
  }

  const shownAvatar = avatarPicker.picked?.uri ?? (removesAvatar ? null : profile.avatarUrl);
  const nameChanged = displayName.trim() !== profile.displayName;
  const avatarChanged = avatarPicker.picked !== null || (removesAvatar && profile.avatarUrl);
  const canSave =
    (nameChanged || avatarChanged) && displayNameSchema.safeParse(displayName).success;

  function chooseAvatar() {
    setError(null);
    setRemovesAvatar(false);
    avatarPicker.choose();
  }

  function removeAvatar() {
    avatarPicker.clear();
    setRemovesAvatar(true);
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      const changes: UpdateProfileInput = {};
      if (nameChanged) {
        changes.displayName = displayName.trim();
      }
      if (avatarPicker.picked) {
        changes.avatarPath = await uploadAvatar(avatarPicker.picked);
      } else if (removesAvatar && profile?.avatarUrl) {
        changes.avatarPath = null;
      }
      queryClient.setQueryData(queryKeys.me, await api.updateProfile(changes));
      router.back();
    } catch (saveError) {
      if (saveError instanceof ApiError && saveError.code === 'network') {
        setError(t('common.networkError'));
      } else if (saveError instanceof ApiError && saveError.code !== 'invalid_avatar') {
        setError(t('common.genericError'));
      } else {
        setError(t('onboarding.avatarUploadFailed'));
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
          accessibilityLabel={t('profile.changePhoto')}
          onPress={chooseAvatar}
        >
          <Avatar uri={shownAvatar} size={112} />
        </Pressable>
        <AppButton label={t('profile.changePhoto')} variant="link" onPress={chooseAvatar} />
        {shownAvatar ? (
          <AppButton label={t('onboarding.avatarRemove')} variant="link" onPress={removeAvatar} />
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
      <View style={styles.username}>
        <AppText variant="muted">{t('onboarding.username')}</AppText>
        <AppText>@{profile.username}</AppText>
        <AppText variant="muted">{t('profile.usernameFixed')}</AppText>
      </View>
      <FormMessage message={error} />
      <AppButton
        label={t('profile.save')}
        onPress={handleSave}
        loading={saving}
        disabled={saving || !canSave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  username: {
    gap: 2,
  },
});
