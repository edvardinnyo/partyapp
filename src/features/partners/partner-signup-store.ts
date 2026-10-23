import { create } from 'zustand';

import type { PickedAvatar } from '@/features/profile/avatar-upload';

/** Everything the partner typed into the application, before it is sent. */
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

export type PendingPartnerSignup = {
  /** Lowercase; only this account sends the application after its email code. */
  email: string;
  draft: PartnerApplicationDraft;
  logo: PickedAvatar | null;
};

type PartnerSignupState = {
  pending: PendingPartnerSignup | null;
  setPending: (pending: PendingPartnerSignup) => void;
  clear: () => void;
};

/**
 * D-008/22: the application filled in before the email code. It stays on the phone, in memory
 * only, until the code confirms the account; then it is sent automatically.
 */
export const usePartnerSignupStore = create<PartnerSignupState>()((set) => ({
  pending: null,
  setPending: (pending) => set({ pending }),
  clear: () => set({ pending: null }),
}));
