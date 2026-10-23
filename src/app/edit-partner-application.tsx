import { useMyProfile } from '@/features/profile/use-my-profile';
import { PartnerApplicationForm } from '@/features/partners/partner-application-form';

// D-008/4: a rejected partner corrects its application and sends it again; without a navbar.
export default function EditPartnerApplicationScreen() {
  const profile = useMyProfile().data?.profile;
  if (!profile?.partner) {
    return null;
  }
  return <PartnerApplicationForm mode="resubmit" profile={profile} />;
}
