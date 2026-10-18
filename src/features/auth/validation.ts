/** D-004 plan: at least 8 characters (also set as the minimum in Supabase Auth). */
export const PASSWORD_MIN_LENGTH = 8;
/** Supabase's email OTP length (Auth → Providers → Email → Email OTP Length). */
export const EMAIL_CODE_LENGTH = 6;
/** Supabase lets a new code be requested once every 60 seconds. */
export const RESEND_COOLDOWN_SECONDS = 60;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_PATTERN = new RegExp(`^\\d{${EMAIL_CODE_LENGTH}}$`);

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

export function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN_LENGTH;
}

export function isValidCode(code: string): boolean {
  return CODE_PATTERN.test(code);
}
