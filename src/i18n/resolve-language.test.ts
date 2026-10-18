import { resolveLanguage } from './resolve-language';

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
