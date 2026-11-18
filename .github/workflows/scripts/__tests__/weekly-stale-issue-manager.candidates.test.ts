/* eslint-disable @typescript-eslint/no-var-requires */
// Verifies which labels the stalebot treats as candidates. The set is driven by
// STALE_TARGET_LABELS (read at module load), so each case reloads the module with
// a different value. request.graphql is mocked to return issues per searched label.
const mockGraphql = jest.fn();

jest.mock('../request', () => ({ graphql: mockGraphql }));

const OLD = '2020-01-01T00:00:00Z';

// Reload the module with a given STALE_TARGET_LABELS value.
function loadWith(targetLabels: string) {
  jest.resetModules();
  process.env.STALE_TARGET_LABELS = targetLabels;
  process.env.GH_TOKEN = 'test-token';

  return require('../weekly-stale-issue-manager');
}

// Make each search return the issue numbers registered for the label it queried.
function searchReturns(byLabel: Record<string, number[]>) {
  mockGraphql.mockImplementation((query: string) => {
    const label = (query.match(/label:\\?"?([\w/-]+)/) || [])[1];
    const nodes = (byLabel[label] || []).map((number) => ({
      number,
      createdAt: OLD,
      labels:    { nodes: [{ name: label }] },
    }));

    return Promise.resolve({ data: { search: { pageInfo: { hasNextPage: false }, nodes } } });
  });
}

const searchedLabels = () => mockGraphql.mock.calls
  .map((c: any[]) => c[0])
  .filter((q: string) => q.includes('search('));

describe('fetchCandidates — configured target labels', () => {
  afterEach(() => jest.clearAllMocks());

  it('searches kind/tech-debt as well as kind/enhancement and unions the results', async () => {
    const mgr = loadWith('kind/enhancement,kind/tech-debt');

    searchReturns({ 'kind/enhancement': [1], 'kind/tech-debt': [2] });

    const candidates = await mgr.fetchCandidates('octo', 'repo');
    const queries = searchedLabels();

    expect(queries.some((q: string) => q.includes('kind/enhancement'))).toStrictEqual(true);
    expect(queries.some((q: string) => q.includes('kind/tech-debt'))).toStrictEqual(true);
    expect(candidates.map((c: any) => c.number).sort()).toStrictEqual([1, 2]);
  });

  it('does not consider kind/tech-debt issues when that label is not configured', async () => {
    const mgr = loadWith('kind/enhancement');

    searchReturns({ 'kind/enhancement': [1], 'kind/tech-debt': [2] });

    const candidates = await mgr.fetchCandidates('octo', 'repo');

    expect(searchedLabels().some((q: string) => q.includes('kind/tech-debt'))).toStrictEqual(false);
    expect(candidates.map((c: any) => c.number)).toStrictEqual([1]);
  });

  it('de-duplicates an issue that carries more than one configured label', async () => {
    const mgr = loadWith('kind/enhancement,kind/tech-debt');

    searchReturns({ 'kind/enhancement': [5], 'kind/tech-debt': [5] });

    const candidates = await mgr.fetchCandidates('octo', 'repo');

    expect(candidates.map((c: any) => c.number)).toStrictEqual([5]);
  });
});
