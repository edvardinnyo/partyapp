// The taste algorithm (F1, PHASE0.md chapter 7): pure and deterministic, shared by the API and
// the tests. Every source (manual choice now; artists, songs and streaming later) turns into
// weighted signals; each source is normalised, the sources are blended, and the top genres win.
import { type Genre, GENRES } from '../contracts/genres.ts';
import { TASTE_CONFIG } from './config.ts';

export type TasteSource = 'manual' | 'streaming';

/** One piece of evidence, e.g. a chosen genre or an artist with its genres. */
export type TasteSignal = { genres: readonly Genre[]; weight: number };

export type GenreScore = { genre: Genre; score: number };

export type TasteResult = {
  /** The top genres, best first (F1: three). */
  topGenres: Genre[];
  /** Every genre with a score, best first; the scores add up to 1. */
  scores: GenreScore[];
};

/** Weight of the item at `index` in an ordered list of `count` items (first = 1). */
export function rankWeight(index: number, count: number): number {
  if (count <= 1) {
    return 1;
  }
  return 1 - (index / (count - 1)) * (1 - TASTE_CONFIG.rankDecayTo);
}

/** D-005: manually chosen genres, favourite first. */
export function manualGenreSignals(genres: readonly Genre[]): TasteSignal[] {
  return genres.map((genre, index) => ({
    genres: [genre],
    weight: TASTE_CONFIG.manualGenreWeight * rankWeight(index, genres.length),
  }));
}

/** Sums one source's signals; a signal with several genres splits its weight between them. */
function scoreSource(signals: readonly TasteSignal[]): Map<Genre, number> {
  const scores = new Map<Genre, number>();
  for (const signal of signals) {
    const genres = [...new Set(signal.genres)];
    for (const genre of genres) {
      scores.set(genre, (scores.get(genre) ?? 0) + signal.weight / genres.length);
    }
  }
  const total = [...scores.values()].reduce((sum, score) => sum + score, 0);
  if (total > 0) {
    for (const [genre, score] of scores) {
      scores.set(genre, score / total);
    }
  }
  return scores;
}

export function computeTaste(sources: Partial<Record<TasteSource, readonly TasteSignal[]>>) {
  const manual = scoreSource(sources.manual ?? []);
  const streaming = scoreSource(sources.streaming ?? []);
  const manualShare =
    manual.size > 0 && streaming.size > 0
      ? TASTE_CONFIG.manualShareWithStreaming
      : manual.size > 0
        ? 1
        : 0;

  const scores = GENRES.map((genre) => ({
    genre,
    score: (manual.get(genre) ?? 0) * manualShare + (streaming.get(genre) ?? 0) * (1 - manualShare),
  }))
    .filter(({ score }) => score > 0)
    // Higher score first; on a tie the genre list order decides, so the result is deterministic.
    .sort((a, b) => b.score - a.score || GENRES.indexOf(a.genre) - GENRES.indexOf(b.genre));

  const result: TasteResult = {
    topGenres: scores.slice(0, TASTE_CONFIG.topGenreCount).map(({ genre }) => genre),
    scores,
  };
  return result;
}
