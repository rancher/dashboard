import { shallowMount } from '@vue/test-utils';
import DetailWorkspace from '@shell/detail/management.cattle.io.fleetworkspace.vue';
import { FLEET } from '@shell/config/types';
import { NAME as FLEET_NAME } from '@shell/config/product/fleet';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';

describe('component: DetailWorkspace', () => {
  const mockValue = {
    id:     'fleet-default',
    counts: {
      gitRepos:      3,
      helmOps:       2,
      clusters:      5,
      cluster:       5,
      clusterGroup:  1,
      clusterGroups: 1,
    },
  };

  const mockRouter = { push: jest.fn() };

  const defaultStore = {
    commit:   jest.fn(),
    dispatch: jest.fn(),
    getters:  {
      'i18n/t':       (key: string) => key,
      'i18n/exists':  () => true,
      currentProduct: { name: FLEET_NAME },
    },
  };

  const createWrapper = (props = {}) => {
    return shallowMount(DetailWorkspace, {
      props:  { value: mockValue, ...props },
      global: {
        mocks: {
          $store:  defaultStore,
          $route:  { params: {} },
          $router: mockRouter,
        },
        stubs: {
          CountBox:     { template: '<div />', props: ['clickable', 'count', 'name', 'primaryColorVar'] },
          ResourceTabs: { template: '<div />' },
        },
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('applicationRoute', () => {
    it('should return the fleet application route', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.applicationRoute).toStrictEqual({
        name:   'c-cluster-fleet-application',
        params: { cluster: BLANK_CLUSTER },
      });
    });
  });

  describe('clustersRoute', () => {
    it('should return the fleet clusters list route', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.clustersRoute).toStrictEqual({
        name:   'c-cluster-product-resource',
        params: {
          cluster:  BLANK_CLUSTER,
          product:  FLEET_NAME,
          resource: FLEET.CLUSTER,
        },
      });
    });
  });

  describe('clusterGroupsRoute', () => {
    it('should return the fleet cluster groups list route', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.clusterGroupsRoute).toStrictEqual({
        name:   'c-cluster-product-resource',
        params: {
          cluster:  BLANK_CLUSTER,
          product:  FLEET_NAME,
          resource: FLEET.CLUSTER_GROUP,
        },
      });
    });
  });

  describe('setWorkspaceAndNavigate', () => {
    it('should commit updateWorkspace with the workspace id', () => {
      const wrapper = createWrapper();
      const route = wrapper.vm.applicationRoute;

      wrapper.vm.setWorkspaceAndNavigate(route);

      expect(defaultStore.commit).toHaveBeenCalledWith('updateWorkspace', {
        value:   'fleet-default',
        getters: defaultStore.getters,
      });
    });

    it('should dispatch prefs/set with the workspace id', () => {
      const wrapper = createWrapper();
      const route = wrapper.vm.applicationRoute;

      wrapper.vm.setWorkspaceAndNavigate(route);

      expect(defaultStore.dispatch).toHaveBeenCalledWith('prefs/set', {
        key:   expect.any(String),
        value: 'fleet-default',
      });
    });

    it('should navigate to the given route', () => {
      const wrapper = createWrapper();
      const route = wrapper.vm.clustersRoute;

      wrapper.vm.setWorkspaceAndNavigate(route);

      expect(mockRouter.push).toHaveBeenCalledWith(route);
    });
  });
});
