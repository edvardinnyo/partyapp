import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/app-text';
import { useAppTheme } from '@/theme';

import { formatEventStart } from './format';
import type { NearbyEvent } from './use-nearby-events';

type EventTileProps = {
  event: NearbyEvent;
  now: number;
};

/** F5: one recommended event in the Home grid; Q8: tapping it opens the event page. */
export function EventTile({ event, now }: EventTileProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const isLive = event.status === 'live';
  const when = isLive
    ? t('events.live')
    : formatEventStart(new Date(event.startsAt), new Date(now), t, i18n.language);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${event.venue.name}, ${when}`}
      onPress={() => router.push(`/event/${event.id}`)}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: colors.surface,
          borderColor: isLive ? colors.accent : colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <AppText
        variant="muted"
        numberOfLines={1}
        style={isLive ? [styles.live, { color: colors.accent }] : undefined}
      >
        {when}
      </AppText>
      <AppText style={styles.title} numberOfLines={3}>
        {event.title}
      </AppText>
      <AppText variant="muted" numberOfLines={1}>
        {event.venue.name}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    justifyContent: 'flex-end',
  },
  live: {
    fontWeight: '700',
  },
  title: {
    fontWeight: '600',
  },
});
