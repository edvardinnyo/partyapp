import * as AppleAuthentication from 'expo-apple-authentication';
import { Alert, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/theme';

/**
 * D-004: Sign in with Apple ships before the iOS release, together with the Apple Developer
 * membership. Until then the button is shown on iOS only and announces that it is coming soon.
 */
export function AppleSignInButton() {
  const { t } = useTranslation();
  const { scheme } = useAppTheme();

  if (Platform.OS !== 'ios') {
    return null;
  }

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={
        scheme === 'dark'
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
      }
      cornerRadius={12}
      style={styles.button}
      onPress={() => Alert.alert(t('auth.appleComingSoonTitle'), t('auth.appleComingSoonMessage'))}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
  },
});
