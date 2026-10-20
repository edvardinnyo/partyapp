import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/app-button';
import { useAppTheme } from '@/theme';

/**
 * D-004: Sign in with Apple ships before the iOS release, together with the Apple Developer
 * membership and a development build; it will then use Apple's native button (that native view
 * is not available in Expo Go). Until then this button is shown on iOS only and says it is
 * coming soon.
 */
export function AppleSignInButton() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <AppButton
      label={t('auth.apple')}
      variant="secondary"
      icon={<Ionicons name="logo-apple" size={18} color={colors.accent} />}
      onPress={() => Alert.alert(t('auth.appleComingSoonTitle'), t('auth.appleComingSoonMessage'))}
    />
  );
}
