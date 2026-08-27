/**
 * Small, dependency-free fuzzy matching helpers.
 *
 * Used to suggest a close resource type when a user navigates to an unknown one
 * (see `ResourceList` / `FailWhale`), and to match abbreviations against
 * resource names in the nav search (see `NavActionBar`).
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

/** How well a query matched some text. Lower is better on every field. */
export interface DisjointMatch {
  /** Runs the query had to be split into. 1 is a plain substring match. */
  runs: number;
  /** Runs that start mid-word rather than on a word boundary. */
  strays: number;
  /** Characters from the start of the first run to the end of the last. */
  span: number;
  /** Where the first run starts, so an earlier match outranks a later one. */
  index: number;
}

const isAlphaNumeric = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9');

/**
 * Whether `index` starts a word in `text`: the beginning, something after a
 * separator (`Cloud Credentials`, `apps.deployment`), or a camel hump
 * (`NetworkPolicies`). Wants the original casing, not a lowercased copy.
 */
function startsWord(text: string, index: number): boolean {
  if (index === 0) {
    return true;
  }

  const prev = text[index - 1];

  return !isAlphaNumeric(prev) || (prev === prev.toLowerCase() && text[index] !== text[index].toLowerCase());
}

/**
 * Match `query` against `text` by splitting it into as few contiguous runs as
 * possible, each found in order and without overlapping, so an abbreviation
 * finds the name it abbreviates: `netpol` matches `NetworkPolicies`, `cm`
 * matches `ConfigMaps`, `ns` matches `Namespaces`.
 *
 * Each run is taken as long as it can be, which keeps the obvious reading of a
 * query (`pol` in `Pod Policies` is one run at `Policies`, not `p` + `ol`) and
 * keeps a plain substring match a single run, ranked above any split.
 *
 * @param text - The text to search, in its original casing.
 * @param query - What to look for, already lowercased and trimmed.
 * @returns How the query matched, or `null` if it doesn't.
 */
export function disjointMatch(text: string, query: string): DisjointMatch | null {
  if (!query) {
    return null;
  }

  const haystack = text.toLowerCase();
  // Lowercasing can change a string's length (a Turkish dotted I becomes two
  // code units), leaving indexes into `haystack` meaningless in `text`. Fall
  // back to the lowercased copy when it does, losing only the camel humps.
  const cased = haystack.length === text.length ? text : haystack;
  let runs = 0;
  let strays = 0;
  let index = -1;
  let from = 0;
  let matched = 0;

  while (matched < query.length) {
    let at = haystack.indexOf(query[matched], from);
    let bestAt = -1;
    let bestLen = 0;

    // The longest run wins; among equals the earliest, so the match sits as far
    // left as it can. Stops as soon as a run swallows the rest of the query.
    while (at >= 0 && bestLen < query.length - matched) {
      let len = 1;

      while (matched + len < query.length && haystack[at + len] === query[matched + len]) {
        len++;
      }

      if (len > bestLen) {
        bestAt = at;
        bestLen = len;
      }

      at = haystack.indexOf(query[matched], at + 1);
    }

    if (bestAt < 0) {
      return null;
    }

    if (index < 0) {
      index = bestAt;
    }

    if (!startsWord(cased, bestAt)) {
      strays++;
    }

    runs++;
    matched += bestLen;
    from = bestAt + bestLen;
  }

  return {
    runs, strays, span: from - index, index
  };
}

/**
 * What a match cost: one per run, one more for each run starting mid-word, and
 * one back if it starts on the first character.
 *
 * So `cm` costs the same against `ConfigMaps` (two runs, both starting a word)
 * as against the `acme` in `acme.cert-manager.io.challenge` (one run, buried),
 * and the tie falls to whichever strayed less. The refund is what picks
 * `Namespaces` out for `ns` over the `ns` inside `DaemonSets`: sharing a first
 * letter is the strongest hint you meant it. Capping the refund at one run is
 * what stops a scattered match riding its initial past a clean one.
 */
const cost = (match: DisjointMatch) => match.runs + match.strays - (match.index === 0 ? 1 : 0);

/**
 * Order two matches best-first: cheapest, then whichever starts earliest, then
 * fewest mid-word runs, then tightest. Returns 0 when they are
 * indistinguishable, leaving the caller to break the tie.
 */
export function compareDisjointMatches(a: DisjointMatch, b: DisjointMatch): number {
  return cost(a) - cost(b) || a.index - b.index || a.strays - b.strays || a.span - b.span;
}
