import { levenshtein, nearestMatches } from '@shell/utils/fuzzy';

describe('fx: levenshtein', () => {
  it.each([
    ['identical strings', 'pod', 'pod', 0],
    ['empty vs empty', '', '', 0],
    ['empty vs non-empty', '', 'pod', 3],
    ['non-empty vs empty', 'pod', '', 3],
    ['single substitution', 'pod', 'pad', 1],
    ['single insertion', 'pod', 'pods', 1],
    ['single deletion', 'pods', 'pod', 1],
    ['transposition counts as two edits', 'pdo', 'pod', 2],
    ['completely different', 'abc', 'xyz', 3],
    ['case sensitive', 'Pod', 'pod', 1],
  ])('should return the edit distance for %s', (_label, a, b, expected) => {
    expect(levenshtein(a, b)).toStrictEqual(expected);
  });

  it('should be symmetric', () => {
    expect(levenshtein('kitten', 'sitting')).toStrictEqual(levenshtein('sitting', 'kitten'));
  });

  it('should compute the classic kitten/sitting distance', () => {
    expect(levenshtein('kitten', 'sitting')).toStrictEqual(3);
  });
});

describe('fx: nearestMatches', () => {
  const candidates = ['pod', 'service', 'secret', 'namespace', 'configmap', 'deployment'];

  it('should return an empty array for empty input', () => {
    expect(nearestMatches('', candidates)).toStrictEqual([]);
  });

  it('should return an empty array when there are no candidates', () => {
    expect(nearestMatches('pod', [])).toStrictEqual([]);
  });

  it('should return an exact match', () => {
    expect(nearestMatches('pod', candidates)).toStrictEqual(['pod']);
  });

  it('should match ignoring case', () => {
    expect(nearestMatches('POD', candidates)).toStrictEqual(['pod']);
  });

  it('should suggest the closest match for a small typo', () => {
    expect(nearestMatches('pdo', candidates, 1)).toStrictEqual(['pod']);
  });

  it('should treat a substring as a high-signal match', () => {
    // 'pods' contains 'pod' -> substring wins over edit distance
    expect(nearestMatches('pods', candidates, 1)).toStrictEqual(['pod']);
  });

  it('should return nothing when no candidate is within tolerance', () => {
    expect(nearestMatches('xyz', candidates)).toStrictEqual([]);
  });

  it('should respect the limit', () => {
    const result = nearestMatches('secre', candidates, 1);

    expect(result).toStrictEqual(['secret']);
  });

  it('should default to at most 3 results', () => {
    // Several plausible near-misses to 'secet'
    const many = ['secret', 'secrets', 'secreta', 'secretb', 'secretc'];
    const result = nearestMatches('secet', many);

    expect(result.length).toStrictEqual(3);
  });

  it('should order results by ascending distance', () => {
    // 'servic' is a substring of 'service' (distance 0) and one edit from nothing else close
    const result = nearestMatches('servic', ['service', 'secret', 'serviceaccount']);

    expect(result[0]).toStrictEqual('service');
  });

  it('should scale tolerance with the length of the input', () => {
    // Short input: tolerance floor of 2, so a 3-edit difference is excluded
    expect(nearestMatches('abc', ['xyz'])).toStrictEqual([]);

    // Longer input: tolerance grows, so a small relative difference is included
    expect(nearestMatches('deploymentx', ['deployment'], 1)).toStrictEqual(['deployment']);
  });
});
