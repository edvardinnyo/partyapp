// D-008: partner (company) accounts. Shared between the app (Metro/Jest) and the API (Deno).
// Keep it free of runtime-specific imports: only `zod` and other shared files.
import { z } from 'zod';

import { displayNameSchema, usernameSchema } from './profile.ts';

const TAX_NUMBER_WEIGHTS = [9, 7, 3, 1, 9, 7, 3];
const TAX_NUMBER_PATTERN = /^(\d{8})-[1-5]-\d{2}$/;

/** The example in the form's hint. A test keeps it valid, so it also works as test data. */
export const TAX_NUMBER_EXAMPLE = '12345676-2-42';

/** "12345678242", "12345678 2 42" and "12345678-2-42" all become "12345678-2-42". */
export function normalizeTaxNumber(input: string): string {
  const digits = input.replace(/[\s-]/g, '');
  return /^\d{11}$/.test(digits)
    ? `${digits.slice(0, 8)}-${digits.slice(8, 9)}-${digits.slice(9)}`
    : input.trim();
}

/**
 * A Hungarian tax number (adószám): an 8-digit taxpayer number ending in a check digit, a VAT
 * code (1–5) and a 2-digit area code. The check digit makes most typos detectable.
 */
export function isValidTaxNumber(value: string): boolean {
  const match = TAX_NUMBER_PATTERN.exec(value);
  if (!match?.[1]) {
    return false;
  }
  const digits = [...match[1]].map(Number);
  const sum = TAX_NUMBER_WEIGHTS.reduce(
    (total, weight, index) => total + weight * (digits[index] ?? 0),
    0,
  );
  return (10 - (sum % 10)) % 10 === digits[7];
}

export type TaxNumberProblem = 'format' | 'checkDigit';

/** Why a tax number is refused: its shape, or a check digit that does not fit (a typo). */
export function taxNumberProblem(value: string): TaxNumberProblem | null {
  if (!TAX_NUMBER_PATTERN.test(value)) {
    return 'format';
  }
  return isValidTaxNumber(value) ? null : 'checkDigit';
}

export const taxNumberSchema = z.string().transform(normalizeTaxNumber).refine(isValidTaxNumber);

/** Digits with an optional leading +, spaces, dashes and brackets; 6–15 digits in all. */
export function isValidPhone(value: string): boolean {
  const digitCount = value.replace(/\D/g, '').length;
  return /^\+?[\d\s()-]+$/.test(value) && digitCount >= 6 && digitCount <= 15;
}

/** "fogashaz.hu" or "instagram.com/fogashaz" becomes an https:// address. */
export function normalizeWebsite(input: string): string {
  const trimmed = input.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export const websiteSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .transform(normalizeWebsite)
  .pipe(z.httpUrl());

/** D-008/2: what the team checks before approving a partner. */
export const partnerDetailsSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  taxNumber: taxNumberSchema,
  contactName: z.string().trim().min(1).max(100),
  contactPhone: z.string().trim().max(30).refine(isValidPhone),
  address: z.string().trim().min(1).max(300),
  website: websiteSchema.nullable(),
});
export type PartnerDetails = z.infer<typeof partnerDetailsSchema>;

/** The first application: the public profile, the company details and the two acceptances. */
export const partnerApplicationInputSchema = partnerDetailsSchema.extend({
  displayName: displayNameSchema,
  username: usernameSchema,
  avatarPath: z.string().min(1).nullable(),
  // D-008: the partner terms and the privacy notice; there is no 18+ box for a company.
  termsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
});
export type PartnerApplicationInput = z.input<typeof partnerApplicationInputSchema>;

/** After a rejection (D-008/4): corrected details and public name; the username stays. */
export const partnerResubmissionInputSchema = partnerDetailsSchema.extend({
  displayName: displayNameSchema,
});
export type PartnerResubmissionInput = z.input<typeof partnerResubmissionInputSchema>;
