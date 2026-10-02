export type MatchRank = 0 | 1 | 2;

/** Ranks how well `haystack` matches `query` (0 = exact, 1 = prefix, 2 =
 * contains), or undefined when it doesn't match at all. Both are compared
 * case-insensitively. */
export function matchRank(
  haystack: string,
  query: string,
): MatchRank | undefined {
  if (!haystack) return undefined;
  const h = haystack.toLowerCase();
  const q = query.toLowerCase();
  if (h === q) return 0;
  if (h.startsWith(q)) return 1;
  if (h.includes(q)) return 2;
  return undefined;
}

/** Best (lowest) rank across several candidate strings, or undefined if none
 * of them match. */
export function bestMatchRank(
  haystacks: readonly string[],
  query: string,
): MatchRank | undefined {
  let best: MatchRank | undefined;
  for (const haystack of haystacks) {
    const rank = matchRank(haystack, query);
    if (rank !== undefined && (best === undefined || rank < best)) {
      best = rank;
    }
  }
  return best;
}
