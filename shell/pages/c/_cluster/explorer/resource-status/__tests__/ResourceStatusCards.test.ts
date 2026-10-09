import { ref } from 'vue';
import { shallowMount } from '@vue/test-utils';
import ResourceStatusCards from '@shell/pages/c/_cluster/explorer/resource-status/ResourceStatusCards.vue';
import StatusSummaryCard from '@shell/components/Resource/Detail/Card/StatusSummaryCard/index.vue';
import StatusBreakdownCard from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/index.vue';
import type { StatusSummaryCardItem } from '@shell/components/Resource/Detail/Card/StatusSummaryCard/types';
import type { StatusBreakdownRow } from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/types';

const mockStatus = {
  loaded:          ref(true),
  deploymentsCard: ref<StatusSummaryCardItem | null>(null),
  nodesCard:       ref<StatusSummaryCardItem | null>(null),
  unhealthyRows:   ref<StatusBreakdownRow[]>([]),
};

jest.mock('@shell/pages/c/_cluster/explorer/resource-status/composable', () => ({ useClusterResourceStatus: () => mockStatus }));

jest.mock('@shell/composables/useI18n', () => ({ useI18n: () => ({ t: (key: string) => `%${ key }%` }) }));

jest.mock('vuex', () => ({ useStore: () => ({}) }));

const deploymentsCard: StatusSummaryCardItem = {
  key:      'apps.deployment',
  title:    'Deployments',
  total:    1,
  segments: [{ color: 'success', percent: 100 }],
  rows:     [{
    key: 'active', label: 'Active', color: 'success', count: 1
  }],
  to: { name: 'deployments' },
};

const nodesCard: StatusSummaryCardItem = {
  key: 'node', title: 'Nodes', total: 0, segments: [], rows: []
};

const unhealthyRows: StatusBreakdownRow[] = [{
  key: 'pod', label: 'Pods', counts: [{ color: 'error', count: 1 }]
}];

describe('component: ResourceStatusCards', () => {
  beforeEach(() => {
    mockStatus.loaded.value = true;
    mockStatus.deploymentsCard.value = deploymentsCard;
    mockStatus.nodesCard.value = nodesCard;
    mockStatus.unhealthyRows.value = unhealthyRows;
  });

  it('should render nothing before the first load', () => {
    mockStatus.loaded.value = false;
    const wrapper = shallowMount(ResourceStatusCards);

    expect(wrapper.find('[data-testid="cluster-dashboard-resource-status"]').exists()).toStrictEqual(false);
  });

  it('should render the nodes and deployments cards in order', () => {
    const wrapper = shallowMount(ResourceStatusCards);

    expect(wrapper.findAllComponents(StatusSummaryCard).map((c) => c.props('title'))).toStrictEqual(['Nodes', 'Deployments']);
  });

  it('should pass each card its props', () => {
    const wrapper = shallowMount(ResourceStatusCards);
    const { key, ...props } = deploymentsCard;

    expect(wrapper.findAllComponents(StatusSummaryCard)[1].props()).toStrictEqual(props);
  });

  it('should leave out a card that is not available', () => {
    mockStatus.deploymentsCard.value = null;
    const wrapper = shallowMount(ResourceStatusCards);

    expect(wrapper.findAllComponents(StatusSummaryCard).map((c) => c.props('title'))).toStrictEqual(['Nodes']);
  });

  it('should render the unhealthy workloads card', () => {
    const wrapper = shallowMount(ResourceStatusCards);
    const card = wrapper.findComponent(StatusBreakdownCard);

    expect(card.props()).toStrictEqual({
      title: '%clusterIndexPage.resourceStatus.unhealthy.title%', rows: unhealthyRows, selectable: false
    });
  });

  it('should render the unhealthy workloads card after the summary cards', () => {
    const wrapper = shallowMount(ResourceStatusCards);
    const children = Array.from((wrapper.element as HTMLElement).children).map((c) => c.tagName.toLowerCase());

    expect(children).toStrictEqual(['status-summary-card-stub', 'status-summary-card-stub', 'status-breakdown-card-stub']);
  });
});
