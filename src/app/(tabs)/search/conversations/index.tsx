import { useTranslation } from 'react-i18next';

import { ListRow } from '@/components/list-row';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';

// F4: conversations with friends, reached from next to the search field.
export default function ConversationsScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Placeholder label={t('conversations.listPlaceholder')} phase={7} />
      <ListRow label={t('conversations.sampleConversation')} href="/search/conversations/sample" />
    </Screen>
  );
}
