import { mount } from '@vue/test-utils';
import ClusterMachineSummary from '@shell/components/formatter/ClusterMachineSummary.vue';

describe('component: ClusterMachineSummary', () => {
  it('should show the node count when the cluster has no machine states', () => {
    const wrapper = mount(ClusterMachineSummary, { props: { row: { stateParts: [], statusInfo: { nodeCount: 3 } } } });

    expect(wrapper.find('span').text()).toBe('3');
    expect(wrapper.findComponent({ name: 'MachineSummaryGraph' }).exists()).toBe(false);
  });

  it('should show zero rather than nothing when the count is missing', () => {
    const wrapper = mount(ClusterMachineSummary, { props: { row: {} } });

    expect(wrapper.find('span').text()).toBe('0');
  });

  it('should draw the graph once there are machine states', () => {
    const wrapper = mount(ClusterMachineSummary, {
      props:  { row: { stateParts: [{ value: 2 }], statusInfo: { nodeCount: 2 } } },
      global: { stubs: { MachineSummaryGraph: true } },
    });

    expect(wrapper.findComponent({ name: 'MachineSummaryGraph' }).exists()).toBe(true);
  });
});
