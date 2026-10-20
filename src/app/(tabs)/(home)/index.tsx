import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { useMyProfile } from '@/features/profile/use-my-profile';
import { useAppTheme } from '@/theme';

const EVENT_PLACEHOLDERS = [1, 2, 3, 4, 5, 6];

// F5: profile picture on top, map icon in the top section, recommended events in a grid below.
// Tapping an event does nothing yet (Q8).
export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const me = useMyProfile();

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={EVENT_PLACEHOLDERS}
        keyExtractor={(item) => String(item)}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topBar}>
              <View style={styles.topBarSide} />
              <Link href="/profile/me" asChild>
                <Pressable accessibilityRole="button" accessibilityLabel={t('home.openProfile')}>
                  <Avatar uri={me.data?.profile?.avatarUrl} size={72} />
                </Pressable>
              </Link>
              <View style={[styles.topBarSide, styles.topBarRight]}>
                <Link href="/map" asChild>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('home.openMap')}
                    hitSlop={8}
                  >
                    <Ionicons name="map-outline" size={28} color={colors.text} />
                  </Pressable>
                </Link>
              </View>
            </View>
            <AppText variant="subtitle">{t('home.recommendedEvents')}</AppText>
            <AppText variant="muted">
              {t('common.placeholder')} · {t('common.plannedPhase', { phase: 4 })}
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <AppText>{t('home.eventTile', { number: item })}</AppText>
          </View>
        )}
      />
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
  header: {
    gap: 4,
    marginBottom: 4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  topBarSide: {
    flex: 1,
  },
  topBarRight: {
    alignItems: 'flex-end',
  },
  gridRow: {
    gap: 12,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'flex-end',
  },
});
