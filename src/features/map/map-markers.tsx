import { memo, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { useAppTheme } from '@/theme';

/**
 * Android draws a custom marker view into a bitmap; tracking its changes all the time is slow,
 * never tracking can leave it blank. So it is tracked briefly after each change.
 */
function useTracksViewChanges(appearance: string): boolean {
  const [drawn, setDrawn] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setDrawn(appearance), 500);
    return () => clearTimeout(timer);
  }, [appearance]);
  return drawn !== appearance;
}

type EventMarkerProps = {
  id: string;
  lat: number;
  lng: number;
  /** F5: recommended events have their own colour. */
  recommended: boolean;
  label: string;
  onPress: (id: string) => void;
};

export const EventMarker = memo(function EventMarker({
  id,
  lat,
  lng,
  recommended,
  label,
  onPress,
}: EventMarkerProps) {
  const { colors } = useAppTheme();
  const color = recommended ? colors.accent : colors.textMuted;
  const tracksViewChanges = useTracksViewChanges(color);

  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={recommended ? 2 : 1}
      tracksViewChanges={tracksViewChanges}
      onPress={() => onPress(id)}
      accessibilityLabel={label}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
    </Marker>
  );
});

type ClusterMarkerProps = {
  id: number;
  lat: number;
  lng: number;
  count: number;
  recommended: boolean;
  label: string;
  onPress: (cluster: { id: number; lat: number; lng: number }) => void;
};

export const ClusterMarker = memo(function ClusterMarker({
  id,
  lat,
  lng,
  count,
  recommended,
  label,
  onPress,
}: ClusterMarkerProps) {
  const { colors } = useAppTheme();
  const color = recommended ? colors.accent : colors.textMuted;
  const size = 30 + Math.min(count, 30) * 0.5;
  const tracksViewChanges = useTracksViewChanges(`${color}-${count}`);

  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={recommended ? 4 : 3}
      tracksViewChanges={tracksViewChanges}
      onPress={() => onPress({ id, lat, lng })}
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.cluster,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        ]}
      >
        <Text style={[styles.count, { color: colors.onAccent }]}>{count}</Text>
      </View>
    </Marker>
  );
});

const styles = StyleSheet.create({
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cluster: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  count: {
    fontSize: 13,
    fontWeight: '700',
  },
});
