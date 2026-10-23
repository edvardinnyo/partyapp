import { PartnerApplicationForm } from '@/features/partners/partner-application-form';

// D-008/1, D-008/22: companies register here with email and password only (no Google), and fill
// in the whole application before the email code; the code comes last and sends it.
export default function PartnerRegisterScreen() {
  return <PartnerApplicationForm mode="signup" />;
}
