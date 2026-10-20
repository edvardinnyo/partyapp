import { computeTaste, manualGenreSignals } from '../taste/compute-taste.ts';
import {
  compareRecommended,
  isRecommended,
  normalizeArtistName,
  type RecommendationTaste,
  scoreEvent,
} from './score-event.ts';

function tasteOf(
  genres: Parameters<typeof manualGenreSignals>[0],
  favouriteArtists: string[] = [],
) {
  const { topGenres, scores } = computeTaste({ manual: manualGenreSignals(genres) });
  const taste: RecommendationTaste = { topGenres, genreScores: scores, favouriteArtists };
  return taste;
}

const event = (genres: string[], performers: string[] = []) => ({ genres, performers });

describe('scoreEvent (F1)', () => {
  const taste = tasteOf(['techno', 'house', 'drum-and-bass', 'pop', 'rock']);

  it('adds up the scores of the event’s genres that are in the user’s top 3', () => {
    const [techno, house] = taste.genreScores;

    expect(scoreEvent(event(['techno']), taste)).toBeCloseTo(techno!.score);
    expect(scoreEvent(event(['techno', 'house']), taste)).toBeCloseTo(techno!.score + house!.score);
  });

  it('ignores genres outside the top 3, even ones the user chose', () => {
    expect(scoreEvent(event(['pop', 'rock']), taste)).toBe(0);
    expect(scoreEvent(event(['jazz']), taste)).toBe(0);
  });

  it('ranks the favourite genre above the third one', () => {
    expect(scoreEvent(event(['techno']), taste)).toBeGreaterThan(
      scoreEvent(event(['drum-and-bass']), taste),
    );
  });

  it('counts a genre listed twice only once and does not depend on the genre order', () => {
    expect(scoreEvent(event(['techno', 'techno']), taste)).toBe(
      scoreEvent(event(['techno']), taste),
    );
    expect(scoreEvent(event(['house', 'techno', 'drum-and-bass']), taste)).toBe(
      scoreEvent(event(['drum-and-bass', 'techno', 'house']), taste),
    );
  });

  it('copes with unknown genres and an empty taste', () => {
    expect(scoreEvent(event(['polka', 'techno']), taste)).toBe(
      scoreEvent(event(['techno']), taste),
    );
    expect(scoreEvent(event(['techno']), tasteOf([]))).toBe(0);
  });

  it('gives a favourite artist a bonus, even without a genre match (D-001/7)', () => {
    const withArtist = tasteOf(['techno', 'house', 'pop'], [normalizeArtistName('Ákos')]);

    expect(scoreEvent(event(['rock'], ['ÁKOS']), withArtist)).toBe(1);
    expect(scoreEvent(event(['rock'], ['Someone else']), withArtist)).toBe(0);
  });
});

describe('normalizeArtistName', () => {
  it('ignores case, accents and punctuation', () => {
    expect(normalizeArtistName('  Ákos & The Band! ')).toBe('akos the band');
    expect(normalizeArtistName('Quimby')).toBe(normalizeArtistName('QUIMBY'));
  });
});

describe('isRecommended (F1, Q6)', () => {
  it('needs a taste match within the search radius', () => {
    expect(isRecommended({ score: 0.3, distanceKm: 4 }, 25)).toBe(true);
    expect(isRecommended({ score: 0.3, distanceKm: 25 }, 25)).toBe(true);
    expect(isRecommended({ score: 0.3, distanceKm: 25.1 }, 25)).toBe(false);
    expect(isRecommended({ score: 0, distanceKm: 1 }, 25)).toBe(false);
  });
});

describe('compareRecommended (Q7)', () => {
  it('orders by match, then by the earlier start, then by id', () => {
    const events = [
      { id: 'c', score: 0.2, startsAt: '2026-10-24T20:00:00.000Z' },
      { id: 'b', score: 0.5, startsAt: '2026-10-25T20:00:00.000Z' },
      { id: 'a', score: 0.2, startsAt: '2026-10-24T20:00:00.000Z' },
      { id: 'd', score: 0.2, startsAt: '2026-10-23T20:00:00.000Z' },
    ];

    expect([...events].sort(compareRecommended).map(({ id }) => id)).toEqual(['b', 'd', 'a', 'c']);
  });
});
