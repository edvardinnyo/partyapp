// D-008/23: the team reviews partner applications in the app. Shared between the app
// (Metro/Jest) and the API (Deno); keep it free of runtime-specific imports.
import { z } from 'zod';

export const REJECTION_REASON_MAX_LENGTH = 500;

/** Approve, or reject with a reason the partner sees in the app and in the email. */
export const partnerDecisionInputSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('approve') }),
  z.object({
    decision: z.literal('reject'),
    reason: z.string().trim().min(1).max(REJECTION_REASON_MAX_LENGTH),
  }),
]);
export type PartnerDecisionInput = z.input<typeof partnerDecisionInputSchema>;

/** An application waiting for the team: the public profile, the company and the account. */
export const partnerApplicationSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  accountEmail: z.string().nullable(),
  companyName: z.string(),
  taxNumber: z.string(),
  contactName: z.string(),
  contactPhone: z.string(),
  address: z.string(),
  website: z.string().nullable(),
  submittedAt: z.string(),
});
export type PartnerApplication = z.infer<typeof partnerApplicationSchema>;

export const partnerApplicationsResponseSchema = z.object({
  applications: z.array(partnerApplicationSchema),
});
