import { shallowMount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import ProjectHelmChartComponent from '@shell/edit/helm.cattle.io.projecthelmchart.vue';
import { _CREATE } from '@shell/config/query-params';
import { CONFIG_MAP } from '@shell/config/types';
import { PROMETHEUS_FEDERATOR_SYSTEM_NAMESPACES_CONFIG_MAP } from '@shell/utils/monitoring';

const systemNamespacesConfigMap = { data: { 'system-namespaces.json': '{"projectReleaseLabelValue": "p-system", "systemProjectLabelValues": []}' } };

const createStore = (hasPrometheusFederator: boolean, find: () => Promise<any>) => {
  const store = {
    getters: {
      'i18n/t':      (text: string) => text,
      'i18n/exists': jest.fn(),
      t:             (text: string) => text,
      currentStore:  () => 'cluster',
      'cluster/all': () => [],
      hasPrometheusFederator,
    },
    dispatch: jest.fn((action: string) => (action === 'cluster/find' ? find() : Promise.resolve())),
    commit:   jest.fn((mutation: string, value: boolean) => {
      if (mutation === 'hasPrometheusFederator') {
        store.getters.hasPrometheusFederator = value;
      }
    }),
  };

  return store;
};

const mountProjectHelmChart = ($store: ReturnType<typeof createStore>) => shallowMount(ProjectHelmChartComponent, {
  props:  { value: { metadata: {}, spec: {} }, mode: _CREATE },
  global: {
    mocks: {
      $store,
      $fetchState: { pending: false },
      $route:      { query: { AS: '' }, name: 'c-cluster-product-resource-create' },
      $router:     { replace: jest.fn() },
    },
    stubs: { CruResource: { template: '<div data-testid="project-monitoring-form"><slot /></div>' } }
  },
});

describe('edit: helm.cattle.io.projecthelmchart', () => {
  it('should show a warning instead of loading forever when the federator has been uninstalled', async() => {
    const store = createStore(true, () => Promise.reject(new Error('404')));
    const wrapper = mountProjectHelmChart(store);

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await flushPromises();

    expect(store.commit).toHaveBeenCalledWith('hasPrometheusFederator', false);
    expect(store.dispatch).not.toHaveBeenCalledWith('catalog/load');
    expect(wrapper.find('[data-testid="project-monitoring-federator-not-installed"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="project-monitoring-form"]').exists()).toBe(false);
  });

  it('should show the form when the federator is installed', async() => {
    const store = createStore(false, () => Promise.resolve(systemNamespacesConfigMap));
    const wrapper = mountProjectHelmChart(store);

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await flushPromises();

    expect(store.dispatch).toHaveBeenCalledWith('cluster/find', {
      type: CONFIG_MAP, id: PROMETHEUS_FEDERATOR_SYSTEM_NAMESPACES_CONFIG_MAP, opt: { force: true, watch: false }
    });
    expect(store.commit).toHaveBeenCalledWith('hasPrometheusFederator', true);
    expect(wrapper.find('[data-testid="project-monitoring-federator-not-installed"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="project-monitoring-form"]').exists()).toBe(true);
  });
});
