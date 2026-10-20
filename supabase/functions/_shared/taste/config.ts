/**
 * F1: every weight of the taste algorithm lives here (PHASE0.md, chapter 7).
 * Streaming weights (7.2) are added together with the streaming sync, which is postponed (D-005).
 */
export const TASTE_CONFIG = {
  /** A genre chosen by hand (7.3). */
  manualGenreWeight: 1.0,
  /**
   * In an ordered list the first item counts fully and the last one this share of it,
   * decreasing linearly in between (7.2); D-005: the manual choice is ordered by preference.
   */
  rankDecayTo: 0.5,
  /** D-001/5: the manual share when the streaming sync is also connected. */
  manualShareWithStreaming: 0.5,
  /** F1: the taste profile is the top 3 genres. */
  topGenreCount: 3,
} as const;
