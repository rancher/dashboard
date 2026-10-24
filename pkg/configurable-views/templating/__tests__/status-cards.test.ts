import {
  buildStatusCards, countsFromClusterCounts, countsFromSummaries, normalizeStatusCards, COUNTS_OTHER_STATE,
  type StatusCardsConfig
} from '@pkg/configurable-views/templating/status-cards';
import type { StateColor } from '@shell/utils/style';

// Rancher's colours, as the dashboard gives them: by state name
const RANCHER: Record<string, StateColor> = {
  running: 'success', completed: 'success', active: 'success', imagepullbackoff: 'info', 'in-progress': 'info', error: 'error', crashloopbackoff: 'error', pending: 'warning'
};
const coloring = { stateColor: (state: string) => RANCHER[state.toLowerCase()] || 'disabled' };

const config = (overrides: Partial<StatusCardsConfig> = {}): StatusCardsConfig => ({ ...normalizeStatusCards({}), ...overrides });

const SUMMARIES = [
  {
    type:    'pod',
    summary: [{
      property: 'metadata.state.name',
      counts:   {
        Running:          { total: 24, namespace: { default: 20, kube: 4 } },
        ImagePullBackOff: { total: 7, namespace: { default: 7 } },
        Completed:        { total: 4, namespace: { kube: 4 } },
        CrashLoopBackOff: { total: 2, namespace: { default: 2 } },
      },
    }],
  },
  {
    type:    'apps.deployment',
    summary: [{
      property: 'metadata.state.name',
      counts:   {
        Active: { total: 11, namespace: { default: 11 } },
        Error:  { total: 5, namespace: { default: 5 } },
      },
    }],
  },
  {
    type: 'apps.statefulset', summary: null, error: 'forbidden'
  },
];
const COUNTS = countsFromSummaries(SUMMARIES);

describe('normalizeStatusCards', () => {
  it('starts as Pods by status, in Rancher colours', () => {
    expect(normalizeStatusCards(undefined)).toStrictEqual({
      resources: ['pod'], namespace: '', cards: 'type', rows: 'state', only: 'all', sort: 'count', top: 0, maxCards: 0, colors: 'state', customColors: {}
    });
  });

  it('keeps only what it understands', () => {
    const out = normalizeStatusCards({
      resources: 'pod, apps.deployment', cards: 'everything', rows: 'namespace', top: '5', maxCards: -2, colors: 'custom', customColors: { Running: 'success', Bad: 'purple' }
    });

    expect(out).toMatchObject({
      resources: ['pod', 'apps.deployment'], cards: 'type', rows: 'namespace', top: 5, maxCards: 0, colors: 'custom', customColors: { running: 'success' }
    });
  });

  it('reads an empty list of resources as every type', () => {
    expect(normalizeStatusCards({ resources: [] }).resources).toStrictEqual([]);
  });
});

describe('counts', () => {
  it('reads each state of each type in each namespace, and leaves out a type that failed', () => {
    expect(COUNTS).toContainEqual({
      type: 'pod', namespace: 'default', state: 'ImagePullBackOff', count: 7
    });
    expect(COUNTS.filter((c) => c.type === 'apps.statefulset')).toHaveLength(0);
  });

  it("reads a cluster's counts, counting what no listed state covers as active", () => {
    const out = countsFromClusterCounts({
      pod:       { summary: { count: 10, states: { 'in-progress': 3 } }, namespaces: { default: { count: 10, states: { 'in-progress': 3 } } } },
      configmap: { summary: { count: 40 } },
    });

    expect(out).toStrictEqual([
      {
        type: 'pod', namespace: 'default', state: 'in-progress', count: 3
      },
      {
        type: 'pod', namespace: 'default', state: COUNTS_OTHER_STATE, count: 7
      },
      {
        type: 'configmap', namespace: '', state: COUNTS_OTHER_STATE, count: 40
      },
    ]);
  });

  it('reads only the types asked for', () => {
    expect(countsFromClusterCounts({ pod: { summary: { count: 2 } }, secret: { summary: { count: 9 } } }, ['secret', 'nope']).map((c) => c.type)).toStrictEqual(['secret']);
  });
});

describe('buildStatusCards', () => {
  it('draws a card per type, a row per state, worst first, as the dashboard does', () => {
    const [pods] = buildStatusCards(COUNTS, config(), coloring).filter((c) => c.key === 'pod');

    expect(pods.total).toBe(37);
    expect(pods.rows.map((r) => [r.key, r.total, r.color])).toStrictEqual([
      ['CrashLoopBackOff', 2, 'error'], ['ImagePullBackOff', 7, 'info'], ['Running', 24, 'success'], ['Completed', 4, 'success'],
    ]);
  });

  it('draws a card per namespace, a row per type, its counts split by colour', () => {
    const cards = buildStatusCards(COUNTS, config({
      cards: 'namespace', rows: 'type', resources: []
    }), coloring);
    const def = cards.find((c) => c.key === 'default');

    expect(cards.map((c) => c.key)).toStrictEqual(['default', 'kube']);
    expect(def?.rows.find((r) => r.key === 'apps.deployment')?.cells.map((c) => [c.color, c.count])).toStrictEqual([['error', 5], ['success', 11]]);
  });

  it('counts only what is in error, for the tops of what needs attention', () => {
    const [card] = buildStatusCards(COUNTS, config({
      cards: 'none', rows: 'type', only: 'error'
    }), coloring);

    expect(card.rows.map((r) => [r.key, r.total])).toStrictEqual([['apps.deployment', 5], ['pod', 2]]);
  });

  it('keeps the top rows and cards by count', () => {
    const [card] = buildStatusCards(COUNTS, config({
      cards: 'none', rows: 'namespace', top: 1
    }), coloring);

    expect(card.rows.map((r) => [r.key, r.total])).toStrictEqual([['default', 45]]);
    expect(buildStatusCards(COUNTS, config({ cards: 'namespace', maxCards: 1 }), coloring).map((c) => c.key)).toStrictEqual(['default']);
  });

  it('keeps to one namespace', () => {
    const [pods] = buildStatusCards(COUNTS, config({ namespace: 'kube' }), coloring);

    expect(pods.rows.map((r) => r.key)).toStrictEqual(['Completed', 'Running']);
  });

  it('draws no colours when asked, and the widget\'s own when given', () => {
    const plain = buildStatusCards(COUNTS, config({ colors: 'none' }), coloring).find((c) => c.key === 'pod');

    expect(plain?.rows.every((r) => r.color === null)).toBe(true);

    const own = buildStatusCards(COUNTS, config({ colors: 'custom', customColors: { imagepullbackoff: 'warning' } }), coloring).find((c) => c.key === 'pod');

    expect(own?.rows.find((r) => r.key === 'ImagePullBackOff')?.color).toBe('warning');
    expect(own?.rows.find((r) => r.key === 'Running')?.color).toBeNull();
  });

  it('sorts by name when asked', () => {
    const [pods] = buildStatusCards(COUNTS, config({ sort: 'name' }), coloring).filter((c) => c.key === 'pod');

    expect(pods.rows.map((r) => r.key)).toStrictEqual(['Completed', 'CrashLoopBackOff', 'ImagePullBackOff', 'Running']);
  });
});
