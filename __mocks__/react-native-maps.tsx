// Jest stand-in for the native map: plain views, and markers that can be pressed by their label.
import { forwardRef, type ReactNode, useImperativeHandle } from 'react';
import { Pressable, View, type ViewProps } from 'react-native';

const MapView = forwardRef<unknown, ViewProps>(function MapView(props, ref) {
  useImperativeHandle(ref, () => ({ animateToRegion: jest.fn() }));
  return <View testID="map-view" {...props} />;
});

type MarkerProps = { children?: ReactNode; onPress?: () => void; accessibilityLabel?: string };

export function Marker({ children, onPress, accessibilityLabel }: MarkerProps) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress}>
      {children}
    </Pressable>
  );
}

/** Tests read its `center` and `radius` props. */
export function Circle(props: Record<string, unknown>) {
  return <View testID="map-circle" {...props} />;
}

export default MapView;
