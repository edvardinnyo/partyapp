import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { isGenre } from '@shared/contracts/genres';
import { eventStatus } from '@shared/events/lifecycle';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { FormMessage } from '@/components/form-message';
import { Screen } from '@/components/screen';
import { formatEventTimeRange } from '@/features/events/format';
import { api, ApiError } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { useNow } from '@/lib/use-now';
import { useAppTheme } from '@/theme';

function InfoRow({
  icon,
  children,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  children: ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={20} color={colors.textMuted} style={styles.infoIcon} />
      <View style={styles.infoText}>{children}</View>
    </View>
  );
}

// Q8 + D-007/4: venue, time, genres and performers, "Show on map" and "Buy tickets".
// The navbar stays visible (F7): the page belongs to the Home tab.
export default function EventScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useQuery({ queryKey: queryKeys.event(id), queryFn: () => api.getEvent(id) });
  const now = useNow(30_000);

  if (event.isPending) {
    return (
      <Screen>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (event.isError) {
    const notFound = event.error instanceof ApiError && event.error.code === 'not_found';
    return (
      <Screen>
        <FormMessage message={notFound ? t('event.notFound') : t('common.genericError')} />
        {notFound ? null : (
          <AppButton
            label={t('common.retry')}
            variant="secondary"
            onPress={() => void event.refetch()}
          />
        )}
      </Screen>
    );
  }

  const { title, venue, genres, performers } = event.data;
  const startsAt = new Date(event.data.startsAt);
  const endsAt = new Date(event.data.endsAt);
  const isLive = eventStatus(startsAt, endsAt, new Date(now)) === 'live';

  return (
    <Screen>
      <AppText variant="title">{title}</AppText>
      {isLive ? (
        <View style={[styles.liveBadge, { backgroundColor: colors.accent }]}>
          <AppText style={[styles.liveText, { color: colors.onAccent }]}>
            {t('events.live')}
          </AppText>
        </View>
      ) : null}

      <InfoRow icon="time-outline">
        <AppText>{formatEventTimeRange(startsAt, endsAt, t, i18n.language)}</AppText>
      </InfoRow>
      <InfoRow icon="location-outline">
        <AppText>{venue.name}</AppText>
        <AppText variant="muted">{venue.address}</AppText>
      </InfoRow>

      <AppText variant="subtitle">{t('event.genres')}</AppText>
      <View style={styles.tags}>
        {genres.filter(isGenre).map((genre) => (
          <View
            key={genre}
            style={[styles.tag, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <AppText>{t(`genres.${genre}`)}</AppText>
          </View>
        ))}
      </View>

      {performers.length > 0 ? (
        <>
          <AppText variant="subtitle">{t('event.performers')}</AppText>
          {performers.map((performer) => (
            <AppText key={performer}>{performer}</AppText>
          ))}
        </>
      ) : null}

      <View style={styles.actions}>
        {/* D-007/4: sold through ticketing partners later; until then it only says so. */}
        <AppButton
          label={t('event.buyTicket')}
          onPress={() => Alert.alert(t('event.ticketsSoonTitle'), t('event.ticketsSoonMessage'))}
        />
        <AppButton
          label={t('event.openOnMap')}
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: '/map',
              params: { lat: String(venue.lat), lng: String(venue.lng) },
            })
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  liveBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  liveText: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    gap: 2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actions: {
    gap: 12,
    marginTop: 12,
  },
});
