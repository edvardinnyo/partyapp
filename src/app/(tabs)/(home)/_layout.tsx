import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function HomeLayout() {
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="map" options={{ title: t('map.title') }} />
    </Stack>
  );
}
