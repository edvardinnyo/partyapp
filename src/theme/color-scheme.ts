import type { ColorScheme } from './colors';

/** D-002: "system" follows the phone; the other values are a manual choice in Settings. */
export type ThemePreference = 'system' | ColorScheme;

/** Anything that is not dark (e.g. unspecified) counts as light. */
export function resolveColorScheme(
  systemScheme: string | null | undefined,
  preference: ThemePreference = 'system',
): ColorScheme {
  if (preference !== 'system') {
    return preference;
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
}
