import { shallowMount } from '@vue/test-utils';
import ByNamespaceSection from '@shell/pages/c/_cluster/explorer/workload-dashboard/ByNamespaceSection.vue';
import StatusBreakdownCard from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/index.vue';
import type { StatusBreakdownCardItem } from '@shell/components/Resource/Detail/Card/StatusBreakdownCard/types';

const cards: StatusBreakdownCardItem[] = [
  {
    key:        'default',
    title:      'default',
    selectable: true,
    rows:       [{
      key: 'pod', label: 'Pods', counts: [{ color: 'success', count: 2 }]
    }],
  },
  {
    key: 'kube-system', title: 'kube-system', selectable: true, rows: []
  },
];

describe('component: ByNamespaceSection', () => {
  const mountSection = (filterByNamespace = jest.fn()) => shallowMount(ByNamespaceSection, { props: { cards, filterByNamespace } });

  it('should render one card per namespace', () => {
    const wrapper = mountSection();

    expect(wrapper.findAllComponents(StatusBreakdownCard).map((c) => c.props('title'))).toStrictEqual(['default', 'kube-system']);
  });

  it('should pass the rows and selectable flag to each card', () => {
    const wrapper = mountSection();
    const card = wrapper.findAllComponents(StatusBreakdownCard)[0];

    expect([card.props('rows'), card.props('selectable')]).toStrictEqual([cards[0].rows, true]);
  });

  it.each(['select', 'select-row', 'select-count'])('should filter by the card namespace on %p', (event) => {
    const filterByNamespace = jest.fn();
    const wrapper = mountSection(filterByNamespace);

    wrapper.findAllComponents(StatusBreakdownCard)[1].vm.$emit(event);

    expect(filterByNamespace).toHaveBeenCalledWith('kube-system');
  });
});
