import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './locales/en';
import { hu, type Translation } from './locales/hu';
import {
  FALLBACK_LANGUAGE,
  type LanguagePreference,
  languageForPreference,
  resolveLanguage,
} from './resolve-language';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: Translation };
  }
}

const i18n = createInstance();

function deviceLanguageCodes() {
  return getLocales().map((locale) => locale.languageCode);
}

void i18n.use(initReactI18next).init({
  resources: {
    hu: { translation: hu },
    en: { translation: en },
  },
  lng: resolveLanguage(deviceLanguageCodes()),
  fallbackLng: FALLBACK_LANGUAGE,
  // React already escapes rendered strings.
  interpolation: { escapeValue: false },
  initAsync: false,
});

/** D-002: switch the UI language to the user's choice, or back to the phone's language. */
export function applyLanguagePreference(preference: LanguagePreference): void {
  const language = languageForPreference(preference, deviceLanguageCodes());
  if (i18n.language !== language) {
    void i18n.changeLanguage(language);
  }
}

export default i18n;
