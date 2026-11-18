import { shallowMount } from '@vue/test-utils';
import flushPromises from 'flush-promises';
import ProjectHelmChartComponent from '@shell/edit/helm.cattle.io.projecthelmchart.vue';
import { _CREATE } from '@shell/config/query-params';
import { CONFIG_MAP } from '@shell/config/types';
import { PROMETHEUS_FEDERATOR_SYSTEM_NAMESPACES_CONFIG_MAP } from '@shell/utils/monitoring';

const systemNamespacesConfigMap = { data: { 'system-namespaces.json': '{"projectReleaseLabelValue": "p-system", "systemProjectLabelValues": []}' } };

const createStore = (federatorMissing: boolean, find: () => Promise<any>) => {
  const store = {
    getters: {
      'i18n/t':      (text: string) => text,
      'i18n/exists': jest.fn(),
      t:             (text: string) => text,
      currentStore:  () => 'cluster',
      'cluster/all': () => [],
      federatorMissing,
    },
    dispatch: jest.fn((action: string) => (action === 'cluster/find' ? find() : Promise.resolve())),
    commit:   jest.fn((mutation: string, value: boolean) => {
      if (mutation === 'federatorMissing') {
        store.getters.federatorMissing = value;
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
    const store = createStore(false, () => Promise.reject(Object.assign(new Error('Not Found'), { status: 404 })));
    const wrapper = mountProjectHelmChart(store);

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await flushPromises();

    expect(store.commit).toHaveBeenCalledWith('federatorMissing', true);
    expect(store.dispatch).not.toHaveBeenCalledWith('catalog/load');
    expect(wrapper.find('[data-testid="project-monitoring-federator-not-installed"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="project-monitoring-form"]').exists()).toBe(false);
  });

  it.each([403, 500])('should show the error and leave the flag alone when the config map request fails with a %p', async(status) => {
    const store = createStore(false, () => Promise.reject(Object.assign(new Error('Failed'), { status })));
    const wrapper = mountProjectHelmChart(store);

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await flushPromises();

    expect(store.commit).not.toHaveBeenCalledWith('federatorMissing', expect.anything());
    expect(wrapper.find('[data-testid="project-monitoring-federator-fetch-failed"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="project-monitoring-federator-not-installed"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="project-monitoring-form"]').exists()).toBe(false);
  });

  it('should show the error rather than an earlier not installed result', async() => {
    const store = createStore(true, () => Promise.reject(Object.assign(new Error('Failed'), { status: 500 })));
    const wrapper = mountProjectHelmChart(store);

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await flushPromises();

    expect(wrapper.find('[data-testid="project-monitoring-federator-fetch-failed"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="project-monitoring-federator-not-installed"]').exists()).toBe(false);
  });

  it.each([
    ['find returns nothing', undefined],
    ['the config map has no content', { data: {} }],
    ['the config map content is malformed', { data: { 'system-namespaces.json': '{' } }],
  ])('should show the error instead of reporting the federator as missing when %s', async(_label, configMap) => {
    const store = createStore(false, () => Promise.resolve(configMap));
    const wrapper = mountProjectHelmChart(store);

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await flushPromises();

    expect(store.commit).not.toHaveBeenCalledWith('federatorMissing', true);
    expect(store.dispatch).not.toHaveBeenCalledWith('catalog/load');
    expect(wrapper.vm.loading).toBe(false);
    expect(wrapper.find('[data-testid="project-monitoring-federator-fetch-failed"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="project-monitoring-federator-not-installed"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="project-monitoring-form"]').exists()).toBe(false);
  });

  it('should show the form when the federator is installed', async() => {
    const store = createStore(true, () => Promise.resolve(systemNamespacesConfigMap));
    const wrapper = mountProjectHelmChart(store);

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    await flushPromises();

    expect(store.dispatch).toHaveBeenCalledWith('cluster/find', {
      type: CONFIG_MAP, id: PROMETHEUS_FEDERATOR_SYSTEM_NAMESPACES_CONFIG_MAP, opt: { force: true, watch: false }
    });
    expect(store.commit).toHaveBeenCalledWith('federatorMissing', false);
    expect(wrapper.find('[data-testid="project-monitoring-federator-not-installed"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="project-monitoring-form"]').exists()).toBe(true);
  });
});
