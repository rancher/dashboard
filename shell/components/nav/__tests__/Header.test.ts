import { shallowMount } from '@vue/test-utils';
import Header from '@shell/components/nav/Header.vue';

describe('component: Header', () => {
  const defaultStoreMock = {
    getters: {
      clusterReady:            false,
      isExplorer:              false,
      isRancher:               false,
      currentCluster:          null,
      currentProduct:          null,
      rootProduct:             { name: 'fleet' },
      backToRancherLink:       '',
      backToRancherGlobalLink: '',
      pageActions:             [],
      isSingleProduct:         false,
      isRancherInHarvester:    false,
      showTopLevelMenu:        false,
      showWorkspaceSwitcher:   true,
      'management/schemaFor':  () => null,
      'management/all':        () => [],
      'rancher/schemaFor':     () => null,
      'rancher/byId':          () => null,
      'rancher/all':           () => [],
      'auth/principalId':      'test',
      'auth/enabled':          false,
      'i18n/withFallback':     () => '',
    },
    dispatch: jest.fn(),
    commit:   jest.fn(),
  };

  const defaultRouteMock = {
    name:   'c-cluster-fleet-application-resource',
    path:   '/c/local/fleet/application/fleet.cattle.io.gitrepo',
    params: { resource: 'fleet.cattle.io.gitrepo' },
  };

  const defaultConfigMock = { rancherEnv: 'web' };

  function createWrapper(routeOverride = {}, storeOverride = {}) {
    const routeMock = {
      ...defaultRouteMock,
      ...routeOverride,
    };

    const storeMock = {
      ...defaultStoreMock,
      getters: {
        ...defaultStoreMock.getters,
        ...storeOverride,
      },
      dispatch: jest.fn(),
      commit:   jest.fn(),
    };

    return shallowMount(Header as any, {
      global: {
        mocks: {
          $store:     storeMock,
          $route:     routeMock,
          $config:    defaultConfigMock,
          $extension: { getDynamic: jest.fn() },
        },
        stubs: {
          'router-link':        { template: '<a><slot /></a>' },
          BrandImage:           { template: '<span />' },
          ClusterProviderIcon:  { template: '<span />' },
          ClusterBadge:         { template: '<span />' },
          TopLevelMenu:         { template: '<div />' },
          NamespaceFilter:      { template: '<div />' },
          WorkspaceSwitcher:    { template: '<div />' },
          IconOrSvg:            { template: '<span />' },
          AppModal:             { template: '<div />' },
          NotificationCenter:   { template: '<div />' },
          HeaderPageActionMenu: { template: '<div />' },
          RcDropdown:           { template: '<div><slot /><slot name="dropdownCollection" /></div>' },
          RcDropdownItem:       { template: '<div><slot /></div>' },
          RcDropdownSeparator:  { template: '<hr />' },
          RcDropdownTrigger:    { template: '<button><slot /></button>' },
        },
      },
    });
  }

  describe('disableWorkspaceSwitcher', () => {
    it('should return false on a list page', () => {
      const wrapper = createWrapper({
        name:   'c-cluster-fleet-application-resource',
        path:   '/c/local/fleet/application/fleet.cattle.io.gitrepo',
        params: { resource: 'fleet.cattle.io.gitrepo' },
      });

      expect((wrapper.vm as any).disableWorkspaceSwitcher).toBe(false);
    });

    it('should return true on a detail page (route has an id param)', () => {
      const wrapper = createWrapper({
        name:   'c-cluster-fleet-application-resource-namespace-id',
        path:   '/c/local/fleet/application/fleet.cattle.io.gitrepo/fleet-default/my-repo',
        params: {
          resource: 'fleet.cattle.io.gitrepo', namespace: 'fleet-default', id: 'my-repo'
        },
      });

      expect((wrapper.vm as any).disableWorkspaceSwitcher).toBe(true);
    });

    it('should return true on a create page (route name ends with -create)', () => {
      const wrapper = createWrapper({
        name:   'c-cluster-fleet-application-resource-create',
        path:   '/c/local/fleet/application/fleet.cattle.io.gitrepo/create',
        params: { resource: 'fleet.cattle.io.gitrepo' },
      });

      expect((wrapper.vm as any).disableWorkspaceSwitcher).toBe(true);
    });

    it('should return true on the application create page', () => {
      const wrapper = createWrapper({
        name:   'c-cluster-fleet-application-create',
        path:   '/c/local/fleet/application/create',
        params: {},
      });

      expect((wrapper.vm as any).disableWorkspaceSwitcher).toBe(true);
    });

    it('should return false on the Workspaces list page', () => {
      const wrapper = createWrapper({
        name:   'c-cluster-fleet-application-resource',
        path:   '/c/local/fleet/application/management.cattle.io.fleetworkspace',
        params: { resource: 'management.cattle.io.fleetworkspace' },
      });

      expect((wrapper.vm as any).disableWorkspaceSwitcher).toBe(false);
    });

    it('should return false on a non-workspace resource list page', () => {
      const wrapper = createWrapper({
        name:   'c-cluster-fleet-application-resource',
        path:   '/c/local/fleet/application/fleet.cattle.io.cluster',
        params: { resource: 'fleet.cattle.io.cluster' },
      });

      expect((wrapper.vm as any).disableWorkspaceSwitcher).toBe(false);
    });

    it('should return true on an edit page (route has an id param)', () => {
      const wrapper = createWrapper({
        name:   'c-cluster-fleet-application-resource-namespace-id',
        path:   '/c/local/fleet/application/fleet.cattle.io.gitrepo/fleet-default/my-repo?mode=edit',
        params: {
          resource: 'fleet.cattle.io.gitrepo', namespace: 'fleet-default', id: 'my-repo'
        },
      });

      expect((wrapper.vm as any).disableWorkspaceSwitcher).toBe(true);
    });
  });

  describe('showFilter', () => {
    it('should return true on a list page when showWorkspaceSwitcher is enabled', () => {
      const wrapper = createWrapper(
        {
          name:   'c-cluster-fleet-application-resource',
          path:   '/c/local/fleet/application/fleet.cattle.io.gitrepo',
          params: { resource: 'fleet.cattle.io.gitrepo' },
        },
        { currentProduct: { showWorkspaceSwitcher: true } },
      );

      expect((wrapper.vm as any).showFilter).toBe(true);
    });

    it('should return true when showWorkspaceSwitcher is enabled on a detail page (switcher visible but disabled)', () => {
      const wrapper = createWrapper(
        {
          name:   'c-cluster-fleet-application-resource-namespace-id',
          path:   '/c/local/fleet/application/fleet.cattle.io.gitrepo/fleet-default/my-repo',
          params: {
            resource: 'fleet.cattle.io.gitrepo', namespace: 'fleet-default', id: 'my-repo'
          },
        },
        { currentProduct: { showWorkspaceSwitcher: true } },
      );

      expect((wrapper.vm as any).showFilter).toBe(true);
    });

    it('should return true when showWorkspaceSwitcher is enabled on a create page (switcher visible but disabled)', () => {
      const wrapper = createWrapper(
        {
          name:   'c-cluster-fleet-application-resource-create',
          path:   '/c/local/fleet/application/fleet.cattle.io.gitrepo/create',
          params: { resource: 'fleet.cattle.io.gitrepo' },
        },
        { currentProduct: { showWorkspaceSwitcher: true } },
      );

      expect((wrapper.vm as any).showFilter).toBe(true);
    });

    it('should return false when showWorkspaceSwitcher is false in the store (e.g. Workspaces page)', () => {
      const wrapper = createWrapper(
        {
          name:   'c-cluster-fleet-application-resource',
          path:   '/c/local/fleet/application/management.cattle.io.fleetworkspace',
          params: { resource: 'management.cattle.io.fleetworkspace' },
        },
        {
          currentProduct:        { showWorkspaceSwitcher: true },
          showWorkspaceSwitcher: false,
        },
      );

      expect((wrapper.vm as any).showFilter).toBe(false);
    });

    it('should return true when showNamespaceFilter is enabled regardless of route', () => {
      const wrapper = createWrapper(
        {
          name:   'c-cluster-fleet-application-resource-namespace-id',
          path:   '/c/local/fleet/application/fleet.cattle.io.gitrepo/fleet-default/my-repo',
          params: {
            resource: 'fleet.cattle.io.gitrepo', namespace: 'fleet-default', id: 'my-repo'
          },
        },
        { currentCluster: { id: 'local' }, currentProduct: { showNamespaceFilter: true } },
      );

      expect((wrapper.vm as any).showFilter).toBe(true);
    });
  });
});
