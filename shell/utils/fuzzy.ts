/**
 * Small, dependency-free fuzzy matching helpers.
 *
 * Used to suggest a close resource type when a user navigates to an unknown one
 * (see `ResourceList` / `FailWhale`).
 */

/**
 * Classic iterative Levenshtein (edit) distance - two-row, O(n*m).
 *
 * Cheap enough to run once over the schema list on an error path.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  if (!a.length) {
    return b.length;
  }
  if (!b.length) {
    return a.length;
  }

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 0; i < a.length; i++) {
    const curr = [i + 1];

    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;

      curr[j + 1] = Math.min(curr[j] + 1, prev[j + 1] + 1, prev[j] + cost);
    }
    prev = curr;
  }

  return prev[b.length];
}

/**
 * Rank `candidates` by closeness to `input`, returning up to `limit` closest.
 *
 * A substring match (typo in the tail, partial type) is high-signal and forced to the top;
 * otherwise entries are ranked by edit distance and filtered to a length-scaled tolerance.
 */
export function nearestMatches(input: string, candidates: string[], limit = 3): string[] {
  if (!input) {
    return [];
  }

  const needle = input.toLowerCase();
  const tolerance = Math.max(2, Math.floor(needle.length / 4));

  return candidates
    .map((c) => {
      const hay = c.toLowerCase();
      const substring = hay.includes(needle) || needle.includes(hay);
      const distance = substring ? 0 : levenshtein(needle, hay);

      return { candidate: c, distance };
    })
    .filter((m) => m.distance <= tolerance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit)
    .map((m) => m.candidate);
}
