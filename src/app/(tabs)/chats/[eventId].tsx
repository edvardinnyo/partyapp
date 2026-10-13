import { useTranslation } from 'react-i18next';

import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';

// F2: real-time chat and photo sharing inside an ongoing event.
export default function EventChatScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Placeholder label={t('chats.roomPlaceholder')} phase={5} />
    </Screen>
  );
}
