import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** A small number shown on a selected chip, e.g. its rank. */
  badge?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function Chip({ label, selected, onPress, badge, disabled, accessibilityLabel }: ChipProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.accent : colors.surface,
          borderColor: selected ? colors.accent : colors.border,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
    >
      {badge !== undefined ? (
        <View style={[styles.badge, { backgroundColor: colors.onAccent }]}>
          <Text style={[styles.badgeText, { color: colors.accent }]}>{badge}</Text>
        </View>
      ) : null}
      <Text style={[styles.label, { color: selected ? colors.onAccent : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
});
