import Ionicons from '@expo/vector-icons/Ionicons';
import { type Href, Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/theme';

type ListRowProps = {
  label: string;
  href: Href;
};

export function ListRow({ label, href }: ListRowProps) {
  const { colors } = useAppTheme();

  return (
    <Link href={href} asChild>
      <Pressable
        accessibilityRole="button"
        // Link asChild only accepts a flat style object.
        style={({ pressed }) =>
          StyleSheet.flatten([
            styles.row,
            {
              borderColor: colors.border,
              backgroundColor: colors.surface,
              opacity: pressed ? 0.7 : 1,
            },
          ])
        }
      >
        <AppText style={styles.label}>{label}</AppText>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  label: {
    flex: 1,
  },
});
