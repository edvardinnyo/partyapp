import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/theme';

type TextFieldProps = Omit<TextInputProps, 'style' | 'placeholderTextColor'> & {
  label: string;
  /** Shown under the field instead of the hint. */
  error?: string | null;
  hint?: string | null;
  hintTone?: 'muted' | 'success';
};

export function TextField({
  label,
  error,
  hint,
  hintTone = 'muted',
  ...inputProps
}: TextFieldProps) {
  const { colors } = useAppTheme();
  const message = error ?? hint;
  const messageColor = error ? colors.danger : hintTone === 'success' ? colors.success : undefined;

  return (
    <View style={styles.field}>
      <AppText variant="muted">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
        {...inputProps}
      />
      {message ? (
        <AppText variant="muted" style={messageColor ? { color: messageColor } : undefined}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});
