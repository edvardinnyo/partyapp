import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { LanguagePreference } from '@/i18n/resolve-language';
import type { ThemePreference } from '@/theme/color-scheme';

type PreferencesState = {
  theme: ThemePreference;
  language: LanguagePreference;
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: LanguagePreference) => void;
};

/** D-002: appearance and language, chosen per device; "system" follows the phone. */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'system',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'preferences',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ theme, language }) => ({ theme, language }),
    },
  ),
);
