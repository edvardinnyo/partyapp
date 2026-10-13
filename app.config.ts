import type { ConfigContext, ExpoConfig } from 'expo/config';

// Q1: same identifier on iOS and Android. It cannot change after the first store upload.
const APP_ID = 'hu.nocturnal.app';

// EAS project on expo.dev, linked with `eas init`. It is not a secret.
const EAS_PROJECT_ID = '17317d02-8a22-4d6d-a425-4b1bc7862d57';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  // The EAS project belongs to the team's Expo organization, not to a personal account.
  owner: 'nocturnal_app',
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
  extra: {
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
});
