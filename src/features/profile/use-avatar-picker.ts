import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type PickedAvatar, pickAvatar } from './avatar-upload';

/**
 * Picking a new profile picture from the library or the camera, shared by sign-up and editing.
 * Errors are reported through `onError` so each screen shows them in its own message line.
 */
export function useAvatarPicker(onError: (message: string) => void) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<PickedAvatar | null>(null);

  async function pick(source: 'library' | 'camera') {
    try {
      const result = await pickAvatar(source);
      if (result === 'permissionDenied') {
        onError(t('onboarding.cameraDenied'));
      } else if (result !== 'cancelled') {
        setPicked(result);
      }
    } catch {
      onError(t('common.genericError'));
    }
  }

  function choose() {
    // Android shows at most three buttons in an alert, so removing has its own link on screen.
    Alert.alert(t('onboarding.avatar'), undefined, [
      { text: t('onboarding.avatarFromLibrary'), onPress: () => void pick('library') },
      { text: t('onboarding.avatarFromCamera'), onPress: () => void pick('camera') },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }

  return { picked, choose, clear: () => setPicked(null) };
}
