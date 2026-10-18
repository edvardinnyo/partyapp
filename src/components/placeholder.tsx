import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/theme';

type PlaceholderProps = {
  /** What will live here once the feature is built. */
  label: string;
  /** The phase that builds the feature (CLAUDE.md, chapter 9). */
  phase: number;
};

export function Placeholder({ label, phase }: PlaceholderProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <View style={[styles.box, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <AppText>{label}</AppText>
      <AppText variant="muted">
        {t('common.placeholder')} · {t('common.plannedPhase', { phase })}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
});
