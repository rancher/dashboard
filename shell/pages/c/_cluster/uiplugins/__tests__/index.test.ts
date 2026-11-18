import { shallowMount, VueWrapper } from '@vue/test-utils';
import UiPluginsPage from '@shell/pages/c/_cluster/uiplugins/index.vue';
import {
  UI_PLUGIN_NAMESPACE,
  UI_PLUGIN_CHART_ANNOTATIONS,
  UI_PLUGIN_METADATA,
  EXTENSIONS_INCOMPATIBILITY_TYPES
} from '@shell/config/uiplugins';
import { CATALOG as CATALOG_ANNOTATIONS } from '@shell/config/labels-annotations';

/**
 * `rancherVersion` and `kubeVersion` are `data()` members of `uiplugins/index.vue`
 * initialised to `null`, so `vue-tsc` infers their type as exactly `null` and
 * rejects the version strings these tests seed them with.
 */
interface ChartVersionContext {
  rancherVersion: string | null;
  kubeVersion: string | null;
}

const versionContextOf = (wrapper: { vm: unknown }): ChartVersionContext => wrapper.vm as ChartVersionContext;

/**
 * `plugins` is a `data()` member of `uiplugins/index.vue` initialised to `[]`, so
 * `vue-tsc` infers its type as exactly `never[]` and rejects the UIPlugin fixtures
 * these tests seed it with.
 */
interface PluginListContext {
  plugins: any[];
}

const pluginListOf = (wrapper: { vm: unknown }): PluginListContext => wrapper.vm as PluginListContext;

/**
 * `mapChartToPluginItem` (see `uiplugins/index.vue`) returns an object literal and
 * only then adds the version and certification members to it via `Object.assign`,
 * so those members are absent from the return type `vue-tsc` infers. Describe just
 * the ones these assertions read.
 */
interface MappedPluginItem {
  displayVersion?: string;
  displayVersionLabel?: string;
  installing?: string;
  primeOnly?: boolean;
  experimental?: boolean;
  certified?: boolean;
}

