// D-008/4: the emails about a partner application, to the team and to the partner. Plain
// functions, so Jest can test them; partner-notifier.ts sends the result.
import type { PartnerApplicationNotice, PartnerDecisionNotice } from './app.ts';

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

/** The paragraphs as HTML; line breaks typed into a rejection reason are kept. */
function paragraphs(texts: string[]) {
  return texts.map((text) => `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`);
}

/** For the team, so it is Hungarian. */
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
  const review = 'Elbírálás az appban, a csapat fiókjával belépve: Beállítások → Partnerkérelmek.';

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
    ...paragraphs([intro]),
    '<table cellpadding="4">',
    ...rows.map(
      ([label, value]) =>
        `<tr><td><strong>${escapeHtml(label)}</strong></td><td>${escapeHtml(value)}</td></tr>`,
    ),
    '</table>',
    ...paragraphs([checks, review]),
  ].join('\n');
  return { subject, text, html };
}

/**
 * D-008/23: the team's decision, to the partner's account address. The partner may use the app
 * in either language, so the email has both: Hungarian first, then English.
 */
export function decisionEmail(notice: PartnerDecisionNotice) {
  const profile = `${notice.displayName} (@${notice.username})`;
  const hungarian = [
    `Kedves ${notice.contactName}!`,
    ...(notice.approved
      ? [
          'Jóváhagytuk a partnerkérelmedet. A profilodon megjelent a hitelesített partner jelzés, és közzéteheted az eseményeidet.',
        ]
      : [
          'A partnerkérelmedet most nem tudtuk jóváhagyni.',
          `Indoklás: ${notice.reason ?? '—'}`,
          'Az appban javíthatod a kérelmet, és újra beküldheted.',
        ]),
    `Partnerprofil: ${profile}`,
    'Ha kérdésed van, válaszolj erre az e-mailre.',
    'A Nocturnal csapata',
  ];
  const english = [
    `Dear ${notice.contactName},`,
    ...(notice.approved
      ? [
          'We have approved your partner application. Your profile now shows the verified partner badge, and you can publish your events.',
        ]
      : [
          'We could not approve your partner application this time.',
          `Reason: ${notice.reason ?? '—'}`,
          'You can correct the application in the app and send it again.',
        ]),
    `Partner profile: ${profile}`,
    'If you have a question, reply to this email.',
    'The Nocturnal team',
  ];

  const subject = notice.approved
    ? 'A partnerkérelmedet jóváhagytuk / Your partner application is approved'
    : 'Döntés a partnerkérelmedről / A decision on your partner application';
  const text = [hungarian.join('\n\n'), english.join('\n\n')].join('\n\n———\n\n');
  const html = [...paragraphs(hungarian), '<hr>', ...paragraphs(english)].join('\n');
  return { subject, text, html };
}
