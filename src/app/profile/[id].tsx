import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { useAppTheme } from '@/theme';

/** Route id of the signed-in user's own profile. */
const OWN_PROFILE_ID = 'me';

const GENRE_PLACEHOLDERS = [1, 2, 3];

// F4: own and other profiles share one layout; only the Follow/Unfollow button differs.
// The profile picture's position is still open (Q18).
export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isOwnProfile = id === OWN_PROFILE_ID;
  const [isFollowing, setIsFollowing] = useState(false);

  const places = [t('profile.mostVisited'), t('profile.topRated'), t('profile.lastVisited')];

  return (
    <Screen edges={['bottom']}>
      <View style={styles.identity}>
        <View
          style={[styles.avatar, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="person" size={56} color={colors.textMuted} />
        </View>
        <View style={styles.genres}>
          {GENRE_PLACEHOLDERS.map((number) => (
            <View key={number} style={[styles.genre, { borderColor: colors.accent }]}>
              <AppText variant="muted">{t('profile.genre', { number })}</AppText>
            </View>
          ))}
        </View>
        <AppText variant="muted">{t('profile.neuronPlaceholder')}</AppText>
      </View>

      {places.map((label) => (
        <View
          key={label}
          style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <AppText variant="muted">{label}</AppText>
          <AppText>{t('common.emptyValue')}</AppText>
        </View>
      ))}

      <View style={styles.counts}>
        <AppText>
          {isFollowing ? 1 : 0} {t('profile.followers')}
        </AppText>
        <AppText>0 {t('profile.following')}</AppText>
      </View>

      {!isOwnProfile && (
        <AppButton
          label={isFollowing ? t('profile.unfollow') : t('profile.follow')}
          variant={isFollowing ? 'secondary' : 'primary'}
          onPress={() => setIsFollowing((current) => !current)}
        />
      )}

      <AppText variant="subtitle">{t('profile.posts')}</AppText>
      <Placeholder label={t('profile.postsPlaceholder')} phase={7} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genres: {
    flexDirection: 'row',
    gap: 8,
  },
  genre: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  field: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  counts: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
});
