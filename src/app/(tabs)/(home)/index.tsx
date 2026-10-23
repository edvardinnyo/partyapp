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

import { isPartnerProfile } from '@shared/contracts/profile';
import { MAX_RADIUS_KM } from '@shared/contracts/settings';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Avatar } from '@/components/avatar';
import { FormMessage } from '@/components/form-message';
import { AdBanner } from '@/features/events/ad-banner';
import { EventTile } from '@/features/events/event-tile';
import { buildHomeGridRows, HOME_GRID, selectHomeEvents } from '@/features/events/home-grid';
import { useNearbyEvents } from '@/features/events/use-nearby-events';
import { PartnerStatusCard } from '@/features/partners/partner-status-card';
import { useMyProfile } from '@/features/profile/use-my-profile';
import { useNow } from '@/lib/use-now';
import { useAppTheme } from '@/theme';

// F5: profile picture on top, map icon in the top section, recommended events in a grid below.
// D-008/8, D-008/11: a partner sees every event nearby (no taste) and the state of its application.
export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const me = useMyProfile();
  const profile = me.data?.profile;
  const forPartner = profile ? isPartnerProfile(profile) : false;
  const nearby = useNearbyEvents();
  const now = useNow(30_000);
  const [refreshing, setRefreshing] = useState(false);

  // Q7: the recommended live and upcoming events, best match first, then the earlier start.
  const rows = useMemo(
    () =>
      buildHomeGridRows(selectHomeEvents(nearby.events, { forPartner, radiusKm: nearby.radiusKm })),
    [nearby.events, nearby.radiusKm, forPartner],
  );

  // P-02: say that nothing is recommended, and suggest a larger distance while the slider allows.
  const nothingText = forPartner ? t('home.noNearbyEvents') : t('home.noRecommendations');
  const emptyText =
    nearby.radiusKm < MAX_RADIUS_KM ? `${nothingText} ${t('home.increaseRadius')}` : nothingText;

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
                  <Avatar uri={profile?.avatarUrl} size={72} />
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
            {profile?.partner ? <PartnerStatusCard partner={profile.partner} /> : null}
            <AppText variant="subtitle">
              {forPartner ? t('home.nearbyEvents') : t('home.recommendedEvents')}
            </AppText>
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
              {emptyText}
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
