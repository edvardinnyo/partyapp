import { StyleSheet, Text, type TextProps } from 'react-native';

import { useAppTheme } from '@/theme';

type Variant = 'title' | 'subtitle' | 'body' | 'muted';

type AppTextProps = TextProps & {
  variant?: Variant;
};

export function AppText({ variant = 'body', style, ...rest }: AppTextProps) {
  const { colors } = useAppTheme();
  const color = variant === 'muted' ? colors.textMuted : colors.text;

  return <Text style={[styles[variant], { color }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
  },
  muted: {
    fontSize: 14,
  },
});
