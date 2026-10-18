import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';
import { useColorScheme } from 'react-native';

import { usePreferencesStore } from '@/features/settings/preferences-store';

import { resolveColorScheme } from './color-scheme';
import { colors, type ColorScheme, type ThemeColors } from './colors';

export type { ColorScheme, ThemeColors };

export type AppTheme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  navigation: Theme;
};

function toNavigationTheme(base: Theme, palette: ThemeColors): Theme {
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: palette.accent,
      background: palette.background,
      card: palette.background,
      text: palette.text,
      border: palette.border,
    },
  };
}

const navigationThemes: Record<ColorScheme, Theme> = {
  light: toNavigationTheme(DefaultTheme, colors.light),
  dark: toNavigationTheme(DarkTheme, colors.dark),
};

export function useAppTheme(): AppTheme {
  const preference = usePreferencesStore((state) => state.theme);
  const scheme = resolveColorScheme(useColorScheme(), preference);
  return { scheme, colors: colors[scheme], navigation: navigationThemes[scheme] };
}
