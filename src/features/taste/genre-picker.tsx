import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type Genre, GENRES, MAX_TASTE_GENRES, MIN_TASTE_GENRES } from '@shared/contracts/genres';
import { AppText } from '@/components/app-text';
import { Chip } from '@/components/chip';
import { useAppTheme } from '@/theme';

const TOP_GENRE_COUNT = 3;

type GenrePickerProps = {
  /** The chosen genres in order of preference: the favourite first (D-005). */
  value: readonly Genre[];
  onChange: (genres: Genre[]) => void;
};

/**
 * D-001 + D-005: 3–10 genres in order of preference. Tapping adds a genre to the end of the order,
 * tapping it again removes it; the order is shown from "favourite" to "simply liked".
 */
export function GenrePicker({ value, onChange }: GenrePickerProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const isFull = value.length >= MAX_TASTE_GENRES;

  function toggle(genre: Genre) {
    onChange(value.includes(genre) ? value.filter((g) => g !== genre) : [...value, genre]);
  }

  return (
    <View style={styles.root}>
      <AppText>{t('taste.intro', { min: MIN_TASTE_GENRES, max: MAX_TASTE_GENRES })}</AppText>

      <View style={styles.grid}>
        {GENRES.map((genre) => {
          const rank = value.indexOf(genre) + 1;
          const label = t(`genres.${genre}`);
          return (
            <Chip
              key={genre}
              label={label}
              selected={rank > 0}
              badge={rank > 0 ? rank : undefined}
              disabled={rank === 0 && isFull}
              accessibilityLabel={rank > 0 ? t('taste.rankedGenre', { genre: label, rank }) : label}
              onPress={() => toggle(genre)}
            />
          );
        })}
      </View>
      <AppText variant="muted">
        {t('taste.count', { count: value.length, max: MAX_TASTE_GENRES })}
      </AppText>

      <View style={[styles.order, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <AppText variant="subtitle">{t('taste.orderTitle')}</AppText>
        {value.length === 0 ? (
          <AppText variant="muted">{t('taste.emptyOrder')}</AppText>
        ) : (
          value.map((genre, index) => {
            const isTop = index < TOP_GENRE_COUNT;
            const isFirst = index === 0;
            const isLast = index === value.length - 1 && value.length > 1;
            return (
              <View key={genre} style={styles.orderRow}>
                <AppText style={[styles.rank, { color: isTop ? colors.accent : colors.textMuted }]}>
                  {index + 1}.
                </AppText>
                <AppText style={styles.orderLabel}>{t(`genres.${genre}`)}</AppText>
                {isFirst ? <AppText variant="muted">{t('taste.mostFavourite')}</AppText> : null}
                {isLast ? <AppText variant="muted">{t('taste.justLiked')}</AppText> : null}
                {isTop ? (
                  <AppText variant="muted" style={{ color: colors.accent }}>
                    {t('taste.top3')}
                  </AppText>
                ) : null}
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  order: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rank: {
    width: 28,
    fontWeight: '700',
  },
  orderLabel: {
    flex: 1,
  },
});
