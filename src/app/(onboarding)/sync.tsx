import { router } from 'expo-router';

import { SyncIntro } from '@/features/taste/sync-intro';

// F6 + D-001: the onboarding's streaming step for a signed-in account without a taste yet.
export default function SyncScreen() {
  return <SyncIntro onChooseGenres={() => router.push('/taste')} />;
}