const assignedFieldsOf = (item: object): MappedPluginItem => item as MappedPluginItem;

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

    it('should not offer a downgrade from a chart whose app version is higher than its chart versions', () => {
      const plugin = {
        installed:           true,
        builtin:             false,
        installedVersion:    '0.4.10',
        installableVersions: [{ version: '0.4.11' }, { version: '0.4.10' }],
      };
      const actions = wrapper.vm.getPluginActions(plugin);

      expect(actions.some((action: any) => action.action === 'downgrade')).toBe(false);
    });

    it('should offer a downgrade to a lower chart version', () => {
      const plugin = {
        installed:           true,
        builtin:             false,
        installedVersion:    '0.4.11',
        installableVersions: [{ version: '0.4.11' }, { version: '0.4.10' }],
      };
      const actions = wrapper.vm.getPluginActions(plugin);

      expect(actions.some((action: any) => action.action === 'downgrade')).toBe(true);
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
        installed:           true,
        builtin:             false,
        installing:          false,
        installedVersion:    '1.2.3',
        displayVersionLabel: '1.2.3',
      };
      const statuses = wrapper.vm.getStatuses(plugin);

      expect(statuses[0].tooltip.text).toBe('generic.installed (1.2.3)');
    });

    it('should name both versions in the installed tooltip when the app version differs', () => {
      const plugin = {
        installed:           true,
        builtin:             false,
        installing:          false,
        installedVersion:    '0.4.10',
        displayVersionLabel: '4.1.0 (0.4.10)',
      };
      const statuses = wrapper.vm.getStatuses(plugin);

      expect(statuses[0].tooltip.text).toBe('generic.installed (4.1.0 (0.4.10))');
    });

    it('should return "upgradeable" status naming the latest version for plugins with an upgrade', () => {
      const plugin = { upgrade: '1.1.0' };
      const statuses = wrapper.vm.getStatuses(plugin);

      expect(statuses[0].tooltip.text).toBe('plugins.upgradeableTo with {"version":"1.1.0"}');
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

      versionContextOf(w).rancherVersion = '2.9.0';
      versionContextOf(w).kubeVersion = '1.28.0';
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
      expect(assignedFieldsOf(result).displayVersion).toBe('1.0.0');
      expect(assignedFieldsOf(result).displayVersionLabel).toBe('1.0.0');
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

      expect(assignedFieldsOf(result).installing).toBe('install');
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

      expect(assignedFieldsOf(result).primeOnly).toBe(true);
      expect(assignedFieldsOf(result).experimental).toBe(false);
      expect(assignedFieldsOf(result).certified).toBe(true);
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

    describe('version shown on the card', () => {
      const apps = [{
        metadata: {
          name:      'my-plugin',
          namespace: UI_PLUGIN_NAMESPACE,
          labels:    { [CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME]: 'rancher-charts' }
        },
        spec: { chart: { metadata: { annotations: {} } } }
      }];

      const chartWithVersions = (versions: any[]) => ({
        name:                'my-plugin',
        chart:               { repoName: 'rancher-charts' },
        displayVersion:      versions[0].version,
        displayVersionLabel: versions[0].version,
        versions,
        installableVersions: versions,
      });

      beforeEach(() => {
        wireWrapper = createWireWrapper(apps);
      });

      it('should show the installed version rather than the latest available one', () => {
        const all: any[] = [chartWithVersions([
          {
            version: '2.0.0', appVersion: '2.0.0', annotations: {}
          },
          {
            version: '1.0.0', appVersion: '1.0.0', annotations: {}
          },
        ])];

        wireWrapper.vm.wirePluginCRToChart({ name: 'my-plugin', version: '1.0.0' }, all);

        expect(all[0].displayVersion).toBe('1.0.0');
        expect(all[0].displayVersionLabel).toBe('1.0.0');
        expect(all[0].upgrade).toBe('2.0.0');
      });

      it('should show the installed chart version alongside its app version when they differ', () => {
        const all: any[] = [chartWithVersions([
          {
            version: '0.4.11', appVersion: '4.1.1', annotations: {}
          },
          {
            version: '0.4.10', appVersion: '4.1.0', annotations: {}
          },
        ])];

        wireWrapper.vm.wirePluginCRToChart({ name: 'my-plugin', version: '4.1.0' }, all);

        expect(all[0].displayVersion).toBe('0.4.10');
        expect(all[0].displayVersionLabel).toBe('4.1.0 (0.4.10)');
      });

      it('should show the installed version even when it is no longer compatible', () => {
        const all: any[] = [{
          name:                'my-plugin',
          chart:               { repoName: 'rancher-charts' },
          displayVersion:      '2.0.0',
          displayVersionLabel: '2.0.0',
          versions:            [
            {
              version: '2.0.0', appVersion: '2.0.0', annotations: {}, isVersionCompatible: true
            },
            {
              version: '1.0.0', appVersion: '1.0.0', annotations: {}, isVersionCompatible: false
            },
          ],
          installableVersions: [{
            version: '2.0.0', appVersion: '2.0.0', annotations: {}
          }],
        }];

        wireWrapper.vm.wirePluginCRToChart({ name: 'my-plugin', version: '1.0.0' }, all);

        expect(all[0].displayVersion).toBe('1.0.0');
        expect(all[0].displayVersionLabel).toBe('1.0.0');
      });

      it('should fall back to the plugin CR version when the chart has no matching version', () => {
        const all: any[] = [chartWithVersions([{
          version: '2.0.0', appVersion: '2.0.0', annotations: {}
        }])];

        wireWrapper.vm.wirePluginCRToChart({ name: 'my-plugin', version: '1.0.0' }, all);

        expect(all[0].displayVersion).toBe('1.0.0');
        expect(all[0].displayVersionLabel).toBe('1.0.0');
      });

      it('should take the installed chart version from the installed app', () => {
        const appsWithChartVersion = [{
          metadata: {
            name:      'my-plugin',
            namespace: UI_PLUGIN_NAMESPACE,
            labels:    { [CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME]: 'rancher-charts' }
          },
          spec: { chart: { metadata: { annotations: {}, version: '0.4.10' } } }
        }];
        const all: any[] = [chartWithVersions([
          {
            version: '0.4.11', appVersion: '4.1.1', annotations: {}
          },
          {
            version: '0.4.10', appVersion: '4.1.0', annotations: {}
          },
        ])];

        // the CR version is the app version, which is not what the versions list is keyed on
        createWireWrapper(appsWithChartVersion).vm.wirePluginCRToChart({ name: 'my-plugin', version: '4.1.0' }, all);

        expect(all[0].installedVersion).toBe('0.4.10');
      });

      it('should fall back to matching on app version when the app reports no chart version', () => {
        const all: any[] = [chartWithVersions([
          {
            version: '0.4.11', appVersion: '4.1.1', annotations: {}
          },
          {
            version: '0.4.10', appVersion: '4.1.0', annotations: {}
          },
        ])];

        wireWrapper.vm.wirePluginCRToChart({ name: 'my-plugin', version: '4.1.0' }, all);

        expect(all[0].installedVersion).toBe('0.4.10');
      });

      it('should fall back to the raw installed version when the repo index no longer lists it', () => {
        const all: any[] = [chartWithVersions([{
          version: '2.0.0', appVersion: '2.0.0', annotations: {}
        }])];

        wireWrapper.vm.wirePluginCRToChart({ name: 'my-plugin', version: '1.0.0' }, all);

        expect(all[0].installedVersion).toBe('1.0.0');
      });

      it('should show the last updated date and icon of the installed version', () => {
        const all: any[] = [{
          ...chartWithVersions([
            {
              version: '2.0.0', appVersion: '2.0.0', annotations: {}, created: '2026-05-01T00:00:00Z', icon: 'new-icon.svg'
            },
            {
              version: '1.0.0', appVersion: '1.0.0', annotations: {}, created: '2025-01-01T00:00:00Z', icon: 'old-icon.svg'
            },
          ]),
          created: '2026-05-01T00:00:00Z',
          icon:    'new-icon.svg',
        }];

        wireWrapper.vm.wirePluginCRToChart({ name: 'my-plugin', version: '1.0.0' }, all);

        expect(all[0].created).toBe('2025-01-01T00:00:00Z');
        expect(all[0].icon).toBe('old-icon.svg');
      });

      it('should keep the existing icon when the installed version has none of its own', () => {
        const all: any[] = [{
          ...chartWithVersions([
            {
              version: '2.0.0', appVersion: '2.0.0', annotations: {}, icon: 'chart-icon.svg'
            },
            {
              version: '1.0.0', appVersion: '1.0.0', annotations: {}
            },
          ]),
          icon: 'chart-icon.svg',
        }];

        wireWrapper.vm.wirePluginCRToChart({ name: 'my-plugin', version: '1.0.0' }, all);

        expect(all[0].icon).toBe('chart-icon.svg');
      });
    });

    describe('upgrade available', () => {
      const apps = [{
        metadata: {
          name:      'my-plugin',
          namespace: UI_PLUGIN_NAMESPACE,
          labels:    { [CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME]: 'rancher-charts' }
        },
        spec: { chart: { metadata: { annotations: {} } } }
      }];

      const chartWith = (versions: any[], installableVersions: any[]) => ({
        name:  'my-plugin',
        chart: { repoName: 'rancher-charts' },
        versions,
        installableVersions,
      });

      beforeEach(() => {
        wireWrapper = createWireWrapper(apps);
      });

      it('should not offer an upgrade to a version older than the one installed', () => {
        // 2.0.0 is installed but has become incompatible, so only 1.0.0 is still installable
        const all: any[] = [chartWith(
          [
            {
              version: '2.0.0', appVersion: '2.0.0', annotations: {}, isVersionCompatible: false
            },
            {
              version: '1.0.0', appVersion: '1.0.0', annotations: {}, isVersionCompatible: true
            },
          ],
          [{
            version: '1.0.0', appVersion: '1.0.0', annotations: {}
          }]
        )];

        wireWrapper.vm.wirePluginCRToChart({ name: 'my-plugin', version: '2.0.0' }, all);

        expect(all[0].upgrade).toBeUndefined();
      });

      it('should compare chart versions rather than app versions', () => {
        const all: any[] = [chartWith(
          [
            {
              version: '0.4.11', appVersion: '4.1.1', annotations: {}
            },
            {
              version: '0.4.10', appVersion: '4.1.0', annotations: {}
            },
          ],
          [{
            version: '0.4.11', appVersion: '4.1.1', annotations: {}
          }]
        )];

        wireWrapper.vm.wirePluginCRToChart({ name: 'my-plugin', version: '4.1.0' }, all);

        expect(all[0].upgrade).toBe('4.1.1 (0.4.11)');
      });

      it('should compare app versions when the installed version is missing from the repo index', () => {
        const all: any[] = [chartWith(
          [{
            version: '2.0.0', appVersion: '2.0.0', annotations: {}
          }],
          [{
            version: '2.0.0', appVersion: '2.0.0', annotations: {}
          }]
        )];

        wireWrapper.vm.wirePluginCRToChart({ name: 'my-plugin', version: '1.0.0' }, all);

        expect(all[0].upgrade).toBe('2.0.0');
      });

      it('should not offer an upgrade when the installed version is the latest installable one', () => {
        const all: any[] = [chartWith(
          [{
            version: '2.0.0', appVersion: '2.0.0', annotations: {}
          }],
          [{
            version: '2.0.0', appVersion: '2.0.0', annotations: {}
          }]
        )];

        wireWrapper.vm.wirePluginCRToChart({ name: 'my-plugin', version: '2.0.0' }, all);

        expect(all[0].upgrade).toBeUndefined();
      });
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

    it('should not match chart from a different repo', () => {
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

      expect(all).toHaveLength(2);
      expect(all[0].installed).toBeUndefined();
      expect(all[1].installed).toBe(true);
      expect(all[1].uiplugin).toBe(pluginCR);
    });

    it('should use install-time repo fallback when originalRepoName is undefined', () => {
      const apps = [{
        metadata: {
          name:      'my-plugin',
          namespace: UI_PLUGIN_NAMESPACE,
          labels:    {}
        },
        spec: { chart: { metadata: { annotations: {} } } }
      }];

      wireWrapper = createWireWrapper(apps);
      wireWrapper.vm.installedFromRepo = { 'my-plugin': 'rancher-charts' };

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

    it('should preserve certification flags when using install-time repo fallback', () => {
      const apps = [{
        metadata: {
          name:      'my-plugin',
          namespace: UI_PLUGIN_NAMESPACE,
          labels:    {}
        },
        spec: { chart: { metadata: { annotations: {} } } }
      }];

      wireWrapper = createWireWrapper(apps);
      wireWrapper.vm.installedFromRepo = { 'my-plugin': 'rancher-charts' };

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

    it('should not cross-match to wrong repo when using install-time repo fallback with multiple repos', () => {
      const apps = [{
        metadata: {
          name:      'my-plugin',
          namespace: UI_PLUGIN_NAMESPACE,
          labels:    {}
        },
        spec: { chart: { metadata: { annotations: {} } } }
      }];

      wireWrapper = createWireWrapper(apps);
      wireWrapper.vm.installedFromRepo = { 'my-plugin': 'repo-a' };

      const all: any[] = [
        {
          name:                'my-plugin',
          chart:               { repoName: 'repo-a' },
          installableVersions: [],
        },
        {
          name:                'my-plugin',
          chart:               { repoName: 'repo-b' },
          installableVersions: [],
        }
      ];

      const pluginCR = { name: 'my-plugin', version: '1.0.0' };

      wireWrapper.vm.wirePluginCRToChart(pluginCR, all);

      expect(all).toHaveLength(2);
      expect(all[0].installed).toBe(true);
      expect(all[0].uiplugin).toBe(pluginCR);
      expect(all[1].installed).toBeUndefined();
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

    it('should translate string UI errors without escaping html', () => {
      const store = {
        getters: {
          'prefs/get':         jest.fn(),
          'catalog/rawCharts': [],
          'uiplugins/plugins': [],
          'uiplugins/errors':  { 'my-plugin': 'plugins.error.developerPkg' },
        },
        dispatch: () => Promise.resolve(),
      };
      const tMock = jest.fn(t);

      const w = shallowMount(UiPluginsPage, {
        global: {
          mocks: { $store: store, t: tMock },
          stubs: { ActionMenu: { template: '<div />' } }
        }
      });

      w.vm.errors = {};

      const all = [{ name: 'my-plugin', id: 'repo/my-plugin' }];

      w.vm.mergePluginErrors(all);

      expect(tMock).toHaveBeenCalledWith('plugins.error.developerPkg', null, true);
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

  describe('tab panel', () => {
    // The tabs render in `tabs-only` mode, so the card grid is the panel they control and has to be
    // associated with them explicitly rather than just sitting next to them.
    const mountLoaded = async() => {
      const w = mountComponent();

      // activeTabButtonId is normally set by Tabbed's @changed event; simulate it directly here
      // since shallowMount stubs Tabbed and won't fire the real event.
      await w.setData({
        loading:           false,
        activeTab:         'available',
        activeTabButtonId: 'tab-v-0-available'
      });

      return w;
    };

    it('should expose the extension card grid as the tab panel', async() => {
      const w = await mountLoaded();
      const panel = w.find('.plugin-cards');

      expect(panel.attributes('id')).toBe('extensions-tab-panel');
      expect(panel.attributes('role')).toBe('tabpanel');
      expect(panel.attributes('tabindex')).toBe('0');
      expect(panel.attributes('aria-labelledby')).toBe('tab-v-0-available');
    });

    it('should tell the tabs which external panel they control', async() => {
      const w = await mountLoaded();

      expect(w.findComponent({ name: 'Tabbed' }).props('externalPanelId')).toBe('extensions-tab-panel');
    });

    it('should not label the panel before a tab has been selected', async() => {
      const w = mountComponent();

      await w.setData({
        loading:           false,
        activeTab:         '',
        activeTabButtonId: undefined
      });

      expect(w.find('.plugin-cards').attributes('aria-labelledby')).toBeUndefined();
    });
  });

  describe('bundled extensions', () => {
    const BUNDLE = 'security-ui-exts';
    const MEMBERS = ['vulnerability-scanner', 'runtime-enforcer'];

    /**
     * A UIPlugin CR. Members of a bundle carry the bundle's name in
     * spec.plugin.metadata, surfaced by the model's `pluginMetadata` getter.
     */
    const crFor = (name: string, version: string, bundle: string | null = BUNDLE) => ({
      name,
      version,
      pluginMetadata: bundle ? { [UI_PLUGIN_METADATA.BUNDLE]: bundle } : {},
    });

    /**
     * An entry from the uiplugins store: a Plugin built at load time from the
     * extension's own package.json, with no knowledge of the CR that installed it.
     */
    const loadedPlugin = (name: string, version: string) => ({
      name,
      id:       `${ name }-${ version }`,
      metadata: {
        name,
        version,
        rancher: { annotations: { [UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME]: name } }
      },
    });

    const appFor = (name: string, chartVersion: string): any => ({
      metadata: { name, namespace: UI_PLUGIN_NAMESPACE },
      spec:     { chart: { metadata: { version: chartVersion, annotations: {} } } }
    });

    const createWrapper = ({
      rawCharts = {}, uiplugins = [], apps = [], plugins = [], errors = {}
    }: {
      rawCharts?: Record<string, any>, uiplugins?: any[], apps?: any[], plugins?: any[], errors?: Record<string, string>
    } = {}): VueWrapper<any> => {
      const store = {
        getters: {
          'prefs/get':         jest.fn(),
          'catalog/rawCharts': rawCharts,
          'uiplugins/plugins': uiplugins,
          'uiplugins/errors':  errors,
          'management/all':    () => apps,
          'i18n/withFallback': (_key: string, _fallback: null, repoName: string) => repoName,
        },
        dispatch: () => Promise.resolve(),
      };

      // The page is an untyped .vue import, so without this `w.vm` widens to `never`
      // and every property access on it is a type error
      const w = shallowMount(UiPluginsPage, {
        global: {
          mocks: { $store: store, t },
          stubs: { ActionMenu: { template: '<div />' } }
        }
      }) as VueWrapper<any>;

      w.vm.installing = {};
      pluginListOf(w).plugins = plugins;

      return w;
    };

    const bundleChart = () => ({
      [BUNDLE]: {
        chartName:   BUNDLE,
        repoName:    'test-repo',
        annotations: { [UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME]: 'SUSE Security' },
        versions:    [{
          version:     '1.0.0',
          annotations: {
            'catalog.cattle.io/ui-component':           'plugins',
            [UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME]: 'SUSE Security',
          },
        }],
      }
    });

    describe('bundleMembership', () => {
      it('should map each member to the bundle that owns it', () => {
        const w = createWrapper({ plugins: [crFor(MEMBERS[0], '0.9.1'), crFor(MEMBERS[1], '0.1.0')] });

        expect(w.vm.bundleMembership).toStrictEqual({
          [MEMBERS[0]]: BUNDLE,
          [MEMBERS[1]]: BUNDLE,
        });
      });

      it('should ignore extensions installed outside a bundle', () => {
        const w = createWrapper({ plugins: [crFor('standalone', '1.0.0', null)] });

        expect(w.vm.bundleMembership).toStrictEqual({});
        expect(w.vm.bundledMemberNames.size).toBe(0);
      });

      it('should keep recognising a member after its CR is removed', async() => {
        // Uninstalling deletes the CRs, but the extensions stay loaded in the browser
        // until the page is reloaded, so membership has to outlive the CR
        const w = createWrapper({ plugins: [crFor(MEMBERS[0], '0.9.1'), crFor(MEMBERS[1], '0.1.0')] });

        // membership is recorded by a watcher, which Vue flushes on the next tick
        await w.vm.$nextTick();

        expect(w.vm.bundledMemberNames.size).toBe(2);

        pluginListOf(w).plugins = [];

        expect(w.vm.bundleMembership).toStrictEqual({});
        expect(w.vm.bundledMemberNames.size).toBe(2);
      });
    });

    describe('wirePluginCRToChart', () => {
      it('should wire members onto the bundle card rather than creating orphans', () => {
        const w = createWrapper({
          apps:    [appFor(BUNDLE, '1.0.0')],
          plugins: [crFor(MEMBERS[0], '0.9.1'), crFor(MEMBERS[1], '0.1.0')]
        });

        const all: any[] = [{
          name:                BUNDLE,
          versions:            [{ version: '1.0.0' }],
          installableVersions: [{ version: '1.0.0' }],
        }];

        w.vm.wirePluginCRToChart(crFor(MEMBERS[0], '0.9.1'), all);
        w.vm.wirePluginCRToChart(crFor(MEMBERS[1], '0.1.0'), all);

        expect(all).toHaveLength(1);
        expect(all[0].name).toBe(BUNDLE);
        expect(all[0].installed).toBe(true);
        expect(all[0].isBundle).toBe(true);
        expect(all[0].bundleMembers.map((m: any) => m.name)).toStrictEqual(MEMBERS);
      });

      it('should report the bundle chart version, not a member version', () => {
        const w = createWrapper({
          apps:    [appFor(BUNDLE, '1.0.0')],
          plugins: [crFor(MEMBERS[0], '0.9.1')]
        });

        const all: any[] = [{ name: BUNDLE, versions: [{ version: '1.0.0' }] }];

        w.vm.wirePluginCRToChart(crFor(MEMBERS[0], '0.9.1'), all);

        expect(all[0].installedVersion).toBe('1.0.0');
        expect(all[0].displayVersion).toBe('1.0.0');
      });

      it('should offer an upgrade when a newer bundle version is installable', () => {
        const w = createWrapper({
          apps:    [appFor(BUNDLE, '1.0.0')],
          plugins: [crFor(MEMBERS[0], '0.9.1')]
        });

        const all: any[] = [{
          name:                BUNDLE,
          versions:            [{ version: '1.0.1' }, { version: '1.0.0' }],
          installableVersions: [{ version: '1.0.1' }],
        }];

        w.vm.wirePluginCRToChart(crFor(MEMBERS[0], '0.9.1'), all);

        expect(all[0].upgrade).toBeDefined();
      });

      it('should not offer an upgrade when the installed bundle is the latest', () => {
        const w = createWrapper({
          apps:    [appFor(BUNDLE, '1.0.0')],
          plugins: [crFor(MEMBERS[0], '0.9.1')]
        });

        const all: any[] = [{
          name:                BUNDLE,
          versions:            [{ version: '1.0.0' }],
          installableVersions: [{ version: '1.0.0' }],
        }];

        w.vm.wirePluginCRToChart(crFor(MEMBERS[0], '0.9.1'), all);

        expect(all[0].upgrade).toBeUndefined();
      });

      it('should create no card when the bundle chart is missing from the catalog', () => {
        const w = createWrapper({ plugins: [crFor(MEMBERS[0], '0.9.1')] });
        const all: any[] = [];

        w.vm.wirePluginCRToChart(crFor(MEMBERS[0], '0.9.1'), all);

        expect(all).toHaveLength(0);
      });

      it('should leave standalone extensions on the existing code path', () => {
        const app = appFor('standalone', '2.0.0');

        app.metadata.labels = { [CATALOG_ANNOTATIONS.CLUSTER_REPO_NAME]: 'rancher-charts' };

        const w = createWrapper({ apps: [app], plugins: [crFor('standalone', '2.0.0', null)] });

        const all: any[] = [{
          name:     'standalone',
          chart:    { repoName: 'rancher-charts' },
          versions: [{ version: '2.0.0' }]
        }];

        w.vm.wirePluginCRToChart(crFor('standalone', '2.0.0', null), all);

        expect(all).toHaveLength(1);
        expect(all[0].installed).toBe(true);
        expect(all[0].isBundle).toBeUndefined();
      });
    });

    describe('reading members off the chart', () => {
      const chartWith = (membersAnnotation?: string) => ({
        chartName: BUNDLE,
        versions:  [{
          version:     '1.0.0',
          annotations: {
            'catalog.cattle.io/ui-component': 'plugins',
            ...(membersAnnotation === undefined ? {} : { 'catalog.cattle.io/ui-extensions-bundle-members': membersAnnotation }),
          },
        }],
      });

      it('should read a bundle\'s members from the chart annotation', () => {
        const w = createWrapper();
        const item = w.vm.mapChartToPluginItem(chartWith(MEMBERS.join(',')));

        expect(item.bundleMemberNames).toStrictEqual(MEMBERS);
      });

      it('should tolerate spacing around the member names', () => {
        const w = createWrapper();
        const item = w.vm.mapChartToPluginItem(chartWith(' vulnerability-scanner ,  runtime-enforcer '));

        expect(item.bundleMemberNames).toStrictEqual(MEMBERS);
      });

      it('should give a regular extension no members', () => {
        const w = createWrapper();

        expect(w.vm.mapChartToPluginItem(chartWith()).bundleMemberNames).toStrictEqual([]);
        expect(w.vm.mapChartToPluginItem(chartWith('')).bundleMemberNames).toStrictEqual([]);
      });
    });

    describe('installedExtensionNames', () => {
      it('should count extensions installed standalone and as bundle members alike', () => {
        const w = createWrapper({ plugins: [crFor(MEMBERS[0], '0.9.2'), crFor('standalone', '1.0.0', null)] });

        expect([...w.vm.installedExtensionNames].sort()).toStrictEqual([MEMBERS[0], 'standalone'].sort());
      });
    });

    describe('install conflicts', () => {
      const bundleCard = (members: string[]) => ({
        name:                BUNDLE,
        bundleMemberNames:   members,
        installed:           false,
        installableVersions: [{ version: '1.0.0' }],
      });

      const singleCard = (name: string) => ({
        name,
        bundleMemberNames:   [],
        installed:           false,
        installableVersions: [{ version: '0.1.1' }],
      });

      it('should block a bundle when one of its members is already installed', () => {
        const w = createWrapper({ plugins: [crFor('runtime-enforcer', '0.1.1', null)] });
        const conflict = w.vm.installConflict(bundleCard(MEMBERS));

        expect(conflict).toStrictEqual({ type: 'bundle', names: ['runtime-enforcer'] });
        expect(w.vm.getPluginActions(bundleCard(MEMBERS))).toStrictEqual([]);
      });

      it('should block an extension an installed bundle already provides', () => {
        const w = createWrapper({ plugins: [crFor('runtime-enforcer', '0.1.1')] });
        const conflict = w.vm.installConflict(singleCard('runtime-enforcer'));

        expect(conflict).toStrictEqual({ type: 'member', names: [BUNDLE] });
        expect(w.vm.getPluginActions(singleCard('runtime-enforcer'))).toStrictEqual([]);
      });

      it('should allow a bundle when none of its members are installed', () => {
        const w = createWrapper({ plugins: [] });

        expect(w.vm.installConflict(bundleCard(MEMBERS))).toBeNull();
        expect(w.vm.getPluginActions(bundleCard(MEMBERS))[0].action).toBe('install');
      });

      it('should allow an unrelated extension while a bundle is installed', () => {
        const w = createWrapper({ plugins: [crFor('runtime-enforcer', '0.1.1')] });

        expect(w.vm.installConflict(singleCard('network'))).toBeNull();
        expect(w.vm.getPluginActions(singleCard('network'))[0].action).toBe('install');
      });

      it('should name every conflicting member, not just the first', () => {
        const w = createWrapper({ plugins: [crFor(MEMBERS[0], '0.9.2', null), crFor(MEMBERS[1], '0.1.1', null)] });

        expect(w.vm.installConflict(bundleCard(MEMBERS))?.names).toStrictEqual(MEMBERS);
      });

      it('should not block something already installed', () => {
        const w = createWrapper({ plugins: [crFor('runtime-enforcer', '0.1.1')] });

        expect(w.vm.installConflict({ ...singleCard('runtime-enforcer'), installed: true })).toBeNull();
      });

      it('should name the blocking bundle when an extension is already provided', () => {
        const w = createWrapper({ plugins: [crFor('runtime-enforcer', '0.1.1')] });
        const card = singleCard('runtime-enforcer');

        expect(w.vm.installConflictMessage(w.vm.installConflict(card), [])).toContain(BUNDLE);
      });

      it('should name the blocking members when a bundle is blocked', () => {
        const w = createWrapper({ plugins: [crFor('runtime-enforcer', '0.1.1', null)] });
        const card = bundleCard(MEMBERS);

        expect(w.vm.installConflictMessage(w.vm.installConflict(card), [])).toContain('runtime-enforcer');
      });

      it('should say nothing when there is no conflict', () => {
        const w = createWrapper({ plugins: [] });
        const card = bundleCard(MEMBERS);

        expect(w.vm.installConflictMessage(w.vm.installConflict(card), [])).toBe('');
      });

      /**
       * The chart id is not what the admin reads on the card, so a message naming it
       * sends them looking for something that is not on screen.
       */
      it('should name the blocker by its card title rather than its chart id', () => {
        const w = createWrapper({ plugins: [crFor('runtime-enforcer', '0.1.1')] });
        const card = singleCard('runtime-enforcer');
        const all = [{ name: BUNDLE, label: 'SUSE Security' }];
        const message = w.vm.installConflictMessage(w.vm.installConflict(card), all);

        expect(message).toContain('SUSE Security');
        expect(message).not.toContain(BUNDLE);
      });

      it('should fall back to the chart name when the blocker has no card', () => {
        const w = createWrapper({ plugins: [crFor('runtime-enforcer', '0.1.1')] });
        const card = singleCard('runtime-enforcer');

        expect(w.vm.installConflictMessage(w.vm.installConflict(card), [])).toContain(BUNDLE);
      });

      it('should surface the reason on the card', () => {
        const w = createWrapper({ plugins: [crFor('runtime-enforcer', '0.1.1')] });
        const card = { ...singleCard('runtime-enforcer'), installConflictMessage: 'blocked by the bundle' };
        const statuses = w.vm.getStatuses(card);

        expect(statuses.some((st: any) => st.color === 'error' && st.tooltip.text.includes('blocked by the bundle'))).toBe(true);
      });

      /**
       * A second repository offering a bundle that is already installed must not report
       * the bundle's own members as a conflict - they are installed by that bundle.
       */
      it('should not flag an installed bundle against its own members', () => {
        const w = createWrapper({ plugins: [crFor(MEMBERS[0], '0.9.2'), crFor(MEMBERS[1], '0.1.1')] });

        expect(w.vm.installConflict(bundleCard(MEMBERS))).toBeNull();
      });

      /**
       * A later bundle version can add an extension the admin already runs standalone.
       * Without this the upgrade is offered and then fails on Helm's ownership error.
       */
      it('should block upgrading a bundle into a member installed standalone', () => {
        // The bundle currently ships MEMBERS; its next version adds 'network', which
        // the admin already runs on its own
        const w = createWrapper({ plugins: [...MEMBERS.map((m) => crFor(m, '0.9.2')), crFor('network', '0.1.1', null)] });
        const installedBundle = {
          ...bundleCard([...MEMBERS, 'network']),
          installed:        true,
          installedVersion: '1.0.0',
          upgrade:          '1.0.2',
        };
        const actions = w.vm.getPluginActions(installedBundle);

        expect(w.vm.installConflict(installedBundle)).toStrictEqual({ type: 'bundle', names: ['network'] });
        expect(actions.some((a: any) => a.action === 'upgrade')).toBe(false);
        expect(actions.some((a: any) => a.action === 'uninstall')).toBe(true);
      });
    });

    describe('bundle card resilience', () => {
      /**
       * Removing the repository a bundle came from must not strand it: the extensions
       * stay loaded, so without a card there is no way to uninstall them.
       */
      it('should keep one card for an installed bundle whose repo was removed', () => {
        const app = appFor(BUNDLE, '1.0.1');

        app.spec.chart.metadata.name = BUNDLE;
        app.spec.chart.metadata.annotations = { [UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME]: 'SUSE Security' };

        const w = createWrapper({
          rawCharts: {},
          uiplugins: MEMBERS.map((m) => loadedPlugin(m, '0.9.1')),
          apps:      [app],
          plugins:   MEMBERS.map((m) => crFor(m, '0.9.1')),
        });
        const cards = w.vm.available;

        expect(cards).toHaveLength(1);
        expect(cards[0].name).toBe(BUNDLE);
        expect(cards[0].label).toBe('SUSE Security');
        expect(cards[0].installed).toBe(true);
        expect(cards[0].displayVersion).toBe('1.0.1');
        expect(w.vm.getPluginActions(cards[0]).some((a: any) => a.action === 'uninstall')).toBe(true);
      });

      it('should offer no upgrade on a bundle recovered from the Helm release alone', () => {
        const app = appFor(BUNDLE, '1.0.1');

        app.spec.chart.metadata.name = BUNDLE;

        const w = createWrapper({
          apps:    [app],
          plugins: MEMBERS.map((m) => crFor(m, '0.9.1')),
        });

        expect(w.vm.available[0].upgrade).toBeUndefined();
      });

      /**
       * A broken member has no card of its own, so without this the bundle shows only
       * the green Installed tick and nothing says an extension failed to load.
       */
      it('should show a member load error on the bundle card', () => {
        const w = createWrapper({
          rawCharts: bundleChart(),
          uiplugins: MEMBERS.map((m) => loadedPlugin(m, '0.9.1')),
          apps:      [appFor(BUNDLE, '1.0.0')],
          plugins:   MEMBERS.map((m) => crFor(m, '0.9.1')),
          errors:    { [MEMBERS[0]]: 'plugins.error.generic' },
        });
        const card = w.vm.available.find((c: any) => c.name === BUNDLE);

        expect(card.installedError).toContain(MEMBERS[0]);
        expect(w.vm.getStatuses(card).some((st: any) => st.color === 'error')).toBe(true);
      });

      it('should keep both members errors rather than letting the last win', () => {
        const w = createWrapper({
          rawCharts: bundleChart(),
          uiplugins: MEMBERS.map((m) => loadedPlugin(m, '0.9.1')),
          apps:      [appFor(BUNDLE, '1.0.0')],
          plugins:   MEMBERS.map((m) => crFor(m, '0.9.1')),
          errors:    { [MEMBERS[0]]: 'plugins.error.generic', [MEMBERS[1]]: 'plugins.error.generic' },
        });
        const card = w.vm.available.find((c: any) => c.name === BUNDLE);

        expect(card.installedError).toContain(MEMBERS[0]);
        expect(card.installedError).toContain(MEMBERS[1]);
      });

      /**
       * A bundle can be offered by both its own gh-pages repo and ui-plugin-charts.
       * Marking the wrong copy installed makes Upgrade pull from the wrong repository.
       */
      it('should mark the repo copy the bundle was actually installed from', () => {
        const chartFor = (repoName: string) => ({
          chartName:   BUNDLE,
          repoName,
          annotations: { [UI_PLUGIN_CHART_ANNOTATIONS.DISPLAY_NAME]: 'SUSE Security' },
          versions:    [{
            version:     '1.0.0',
            annotations: { 'catalog.cattle.io/ui-component': 'plugins' },
          }],
        });
        const app = appFor(BUNDLE, '1.0.0');

        app.spec.chart.metadata.annotations = { [CATALOG_ANNOTATIONS.SOURCE_REPO_NAME]: 'second-repo' };

        const w = createWrapper({
          rawCharts: {
            'first-repo/security':  chartFor('first-repo'),
            'second-repo/security': chartFor('second-repo'),
          },
          uiplugins: MEMBERS.map((m) => loadedPlugin(m, '0.9.1')),
          apps:      [app],
          plugins:   MEMBERS.map((m) => crFor(m, '0.9.1')),
        });
        const installed = w.vm.available.filter((c: any) => c.name === BUNDLE && c.installed);

        expect(installed).toHaveLength(1);
        expect(installed[0].chart.repoName).toBe('second-repo');
      });
    });

    describe('available', () => {
      /**
       * The behaviour the whole feature exists for. Without it an installed two-member
       * bundle yields three cards: the bundle's own, plus an orphan per member.
       */
      it('should show exactly one card for an installed bundle', () => {
        const w = createWrapper({
          rawCharts: bundleChart(),
          uiplugins: [loadedPlugin(MEMBERS[0], '0.9.1'), loadedPlugin(MEMBERS[1], '0.1.0')],
          apps:      [appFor(BUNDLE, '1.0.0')],
          plugins:   [crFor(MEMBERS[0], '0.9.1'), crFor(MEMBERS[1], '0.1.0')],
        });

        const cards = w.vm.available;

        expect(cards).toHaveLength(1);
        expect(cards[0].name).toBe(BUNDLE);
        expect(cards[0].installed).toBe(true);
        expect(cards[0].isBundle).toBe(true);
      });

      it('should keep showing one card after an uninstall, before the page reloads', async() => {
        const w = createWrapper({
          rawCharts: bundleChart(),
          uiplugins: [loadedPlugin(MEMBERS[0], '0.9.1'), loadedPlugin(MEMBERS[1], '0.1.0')],
          apps:      [appFor(BUNDLE, '1.0.0')],
          plugins:   [crFor(MEMBERS[0], '0.9.1'), crFor(MEMBERS[1], '0.1.0')],
        });

        // let the watcher record membership before the CRs go away
        await w.vm.$nextTick();

        expect(w.vm.available).toHaveLength(1);

        // Helm removed the CRs, but the extensions are still loaded in this page
        pluginListOf(w).plugins = [];

        const cards = w.vm.available;

        expect(cards).toHaveLength(1);
        expect(cards[0].name).toBe(BUNDLE);
      });

      it('should still card a loaded extension that belongs to no bundle', () => {
        const w = createWrapper({
          uiplugins: [loadedPlugin('standalone', '1.0.0')],
          plugins:   [],
        });

        expect(w.vm.available.map((c: any) => c.name)).toStrictEqual(['standalone']);
      });
    });
  });
});
