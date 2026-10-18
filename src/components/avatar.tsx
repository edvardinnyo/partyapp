import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme';

type AvatarProps = {
  uri: string | null | undefined;
  size: number;
};

/** Profile picture; without one it shows the neutral silhouette (D-004). */
export function Avatar({ uri, size }: AvatarProps) {
  const { colors } = useAppTheme();
  const shape = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View
      style={[styles.frame, shape, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      {uri ? (
        <Image source={{ uri }} style={shape} contentFit="cover" />
      ) : (
        <Ionicons name="person" size={size / 2} color={colors.textMuted} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
