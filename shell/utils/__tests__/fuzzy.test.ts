import { compareDisjointMatches, disjointMatch, levenshtein, nearestMatches } from '@shell/utils/fuzzy';

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

describe('fx: disjointMatch', () => {
  it.each([
    ['a query the text does not contain', 'Pods', 'xyz'],
    ['a query longer than the text', 'Pods', 'podsandmore'],
    ['an empty query', 'Pods', ''],
    ['an empty text', '', 'pod'],
    ['a run that would have to be reused', 'aaa', 'aaaa'],
  ])('should not match %s', (_label, text, query) => {
    expect(disjointMatch(text, query)).toBeNull();
  });

  it.each([
    ['a whole word', 'Pods', 'pod', {
      runs: 1, strays: 0, span: 3, index: 0
    }],
    ['the whole text, ignoring case', 'ConfigMaps', 'configmaps', {
      runs: 1, strays: 0, span: 10, index: 0
    }],
    ['a word after a separator', 'Cloud Credentials', 'cred', {
      runs: 1, strays: 0, span: 4, index: 6
    }],
    ['a word after a dot', 'provisioning.cattle.io.cluster', 'cattle', {
      runs: 1, strays: 0, span: 6, index: 13
    }],
    ['a mid-word substring', 'Deployments', 'ploy', {
      runs: 1, strays: 1, span: 4, index: 2
    }],
    ['a camel-cased abbreviation', 'NetworkPolicies', 'netpol', {
      runs: 2, strays: 0, span: 10, index: 0
    }],
    ['a two-letter abbreviation', 'ConfigMaps', 'cm', {
      runs: 2, strays: 0, span: 7, index: 0
    }],
    ['an abbreviation split mid-word', 'Namespaces', 'ns', {
      runs: 2, strays: 1, span: 5, index: 0
    }],
    ['an abbreviation of a single word', 'Endpoints', 'ep', {
      runs: 2, strays: 1, span: 4, index: 0
    }],
    ['an abbreviation needing three runs', 'PersistentVolumeClaims', 'pvc', {
      runs: 3, strays: 0, span: 17, index: 0
    }],
  ])('should match %s', (_label, text, query, expected) => {
    expect(disjointMatch(text, query)).toStrictEqual(expected);
  });

  it('should take the earliest of two equal runs, not the one that starts a word', () => {
    // The 'c' could land on the 'C' of 'CIDRs' and save a stray, which would put
    // ServiceCIDRs above Services for 'svc'; the earliest run leaves both with
    // the same match, and the shorter label wins the tie
    expect(disjointMatch('ServiceCIDRs', 'svc')).toStrictEqual({
      runs: 3, strays: 2, span: 6, index: 0
    });
    expect(disjointMatch('Services', 'svc')).toStrictEqual(disjointMatch('ServiceCIDRs', 'svc'));
  });

  it('should stay in the first word when a later word could start a run', () => {
    // 'rc' takes the 'c' of 'Replication', not the one starting 'Controllers'
    expect(disjointMatch('Replication Controllers', 'rc')).toStrictEqual({
      runs: 2, strays: 1, span: 6, index: 0
    });
  });

  it('should take the longest run it can rather than the earliest', () => {
    // 'p' + 'ol' at the front would also match, but 'pol' whole is the obvious read
    expect(disjointMatch('Pod Policies', 'pol')).toStrictEqual({
      runs: 1, strays: 0, span: 3, index: 4
    });
  });

  it('should shorten a run rather than let it strand the rest of the query', () => {
    // The longest 'me' is the one in 'DeployMEnts', which leaves no 'd' after
    // it; the match is the earlier 'm' plus the 'ed' of 'MachinED...'
    expect(disjointMatch('MachineDeployments', 'med')).toStrictEqual({
      runs: 2, strays: 1, span: 8, index: 0
    });
  });

  it('should give up the longest run when the query cannot finish after it', () => {
    // The longest run of 'abc' is the 'ab' at the end, which leaves no 'c'; the
    // 'a' at the front plus the 'bc' after it is the match
    expect(disjointMatch('aXbcYab', 'abc')).toStrictEqual({
      runs: 2, strays: 1, span: 4, index: 0
    });
  });

  it('should match runs in order and never reuse text', () => {
    expect(disjointMatch('Policies Pod', 'podpol')).toBeNull();
    expect(disjointMatch('Pod Policies', 'podpol')).toStrictEqual({
      runs: 2, strays: 0, span: 7, index: 0
    });
  });
});

describe('fx: compareDisjointMatches', () => {
  // 'cm' against 'ConfigMaps': two runs, both starting a word, first one first
  const split = {
    runs: 2, strays: 0, span: 7, index: 0
  };

  it('should rank a whole match above a split one starting no earlier', () => {
    const whole = {
      runs: 1, strays: 0, span: 2, index: 0
    };

    expect(compareDisjointMatches(whole, split)).toBeLessThan(0);
  });

  it('should charge a run buried in a word as much as an extra run', () => {
    // 'cm' against the 'acme' in 'acme.cert-manager.io.challenge'
    const buried = {
      runs: 1, strays: 1, span: 2, index: 1
    };

    expect(compareDisjointMatches(split, buried)).toBeLessThan(0);
  });

  it('should refund one run to a match sharing the text\'s first letter', () => {
    // 'ns' splits both 'Namespaces' (from its first letter) and 'DaemonSets'
    // (whole, buried), which would otherwise cost the same
    const initial = {
      runs: 2, strays: 1, span: 5, index: 0
    };
    const inner = {
      runs: 1, strays: 1, span: 2, index: 5
    };

    expect(compareDisjointMatches(initial, inner)).toBeLessThan(0);
  });

  it('should not let a first letter carry a match that costs more than one extra run', () => {
    const scattered = {
      runs: 4, strays: 0, span: 20, index: 0
    };
    const clean = {
      runs: 2, strays: 0, span: 7, index: 6
    };

    expect(compareDisjointMatches(clean, scattered)).toBeLessThan(0);
  });

  it('should rank an earlier match above a later one of the same cost', () => {
    const later = {
      runs: 2, strays: 1, span: 7, index: 4
    };
    const earlier = {
      runs: 3, strays: 0, span: 7, index: 1
    };

    expect(compareDisjointMatches(earlier, later)).toBeLessThan(0);
  });

  it('should rank runs that start words above runs that start mid-word', () => {
    const strayed = {
      runs: 1, strays: 1, span: 7, index: 3
    };
    const clean = {
      runs: 2, strays: 0, span: 9, index: 3
    };

    expect(compareDisjointMatches(clean, strayed)).toBeLessThan(0);
  });

  it('should rank a tighter match above a match spread across the text', () => {
    const spread = {
      runs: 2, strays: 0, span: 15, index: 0
    };

    expect(compareDisjointMatches(split, spread)).toBeLessThan(0);
  });

  it('should leave indistinguishable matches for the caller to break', () => {
    expect(compareDisjointMatches(split, { ...split })).toStrictEqual(0);
  });
});
