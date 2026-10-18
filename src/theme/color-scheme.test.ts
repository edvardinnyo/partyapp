import { resolveColorScheme } from './color-scheme';

describe('resolveColorScheme', () => {
  it('follows the phone setting by default', () => {
    expect(resolveColorScheme('dark')).toBe('dark');
    expect(resolveColorScheme('light')).toBe('light');
  });

  it('uses light when the phone gives no preference', () => {
    expect(resolveColorScheme('unspecified')).toBe('light');
    expect(resolveColorScheme(null)).toBe('light');
    expect(resolveColorScheme(undefined)).toBe('light');
  });

  it('lets a manual choice override the phone (D-002)', () => {
    expect(resolveColorScheme('light', 'dark')).toBe('dark');
    expect(resolveColorScheme('dark', 'light')).toBe('light');
    expect(resolveColorScheme('dark', 'system')).toBe('dark');
  });
});
