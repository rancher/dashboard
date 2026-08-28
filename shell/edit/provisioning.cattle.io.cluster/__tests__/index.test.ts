import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ClusterCreate from '@shell/edit/provisioning.cattle.io.cluster/index.vue';
import { MANAGEMENT } from '@shell/config/types';
import { FROM_CLUSTER } from '@shell/config/query-params';
import { BLANK_CLUSTER } from '@shell/store/store-types';
jest.mock('@shell/edit/provisioning.cattle.io.cluster/shared', () => ({
  RETENTION_DEFAULT:         5,
  RKE2_INGRESS_NGINX:        'rke2-ingress-nginx',
  RKE2_TRAEFIK:              'rke2-traefik',
  INGRESS_NGINX:             'ingress-nginx',
  INGRESS_CONTROLLER:        'ingress-controller',
  TRAEFIK:                   'traefik',
  HARVESTER:                 'harvester',
  INGRESS_DUAL:              'dual',
  INGRESS_NONE:              'none',
  INGRESS_OPTIONS:           [],
  INGRESS_MIGRATION_KB_LINK: 'mock-link'
}));
describe('component: Cluster: Create', () => {
  it('should hide RKE1 and RKE2 toggle button if RKE1 ui feature flag is NOT set', () => {
    const store = createStore({
      modules: {
        i18n: {
          namespaced: true,
          getters:    {
            t:            jest.fn(),
            withFallback: () => jest.fn(),
          }
        },
        features: {
          namespaced: true,
          getters:    {
            get:          () => jest.fn(),
            withFallback: jest.fn(),
          }
        },
        prefs: {
          namespaced: true,
          getters:    { get: jest.fn() }
        },
        mapFeature: {
          namespaced: true,
          getters:    { get: jest.fn() }
        },
        'type-map': {
          namespaced: true,
          getters:    { activeProducts: () => [] }
        },
        catalog: {
          namespaced: true,
          getters:    { charts: () => [] }
        }
      },
      getters: {
        defaultClusterId: jest.fn(),
        clusterId:        jest.fn()
      }
    });

    const wrapper = shallowMount(ClusterCreate, {
      computed: { rke1UiEnabled: () => false },

      props: {
        value:           { metadata: {}, spec: { template: {} } },
        realMode:        '',
        mode:            'edit',
        componentTestid: 'cluster-manager-create',
      },

      global: {
        mocks: {
          $store:      store,
          $route:      { params: {}, query: {} },
          $router:     { applyQuery: jest.fn() },
          $fetchState: { pending: false },
        },

        stubs: { CruResource: { template: '<div><slot name="subtypes"></slot></div>' } },
      },
    });

    const element = wrapper.find('[data-testid="cluster-manager-create-rke-switch"]');

    expect(element.exists()).toBe(false);
  });
});

describe('component: Cluster: Create - installing a cluster-scoped chart', () => {
  const mountWith = ({ canList, findResult, findRejects }: {
    canList: boolean, findResult?: any, findRejects?: boolean
  }) => {
    const chart = { goToInstall: jest.fn() };

    const store = createStore({
      modules: {
        i18n: {
          namespaced: true,
          getters:    {
            t:            jest.fn(),
            withFallback: () => jest.fn(),
          }
        },
        features: {
          namespaced: true,
          getters:    {
            get:          () => jest.fn(),
            withFallback: jest.fn(),
          }
        },
        prefs:      { namespaced: true, getters: { get: jest.fn() } },
        mapFeature: { namespaced: true, getters: { get: jest.fn() } },
        'type-map': { namespaced: true, getters: { activeProducts: () => [] } },
        catalog:    {
          namespaced: true,
          getters:    {
            charts: () => [],
            chart:  () => () => chart,
          }
        },
        management: {
          namespaced: true,
          getters:    { canList: () => () => canList },
          actions:    { find: () => (findRejects ? Promise.reject(new Error('404')) : Promise.resolve(findResult)) }
        }
      },
      getters: {
        defaultClusterId: jest.fn(),
        clusterId:        jest.fn()
      }
    });

    const dispatch = jest.spyOn(store, 'dispatch');

    const wrapper = shallowMount(ClusterCreate, {
      computed: { rke1UiEnabled: () => false },

      props: {
        value:           { metadata: {}, spec: { template: {} } },
        realMode:        '',
        mode:            'edit',
        componentTestid: 'cluster-manager-create',
      },

      global: {
        mocks: {
          $store:      store,
          $route:      { params: {}, query: {} },
          $router:     { applyQuery: jest.fn() },
          $fetchState: { pending: false },
        },
        stubs: { CruResource: { template: '<div><slot name="subtypes"></slot></div>' } },
      },
    });

    return {
      wrapper, chart, dispatch
    };
  };

  it('installs against the local cluster, resolved by id, when the user can access it', async() => {
    const { wrapper, chart, dispatch } = mountWith({ canList: true, findResult: { id: 'local' } });

    await (wrapper.vm as any).clickedType({ id: 'chart:my-chart' });

    expect(dispatch).toHaveBeenCalledWith('management/find', {
      type: MANAGEMENT.CLUSTER,
      id:   'local',
      opt:  { watch: false }
    });
    expect(chart.goToInstall).toHaveBeenCalledWith(FROM_CLUSTER, 'local', true);
  });

  it('falls back to the blank cluster when the local cluster cannot be fetched', async() => {
    const { wrapper, chart, dispatch } = mountWith({ canList: true, findRejects: true });

    await (wrapper.vm as any).clickedType({ id: 'chart:my-chart' });

    expect(dispatch).toHaveBeenCalledWith('management/find', {
      type: MANAGEMENT.CLUSTER,
      id:   'local',
      opt:  { watch: false }
    });
    expect(chart.goToInstall).toHaveBeenCalledWith(FROM_CLUSTER, BLANK_CLUSTER, true);
  });

  it('falls back to the blank cluster without a lookup when the user cannot list clusters', async() => {
    const { wrapper, chart, dispatch } = mountWith({ canList: false });

    await (wrapper.vm as any).clickedType({ id: 'chart:my-chart' });

    expect(dispatch).not.toHaveBeenCalledWith('management/find', expect.anything());
    expect(chart.goToInstall).toHaveBeenCalledWith(FROM_CLUSTER, BLANK_CLUSTER, true);
  });
});
