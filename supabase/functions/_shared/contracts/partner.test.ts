import {
  isValidPhone,
  isValidTaxNumber,
  normalizeTaxNumber,
  normalizeWebsite,
  partnerApplicationInputSchema,
  TAX_NUMBER_EXAMPLE,
  taxNumberProblem,
} from './partner.ts';

describe('Hungarian tax numbers', () => {
  it('accepts real ones, with or without dashes', () => {
    // Public tax numbers of large Hungarian companies.
    for (const taxNumber of ['10773381-2-44', '10537914-4-44', '10625790-4-44']) {
      expect(isValidTaxNumber(taxNumber)).toBe(true);
    }
    expect(normalizeTaxNumber('10773381244')).toBe('10773381-2-44');
    expect(normalizeTaxNumber(' 10773381 2 44 ')).toBe('10773381-2-44');
  });

  it('catches a mistyped digit, a wrong VAT code and a wrong format', () => {
    expect(isValidTaxNumber('10773391-2-44')).toBe(false);
    expect(isValidTaxNumber('10773381-7-44')).toBe(false);
    expect(isValidTaxNumber('1077338-2-44')).toBe(false);
    expect(isValidTaxNumber('HU10773381')).toBe(false);
  });

  it('tells a wrong shape from a check digit that does not fit', () => {
    expect(taxNumberProblem('1234')).toBe('format');
    expect(taxNumberProblem('12345676-7-42')).toBe('format');
    expect(taxNumberProblem('12345678-2-42')).toBe('checkDigit');
    expect(taxNumberProblem('10773381-2-44')).toBeNull();
  });

  it('shows an example in the form that is itself valid', () => {
    expect(taxNumberProblem(TAX_NUMBER_EXAMPLE)).toBeNull();
  });
});

describe('contact details', () => {
  it('accepts usual phone formats only', () => {
    expect(isValidPhone('+36 30 123 4567')).toBe(true);
    expect(isValidPhone('06-1-234-5678')).toBe(true);
    expect(isValidPhone('(1) 234 5678')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
    expect(isValidPhone('call me')).toBe(false);
  });

  it('turns a bare domain into a web address', () => {
    expect(normalizeWebsite('fogashaz.hu')).toBe('https://fogashaz.hu');
    expect(normalizeWebsite('instagram.com/fogashaz')).toBe('https://instagram.com/fogashaz');
    expect(normalizeWebsite('http://example.com')).toBe('http://example.com');
  });
});

describe('partnerApplicationInputSchema (D-008)', () => {
  const application = {
    displayName: 'Fogasház',
    username: 'fogashaz',
    avatarPath: null,
    companyName: 'Fogasház Kft.',
    taxNumber: '10773381244',
    contactName: 'Kiss Anna',
    contactPhone: '+36 30 123 4567',
    address: '1073 Budapest, Akácfa utca 51.',
    website: 'fogashaz.hu',
    termsAccepted: true,
    privacyAccepted: true,
  };

  it('normalises the tax number and the website', () => {
    expect(partnerApplicationInputSchema.parse(application)).toMatchObject({
      taxNumber: '10773381-2-44',
      website: 'https://fogashaz.hu',
    });
    expect(partnerApplicationInputSchema.parse({ ...application, website: null }).website).toBe(
      null,
    );
  });

  it('needs both acceptances and valid details', () => {
    expect(
      partnerApplicationInputSchema.safeParse({ ...application, termsAccepted: false }).success,
    ).toBe(false);
    expect(
      partnerApplicationInputSchema.safeParse({ ...application, privacyAccepted: false }).success,
    ).toBe(false);
    expect(
      partnerApplicationInputSchema.safeParse({ ...application, taxNumber: '12345678-2-44' })
        .success,
    ).toBe(false);
    expect(
      partnerApplicationInputSchema.safeParse({ ...application, website: 'not a site' }).success,
    ).toBe(false);
    expect(
      partnerApplicationInputSchema.safeParse({ ...application, companyName: ' ' }).success,
    ).toBe(false);
  });
});
