import { useTranslation } from 'react-i18next';

import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';

// F5 + Q6: map with the user's position, all events and the distance slider (1–200 km).
export default function MapScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Placeholder label={t('map.placeholder')} phase={4} />
    </Screen>
  );
}
