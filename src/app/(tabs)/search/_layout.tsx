import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function SearchLayout() {
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="conversations/index" options={{ title: t('conversations.title') }} />
      <Stack.Screen
        name="conversations/[conversationId]"
        options={{ title: t('conversations.sampleConversation') }}
      />
    </Stack>
  );
}
