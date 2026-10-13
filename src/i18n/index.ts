import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from './locales/en';
import { hu, type Translation } from './locales/hu';
import { FALLBACK_LANGUAGE, resolveLanguage } from './resolve-language';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: Translation };
  }
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: {
    hu: { translation: hu },
    en: { translation: en },
  },
  lng: resolveLanguage(getLocales().map((locale) => locale.languageCode)),
  fallbackLng: FALLBACK_LANGUAGE,
  // React already escapes rendered strings.
  interpolation: { escapeValue: false },
  initAsync: false,
});

export default i18n;
