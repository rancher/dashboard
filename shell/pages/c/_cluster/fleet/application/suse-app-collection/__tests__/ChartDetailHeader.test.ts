import { shallowMount } from '@vue/test-utils';
import ChartDetailHeader from '@shell/pages/c/_cluster/fleet/application/suse-app-collection/ChartDetailHeader.vue';

describe('component: ChartDetailHeader', () => {
  const mountHeader = (deprecated: boolean) => shallowMount(ChartDetailHeader, {
    props:  { chartName: 'apache-apisix-dashboard', deprecated },
    global: {
      stubs: {
        RcIcon:                true,
        LazyImage:             true,
        AppChartCardSubHeader: true,
      }
    }
  });

  const BADGE = '[data-testid="appco-chart-deprecated-badge"]';

  describe('deprecated badge', () => {
    it('should render the deprecated badge when the chart is deprecated', () => {
      const wrapper = mountHeader(true);

      expect(wrapper.find(BADGE).exists()).toBe(true);
    });

    it('should not render the deprecated badge when the chart is not deprecated', () => {
      const wrapper = mountHeader(false);

      expect(wrapper.find(BADGE).exists()).toBe(false);
    });
  });
});
