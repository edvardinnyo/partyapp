import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'link';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
}: AppButtonProps) {
  const { colors } = useAppTheme();
  const isInactive = disabled || loading;
  const tone = variant === 'destructive' ? colors.danger : colors.accent;
  const isFilled = variant === 'primary';
  const textColor = isFilled ? colors.onAccent : tone;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      onPress={onPress}
      style={({ pressed }) => [
        variant === 'link' ? styles.link : styles.button,
        variant !== 'link' && {
          backgroundColor: isFilled ? tone : 'transparent',
          borderColor: tone,
        },
        { opacity: isInactive ? 0.5 : pressed ? 0.7 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  link: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
