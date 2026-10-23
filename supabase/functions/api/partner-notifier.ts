// Sends the partner application emails through Resend's HTTP API (the same service that sends
// the sign-up codes). The key and the team's address are Supabase secrets, never in the repo.
import type { PartnerNotifier } from './app.ts';
import { applicationEmail, decisionEmail } from './partner-email.ts';

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
const SENDER = 'Nocturnal <no-reply@nocturnal.hu>';

type Email = { to: string; subject: string; text: string; html: string; replyTo?: string | null };

export function createPartnerNotifier(config: { apiKey?: string; to?: string }): PartnerNotifier {
  async function send(apiKey: string, { to, subject, text, html, replyTo }: Email) {
    const response = await fetch(RESEND_EMAILS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: SENDER,
        to: [to],
        subject,
        text,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!response.ok) {
      throw new Error(`Resend answered ${response.status}`);
    }
  }

  return {
    async applicationSubmitted(notice) {
      if (!config.apiKey || !config.to) {
        console.warn(
          '[partners] application email skipped: RESEND_API_KEY or PARTNER_REVIEW_EMAIL is not set',
        );
        return;
      }
      // Replying from the team's mailbox reaches the partner directly.
      await send(config.apiKey, {
        ...applicationEmail(notice),
        to: config.to,
        replyTo: notice.accountEmail,
      });
    },

    async applicationDecided(notice) {
      if (!config.apiKey) {
        console.warn('[partners] decision email skipped: RESEND_API_KEY is not set');
        return;
      }
      // The partner's reply reaches the team's mailbox.
      await send(config.apiKey, { ...decisionEmail(notice), to: notice.to, replyTo: config.to });
    },
  };
}
