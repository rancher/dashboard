import { reactive, ref, toValue } from 'vue';
import { shallowMount } from '@vue/test-utils';
import ResourceStatusWidget from '@shell/components/ResourceStatusWidget/index.vue';
import StatusSummaryCard from '@shell/components/Resource/Detail/Card/StatusSummaryCard/index.vue';
import StatusBreakdownCard from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/index.vue';
import type { ResourceStatusWidgetConfig } from '@shell/components/ResourceStatusWidget/types';
import type { StatusBreakdownRow } from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/types';
import { COUNT } from '@shell/config/types';

const mockGetters: Record<string, any> = reactive({});
const mockLoaded = ref(true);
const mockStateCounts: Record<string, Record<string, number> | null> = reactive({});
const mockSummariesArgs: { types?: any; options?: any } = {};

const mockStateColors: Record<string, string> = {
  active: 'success', running: 'success', error: 'error', crashloopbackoff: 'error', pending: 'warning', updating: 'info'
};

jest.mock('vuex', () => ({ useStore: () => ({ getters: mockGetters }) }));

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => `%${ key }%` }) }));

jest.mock('@shell/composables/useStateColor', () => ({ useStateColor: () => ({ toStateColor: (state: string) => mockStateColors[state] || 'disabled' }) }));

jest.mock('@shell/components/ResourceStatusWidget/useResourceStateSummaries', () => ({
  useResourceStateSummaries: (types: any, options: any) => {
    mockSummariesArgs.types = types;
    mockSummariesArgs.options = options;

    return { loaded: mockLoaded, stateCounts: (type: string) => mockStateCounts[type] ?? null };
  },
}));

const labels: Record<string, string> = {
  'apps.deployment': 'Deployments', 'apps.daemonset': 'DaemonSets', 'batch.job': 'Jobs', pod: 'Pods'
};

let countStates: Record<string, Record<string, number>> = {};
let unlistable: string[] = [];
let ignored: string[] = [];

function setupGetters() {
  Object.keys(mockGetters).forEach((key) => delete mockGetters[key]);
  Object.assign(mockGetters, {
    clusterId:            'c-123',
    'cluster/all':        (type: string) => (type === COUNT ? [{ counts: Object.fromEntries(Object.entries(countStates).map(([t, states]) => [t, { summary: { states } }])) }] : []),
    'cluster/schemaFor':  (type: string) => (labels[type] ? { id: type } : undefined),
    'cluster/canList':    (type: string) => !unlistable.includes(type),
    'type-map/isIgnored': (schema: { id: string }) => ignored.includes(schema.id),
    'type-map/labelFor':  (schema: { id: string }) => labels[schema.id],
  });
}

function route(resource: string, stateFilter?: string) {
  return {
    name:   'c-cluster-product-resource',
    params: {
      cluster: 'c-123', product: 'explorer', resource
    },
    ...(stateFilter ? { query: { stateFilter } } : {}),
  };
}

function mountWidget(config: ResourceStatusWidgetConfig) {
  return shallowMount(ResourceStatusWidget, { props: { config } });
}

function setStateCounts(counts: Record<string, Record<string, number> | null>) {
  Object.keys(mockStateCounts).forEach((key) => delete mockStateCounts[key]);
  Object.assign(mockStateCounts, counts);
}

