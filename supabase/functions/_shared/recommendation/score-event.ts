// Event recommendation (F1, PHASE0.md 7.5): pure and deterministic. The API scores the events,
// the app decides with the user's search radius (Q6) which ones are recommended.
import type { Genre } from '../contracts/genres.ts';
import type { GenreScore } from '../taste/compute-taste.ts';

/** F1: every weight and threshold of the recommendation lives here. */
export const RECOMMENDATION_CONFIG = {
  /** D-001/7: a favourite artist on the line-up recommends the event even without a genre match. */
  favouriteArtistBonus: 1,
  /** An event is recommended when its score is above this (any top 3 genre or artist match). */
  scoreThreshold: 0,
} as const;

export type RecommendationTaste = {
  topGenres: readonly Genre[];
  genreScores: readonly GenreScore[];
  /** Normalised with normalizeArtistName; empty until artists can be chosen (D-005). */
  favouriteArtists: readonly string[];
};

/** Lowercase, no accents or punctuation: the same artist from different sources still matches. */
export function normalizeArtistName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * The sum of the user's scores for the event's genres that are in their top 3, plus the bonus
 * for a favourite artist.
 */
export function scoreEvent(
  event: { genres: readonly string[]; performers: readonly string[] },
  taste: RecommendationTaste,
): number {
  const topScores = new Map(
    taste.genreScores
      .filter(({ genre }) => taste.topGenres.includes(genre))
      .map(({ genre, score }) => [genre as string, score]),
  );
  const genreScore = [...new Set(event.genres)].reduce(
    (sum, genre) => sum + (topScores.get(genre) ?? 0),
    0,
  );
  const favourites = new Set(taste.favouriteArtists);
  const hasFavouriteArtist = event.performers.some((performer) =>
    favourites.has(normalizeArtistName(performer)),
  );
  const score = genreScore + (hasFavouriteArtist ? RECOMMENDATION_CONFIG.favouriteArtistBonus : 0);
  // Rounded, so the order of an event's genres cannot change its score in the last digit.
  return Math.round(score * 1e6) / 1e6;
}

/** F1 + Q6: recommended = matches the taste and is within the user's search radius. */
export function isRecommended(
  event: { score: number; distanceKm: number },
  radiusKm: number,
): boolean {
  return event.score > RECOMMENDATION_CONFIG.scoreThreshold && event.distanceKm <= radiusKm;
}

type Rankable = { score: number; startsAt: string; id: string };

/** Q7: the best match first; on a tie the earlier start, then the id, so the order is stable. */
export function compareRecommended(a: Rankable, b: Rankable): number {
  return (
    b.score - a.score ||
    Date.parse(a.startsAt) - Date.parse(b.startsAt) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}
