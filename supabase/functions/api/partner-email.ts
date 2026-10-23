// D-008/4: the email the team gets about a partner application. Plain functions, so Jest can
// test them; partner-notifier.ts sends the result. The text is Hungarian: it is for the team.
import type { PartnerApplicationNotice } from './app.ts';

const budapestTime = new Intl.DateTimeFormat('hu-HU', {
  timeZone: 'Europe/Budapest',
  dateStyle: 'long',
  timeStyle: 'short',
});

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Everything in the email comes from the applicant, so none of it may become markup. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character);
}

export function applicationEmail(notice: PartnerApplicationNotice) {
  const { details } = notice;
  const rows: [string, string][] = [
    ['Nyilvános név', `${notice.displayName} (@${notice.username})`],
    ['Cégnév', details.companyName],
    ['Adószám', details.taxNumber],
    ['Kapcsolattartó', details.contactName],
    ['Telefonszám', details.contactPhone],
    ['A helyszín címe', details.address],
    ['Weboldal', details.website ?? '—'],
    ['A fiók e-mail-címe', notice.accountEmail ?? '—'],
    ['Beküldve', budapestTime.format(notice.submittedAt)],
    ['Felhasználó-azonosító', notice.userId],
  ];
  const intro = notice.resubmission
    ? 'Egy elutasított partner javított kérelmet küldött be.'
    : 'Új partnerkérelem érkezett a Nocturnalba.';
  const checks =
    'Ellenőrzendő: a cégnév és az adószám (e-cegjegyzek.hu, a NAV adószám-lekérdezője), ' +
    'és hogy a fiók e-mail-címe a cég saját domainjén van-e. A válasz erre az e-mailre ' +
    'a partner fiókjának címére megy.';
  const review =
    'Elbírálás egyelőre a Supabase felületén: Table Editor → partners → status ' +
    '(approved vagy rejected; elutasításnál a rejection_reason az indoklás).';

  // A display name cannot break the subject line.
  const name = notice.displayName.replace(/\s+/g, ' ');
  const subject = `${notice.resubmission ? 'Javított partnerkérelem' : 'Új partnerkérelem'}: ${name}`;
  const text = [
    intro,
    '',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    checks,
    review,
  ].join('\n');
  const html = [
    `<p>${escapeHtml(intro)}</p>`,
    '<table cellpadding="4">',
    ...rows.map(
      ([label, value]) =>
        `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`,
    ),
    '</table>',
    `<p>${escapeHtml(checks)}</p>`,
    `<p>${escapeHtml(review)}</p>`,
  ].join('\n');
  return { subject, text, html };
}
