// Jest stand-in for the native slider; tests fire `valueChange` and `slidingComplete` on it.
import { View } from 'react-native';

export default function Slider(props: Record<string, unknown>) {
  return <View accessibilityRole="adjustable" {...props} />;
}
