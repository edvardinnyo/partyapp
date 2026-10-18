import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  /**
   * Safe-area edges this screen has to handle itself. A navigation header covers the top,
   * the navbar covers the bottom, so most screens need none.
   */
  edges?: Edge[];
};

export function Screen({ children, edges = [] }: ScreenProps) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
});
