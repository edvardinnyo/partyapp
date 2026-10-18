import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/theme';

type FormMessageProps = {
  message: string | null;
  tone?: 'error' | 'info';
};

/** An inline status line under a form; renders nothing without a message. */
export function FormMessage({ message, tone = 'error' }: FormMessageProps) {
  const { colors } = useAppTheme();
  if (!message) {
    return null;
  }
  return (
    <AppText
      accessibilityLiveRegion="polite"
      style={{ color: tone === 'error' ? colors.danger : colors.success }}
    >
      {message}
    </AppText>
  );
}
