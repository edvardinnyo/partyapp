import { useTranslation } from 'react-i18next';

import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';

// F4: a real-time conversation with a friend.
export default function ConversationScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Placeholder label={t('conversations.threadPlaceholder')} phase={7} />
    </Screen>
  );
}
