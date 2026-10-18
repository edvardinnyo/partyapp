import { resolveColorScheme } from './color-scheme';

describe('resolveColorScheme', () => {
  it('follows the phone setting', () => {
    expect(resolveColorScheme('dark')).toBe('dark');
    expect(resolveColorScheme('light')).toBe('light');
  });

  it('uses light when the phone gives no preference', () => {
    expect(resolveColorScheme('unspecified')).toBe('light');
    expect(resolveColorScheme(null)).toBe('light');
    expect(resolveColorScheme(undefined)).toBe('light');
  });
});
