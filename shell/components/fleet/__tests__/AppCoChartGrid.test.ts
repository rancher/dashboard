import { shallowMount, VueWrapper } from '@vue/test-utils';
import AppCoChartGrid from '@shell/components/fleet/AppCoChartGrid.vue';
import { RcItemCard } from '@components/RcItemCard';

const DEPRECATED_STATUS = {
  icon: 'icon-alert-alt', color: 'error', tooltip: { key: 'generic.deprecated' }
};

describe('component: AppCoChartGrid', () => {
  const mountGrid = (charts: Record<string, any[]>) => shallowMount(AppCoChartGrid, { props: { charts } });

  const cardFor = (wrapper: VueWrapper<any>, id: string) => wrapper
    .findAllComponents(RcItemCard)
    .find((card) => card.props('id') === id);

  describe('deprecated badge', () => {
    it('should add a deprecated status when the latest version is flagged deprecated', () => {
      const wrapper = mountGrid({ 'apache-apisix-dashboard': [{ version: '0.8.3', deprecated: true }] });

      const card = cardFor(wrapper, 'apache-apisix-dashboard');

      expect(card?.props('header').statuses).toStrictEqual([DEPRECATED_STATUS]);
    });

    it('should add a deprecated status when the deprecated annotation is set', () => {
      const wrapper = mountGrid({ 'my-chart': [{ version: '1.0.0', annotations: { 'catalog.cattle.io/deprecated': 'true' } }] });

      const card = cardFor(wrapper, 'my-chart');

      expect(card?.props('header').statuses).toStrictEqual([DEPRECATED_STATUS]);
    });

    it('should not add a status for a non-deprecated chart', () => {
      const wrapper = mountGrid({ alertmanager: [{ version: '1.41.0' }] });

      const card = cardFor(wrapper, 'alertmanager');

      expect(card?.props('header').statuses).toBeUndefined();
    });

    it('should only badge the deprecated chart when deprecated and non-deprecated charts are both present', () => {
      const wrapper = mountGrid({
        alertmanager:              [{ version: '1.41.0' }],
        'apache-apisix-dashboard': [{ version: '0.8.3', deprecated: true }],
      });

      expect(cardFor(wrapper, 'alertmanager')?.props('header').statuses).toBeUndefined();
      expect(cardFor(wrapper, 'apache-apisix-dashboard')?.props('header').statuses).toStrictEqual([DEPRECATED_STATUS]);
    });
  });
});
