import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function ChatsLayout() {
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('chats.title') }} />
      <Stack.Screen name="[eventId]" options={{ title: t('chats.sampleEvent') }} />
    </Stack>
  );
}
