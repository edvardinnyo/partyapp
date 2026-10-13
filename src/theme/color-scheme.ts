import type { ColorScheme } from './colors';

/** D-002: follow the phone setting; anything that is not dark (e.g. unspecified) is light. */
export function resolveColorScheme(systemScheme: string | null | undefined): ColorScheme {
  return systemScheme === 'dark' ? 'dark' : 'light';
}
