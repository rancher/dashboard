import { shallowMount } from '@vue/test-utils';
import ChartProductRedirect from '@shell/mixins/chart-product-redirect';

describe('chart Product Redirect', () => {
  const PRODUCT = 'PRODUCT';
  const CHART_NAME = 'CHART_NAME';

  const createComponent = (...args: Parameters<typeof ChartProductRedirect>) => ({
    props:  {},
    render() { },
    mixins: [ChartProductRedirect(...args)]
  });

  it('should exit early because the product is already active', async() => {
    const store = { getters: { 'type-map/isProductActive': jest.fn(() => true) } };
    const currentCluster = jest.fn();

    // This is just so we can verify if this is called, in all other places we'll mock it with a primitive
    Object.defineProperty(store, 'currentCluster', { get: currentCluster });

    const wrapper = shallowMount(createComponent(PRODUCT), { mocks: { $store: store } });

    expect((wrapper.vm as any).redirectPending).toBeTruthy();
    expect(store.getters['type-map/isProductActive']).toHaveBeenCalledWith(PRODUCT);
    // Confirms that we exited early
    expect(currentCluster).toHaveBeenCalledTimes(0);
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).redirectPending).toBeFalsy();
  });

  it('should log an error because the chart did not exist', async() => {
    const store = {
      getters: {
        'type-map/isProductActive': jest.fn(() => false),
        'catalog/chart':            jest.fn(() => false)
      },
      dispatch: jest.fn(() => Promise.resolve())
    };

    const wrapper = shallowMount(createComponent(PRODUCT, CHART_NAME), { mocks: { $store: store } });

    expect(store.dispatch).toHaveBeenCalledWith('catalog/load');
    await wrapper.vm.$nextTick();
    expect(store.getters['catalog/chart']).toHaveBeenCalledWith({ chartName: CHART_NAME });
    expect(store.dispatch).toHaveBeenCalledWith('loadingError', `Chart not found for ${ PRODUCT }`);
  });

  it('should redirect to the chart install page', async() => {
    const chart = {
      repoType:  'REPO_TYPE',
      repoName:  'REPO_NAME',
      chartName: CHART_NAME,
      versions:  [{ version: 'VERSION' }]
    };

    const store = {
      getters: {
        'type-map/isProductActive': jest.fn(() => false),
        'catalog/chart':            jest.fn(() => chart)
      },
      dispatch: jest.fn(() => Promise.resolve())
    };

    const router = { replace: jest.fn() };

    const wrapper = shallowMount(createComponent(PRODUCT, CHART_NAME), { mocks: { $store: store, $router: router } });

    await wrapper.vm.$nextTick();
    expect(router.replace).toHaveBeenCalledWith({
      name:   'c-cluster-apps-charts-chart',
      params: { cluster: 'local' },
      query:  {
        'repo-type': chart.repoType,
        repo:        chart.repoName,
        chart:       chart.chartName,
        version:     chart.versions[0].version
      },
    });
  });

  it('should go to the cluster explorer page if we do not want to install the charts', async() => {
    const store = { getters: { 'type-map/isProductActive': jest.fn(() => false), currentCluster: { id: 'CURRENT_CLUSTER' } } };
    const router = { replace: jest.fn() };

    shallowMount(createComponent(PRODUCT, undefined, false), { mocks: { $store: store, $router: router } });

    expect(router.replace).toHaveBeenCalledWith({
      name:   'c-cluster-explorer',
      params: { cluster: store.getters.currentCluster.id },
    }
    );
  });
});
