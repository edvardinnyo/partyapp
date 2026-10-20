import Slider from '@react-native-community/slider';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { type Region } from 'react-native-maps';
import { useTranslation } from 'react-i18next';

import { MAX_RADIUS_KM, MIN_RADIUS_KM } from '@shared/contracts/settings';
import { isRecommended } from '@shared/recommendation/score-event';
import { AppText } from '@/components/app-text';
import { FormMessage } from '@/components/form-message';
import { useNearbyEvents } from '@/features/events/use-nearby-events';
import { useLocationStore } from '@/features/location/location-store';
import { LAUNCH_CITY_CENTER, type Position } from '@/features/location/position';
import {
  clusterExpansionRegion,
  createClusterIndex,
  mapItems,
  regionAround,
} from '@/features/map/clustering';
import { ClusterMarker, EventMarker } from '@/features/map/map-markers';
import { useSearchRadius } from '@/features/settings/use-search-radius';
import { useAppTheme } from '@/theme';

/** "Show on map" from an event page zooms in this close to the venue. */
const FOCUS_RADIUS_KM = 0.5;
/** Space between the floating cards and the screen edges. */
const CARD_MARGIN = 12;

function parseFocus(lat?: string, lng?: string): Position | null {
  const position = { lat: Number(lat), lng: Number(lng) };
  return lat && lng && Math.abs(position.lat) <= 90 && Math.abs(position.lng) <= 180
    ? position
    : null;
}

// F5: the map opens at the user's position and shows every event, the recommended ones in their
// own colour (P-01: in numbered clusters when close). Q6: the slider sets the search radius.
export default function MapScreen() {
  const { t } = useTranslation();
  const { colors, scheme } = useAppTheme();
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();
  const focus = useMemo(() => parseFocus(params.lat, params.lng), [params.lat, params.lng]);
  const locationStatus = useLocationStore((state) => state.status);
  const nearby = useNearbyEvents();
  const radius = useSearchRadius();
  const mapRef = useRef<MapView>(null);

  // The slider's value while it moves and until it is saved; the markers follow it right away.
  const [movedRadiusKm, setMovedRadiusKm] = useState<number | null>(null);
  const sliding = useRef(false);
  const draftRadiusKm = movedRadiusKm ?? radius.radiusKm;

  // The map's own logo and legal link must stay visible (Apple and Google terms), so the map is
  // padded by the cards that float over it.
  const [noticeHeight, setNoticeHeight] = useState(0);
  const [panelHeight, setPanelHeight] = useState(0);

  const [region, setRegion] = useState<Region>(() =>
    focus
      ? regionAround(focus, FOCUS_RADIUS_KM)
      : regionAround(nearby.origin ?? LAUNCH_CITY_CENTER, radius.radiusKm),
  );

  // F5: once the position is known, the map moves there (unless it shows a chosen event).
  const centred = useRef(focus !== null || nearby.origin !== null);
  useEffect(() => {
    if (!centred.current && nearby.origin) {
      centred.current = true;
      mapRef.current?.animateToRegion(regionAround(nearby.origin, radius.radiusKm), 400);
    }
  }, [nearby.origin, radius.radiusKm]);

  const eventsById = useMemo(
    () => new Map(nearby.events.map((event) => [event.id, event])),
    [nearby.events],
  );
  const clusterIndex = useMemo(
    () =>
      createClusterIndex(
        nearby.events.map((event) => ({
          id: event.id,
          lat: event.venue.lat,
          lng: event.venue.lng,
          recommended: isRecommended(event, draftRadiusKm),
        })),
      ),
    [nearby.events, draftRadiusKm],
  );
  const items = useMemo(() => mapItems(clusterIndex, region), [clusterIndex, region]);

  const openEvent = useCallback((id: string) => router.push(`/event/${id}`), []);
  const zoomInto = useCallback(
    (cluster: { id: number; lat: number; lng: number }) =>
      mapRef.current?.animateToRegion(clusterExpansionRegion(clusterIndex, cluster, region), 300),
    [clusterIndex, region],
  );

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        mapPadding={{
          top: nearby.isApproximate ? noticeHeight + CARD_MARGIN : 0,
          right: 0,
          bottom: panelHeight + CARD_MARGIN,
          left: 0,
        }}
        showsUserLocation={locationStatus === 'granted'}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        userInterfaceStyle={scheme}
      >
        {items.map((item) => {
          if (item.kind === 'cluster') {
            return (
              <ClusterMarker
                key={`cluster-${item.id}`}
                id={item.id}
                lat={item.lat}
                lng={item.lng}
                count={item.count}
                recommended={item.recommended}
                label={t('map.cluster', { count: item.count })}
                onPress={zoomInto}
              />
            );
          }
          const event = eventsById.get(item.id);
          const details = { title: event?.title ?? '', venue: event?.venue.name ?? '' };
          return (
            <EventMarker
              key={item.id}
              id={item.id}
              lat={item.lat}
              lng={item.lng}
              recommended={item.recommended}
              label={t(item.recommended ? 'map.recommendedMarker' : 'map.eventMarker', details)}
              onPress={openEvent}
            />
          );
        })}
      </MapView>

      {nearby.isApproximate ? (
        <View
          onLayout={(layoutEvent) => setNoticeHeight(layoutEvent.nativeEvent.layout.height)}
          style={[styles.card, styles.notice, { backgroundColor: colors.background }]}
        >
          <AppText variant="muted">{t('location.approximate')}</AppText>
        </View>
      ) : null}

      <View
        onLayout={(layoutEvent) => setPanelHeight(layoutEvent.nativeEvent.layout.height)}
        style={[styles.card, styles.panel, { backgroundColor: colors.background }]}
      >
        <AppText>{t('map.radius', { km: draftRadiusKm })}</AppText>
        <Slider
          accessibilityLabel={t('map.radiusLabel')}
          minimumValue={MIN_RADIUS_KM}
          maximumValue={MAX_RADIUS_KM}
          step={1}
          value={radius.radiusKm}
          onSlidingStart={() => {
            sliding.current = true;
          }}
          onValueChange={(value) => setMovedRadiusKm(Math.round(value))}
          onSlidingComplete={(value) => {
            sliding.current = false;
            // Once saved (or reverted after an error), the saved value takes over again.
            radius.setRadiusKm(Math.round(value), () => {
              if (!sliding.current) {
                setMovedRadiusKm(null);
              }
            });
          }}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.accent}
        />
        <FormMessage message={radius.saveFailed ? t('map.saveFailed') : null} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    left: CARD_MARGIN,
    right: CARD_MARGIN,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  notice: {
    top: CARD_MARGIN,
  },
  panel: {
    bottom: CARD_MARGIN,
    gap: 4,
  },
});
