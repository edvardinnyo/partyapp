import { computeTaste, manualGenreSignals, rankWeight } from './compute-taste.ts';

describe('rankWeight', () => {
  it('goes linearly from the full weight to half of it', () => {
    expect(rankWeight(0, 5)).toBe(1);
    expect(rankWeight(2, 5)).toBeCloseTo(0.75);
    expect(rankWeight(4, 5)).toBeCloseTo(0.5);
    expect(rankWeight(0, 1)).toBe(1);
  });
});

describe('computeTaste', () => {
  it('ranks the manual choice by the user’s order (D-005)', () => {
    const result = computeTaste({
      manual: manualGenreSignals(['rock', 'techno', 'jazz', 'pop', 'house']),
    });

    expect(result.topGenres).toEqual(['rock', 'techno', 'jazz']);
    expect(result.scores.map(({ genre }) => genre)).toEqual([
      'rock',
      'techno',
      'jazz',
      'pop',
      'house',
    ]);
  });

  it('normalises the scores to add up to 1', () => {
    const { scores } = computeTaste({ manual: manualGenreSignals(['rock', 'techno', 'jazz']) });

    expect(scores.reduce((sum, { score }) => sum + score, 0)).toBeCloseTo(1);
  });

  it('is deterministic and breaks ties by the genre list order', () => {
    const tied = [
      { genres: ['pop'] as const, weight: 1 },
      { genres: ['techno'] as const, weight: 1 },
    ];

    expect(computeTaste({ manual: tied }).topGenres).toEqual(['techno', 'pop']);
    expect(computeTaste({ manual: [...tied].reverse() }).topGenres).toEqual(['techno', 'pop']);
  });

  it('splits a signal with several genres between them', () => {
    const { scores } = computeTaste({
      manual: [
        { genres: ['techno', 'house'], weight: 1 },
        { genres: ['rock'], weight: 1 },
      ],
    });

    expect(scores).toEqual([
      { genre: 'rock', score: 0.5 },
      { genre: 'techno', score: 0.25 },
      { genre: 'house', score: 0.25 },
    ]);
  });

  it('blends manual and streaming half and half when both exist (D-001)', () => {
    const { scores } = computeTaste({
      manual: [{ genres: ['jazz'], weight: 1 }],
      streaming: [{ genres: ['techno'], weight: 3 }],
    });

    expect(scores).toEqual([
      { genre: 'techno', score: 0.5 },
      { genre: 'jazz', score: 0.5 },
    ]);
  });

  it('returns an empty profile without any signal', () => {
    expect(computeTaste({})).toEqual({ topGenres: [], scores: [] });
  });
});
