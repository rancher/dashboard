import { shallowMount } from '@vue/test-utils';
import UiPluginsPage from '@shell/pages/c/_cluster/uiplugins/index.vue';

const t = (key: string, args: Object) => {
  if (args) {
    return `${ key } with ${ JSON.stringify(args) }`;
  }

  return key;
};

describe('page: UI plugins/Extensions', () => {
  let wrapper;

  const mountComponent = (mocks = {}) => {
    const store = {
      getters:  { 'prefs/get': jest.fn() },
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

      expect(actions).toHaveLength(1);
      expect(actions[0].action).toBe('uninstall');
    });

    it('should not return uninstall action for a builtin plugin', () => {
      const plugin = {
        installed:           true,
        installableVersions: [],
        builtin:             true,
        upgrade:             null,
      };
      const actions = wrapper.vm.getPluginActions(plugin);

      expect(actions.some((a) => a.action === 'uninstall')).toBe(false);
    });

    it('should return update action for an installed plugin with an upgrade', () => {
      const plugin = {
        installed:           true,
        installableVersions: [],
        builtin:             false,
        upgrade:             '1.1.0',
      };
      const actions = wrapper.vm.getPluginActions(plugin);

      expect(actions.some((a) => a.action === 'update')).toBe(true);
    });

    it('should return rollback action for an installed plugin with multiple installable versions and no upgrade', () => {
      const plugin = {
        installed:           true,
        installableVersions: [{ version: '1.0.0' }, { version: '0.9.0' }],
        builtin:             false,
        upgrade:             null,
      };
      const actions = wrapper.vm.getPluginActions(plugin);

      expect(actions.some((a) => a.action === 'rollback')).toBe(true);
    });

    it('should return all applicable actions', () => {
      const plugin = {
        installed:           true,
        installableVersions: [{ version: '1.1.0' }, { version: '1.0.0' }],
        builtin:             false,
        upgrade:             '1.1.0',
      };
      const actions = wrapper.vm.getPluginActions(plugin);

      expect(actions.map((a) => a.action)).toContain('uninstall');
      expect(actions.map((a) => a.action)).toContain('update');
      expect(actions.map((a) => a.action)).not.toContain('rollback');
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

      expect(items).toHaveLength(2);
      expect(items[1].label).toBe('plugins.labels.installing');
    });

    it('should show uninstalling status', () => {
      const plugin = { displayVersionLabel: 'v1.0.0', installing: 'uninstall' };
      const items = wrapper.vm.getSubHeaderItems(plugin);

      expect(items).toHaveLength(2);
      expect(items[1].label).toBe('plugins.labels.uninstalling');
    });

    it('should show updating status', () => {
      const plugin = { displayVersionLabel: 'v1.0.0', installing: 'update' };
      const items = wrapper.vm.getSubHeaderItems(plugin);

      expect(items).toHaveLength(2);
      expect(items[1].label).toBe('plugins.labels.updating');
    });

    it('should show rolling back status', () => {
      const plugin = { displayVersionLabel: 'v1.0.0', installing: 'rollback' };
      const items = wrapper.vm.getSubHeaderItems(plugin);

      expect(items).toHaveLength(2);
      expect(items[1].label).toBe('plugins.labels.rollingBack');
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
    it('should return "installed" status for installed, non-builtin plugins', () => {
      const plugin = {
        installed: true, builtin: false, installing: false
      };
      const statuses = wrapper.vm.getStatuses(plugin);

      expect(statuses[0].tooltip.key).toBe('generic.installed');
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
      const warningStatus = statuses.find((s) => s.icon === 'icon-alert-alt');

      expect(warningStatus.tooltip.text).toBe('generic.deprecated. generic.error: plugins.helmError');
    });
  });

  describe('watch: helmOps', () => {
    let wrapper;

    beforeEach(() => {
      const store = {
        getters: {
          'prefs/get':         jest.fn(),
          'catalog/rawCharts': {},
          'uiplugins/plugins': [],
          'uiplugins/errors':  {}
        },
        dispatch: () => Promise.resolve(),
      };

      wrapper = shallowMount(UiPluginsPage, {
        global: {
          mocks: {
            $store: store,
            t,
          },
          stubs: { ActionMenu: { template: '<div />' } }
        }
      });
    });

    it('should set status to "update" for an upgrade operation', async() => {
      const plugin = { name: 'my-plugin' };

      wrapper.vm.available = [plugin];
      wrapper.vm.installing['my-plugin'] = 'update';

      const helmOps = [{
        metadata: { state: { transitioning: true } },
        status:   { releaseName: 'my-plugin', action: 'upgrade' }
      }];

      wrapper.vm.helmOps = helmOps;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.installing['my-plugin']).toBe('update');
    });

    it('should keep status as "rollback" during an upgrade operation if it was already rolling back', async() => {
      const plugin = { name: 'my-plugin' };

      wrapper.vm.available = [plugin];
      wrapper.vm.installing['my-plugin'] = 'rollback';

      const helmOps = [{
        metadata: { state: { transitioning: true } },
        status:   { releaseName: 'my-plugin', action: 'upgrade' }
      }];

      wrapper.vm.helmOps = helmOps;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.installing['my-plugin']).toBe('rollback');
    });
  });
});
