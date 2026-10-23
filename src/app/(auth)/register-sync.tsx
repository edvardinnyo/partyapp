import { router } from 'expo-router';

import { SyncIntro } from '@/features/taste/sync-intro';

// D-009: the registration's streaming step, before the email code.
export default function RegisterSyncScreen() {
  return <SyncIntro onChooseGenres={() => router.push('/register-taste')} />;
}
