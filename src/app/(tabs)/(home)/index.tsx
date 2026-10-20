import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { compareRecommended } from '@shared/recommendation/score-event';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { FormMessage } from '@/components/form-message';
import { AdBanner } from '@/features/events/ad-banner';
import { EventTile } from '@/features/events/event-tile';
import { buildHomeGridRows, HOME_GRID } from '@/features/events/home-grid';
import { useNearbyEvents } from '@/features/events/use-nearby-events';
import { useMyProfile } from '@/features/profile/use-my-profile';
import { useNow } from '@/lib/use-now';
import { useAppTheme } from '@/theme';

// F5: profile picture on top, map icon in the top section, recommended events in a grid below.
export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const me = useMyProfile();
  const nearby = useNearbyEvents();
  const now = useNow(30_000);
  const [refreshing, setRefreshing] = useState(false);

  // Q7: the recommended live and upcoming events, best match first, then the earlier start.
  const rows = useMemo(
    () =>
      buildHomeGridRows(
        nearby.events.filter((event) => event.recommended).sort(compareRecommended),
      ),
    [nearby.events],
  );

  async function refresh() {
    // Nothing to fetch until we know where distances are measured from.
    if (!nearby.origin) {
      return;
    }
    setRefreshing(true);
    try {
      await nearby.refetch();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} />
        }
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
            {nearby.isApproximate ? (
              <AppText variant="muted">{t('location.approximate')}</AppText>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          nearby.isError ? (
            <View style={styles.status}>
              <FormMessage message={t('common.genericError')} />
              <AppButton
                label={t('common.retry')}
                variant="secondary"
                onPress={() => void nearby.refetch()}
              />
            </View>
          ) : !nearby.isReady ? (
            <ActivityIndicator style={styles.status} color={colors.accent} />
          ) : (
            <AppText variant="muted" style={styles.status}>
              {t('home.noRecommendations')}
            </AppText>
          )
        }
        renderItem={({ item }) =>
          item.kind === 'ad' ? (
            <AdBanner />
          ) : (
            <View style={styles.gridRow}>
              {item.events.map((event) => (
                <EventTile key={event.id} event={event} now={now} />
              ))}
              {item.events.length < HOME_GRID.columns ? <View style={styles.gridSpacer} /> : null}
            </View>
          )
        }
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
    flexDirection: 'row',
    gap: 12,
  },
  gridSpacer: {
    flex: 1,
  },
  status: {
    marginTop: 24,
    gap: 12,
  },
});
