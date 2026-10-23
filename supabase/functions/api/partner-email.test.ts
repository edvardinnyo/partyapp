import type { PartnerApplicationNotice, PartnerDecisionNotice } from './app.ts';
import { applicationEmail, decisionEmail, escapeHtml } from './partner-email.ts';

const notice: PartnerApplicationNotice = {
  userId: 'user-1',
  accountEmail: 'info@fogashaz.hu',
  displayName: 'Fogasház <b>Bp</b>\nSecond line',
  username: 'fogashaz',
  details: {
    companyName: 'Fogasház & Társa Kft.',
    taxNumber: '10773381-2-44',
    contactName: 'Kiss Anna',
    contactPhone: '+36 30 123 4567',
    address: '1073 Budapest, Akácfa utca 51.',
    website: null,
  },
  submittedAt: new Date('2026-10-23T18:30:00Z'),
  resubmission: false,
};

describe('applicationEmail (D-008/4)', () => {
  it('lists the details for the team, in Budapest time', () => {
    const { subject, text } = applicationEmail(notice);

    expect(subject).toBe('Új partnerkérelem: Fogasház <b>Bp</b> Second line');
    expect(text).toContain('Adószám: 10773381-2-44');
    expect(text).toContain('A fiók e-mail-címe: info@fogashaz.hu');
    expect(text).toContain('Weboldal: —');
    expect(text).toContain('20:30');
    // D-008/23: the team decides in the app.
    expect(text).toContain('Beállítások → Partnerkérelmek');
  });

  it('never lets the applicant’s text become markup', () => {
    const { html } = applicationEmail(notice);

    expect(html).toContain('Fogasház &lt;b&gt;Bp&lt;/b&gt;');
    expect(html).toContain('Fogasház &amp; Társa Kft.');
    expect(html).not.toContain('<b>Bp</b>');
    expect(escapeHtml(`"'`)).toBe('&quot;&#39;');
  });

  it('marks a corrected application', () => {
    expect(applicationEmail({ ...notice, resubmission: true }).subject).toMatch(
      /^Javított partnerkérelem/,
    );
  });
});

describe('decisionEmail (D-008/23)', () => {
  const decision: PartnerDecisionNotice = {
    to: 'info@fogashaz.hu',
    contactName: 'Kiss Anna',
    displayName: 'Fogasház',
    username: 'fogashaz',
    approved: true,
    reason: null,
  };

  it('tells the partner about an approval in Hungarian, then in English', () => {
    const { subject, text } = decisionEmail(decision);

    expect(subject).toBe('A partnerkérelmedet jóváhagytuk / Your partner application is approved');
    expect(text.indexOf('Kedves Kiss Anna!')).toBeLessThan(text.indexOf('Dear Kiss Anna,'));
    expect(text).toContain('Partnerprofil: Fogasház (@fogashaz)');
    expect(text).not.toContain('Indoklás');
  });

  it('gives the reason of a rejection, never as markup', () => {
    const { subject, text, html } = decisionEmail({
      ...decision,
      approved: false,
      reason: 'Az adószám <nem> a cégé.\nKérjük, ellenőrizd.',
    });

    expect(subject).toMatch(/^Döntés a partnerkérelmedről/);
    expect(text).toContain('Indoklás: Az adószám <nem> a cégé.');
    expect(text).toContain('Reason: Az adószám <nem> a cégé.');
    expect(html).toContain('Az adószám &lt;nem&gt; a cégé.<br>Kérjük, ellenőrizd.');
    expect(html).not.toContain('<nem>');
  });
});
