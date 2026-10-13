import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/app-text';
import { ListRow } from '@/components/list-row';
import { Placeholder } from '@/components/placeholder';
import { Screen } from '@/components/screen';
import { useAppTheme } from '@/theme';

// F4: search field on top, the conversations entry next to it, posts of followed people below.
export default function SearchScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [query, setQuery] = useState('');
  const isSearching = query.trim().length > 0;

  return (
    <Screen edges={['top']}>
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.inputPlaceholder')}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={t('search.inputPlaceholder')}
          autoCorrect={false}
          style={[
            styles.input,
            { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        />
        <Link href="/search/conversations" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('search.conversations')}
            hitSlop={8}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={26} color={colors.text} />
          </Pressable>
        </Link>
      </View>
      {isSearching ? (
        <>
          <AppText variant="subtitle">{t('search.results')}</AppText>
          <ListRow label={t('search.sampleUser')} href="/profile/sample-user" />
        </>
      ) : (
        <>
          <AppText variant="subtitle">{t('search.feedTitle')}</AppText>
          <Placeholder label={t('search.feedPlaceholder')} phase={7} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
});
