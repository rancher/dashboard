import { shallowMount, VueWrapper } from '@vue/test-utils';
import UiPluginsPage from '@shell/pages/c/_cluster/uiplugins/index.vue';
import { UI_PLUGIN_NAMESPACE } from '@shell/config/uiplugins';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

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
    it('should return "developer" label for isDeveloper plugins', () => {
      const plugin = { isDeveloper: true };
      const items = wrapper.vm.getFooterItems(plugin);

      expect(items[0].labels).toContain('plugins.labels.isDeveloper');
    });

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

    it('should display repository name for non-installed plugins with chart info', () => {
      const plugin = {
        installed: false,
        chart:     { repoNameDisplay: 'rancher-charts' },
        certified: true
      };
      const items = wrapper.vm.getFooterItems(plugin);

      expect(items).toHaveLength(1);
      expect(items[0].icon).toBe('repository-alt');
      expect(items[0].labels).toStrictEqual(['rancher-charts']);
    });

    it('should display repository name for installed plugins when chart info is present (original repo exists)', () => {
      const plugin = {
        installed: true,
        chart:     { repoNameDisplay: 'rancher-charts' },
        certified: true
      };
      const items = wrapper.vm.getFooterItems(plugin);

      expect(items).toHaveLength(1);
      expect(items[0].icon).toBe('repository-alt');
      expect(items[0].labels).toStrictEqual(['rancher-charts']);
    });

    it('should display original repository name for installed plugins when original repo was removed', () => {
      const plugin = {
        installed:               true,
        originalRepoNameDisplay: 'removed-repo',
        certified:               true
      };
      const items = wrapper.vm.getFooterItems(plugin);

      expect(items).toHaveLength(1);
      expect(items[0].icon).toBe('repository-alt');
      expect(items[0].labels).toStrictEqual(['removed-repo']);
    });

    it('should prefer chart.repoNameDisplay over originalRepoNameDisplay when both are present', () => {
      const plugin = {
        installed:               true,
        chart:                   { repoNameDisplay: 'current-repo' },
        originalRepoNameDisplay: 'original-repo',
        certified:               true
      };
      const items = wrapper.vm.getFooterItems(plugin);

      expect(items).toHaveLength(1);
      expect(items[0].labels).toStrictEqual(['current-repo']);
    });

    it('should NOT display repository name when neither chart nor originalRepoNameDisplay are present', () => {
      const plugin = {
        installed: true,
        certified: true
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
      const plugin = { chart: { versions: [{ annotations: { [CATALOG_ANNOTATIONS.DEPRECATED]: 'true' } }] } };
      const statuses = wrapper.vm.getStatuses(plugin);

      expect(statuses[0].tooltip.text).toBe('generic.deprecated');
      expect(statuses[0].color).toBe('error');
    });

    it('should return error status for installedError', () => {
      const plugin = { installedError: 'An error occurred' };
      const statuses = wrapper.vm.getStatuses(plugin);

      expect(statuses[0].icon).toBe('icon-alert-alt');
      expect(statuses[0].color).toBe('error');
      expect(statuses[0].tooltip.text).toBe('An error occurred');
    });

    it('should return warning status for incompatibilityMessage', () => {
      const plugin = { incompatibilityMessage: 'Incompatible version' };
      const statuses = wrapper.vm.getStatuses(plugin);

      expect(statuses[0].icon).toBe('icon-alert-alt');
      expect(statuses[0].color).toBe('error');
      expect(statuses[0].tooltip.text).toBe('Incompatible version');
    });

    it('should return error status for helmError', () => {
      const plugin = { helmError: true };
      const statuses = wrapper.vm.getStatuses(plugin);

      expect(statuses[0].icon).toBe('icon-alert-alt');
      expect(statuses[0].color).toBe('error');
      expect(statuses[0].tooltip.text).toBe('plugins.helmError');
    });

    it('should combine deprecated and error messages in a single tooltip', () => {
      const plugin = { chart: { versions: [{ annotations: { [CATALOG_ANNOTATIONS.DEPRECATED]: 'true' } }] }, helmError: true };
      const statuses = wrapper.vm.getStatuses(plugin);
      const errorStatus = statuses.find((status: any) => status.color === 'error');

      expect(errorStatus.tooltip.text).toBe('generic.deprecated<br/>plugins.helmError');
    });
  });

  describe('showInstallDialog', () => {
    let dispatchMock: jest.Mock;

    const createWrapper = (availablePlugins: any[] = []) => {
      dispatchMock = jest.fn().mockResolvedValue(true);

      const store = {
        getters: {
          'prefs/get':         jest.fn(),
          'catalog/rawCharts': {},
          'uiplugins/plugins': [],
          'uiplugins/errors':  {},
          'management/all':    () => [],
        },
        dispatch: dispatchMock,
      };

      const wrapper = shallowMount(UiPluginsPage, {
        global: {
          mocks: {
            $store: store,
            t,
          },
          stubs: { ActionMenu: { template: '<div />' } }
        }
      });

      // Mock the available computed property
      Object.defineProperty(wrapper.vm, 'available', { get: () => availablePlugins });

      return wrapper;
    };

    it('should open UninstallExistingExtensionDialog when installing a plugin that is already installed from a different source', () => {
      const installedPlugin = {
        id:        'other-repo/my-plugin',
        name:      'my-plugin',
        installed: true
      };
      const pluginToInstall = {
        id:   'new-repo/my-plugin',
        name: 'my-plugin'
      };

      const wrapper = createWrapper([installedPlugin, pluginToInstall]);

      wrapper.vm.showInstallDialog(pluginToInstall, 'install', {});

      expect(dispatchMock).toHaveBeenCalledWith(
        'management/promptModal',
        expect.objectContaining({ component: 'UninstallExistingExtensionDialog' })
      );
    });

    it('should NOT open InstallExtensionDialog when plugin is already installed from a different source', () => {
      const installedPlugin = {
        id:        'other-repo/my-plugin',
        name:      'my-plugin',
        installed: true
      };
      const pluginToInstall = {
        id:   'new-repo/my-plugin',
        name: 'my-plugin'
      };

      const wrapper = createWrapper([installedPlugin, pluginToInstall]);

      wrapper.vm.showInstallDialog(pluginToInstall, 'install', {});

      expect(dispatchMock).not.toHaveBeenCalledWith(
        'management/promptModal',
        expect.objectContaining({ component: 'InstallExtensionDialog' })
      );
    });

    it('should pass the installedPlugin to UninstallExistingExtensionDialog', () => {
      const installedPlugin = {
        id:        'other-repo/my-plugin',
        name:      'my-plugin',
        installed: true
      };
      const pluginToInstall = {
        id:   'new-repo/my-plugin',
        name: 'my-plugin'
      };

      const wrapper = createWrapper([installedPlugin, pluginToInstall]);

      wrapper.vm.showInstallDialog(pluginToInstall, 'install', {});

      expect(dispatchMock).toHaveBeenCalledWith(
        'management/promptModal',
        expect.objectContaining({
          component:      'UninstallExistingExtensionDialog',
          componentProps: expect.objectContaining({ installedPlugin })
        })
      );
    });

    it('should open InstallExtensionDialog when installing a plugin that is NOT installed from another source', () => {
      const pluginToInstall = {
        id:   'repo/my-plugin',
        name: 'my-plugin'
      };

      const wrapper = createWrapper([pluginToInstall]);

      wrapper.vm.showInstallDialog(pluginToInstall, 'install', {});

      expect(dispatchMock).toHaveBeenCalledWith(
        'management/promptModal',
        expect.objectContaining({ component: 'InstallExtensionDialog' })
      );
    });

    it('should open InstallExtensionDialog when the same plugin id is being re-installed (same source)', () => {
      const installedPlugin = {
        id:        'repo/my-plugin',
        name:      'my-plugin',
        installed: true
      };

      const wrapper = createWrapper([installedPlugin]);

      wrapper.vm.showInstallDialog(installedPlugin, 'install', {});

      expect(dispatchMock).toHaveBeenCalledWith(
        'management/promptModal',
        expect.objectContaining({ component: 'InstallExtensionDialog' })
      );
    });

    it('should open InstallExtensionDialog for upgrade action even if same name exists in another repo', () => {
      const installedPlugin = {
        id:        'repo-a/my-plugin',
        name:      'my-plugin',
        installed: true
      };
      const otherPlugin = {
        id:        'repo-b/my-plugin',
        name:      'my-plugin',
        installed: false
      };

      const wrapper = createWrapper([installedPlugin, otherPlugin]);

      // Upgrade action should always go to InstallExtensionDialog
      wrapper.vm.showInstallDialog(installedPlugin, 'upgrade', {});

      expect(dispatchMock).toHaveBeenCalledWith(
        'management/promptModal',
        expect.objectContaining({ component: 'InstallExtensionDialog' })
      );
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
            { name: 'plugin1', id: 'repo/plugin1' },
            { name: 'plugin2', id: 'repo/plugin2' },
            { name: 'plugin3', id: 'repo/plugin3' },
            { name: 'plugin4', id: 'repo/plugin4' },
          ],
          hasMenuActions: () => true,
          menuActions:    () => []
        }
      });

      updatePluginInstallStatusMock = jest.fn();
      wrapper.vm.updatePluginInstallStatus = updatePluginInstallStatusMock;

      // Set the 'installing' status on the component instance
      wrapper.vm.installing = {
        'repo/plugin1': 'install',
        'repo/plugin2': 'downgrade',
        'repo/plugin3': 'uninstall',
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

      expect(updatePluginInstallStatusMock).toHaveBeenCalledWith('repo/plugin1', 'install');
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
      expect(updatePluginInstallStatusMock).not.toHaveBeenCalledWith('repo/plugin2', 'upgrade');
    });

    it('should clear status for a completed uninstall operation', async() => {
      const helmOps = [{
        namespace: UI_PLUGIN_NAMESPACE,
        status:    { releaseName: 'plugin3', action: 'uninstall' },
        metadata:  { creationTimestamp: '1', state: { transitioning: false } }
      }];

      wrapper.vm.helmOps = helmOps;
      await wrapper.vm.$nextTick();

      expect(updatePluginInstallStatusMock).toHaveBeenCalledWith('repo/plugin3', false);
    });

    it('should set error and clear status for a failed operation', async() => {
      const helmOps = [{
        namespace: UI_PLUGIN_NAMESPACE,
        status:    { releaseName: 'plugin1', action: 'install' },
        metadata:  { creationTimestamp: '1', state: { transitioning: false, error: true } }
      }];

      wrapper.vm.helmOps = helmOps;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.errors['repo/plugin1']).toBe(true);
      expect(updatePluginInstallStatusMock).toHaveBeenCalledWith('repo/plugin1', false);
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
      expect(updatePluginInstallStatusMock).toHaveBeenCalledWith('repo/plugin4', false);
    });
  });
});
