import { create } from 'zustand';

import type { Genre } from '@shared/contracts/genres';
import type { PickedAvatar } from '@/features/profile/avatar-upload';

/** A person's profile and taste, typed in before the email code (D-009). */
export type PersonDraft = {
  displayName: string;
  username: string;
  avatar: PickedAvatar | null;
  /** Empty until the taste step. */
  genres: Genre[];
};

/** A partner's application, typed in before the email code (D-008/22). */
export type PartnerApplicationDraft = {
  displayName: string;
  username: string;
  companyName: string;
  taxNumber: string;
  contactName: string;
  contactPhone: string;
  address: string;
  website: string | null;
};

type PendingAccount = {
  /** Lowercase; only this account picks the registration up after its email code. */
  email: string;
  /** Needed right after the code only (see confirmSignUp); then it is forgotten. */
  password: string;
};

export type PendingRegistration =
  | (PendingAccount & { accountType: 'person'; person: PersonDraft })
  | (PendingAccount & {
      accountType: 'partner';
      partner: PartnerApplicationDraft;
      logo: PickedAvatar | null;
    });

type RegistrationState = {
  pending: PendingRegistration | null;
  setPending: (pending: PendingRegistration) => void;
  setGenres: (genres: Genre[]) => void;
  forgetPassword: () => void;
  clear: () => void;
};

/**
 * D-008/22, D-009: the email code comes last in both registrations. Until it is entered,
 * everything typed stays on the phone, in memory only; the code confirms the account and the
 * profile or application is sent right after.
 */
export const useRegistrationStore = create<RegistrationState>()((set) => ({
  pending: null,
  setPending: (pending) => set({ pending }),
  setGenres: (genres) =>
    set(({ pending }) => ({
      pending:
        pending?.accountType === 'person'
          ? { ...pending, person: { ...pending.person, genres } }
          : pending,
    })),
  forgetPassword: () =>
    set(({ pending }) => ({ pending: pending ? { ...pending, password: '' } : null })),
  clear: () => set({ pending: null }),
}));

/** The registration waiting for this signed-in account, if any. */
export function pendingRegistrationFor(
  pending: PendingRegistration | null,
  email: string | null,
): PendingRegistration | null {
  return pending && email !== null && pending.email === email.toLowerCase() ? pending : null;
}
