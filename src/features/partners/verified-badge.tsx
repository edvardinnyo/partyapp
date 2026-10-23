import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/theme';

/** D-008/5: the "verified partner" badge; only an approved partner gets it. */
export function VerifiedBadge({ size = 18 }: { size?: number }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <Ionicons
      name="checkmark-circle"
      size={size}
      color={colors.accent}
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('partners.verified')}
    />
  );
}
