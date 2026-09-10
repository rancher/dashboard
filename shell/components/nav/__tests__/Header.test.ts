import { shallowMount } from '@vue/test-utils';
import { isReactive, markRaw } from 'vue';
import Header from '@shell/components/nav/Header.vue';
import { isMac } from '@shell/utils/platform';

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

  function createWrapper(routeOverride = {}, storeOverride = {}, extensionMock: any = { getDynamic: jest.fn() }, props = {}, stubsOverride: any = {}) {
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
      props,
      global: {
        mocks: {
          $store:     storeMock,
          $route:     routeMock,
          $config:    defaultConfigMock,
          $extension: extensionMock,
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
          ...stubsOverride,
        },
      },
    });
  }

  describe('a11y: brand logo', () => {
    it('should label the logo with the product name, not just "Logo"', () => {
      const wrapper = createWrapper(
        {
          name:   'home',
          path:   '/home',
          params: {},
        },
        { rootProduct: {} },
        undefined,
        { simple: true },
      );

      const brandImage = wrapper.find('[data-testid="header__brand-img"]');

      expect(brandImage.exists()).toBe(true);
      expect(brandImage.attributes('alt')).toBe('%branding.logos.logoLabel%');
    });
  });

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

    it.each([
      ['c-cluster-fleet-application-appco-credentials', '/c/local/fleet/application/suse-app-collection/credentials'],
      ['c-cluster-fleet-application-appco-charts', '/c/local/fleet/application/suse-app-collection/charts'],
      ['c-cluster-fleet-application-appco-chart', '/c/local/fleet/application/suse-app-collection/chart'],
    ])('should disable Workspace Switcher on AppCo page %s (via route meta)', (name, path) => {
      const wrapper = createWrapper({
        name,
        path,
        params: {},
        meta:   { disableWorkspaceSwitcher: true },
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

  describe('the cluster pin', () => {
    const cluster = (over: any = {}) => ({
      id: 'c-abc', nameDisplay: 'prod', isLocal: false, pinned: false, spec: { displayName: 'prod' }, pin: jest.fn(), unpin: jest.fn(), ...over
    });
    // The pin lives beside the cluster name, which only renders for a product that shows the switcher.
    const withCluster = (currentCluster: any, stubs: any = {}) => createWrapper({}, {
      currentCluster,
      currentProduct: { showClusterSwitcher: true },
      // Rendering the cluster area brings the header's action buttons with it, and those read the
      // feature flags the default mock does not carry.
      'features/get': () => false,
    }, { getDynamic: jest.fn() }, {}, stubs);

    // A stand-in for the pin control that records the toggle, so these tests assert the shortcut reaches
    // it rather than re-testing the control itself.
    const pinStub = (toggle: jest.Mock) => ({ Pinned: { template: '<span />', methods: { toggle } } });

    it('offers a pin for the cluster being explored', () => {
      const vm = withCluster(cluster()).vm as any;

      expect(vm.pinnableCluster).toMatchObject({ pinned: false, label: 'prod' });
    });

    // `local` holds a fixed slot in the nav and is filtered out of PINNED, so a pin on it would be an
    // affordance that changes nothing.
    it.each([
      ['local', cluster({ isLocal: true, nameDisplay: 'local' })],
      ['no cluster', null],
    ])('offers no pin for %s', (_label, currentCluster) => {
      expect((withCluster(currentCluster).vm as any).pinnableCluster).toBeNull();
    });

    it('names the action for the state the pin is in', () => {
      // The suite renders keys rather than copy, so match the key each state resolves to.
      expect((withCluster(cluster()).vm as any).pinTooltip).toContain('nav.header.pinCluster');
      expect((withCluster(cluster({ pinned: true })).vm as any).pinTooltip).toContain('nav.header.unpinCluster');
    });

    // The tooltip advertises the shortcut, so the label has to name the key the handler below listens
    // for — Alt, which a Mac keyboard calls Option and prints ⌥.
    // The label and the announced name have to name the keys the binding actually registers, or the
    // tooltip and a screen reader advertise a shortcut that does nothing.
    it('advertises the keys it binds', () => {
      const vm = withCluster(cluster()).vm as any;

      expect(vm.pinShortcutKeys).toStrictEqual({ windows: ['alt', 'p'], mac: ['meta', 'shift', 'p'] });
      // Whichever platform this runs on, the label and the announced name describe the same combo. Keyed
      // off the platform rather than off the label's own text: comparing against the label meant a change
      // to how it is WRITTEN silently sent this assertion down the other platform's branch.
      expect(vm.pinShortcutLabel).toBe(isMac ? '⌘-Shift-P' : 'Alt-P');
      expect(vm.pinAriaShortcut).toBe(isMac ? 'Meta+Shift+P' : 'Alt+P');
    });

    describe('the pin shortcut', () => {
      // Matching, and staying out of text fields, is the `v-shortkey` directive's job — this handler runs
      // only once the directive has decided the shortcut fired.
      it('toggles the pin through the control, so the write and the animation stay on one path', () => {
        const toggle = jest.fn();
        const vm = withCluster(cluster(), pinStub(toggle)).vm as any;

        vm.onPinShortcut();

        expect(toggle).toHaveBeenCalledWith();
      });

      it('does nothing on a cluster that cannot be pinned', () => {
        const toggle = jest.fn();
        const vm = withCluster(cluster({ isLocal: true }), pinStub(toggle)).vm as any;

        vm.onPinShortcut();

        expect(toggle).not.toHaveBeenCalled();
      });
    });
  });

  describe('navHeaderRight', () => {
    it('should store the raw dynamic component from getDynamic without making it reactive', () => {
      // getDynamic marks component definitions raw; the stored value must stay
      // non-reactive so Vue does not warn / add overhead when rendering it.
      const navHeaderRightComponent = markRaw({ name: 'NavHeaderRight', render: () => null });
      const wrapper = createWrapper({}, {}, { getDynamic: jest.fn(() => navHeaderRightComponent) });

      const stored = (wrapper.vm as any).navHeaderRight;

      expect(stored).toBe(navHeaderRightComponent);
      expect(isReactive(stored)).toBe(false);
    });

    it('should be null when no dynamic component is registered', () => {
      const wrapper = createWrapper({}, {}, { getDynamic: jest.fn(() => undefined) });

      expect((wrapper.vm as any).navHeaderRight).toBeNull();
    });
  });

  describe('extensionHeaderActionsAriaExpanded', () => {
    it('returns undefined for an action with no ariaExpanded', () => {
      const wrapper = createWrapper();

      (wrapper.vm as any).extensionHeaderActions = [{ label: 'Test', invoke: jest.fn() }];

      expect((wrapper.vm as any).extensionHeaderActionsAriaExpanded).toStrictEqual([undefined]);
    });

    it('returns the boolean value when ariaExpanded is a boolean', () => {
      const wrapper = createWrapper();

      (wrapper.vm as any).extensionHeaderActions = [
        {
          label:        'Open',
          invoke:       jest.fn(),
          ariaExpanded: true
        },
        {
          label:        'Closed',
          invoke:       jest.fn(),
          ariaExpanded: false
        },
      ];

      expect((wrapper.vm as any).extensionHeaderActionsAriaExpanded).toStrictEqual([true, false]);
    });

    it('calls ariaExpanded and returns its result when it is a function', () => {
      const wrapper = createWrapper();

      (wrapper.vm as any).extensionHeaderActions = [
        {
          label:        'Dynamic',
          invoke:       jest.fn(),
          ariaExpanded: () => true
        },
      ];

      expect((wrapper.vm as any).extensionHeaderActionsAriaExpanded).toStrictEqual([true]);
    });

    it('does not render aria-expanded attribute when value is undefined', async() => {
      const wrapper = createWrapper();

      (wrapper.vm as any).extensionHeaderActions = [{ label: 'Test', invoke: jest.fn() }];

      await wrapper.vm.$nextTick();

      const button = wrapper.find('[data-testid="extension-header-action-Test"]');

      expect(button.attributes('aria-expanded')).toBeUndefined();
    });

    it('renders aria-expanded attribute when value is a boolean', async() => {
      const wrapper = createWrapper();

      (wrapper.vm as any).extensionHeaderActions = [
        {
          label:        'Open',
          invoke:       jest.fn(),
          ariaExpanded: true
        },
      ];

      await wrapper.vm.$nextTick();

      const button = wrapper.find('[data-testid="extension-header-action-Open"]');

      expect(button.attributes('aria-expanded')).toBe('true');
    });
  });
});
