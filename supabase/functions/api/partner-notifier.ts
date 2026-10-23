// Sends the partner application emails through Resend's HTTP API (the same service that sends
// the sign-up codes). The key and the team's address are Supabase secrets, never in the repo.
import type { PartnerNotifier } from './app.ts';
import { applicationEmail } from './partner-email.ts';

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
const SENDER = 'Nocturnal <no-reply@nocturnal.hu>';

export function createPartnerNotifier(config: { apiKey?: string; to?: string }): PartnerNotifier {
  return {
    async applicationSubmitted(notice) {
      if (!config.apiKey || !config.to) {
        console.warn(
          '[partners] application email skipped: RESEND_API_KEY or PARTNER_REVIEW_EMAIL is not set',
        );
        return;
      }
      const { subject, text, html } = applicationEmail(notice);
      const response = await fetch(RESEND_EMAILS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: SENDER,
          to: [config.to],
          subject,
          text,
          html,
          // Replying from the team's mailbox reaches the partner directly.
          ...(notice.accountEmail ? { reply_to: notice.accountEmail } : {}),
        }),
      });
      if (!response.ok) {
        throw new Error(`Resend answered ${response.status}`);
      }
    },
  };
}
