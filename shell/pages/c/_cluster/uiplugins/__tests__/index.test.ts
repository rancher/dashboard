import { shallowMount, VueWrapper } from '@vue/test-utils';
import UiPluginsPage from '@shell/pages/c/_cluster/uiplugins/index.vue';
import {
  UI_PLUGIN_NAMESPACE,
  UI_PLUGIN_CHART_ANNOTATIONS,
  EXTENSIONS_INCOMPATIBILITY_TYPES
} from '@shell/config/uiplugins';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

const t = (key: string, args?: object, raw?: boolean) => {
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

  describe('extractCertificationFlags', () => {
    it('should extract all flags as true when annotations match', () => {
      const annotations = {
        [CATALOG_ANNOTATIONS.PRIME_ONLY]:   'true',
        [CATALOG_ANNOTATIONS.EXPERIMENTAL]: 'true',
        [CATALOG_ANNOTATIONS.CERTIFIED]:    CATALOG_ANNOTATIONS._RANCHER,
      };
      const result = wrapper.vm.extractCertificationFlags(annotations);

      expect(result).toStrictEqual({
        primeOnly:    true,
        experimental: true,
        certified:    true,
      });
    });

    it('should return all flags as false when annotations are empty', () => {
      const result = wrapper.vm.extractCertificationFlags({});

      expect(result).toStrictEqual({
        primeOnly:    false,
        experimental: false,
        certified:    false,
      });
    });

    it('should return all flags as false when annotations are undefined', () => {
      const result = wrapper.vm.extractCertificationFlags(undefined);

      expect(result).toStrictEqual({
        primeOnly:    false,
        experimental: false,
        certified:    false,
      });
    });

    it('should not treat non-"true" values as truthy for primeOnly and experimental', () => {
      const annotations = {
        [CATALOG_ANNOTATIONS.PRIME_ONLY]:   'false',
        [CATALOG_ANNOTATIONS.EXPERIMENTAL]: '1',
        [CATALOG_ANNOTATIONS.CERTIFIED]:    'community',
      };
      const result = wrapper.vm.extractCertificationFlags(annotations);

      expect(result).toStrictEqual({
        primeOnly:    false,
        experimental: false,
        certified:    false,
      });
    });

    it('should handle partial annotations', () => {
      const annotations = { [CATALOG_ANNOTATIONS.PRIME_ONLY]: 'true' };
      const result = wrapper.vm.extractCertificationFlags(annotations);

      expect(result).toStrictEqual({
        primeOnly:    true,
        experimental: false,
        certified:    false,
      });
    });
  });

  describe('buildIncompatibilityMessage', () => {
    it('should build a message for HOST incompatibility type', () => {
      const versionData = {
        version:                    '2.0.0',
        versionIncompatibilityData: {
          type:           EXTENSIONS_INCOMPATIBILITY_TYPES.HOST,
          cardMessageKey: 'plugins.incompatible.host',
          required:       'rancher-prime',
          mainHost:       'rancher-manager',
        }
      };
      const result = wrapper.vm.buildIncompatibilityMessage(versionData);

      expect(result).toBe(`plugins.incompatible.host with ${ JSON.stringify({
        version:  '2.0.0',
        required: 'rancher-prime',
        mainHost: 'rancher-manager',
      }) }`);
    });

    it('should build a message for non-HOST incompatibility type without mainHost', () => {
      const versionData = {
        version:                    '2.0.0',
        versionIncompatibilityData: {
          type:           EXTENSIONS_INCOMPATIBILITY_TYPES.KUBE,
          cardMessageKey: 'plugins.incompatible.kube',
          required:       '1.25.0',
        }
      };
      const result = wrapper.vm.buildIncompatibilityMessage(versionData);

      expect(result).toBe(`plugins.incompatible.kube with ${ JSON.stringify({
        version:  '2.0.0',
        required: '1.25.0',
      }) }`);
    });

    it('should handle missing required field', () => {
      const versionData = {
        version:                    '2.0.0',
        versionIncompatibilityData: {
          type:           EXTENSIONS_INCOMPATIBILITY_TYPES.UI,
          cardMessageKey: 'plugins.incompatible.ui',
        }
      };
      const result = wrapper.vm.buildIncompatibilityMessage(versionData);

      expect(result).toBe(`plugins.incompatible.ui with ${ JSON.stringify({
        version:  '2.0.0',
        required: undefined,
      }) }`);
    });
  });

  describe('mapChartToPluginItem', () => {
    const createChartWrapper = (overrides = {}) => {
      const store = {
        getters: {
          'prefs/get':         jest.fn(),
          'catalog/rawCharts': [],
          'uiplugins/plugins': [],
          'uiplugins/errors':  {},
        },
        dispatch: () => Promise.resolve(),
      };

      const w = shallowMount(UiPluginsPage, {
        global: {
          mocks: {
            $store: store,
            t,
            ...overrides,
          },
          stubs: { ActionMenu: { template: '<div />' } }
        }
      });

      w.vm.rancherVersion = '2.9.0';
      w.vm.kubeVersion = '1.28.0';
      w.vm.installing = {};

      return w;
    };

    it('should map a chart with compatible versions correctly', () => {
      const w = createChartWrapper();

      const chart = {
        chartName:        'my-extension',
        chartNameDisplay: 'My Extension',
        chartDescription: 'A test extension',
        id:               'repo/my-extension',
        icon:             'chart-icon.svg',
        versions:         [{
          version:     '1.0.0',
          appVersion:  '1.0.0',
          created:     '2024-01-01',
          annotations: {
            [CATALOG_ANNOTATIONS.EXPERIMENTAL]: 'true',
            [CATALOG_ANNOTATIONS.CERTIFIED]:    CATALOG_ANNOTATIONS._RANCHER,
          }
        }]
      };

      const result = w.vm.mapChartToPluginItem(chart);

      expect(result.name).toBe('my-extension');
      expect(result.label).toBe('My Extension');
      expect(result.description).toBe('A test extension');
      expect(result.id).toBe('repo/my-extension');
      expect(result.installed).toBe(false);
      expect(result.builtin).toBe(false);
      expect(result.chart).toBe(chart);
      expect(result.versions).toHaveLength(1);
      expect(result.displayVersion).toBe('1.0.0');
      expect(result.displayVersionLabel).toBe('1.0.0');
    });

    it('should use chart annotation DISPLAY_NAME as label when present', () => {
      const w = createChartWrapper();

      const chart = {
        chartName:        'my-extension',
        chartNameDisplay: 'My Extension',
        chartDescription: 'desc',
        id:               'repo/my-extension',
        versions:         [{
          version:     '1.0.0',
          annotations: { [UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME]: 'Custom Display Name' }
        }],
      };

      const result = w.vm.mapChartToPluginItem(chart);

      expect(result.label).toBe('Custom Display Name');
    });

    it('should set installing status when plugin is being installed', () => {
      const w = createChartWrapper();

      w.vm.installing = { 'repo/my-extension': 'install' };

      const chart = {
        chartName:        'my-extension',
        chartNameDisplay: 'My Extension',
        chartDescription: 'desc',
        id:               'repo/my-extension',
        versions:         [{ version: '1.0.0', annotations: {} }]
      };

      const result = w.vm.mapChartToPluginItem(chart);

      expect(result.installing).toBe('install');
    });

    it('should extract certification flags from compatible version', () => {
      const w = createChartWrapper();

      const chart = {
        chartName:        'certified-extension',
        chartNameDisplay: 'Certified Extension',
        chartDescription: 'desc',
        id:               'repo/certified',
        versions:         [{
          version:     '1.0.0',
          annotations: {
            [CATALOG_ANNOTATIONS.PRIME_ONLY]:   'true',
            [CATALOG_ANNOTATIONS.EXPERIMENTAL]: 'false',
            [CATALOG_ANNOTATIONS.CERTIFIED]:    CATALOG_ANNOTATIONS._RANCHER,
          }
        }]
      };

      const result = w.vm.mapChartToPluginItem(chart);

      expect(result.primeOnly).toBe(true);
      expect(result.experimental).toBe(false);
      expect(result.certified).toBe(true);
    });
  });

  describe('buildLoadedPluginItem', () => {
    it('should build an item for a non-builtin loaded plugin', () => {
      const plugin = {
        name:     'my-plugin',
        id:       'my-plugin-id',
        builtin:  false,
        metadata: {
          version:     '1.2.3',
          description: 'Plugin description',
          icon:        'plugin-icon.svg',
          rancher:     { annotations: {} },
        }
      };

      const result = wrapper.vm.buildLoadedPluginItem(plugin);

      expect(result).toStrictEqual({
        name:                'my-plugin',
        label:               'my-plugin',
        description:         'Plugin description',
        icon:                'plugin-icon.svg',
        id:                  'my-plugin-id',
        versions:            [],
        displayVersion:      '1.2.3',
        displayVersionLabel: '1.2.3',
        installed:           true,
        installedVersion:    '1.2.3',
        builtin:             false,
        primeOnly:           false,
        experimental:        false,
        certified:           false,
      });
    });

    it('should use DISPLAY_NAME annotation as label when available', () => {
      const plugin = {
        name:     'my-plugin',
        id:       'my-plugin-id',
        builtin:  false,
        metadata: {
          version: '1.0.0',
          rancher: { annotations: { [UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME]: 'Pretty Name' } }
        }
      };

      const result = wrapper.vm.buildLoadedPluginItem(plugin);

      expect(result?.label).toBe('Pretty Name');
    });

    it('should return null for hidden builtin plugins', () => {
      const plugin = {
        name:     'hidden-builtin',
        id:       'hidden-id',
        builtin:  true,
        metadata: {
          version: '1.0.0',
          rancher: { [UI_PLUGIN_CHART_ANNOTATIONS.HIDDEN_BUILTIN]: true, annotations: {} }
        }
      };

      const result = wrapper.vm.buildLoadedPluginItem(plugin);

      expect(result).toBeNull();
    });

    it('should NOT return null for visible builtin plugins', () => {
      const plugin = {
        name:     'visible-builtin',
        id:       'visible-id',
        builtin:  true,
        metadata: {
          version: '1.0.0',
          rancher: { annotations: {} }
        }
      };

      const result = wrapper.vm.buildLoadedPluginItem(plugin);

      expect(result).not.toBeNull();
      expect(result?.builtin).toBe(true);
    });

    it('should default displayVersionLabel to "-" when version is missing', () => {
      const plugin = {
        name:     'no-version',
        id:       'no-version-id',
        builtin:  false,
        metadata: { rancher: { annotations: {} } }
      };

      const result = wrapper.vm.buildLoadedPluginItem(plugin);

      expect(result?.displayVersionLabel).toBe('-');
    });

    it('should extract certification flags from rancher annotations', () => {
      const plugin = {
        name:     'certified-plugin',
        id:       'cert-id',
        builtin:  false,
        metadata: {
          version: '1.0.0',
          rancher: {
            annotations: {
              [CATALOG_ANNOTATIONS.PRIME_ONLY]:   'true',
              [CATALOG_ANNOTATIONS.EXPERIMENTAL]: 'true',
              [CATALOG_ANNOTATIONS.CERTIFIED]:    CATALOG_ANNOTATIONS._RANCHER,
            }
          }
        }
      };

      const result = wrapper.vm.buildLoadedPluginItem(plugin);

      expect(result?.primeOnly).toBe(true);
      expect(result?.experimental).toBe(true);
      expect(result?.certified).toBe(true);
    });

    it('should handle metadata.rancher being a non-object', () => {
      const plugin = {
        name:     'legacy-plugin',
        id:       'legacy-id',
        builtin:  false,
        metadata: {
          version: '1.0.0',
          rancher: 'not-an-object'
        }
      };

      const result = wrapper.vm.buildLoadedPluginItem(plugin);

      expect(result?.label).toBe('legacy-plugin');
      expect(result?.primeOnly).toBe(false);
    });
  });

  describe('wirePluginCRToChart', () => {
    let wireWrapper: VueWrapper<any>;

    const createWireWrapper = (apps: any[] = []) => {
      const store = {
        getters: {
          'prefs/get':         jest.fn(),
          'catalog/rawCharts': {},
          'uiplugins/plugins': [],
          'uiplugins/errors':  {},
          'management/all':    () => apps,
          'i18n/withFallback': (_key: string, _fallback: null, repoName: string) => repoName,
        },
        dispatch: () => Promise.resolve(),
      };

      const w = shallowMount(UiPluginsPage, {
        global: {
          mocks: {
            $store: store,
            t,
          },
          stubs: { ActionMenu: { template: '<div />' } }
        }
      });

      w.vm.installing = {};

      return w;
    };

    beforeEach(() => {
      wireWrapper = createWireWrapper();
    });

    it('should wire CR to matching chart when found by repo name', () => {
      const apps = [{
        metadata: {
          name:      'my-plugin',
          namespace: UI_PLUGIN_NAMESPACE,
          labels:    { [CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME]: 'rancher-charts' }
        },
        spec: { chart: { metadata: { annotations: {} } } }
      }];

      wireWrapper = createWireWrapper(apps);

      const all: any[] = [{
        name:                'my-plugin',
        chart:               { repoName: 'rancher-charts' },
        installableVersions: [],
      }];

      const pluginCR = { name: 'my-plugin', version: '1.0.0' };

      wireWrapper.vm.wirePluginCRToChart(pluginCR, all);

      expect(all).toHaveLength(1);
      expect(all[0].installed).toBe(true);
      expect(all[0].uiplugin).toBe(pluginCR);
      expect(all[0].installedVersion).toBe('1.0.0');
    });

    it('should set upgrade when a newer installable version exists', () => {
      const apps = [{
        metadata: {
          name:      'my-plugin',
          namespace: UI_PLUGIN_NAMESPACE,
          labels:    { [CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME]: 'rancher-charts' }
        },
        spec: { chart: { metadata: { annotations: {} } } }
      }];

      wireWrapper = createWireWrapper(apps);

      const all: any[] = [{
        name:                'my-plugin',
        chart:               { repoName: 'rancher-charts' },
        installableVersions: [{
          version: '2.0.0', appVersion: '2.0.0', annotations: {}
        }],
      }];

      const pluginCR = { name: 'my-plugin', version: '1.0.0' };

      wireWrapper.vm.wirePluginCRToChart(pluginCR, all);

      expect(all[0].upgrade).toBe('2.0.0');
    });

    it('should NOT set upgrade when installed version matches latest', () => {
      const apps = [{
        metadata: {
          name:      'my-plugin',
          namespace: UI_PLUGIN_NAMESPACE,
          labels:    { [CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME]: 'rancher-charts' }
        },
        spec: { chart: { metadata: { annotations: {} } } }
      }];

      wireWrapper = createWireWrapper(apps);

      const all: any[] = [{
        name:                'my-plugin',
        chart:               { repoName: 'rancher-charts' },
        installableVersions: [{ version: '1.0.0', annotations: {} }],
      }];

      const pluginCR = { name: 'my-plugin', version: '1.0.0' };

      wireWrapper.vm.wirePluginCRToChart(pluginCR, all);

      expect(all[0].upgrade).toBeUndefined();
    });

    it('should push new item when no matching chart is found', () => {
      const apps = [{
        metadata: {
          name:      'orphan-plugin',
          namespace: UI_PLUGIN_NAMESPACE,
          labels:    { [CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME]: 'removed-repo' }
        },
        spec: {
          chart: {
            metadata: {
              name:        'Orphan Plugin',
              description: 'Plugin from removed repo',
              icon:        'orphan-icon.svg',
              annotations: { [UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME]: 'Orphan Display Name' }
            }
          }
        }
      }];

      wireWrapper = createWireWrapper(apps);

      const all: any[] = [];
      const pluginCR = {
        name:        'orphan-plugin',
        version:     '1.0.0',
        description: 'fallback desc',
        isDeveloper: false,
      };

      wireWrapper.vm.wirePluginCRToChart(pluginCR, all);

      expect(all).toHaveLength(1);
      expect(all[0].name).toBe('orphan-plugin');
      expect(all[0].label).toBe('Orphan Display Name');
      expect(all[0].description).toBe('Plugin from removed repo');
      expect(all[0].icon).toBe('orphan-icon.svg');
      expect(all[0].installed).toBe(true);
      expect(all[0].uiplugin).toBe(pluginCR);
      expect(all[0].originalRepoNameDisplay).toBe('removed-repo');
    });

    it('should push new item with fallback values when app has no chart metadata', () => {
      wireWrapper = createWireWrapper([]);

      const all: any[] = [];
      const pluginCR = {
        name:        'no-app-plugin',
        version:     '1.0.0',
        description: 'CR description',
        isDeveloper: true,
      };

      wireWrapper.vm.wirePluginCRToChart(pluginCR, all);

      expect(all).toHaveLength(1);
      expect(all[0].label).toBe('no-app-plugin');
      expect(all[0].description).toBe('CR description');
      expect(all[0].isDeveloper).toBe(true);
      expect(all[0].originalRepoNameDisplay).toBeNull();
    });

    it('should fall back to name-only match when repo name does not match', () => {
      const apps = [{
        metadata: {
          name:      'my-plugin',
          namespace: UI_PLUGIN_NAMESPACE,
          labels:    { [CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME]: 'repo-a' }
        },
        spec: { chart: { metadata: { annotations: {} } } }
      }];

      wireWrapper = createWireWrapper(apps);

      const all: any[] = [{
        name:                'my-plugin',
        chart:               { repoName: 'repo-b' },
        installableVersions: [],
      }];

      const pluginCR = { name: 'my-plugin', version: '1.0.0' };

      wireWrapper.vm.wirePluginCRToChart(pluginCR, all);

      expect(all).toHaveLength(1);
      expect(all[0].installed).toBe(true);
      expect(all[0].uiplugin).toBe(pluginCR);
      expect(all[0].installedVersion).toBe('1.0.0');
    });

    it('should fall back to name-only match when originalRepoName is undefined', () => {
      const apps = [{
        metadata: {
          name:      'my-plugin',
          namespace: UI_PLUGIN_NAMESPACE,
          labels:    {}
        },
        spec: { chart: { metadata: { annotations: {} } } }
      }];

      wireWrapper = createWireWrapper(apps);

      const all: any[] = [{
        name:                'my-plugin',
        chart:               { repoName: 'rancher-charts' },
        installableVersions: [],
      }];

      const pluginCR = { name: 'my-plugin', version: '1.0.0' };

      wireWrapper.vm.wirePluginCRToChart(pluginCR, all);

      expect(all).toHaveLength(1);
      expect(all[0].installed).toBe(true);
      expect(all[0].uiplugin).toBe(pluginCR);
      expect(all[0].installedVersion).toBe('1.0.0');
    });

    it('should preserve certification flags from chart when falling back to name-only match', () => {
      const apps = [{
        metadata: {
          name:      'my-plugin',
          namespace: UI_PLUGIN_NAMESPACE,
          labels:    {}
        },
        spec: { chart: { metadata: { annotations: {} } } }
      }];

      wireWrapper = createWireWrapper(apps);

      const all: any[] = [{
        name:                'my-plugin',
        chart:               { repoName: 'rancher-charts' },
        certified:           true,
        primeOnly:           false,
        experimental:        false,
        installableVersions: [],
      }];

      const pluginCR = { name: 'my-plugin', version: '1.0.0' };

      wireWrapper.vm.wirePluginCRToChart(pluginCR, all);

      expect(all).toHaveLength(1);
      expect(all[0].installed).toBe(true);
      expect(all[0].certified).toBe(true);
    });
  });

  describe('mergePluginErrors', () => {
    it('should set installedError for string UI errors', () => {
      const store = {
        getters: {
          'prefs/get':         jest.fn(),
          'catalog/rawCharts': [],
          'uiplugins/plugins': [],
          'uiplugins/errors':  { 'my-plugin': 'plugins.error.load' },
        },
        dispatch: () => Promise.resolve(),
      };

      const w = shallowMount(UiPluginsPage, {
        global: {
          mocks: { $store: store, t },
          stubs: { ActionMenu: { template: '<div />' } }
        }
      });

      w.vm.errors = {};

      const all = [{ name: 'my-plugin', id: 'repo/my-plugin' }];

      w.vm.mergePluginErrors(all);

      expect(all[0]).toHaveProperty('installedError', 'plugins.error.load');
    });

    it('should set empty installedError for non-string UI errors', () => {
      const store = {
        getters: {
          'prefs/get':         jest.fn(),
          'catalog/rawCharts': [],
          'uiplugins/plugins': [],
          'uiplugins/errors':  { 'my-plugin': true },
        },
        dispatch: () => Promise.resolve(),
      };

      const w = shallowMount(UiPluginsPage, {
        global: {
          mocks: { $store: store, t },
          stubs: { ActionMenu: { template: '<div />' } }
        }
      });

      w.vm.errors = {};

      const all = [{ name: 'my-plugin', id: 'repo/my-plugin' }];

      w.vm.mergePluginErrors(all);

      expect(all[0]).toHaveProperty('installedError', '');
    });

    it('should set helmError from component errors', () => {
      const all = [{ name: 'my-plugin', id: 'repo/my-plugin' }];

      wrapper.vm.errors = { 'repo/my-plugin': 'helm failed' };
      wrapper.vm.mergePluginErrors(all);

      expect(all[0]).toHaveProperty('helmError', true);
    });

    it('should not modify plugins that have no matching errors', () => {
      const store = {
        getters: {
          'prefs/get':         jest.fn(),
          'catalog/rawCharts': [],
          'uiplugins/plugins': [],
          'uiplugins/errors':  { 'other-plugin': 'some error' },
        },
        dispatch: () => Promise.resolve(),
      };

      const w = shallowMount(UiPluginsPage, {
        global: {
          mocks: { $store: store, t },
          stubs: { ActionMenu: { template: '<div />' } }
        }
      });

      w.vm.errors = { 'other-id': 'error' };

      const all = [{ name: 'my-plugin', id: 'repo/my-plugin' }];

      w.vm.mergePluginErrors(all);

      expect(all[0]).not.toHaveProperty('installedError');
      expect(all[0]).not.toHaveProperty('helmError');
    });

    it('should handle both UI errors and helm errors for different plugins', () => {
      const store = {
        getters: {
          'prefs/get':         jest.fn(),
          'catalog/rawCharts': [],
          'uiplugins/plugins': [],
          'uiplugins/errors':  { 'plugin-a': 'plugins.error.load' },
        },
        dispatch: () => Promise.resolve(),
      };

      const w = shallowMount(UiPluginsPage, {
        global: {
          mocks: { $store: store, t },
          stubs: { ActionMenu: { template: '<div />' } }
        }
      });

      w.vm.errors = { 'repo/plugin-b': 'helm failure' };

      const all = [
        { name: 'plugin-a', id: 'repo/plugin-a' },
        { name: 'plugin-b', id: 'repo/plugin-b' },
      ];

      w.vm.mergePluginErrors(all);

      expect(all[0]).toHaveProperty('installedError', 'plugins.error.load');
      expect(all[0]).not.toHaveProperty('helmError');
      expect(all[1]).not.toHaveProperty('installedError');
      expect(all[1]).toHaveProperty('helmError', true);
    });
  });
});
