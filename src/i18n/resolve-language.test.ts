import { languageForPreference, resolveLanguage } from './resolve-language';

describe('resolveLanguage', () => {
  it('uses Hungarian on a Hungarian phone', () => {
    expect(resolveLanguage(['hu'])).toBe('hu');
    expect(resolveLanguage(['HU'])).toBe('hu');
  });

  it('uses English on an English phone', () => {
    expect(resolveLanguage(['en'])).toBe('en');
  });

  it('uses English for any other primary language, even if Hungarian comes later', () => {
    expect(resolveLanguage(['de', 'hu'])).toBe('en');
  });

  it('skips missing language codes', () => {
    expect(resolveLanguage([null, 'hu'])).toBe('hu');
  });

  it('falls back to Hungarian without any language info', () => {
    expect(resolveLanguage([])).toBe('hu');
    expect(resolveLanguage([null])).toBe('hu');
  });
});

describe('languageForPreference', () => {
  it('follows the phone for "system"', () => {
    expect(languageForPreference('system', ['hu'])).toBe('hu');
    expect(languageForPreference('system', ['de'])).toBe('en');
  });

  it('lets a manual choice override the phone (D-002)', () => {
    expect(languageForPreference('en', ['hu'])).toBe('en');
    expect(languageForPreference('hu', ['en'])).toBe('hu');
  });
});
