import { PartnerApplicationForm } from '@/features/partners/partner-application-form';

// D-008: after confirming the email, a partner fills in its application instead of the
// person's profile and taste steps.
export default function PartnerApplicationScreen() {
  return <PartnerApplicationForm mode="create" />;
}
