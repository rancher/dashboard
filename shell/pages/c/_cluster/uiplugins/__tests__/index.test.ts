import { shallowMount, VueWrapper } from '@vue/test-utils';
import UiPluginsPage from '@shell/pages/c/_cluster/uiplugins/index.vue';
import { UI_PLUGIN_NAMESPACE } from '@shell/config/uiplugins';

const t = (key: string, args: Object) => {
  if (args) {
    return `${ key } with ${ JSON.stringify(args) }`;
  }

  return key;
};

describe('page: UI plugins/Extensions', () => {
  let wrapper: VueWrapper<any>;

  const mountComponent = (mocks = {}) => {
    const store = {
      getters: {
        'prefs/get':         jest.fn(),
        'catalog/rawCharts': [],
        'uiplugins/plugins': [],
        'uiplugins/errors':  {},
      },
      dispatch: () => Promise.resolve(),
    };

    return shallowMount(UiPluginsPage, {
      global: {
        mocks: {
          $store: store,
          t,
          ...mocks,
        },
        stubs: { ActionMenu: { template: '<div />' } }
      }
    });
  };

  beforeEach(() => {
    wrapper = mountComponent();
  });

  describe('getPluginActions', () => {
    it('should return install action for a non-installed plugin with installable versions', () => {
      const plugin = {
        installed:           false,
        installableVersions: [{ version: '1.0.0' }],
        builtin:             false,
        upgrade:             null,
      };
      const actions = wrapper.vm.getPluginActions(plugin);

      expect(actions).toHaveLength(1);
      expect(actions[0].action).toBe('install');
    });

    it('should return uninstall action for an installed, non-builtin plugin', () => {
      const plugin = {
        installed:           true,
        installableVersions: [],
        builtin:             false,
        upgrade:             null,
      };
      const actions = wrapper.vm.getPluginActions(plugin);

      expect(actions.find((action: any) => action.action === 'uninstall')).toBeDefined();
    });

    it('should not return uninstall action for a builtin plugin', () => {
      const plugin = {
        installed:           true,
        installableVersions: [],
        builtin:             true,
        upgrade:             null,
      };
      const actions = wrapper.vm.getPluginActions(plugin);

      expect(actions.some((action: any) => action.action === 'uninstall')).toBe(false);
    });

    it('should return upgrade action for an installed plugin with an upgrade', () => {
      const plugin = {
        installed:           true,
        installableVersions: [],
        builtin:             false,
        upgrade:             '1.1.0',
      };
      const actions = wrapper.vm.getPluginActions(plugin);

      expect(actions.some((action: any) => action.action === 'upgrade')).toBe(true);
    });

    it('should return downgrade action for an installed plugin with older installable versions', () => {
      const plugin = {
        installed:           true,
        installableVersions: [{ version: '1.0.0' }, { version: '0.9.0' }],
        builtin:             false,
        upgrade:             null,
        installedVersion:    '1.0.0',
      };
      const actions = wrapper.vm.getPluginActions(plugin);

      expect(actions.some((action: any) => action.action === 'downgrade')).toBe(true);
    });

    it('should return all applicable actions (upgrade, downgrade, uninstall)', () => {
      const plugin = {
        installed:           true,
        installableVersions: [{ version: '1.1.0' }, { version: '1.0.0' }, { version: '0.9.0' }],
        builtin:             false,
        upgrade:             '1.1.0',
        installedVersion:    '1.0.0',
      };
      const actions = wrapper.vm.getPluginActions(plugin);

      expect(actions.map((action: any) => action.action)).toContain('uninstall');
      expect(actions.map((action: any) => action.action)).toContain('upgrade');
      expect(actions.map((action: any) => action.action)).toContain('downgrade');
    });
  });

  describe('getSubHeaderItems', () => {
    it('should return version info', () => {
      const plugin = { displayVersionLabel: 'v1.0.0' };
      const items = wrapper.vm.getSubHeaderItems(plugin);

      expect(items[0].label).toBe('v1.0.0');
    });

    it('should show installing status', () => {
      const plugin = { displayVersionLabel: 'v1.0.0', installing: 'install' };
      const items = wrapper.vm.getSubHeaderItems(plugin);

      expect(items.find((item: any) => item.label === 'plugins.labels.installing')).toBeDefined();
    });

    it('should show uninstalling status', () => {
      const plugin = { displayVersionLabel: 'v1.0.0', installing: 'uninstall' };
      const items = wrapper.vm.getSubHeaderItems(plugin);

      expect(items.find((item: any) => item.label === 'plugins.labels.uninstalling')).toBeDefined();
    });

    it('should show upgrading status', () => {
      const plugin = { displayVersionLabel: 'v1.0.0', installing: 'upgrade' };
      const items = wrapper.vm.getSubHeaderItems(plugin);

      expect(items.find((item: any) => item.label === 'plugins.labels.upgrading')).toBeDefined();
    });

    it('should show downgrading status', () => {
      const plugin = { displayVersionLabel: 'v1.0.0', installing: 'downgrade' };
      const items = wrapper.vm.getSubHeaderItems(plugin);

      expect(items.find((item: any) => item.label === 'plugins.labels.downgrading')).toBeDefined();
    });

    it('should include date info', () => {
      const plugin = { created: '2023-01-01T00:00:00Z' };
      const items = wrapper.vm.getSubHeaderItems(plugin);

      expect(items.find((item: any) => item.icon === 'icon-refresh-alt')).toBeDefined();
    });
  });

  describe('getFooterItems', () => {
    it('should return "builtin" label for builtin plugins', () => {
      const plugin = { builtin: true };
      const items = wrapper.vm.getFooterItems(plugin);

      expect(items[0].labels).toContain('plugins.labels.builtin');
    });

    it('should return "third-party" label for non-certified, non-builtin plugins', () => {
      const plugin = { builtin: false, certified: false };
      const items = wrapper.vm.getFooterItems(plugin);

      expect(items[0].labels).toContain('plugins.labels.third-party');
    });

    it('should not return "third-party" for certified plugins', () => {
      const plugin = { builtin: false, certified: true };
      const items = wrapper.vm.getFooterItems(plugin);

      expect(items).toHaveLength(0);
    });

    it('should return "experimental" label for experimental plugins', () => {
      const plugin = { builtin: false, experimental: true };
      const items = wrapper.vm.getFooterItems(plugin);

      expect(items[0].labels).toContain('plugins.labels.experimental');
    });

    it('should return no items if no labels apply', () => {
      const plugin = {
        builtin: false, certified: true, experimental: false
      };
      const items = wrapper.vm.getFooterItems(plugin);

      expect(items).toHaveLength(0);
    });
  });

  describe('getStatuses', () => {
    it('should return "installed" status with version for installed, non-builtin plugins', () => {
      const plugin = {
        installed:        true,
        builtin:          false,
        installing:       false,
        installedVersion: '1.2.3',
      };
      const statuses = wrapper.vm.getStatuses(plugin);

      expect(statuses[0].tooltip.text).toBe('generic.installed (1.2.3)');
    });

    it('should return "upgradeable" status for plugins with an upgrade', () => {
      const plugin = { upgrade: '1.1.0' };
      const statuses = wrapper.vm.getStatuses(plugin);

      expect(statuses[0].tooltip.key).toBe('generic.upgradeable');
    });

    it('should return "deprecated" status for deprecated plugins', () => {
      const plugin = { chart: { deprecated: true } };
      const statuses = wrapper.vm.getStatuses(plugin);

      expect(statuses[0].tooltip.key).toBe('generic.deprecated');
    });

    it('should return error status for installedError', () => {
      const plugin = { installedError: 'An error occurred' };
      const statuses = wrapper.vm.getStatuses(plugin);

      expect(statuses[0].icon).toBe('icon-alert-alt');
      expect(statuses[0].tooltip.text).toBe('generic.error: An error occurred');
    });

    it('should return error status for incompatibilityMessage', () => {
      const plugin = { incompatibilityMessage: 'Incompatible version' };
      const statuses = wrapper.vm.getStatuses(plugin);

      expect(statuses[0].icon).toBe('icon-alert-alt');
      expect(statuses[0].tooltip.text).toBe('generic.error: Incompatible version');
    });

    it('should return error status for helmError', () => {
      const plugin = { helmError: true };
      const statuses = wrapper.vm.getStatuses(plugin);

      expect(statuses[0].icon).toBe('icon-alert-alt');
      expect(statuses[0].tooltip.text).toBe('generic.error: plugins.helmError');
    });

    it('should combine deprecated and other errors in tooltip', () => {
      const plugin = { chart: { deprecated: true }, helmError: true };
      const statuses = wrapper.vm.getStatuses(plugin);
      const warningStatus = statuses.find((status: any) => status.icon === 'icon-alert-alt');

      expect(warningStatus.tooltip.text).toBe('generic.deprecated. generic.error: plugins.helmError');
    });
  });

  describe('watch: helmOps', () => {
    let wrapper: VueWrapper<any>;
    let updatePluginInstallStatusMock: jest.Mock;

    beforeEach(() => {
      const store = {
        getters: {
          'prefs/get':         jest.fn(),
          'catalog/rawCharts': {},
          'uiplugins/plugins': [],
          'uiplugins/errors':  {},
          'features/get':      () => true,
        },
        dispatch: () => Promise.resolve(true),
      };

      wrapper = shallowMount(UiPluginsPage, {
        global: {
          mocks: {
            $store: store,
            t,
          },
          stubs: { ActionMenu: { template: '<div />' } }
        },
        computed: {
          // Override the computed property for this test suite
          available: () => [
            { name: 'plugin1' },
            { name: 'plugin2' },
            { name: 'plugin3' },
            { name: 'plugin4' },
          ],
          hasMenuActions: () => true,
          menuActions:    () => []
        }
      });

      updatePluginInstallStatusMock = jest.fn();
      wrapper.vm.updatePluginInstallStatus = updatePluginInstallStatusMock;

      // Set the 'installing' status on the component instance
      wrapper.vm.installing = {
        plugin1: 'install',
        plugin2: 'downgrade',
        plugin3: 'uninstall',
      };

      // Reset errors
      wrapper.vm.errors = {};
    });

    it('should update status for an active operation', async() => {
      const helmOps = [{
        namespace: UI_PLUGIN_NAMESPACE,
        status:    { releaseName: 'plugin1', action: 'install' },
        metadata:  { creationTimestamp: '1', state: { transitioning: true } }
      }];

      wrapper.vm.helmOps = helmOps;
      await wrapper.vm.$nextTick();

      expect(updatePluginInstallStatusMock).toHaveBeenCalledWith('plugin1', 'install');
    });

    it('should not update status for an upgrade op when a downgrade was initiated', async() => {
      const helmOps = [{
        namespace: UI_PLUGIN_NAMESPACE,
        status:    { releaseName: 'plugin2', action: 'upgrade' },
        metadata:  { creationTimestamp: '1', state: { transitioning: true } }
      }];

      wrapper.vm.helmOps = helmOps;
      await wrapper.vm.$nextTick();

      // It should not be called with 'upgrade' for plugin2
      expect(updatePluginInstallStatusMock).not.toHaveBeenCalledWith('plugin2', 'upgrade');
    });

    it('should clear status for a completed uninstall operation', async() => {
      const helmOps = [{
        namespace: UI_PLUGIN_NAMESPACE,
        status:    { releaseName: 'plugin3', action: 'uninstall' },
        metadata:  { creationTimestamp: '1', state: { transitioning: false } }
      }];

      wrapper.vm.helmOps = helmOps;
      await wrapper.vm.$nextTick();

      expect(updatePluginInstallStatusMock).toHaveBeenCalledWith('plugin3', false);
    });

    it('should set error and clear status for a failed operation', async() => {
      const helmOps = [{
        namespace: UI_PLUGIN_NAMESPACE,
        status:    { releaseName: 'plugin1', action: 'install' },
        metadata:  { creationTimestamp: '1', state: { transitioning: false, error: true } }
      }];

      wrapper.vm.helmOps = helmOps;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.errors.plugin1).toBe(true);
      expect(updatePluginInstallStatusMock).toHaveBeenCalledWith('plugin1', false);
    });

    it('should clear status for plugins with no active operation', async() => {
      const helmOps = [{
        namespace: UI_PLUGIN_NAMESPACE,
        status:    { releaseName: 'plugin1', action: 'install' },
        metadata:  { creationTimestamp: '1', state: { transitioning: true } }
      }];

      wrapper.vm.helmOps = helmOps;
      await wrapper.vm.$nextTick();

      // plugin4 has no op, so its status should be cleared
      expect(updatePluginInstallStatusMock).toHaveBeenCalledWith('plugin4', false);
    });
  });
});
