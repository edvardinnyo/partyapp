import { PersonProfileForm } from '@/features/profile/person-profile-form';

// F6 + D-009: sign-in details and profile first, then the taste; the email code comes last.
export default function RegisterScreen() {
  return <PersonProfileForm mode="signup" />;
}
