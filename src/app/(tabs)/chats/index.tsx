import { useTranslation } from 'react-i18next';

import { ListRow } from '@/components/list-row';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';

// F2: chat rooms of the ongoing events recommended to the user.
export default function ChatsScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Placeholder label={t('chats.listPlaceholder')} phase={5} />
      <ListRow label={t('chats.sampleEvent')} href="/chats/sample-event" />
    </Screen>
  );
}
