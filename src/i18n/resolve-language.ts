export type AppLanguage = 'hu' | 'en';

/** D-002: "system" follows the phone; the other values are a manual choice in Settings. */
export type LanguagePreference = 'system' | AppLanguage;

/** Hungarian is the primary language of the app (Q22). */
export const FALLBACK_LANGUAGE: AppLanguage = 'hu';

/**
 * D-002: the phone's primary language decides — Hungarian phones get Hungarian,
 * every other language gets English. Without any language info we keep the primary language.
 */
export function resolveLanguage(deviceLanguageCodes: readonly (string | null)[]): AppLanguage {
  const primary = deviceLanguageCodes.find((code): code is string => Boolean(code));
  if (primary === undefined) {
    return FALLBACK_LANGUAGE;
  }
  return primary.toLowerCase() === 'hu' ? 'hu' : 'en';
}

export function languageForPreference(
  preference: LanguagePreference,
  deviceLanguageCodes: readonly (string | null)[],
): AppLanguage {
  return preference === 'system' ? resolveLanguage(deviceLanguageCodes) : preference;
}