describe('component: ResourceStatusWidget', () => {
  beforeEach(() => {
    mockLoaded.value = true;
    countStates = {};
    unlistable = [];
    ignored = [];
    setStateCounts({});
    setupGetters();
  });

  describe('summary', () => {
    const config: ResourceStatusWidgetConfig = { kind: 'summary', resource: 'apps.deployment' };

    beforeEach(() => {
      setStateCounts({ 'apps.deployment': { active: 3, error: 1 } });
    });

    it('should fetch the counts of the resource', () => {
      mountWidget(config);

      expect(toValue(mockSummariesArgs.types)).toStrictEqual(['apps.deployment']);
    });

    it('should use the plural label of the resource as the title', () => {
      const wrapper = mountWidget(config);

      expect(wrapper.findComponent(StatusSummaryCard).props('title')).toStrictEqual('Deployments');
    });

    it('should use the title from the config', () => {
      const wrapper = mountWidget({ ...config, title: 'My Deployments' });

      expect(wrapper.findComponent(StatusSummaryCard).props('title')).toStrictEqual('My Deployments');
    });

    it('should pass the total of all states', () => {
      const wrapper = mountWidget(config);

      expect(wrapper.findComponent(StatusSummaryCard).props('total')).toStrictEqual(4);
    });

    it('should link the card to the resource list', () => {
      const wrapper = mountWidget(config);

      expect(wrapper.findComponent(StatusSummaryCard).props('to')).toStrictEqual(route('apps.deployment'));
    });

    it('should link each state row to the list filtered by that state', () => {
      const wrapper = mountWidget(config);

      expect(wrapper.findComponent(StatusSummaryCard).props('rows').map((r: any) => r.to)).toStrictEqual([
        route('apps.deployment', 'error'),
        route('apps.deployment', 'active'),
      ]);
    });

    it.each([
      ['the user cannot list the resource', () => unlistable.push('apps.deployment')],
      ['the resource is ignored', () => ignored.push('apps.deployment')],
      ['the resource has no schema', () => delete labels['apps.deployment']],
    ])('should not fetch anything when %s', (_, setup) => {
      const label = labels['apps.deployment'];

      setup();
      mountWidget(config);

      expect(toValue(mockSummariesArgs.types)).toStrictEqual([]);
      labels['apps.deployment'] = label;
    });

    it('should render nothing when the user cannot list the resource', () => {
      unlistable.push('apps.deployment');
      mockLoaded.value = false;
      const wrapper = mountWidget(config);

      expect(wrapper.html()).toStrictEqual('<!--v-if-->');
    });

    it('should render nothing when the counts could not be fetched', () => {
      setStateCounts({ 'apps.deployment': null });
      const wrapper = mountWidget(config);

      expect(wrapper.html()).toStrictEqual('<!--v-if-->');
    });

    it('should show a loading card with the title before the first load', () => {
      mockLoaded.value = false;
      setStateCounts({});
      const wrapper = mountWidget(config);

      expect(wrapper.find('[data-testid="resource-status-widget-loading"]').attributes('title')).toStrictEqual('Deployments');
    });
  });

  describe('breakdown', () => {
    const config: ResourceStatusWidgetConfig = {
      kind: 'breakdown', title: 'Unhealthy', resources: ['pod', 'batch.job', 'apps.daemonset'], colors: ['error', 'warning']
    };

    beforeEach(() => {
      countStates = {
        pod: { error: 2 }, 'batch.job': { pending: 1 }, 'apps.daemonset': { error: 1 }
      };
      setStateCounts({
        pod: {
          running: 5, error: 1, crashloopbackoff: 1
        },
        'batch.job':      { pending: 1 },
        'apps.daemonset': { error: 1, pending: 2 },
      });
    });

    function rows(wrapper: ReturnType<typeof mountWidget>) {
      return wrapper.findComponent(StatusBreakdownCard).props('rows');
    }

    function row(wrapper: ReturnType<typeof mountWidget>, key: string): StatusBreakdownRow {
      return rows(wrapper).find((r: StatusBreakdownRow) => r.key === key)!;
    }

    it('should pass the title from the config', () => {
      const wrapper = mountWidget(config);

      expect(wrapper.findComponent(StatusBreakdownCard).props('title')).toStrictEqual('Unhealthy');
    });

    it('should forward the property and namespace filter options', () => {
      mountWidget({
        ...config, property: 'metadata.state.name', followNamespaceFilter: false
      });

      expect([toValue(mockSummariesArgs.options.property), toValue(mockSummariesArgs.options.followNamespaceFilter)]).toStrictEqual(['metadata.state.name', false]);
    });

    it('should leave out types the user cannot list', () => {
      unlistable.push('batch.job');
      mountWidget(config);

      expect(toValue(mockSummariesArgs.types)).toStrictEqual(['pod', 'apps.daemonset']);
    });

    it('should leave out ignored types', () => {
      ignored.push('pod');
      mountWidget(config);

      expect(toValue(mockSummariesArgs.types)).toStrictEqual(['batch.job', 'apps.daemonset']);
    });

    it('should not fetch types with no counted states when only counted colors are shown', () => {
      countStates = { pod: { error: 2 }, 'batch.job': { pending: 0 } };
      mountWidget(config);

      expect(toValue(mockSummariesArgs.types)).toStrictEqual(['pod']);
    });

    it.each([
      ['colors include a color that is not counted', ['error', 'success']],
      ['no colors are given', undefined],
    ])('should fetch types with no counted states when %s', (_, colors) => {
      countStates = {};
      mountWidget({ ...config, colors } as ResourceStatusWidgetConfig);

      expect(toValue(mockSummariesArgs.types)).toStrictEqual(['pod', 'batch.job', 'apps.daemonset']);
    });

    it('should add up the states of each color, most severe first', () => {
      const wrapper = mountWidget(config);

      expect(row(wrapper, 'apps.daemonset').counts.map((c: any) => [c.color, c.count])).toStrictEqual([['error', 1], ['warning', 2]]);
    });

    it('should leave out states with colors that are not shown', () => {
      const wrapper = mountWidget(config);

      expect(row(wrapper, 'pod').counts.map((c: any) => [c.color, c.count])).toStrictEqual([['error', 2]]);
    });

    it('should show every color when no colors are given', () => {
      const wrapper = mountWidget({ ...config, colors: undefined });

      expect(row(wrapper, 'pod').counts.map((c: any) => [c.color, c.count])).toStrictEqual([['error', 2], ['success', 5]]);
    });

    it('should link each count to the list filtered by its states', () => {
      const wrapper = mountWidget(config);

      expect(row(wrapper, 'pod').counts[0].to).toStrictEqual(route('pod', 'error,crashloopbackoff'));
    });

    it('should link each row to the resource list', () => {
      const wrapper = mountWidget(config);

      expect(row(wrapper, 'pod').to).toStrictEqual(route('pod'));
    });

    it('should sort the rows by label', () => {
      const wrapper = mountWidget(config);

      expect(rows(wrapper).map((r: any) => r.label)).toStrictEqual(['DaemonSets', 'Jobs', 'Pods']);
    });

    it('should leave out states with no resources', () => {
      setStateCounts({ pod: { error: 0, crashloopbackoff: 1 } });
      const wrapper = mountWidget(config);

      expect(rows(wrapper).map((r: any) => r.counts)).toStrictEqual([[{
        color: 'error', count: 1, to: route('pod', 'crashloopbackoff')
      }]]);
    });

    it('should leave out types with nothing to show', () => {
      setStateCounts({ pod: { running: 5 }, 'batch.job': { pending: 1 } });
      const wrapper = mountWidget(config);

      expect(rows(wrapper).map((r: any) => r.key)).toStrictEqual(['batch.job']);
    });

    it('should leave out types whose counts could not be fetched', () => {
      setStateCounts({ pod: null, 'batch.job': { pending: 1 } });
      const wrapper = mountWidget(config);

      expect(rows(wrapper).map((r: any) => r.key)).toStrictEqual(['batch.job']);
    });

    it('should show the card with no rows when nothing is unhealthy', () => {
      countStates = {};
      setStateCounts({});
      const wrapper = mountWidget(config);

      expect(rows(wrapper)).toStrictEqual([]);
    });

    it('should show a loading card with the title before the first load', () => {
      mockLoaded.value = false;
      const wrapper = mountWidget(config);

      expect(wrapper.find('[data-testid="resource-status-widget-loading"]').attributes('title')).toStrictEqual('Unhealthy');
    });
  });
});
