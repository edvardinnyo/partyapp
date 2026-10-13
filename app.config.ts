import type { ConfigContext, ExpoConfig } from 'expo/config';

// Q1: same identifier on iOS and Android. It cannot change after the first store upload.
const APP_ID = 'hu.nocturnal.app';

// The EAS project id (extra.eas.projectId) is added here once the project is linked with `eas init`.
// It is not a secret.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Nocturnal',
  slug: 'nocturnal',
  scheme: 'nocturnal',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  // D-002: the theme follows the phone setting by default.
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: APP_ID,
    supportsTablet: true,
  },
  android: {
    package: APP_ID,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: ['expo-router', 'expo-localization'],
});
