import { clashesWithProtectedNames, isTooSimilar, nameKey } from './protected-names.ts';

describe('nameKey', () => {
  it('keeps only lowercase letters and digits, without accents', () => {
    expect(nameKey('Fogasház Bp.')).toBe('fogashazbp');
    expect(nameKey('A38 Hajó')).toBe('a38hajo');
  });
});

describe('isTooSimilar (D-008/5)', () => {
  it('blocks the same name in any spelling', () => {
    expect(isTooSimilar('fogashaz', 'Fogasház')).toBe(true);
    expect(isTooSimilar('FOGAS HÁZ', 'Fogasház')).toBe(true);
    expect(isTooSimilar('a.38', 'A38')).toBe(true);
  });

  it('blocks names built around a longer partner name, and one-letter typos', () => {
    expect(isTooSimilar('fogashaz.official', 'Fogasház')).toBe(true);
    expect(isTooSimilar('real_fogashaz_bp', 'fogashaz')).toBe(true);
    expect(isTooSimilar('fogashazz', 'fogashaz')).toBe(true);
    expect(isTooSimilar('fogashas', 'fogashaz')).toBe(true);
  });

  it('leaves unrelated and only partly similar names alone', () => {
    expect(isTooSimilar('fogas', 'Fogasház')).toBe(false);
    expect(isTooSimilar('anna38', 'A38')).toBe(false);
    expect(isTooSimilar('ka38x', 'A38')).toBe(false);
    expect(isTooSimilar('akvarium', 'Fogasház')).toBe(false);
    expect(isTooSimilar('...', 'A38')).toBe(false);
  });
});

describe('clashesWithProtectedNames', () => {
  const partners = [{ userId: 'partner-1', username: 'fogashaz', displayName: 'Fogasház' }];

  it('checks every name against every protected one, except the partner’s own', () => {
    expect(clashesWithProtectedNames(['oli', 'Fogasház Fan'], partners)).toBe(true);
    expect(clashesWithProtectedNames(['oli', 'Oli'], partners)).toBe(false);
    expect(clashesWithProtectedNames(['fogashaz'], partners, 'partner-1')).toBe(false);
  });
});
