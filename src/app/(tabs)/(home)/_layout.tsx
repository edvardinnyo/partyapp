import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useEventsLiveUpdates } from '@/features/events/use-events-live-updates';
import { useLocationTracking } from '@/features/location/use-location-tracking';

export default function HomeLayout() {
  const { t } = useTranslation();
  // F1, F5: the position and the live event updates serve the Home grid, the map and event pages.
  useLocationTracking();
  useEventsLiveUpdates();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="map" options={{ title: t('map.title') }} />
      {/* Q8: inside the Home tab, so the navbar stays visible (F7). */}
      <Stack.Screen name="event/[id]" options={{ title: t('event.title') }} />
    </Stack>
  );
}
