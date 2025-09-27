import { shallowMount, VueWrapper } from '@vue/test-utils';
import PluginInfoPanel from '@shell/pages/c/_cluster/uiplugins/PluginInfoPanel.vue';

jest.mock('@shell/config/uiplugins', () => ({
  ...jest.requireActual('@shell/config/uiplugins'),
  isChartVersionHigher: jest.fn((v1: string, v2: string) => v1 > v2),
}));

jest.mock('@shell/utils/uiplugins', () => ({
  getPluginChartVersionLabel: jest.fn((v) => v.version),
  getPluginChartVersion:      jest.fn(),
}));

const t = (key: string): string => key;

describe('component: PluginInfoPanel', () => {
  let wrapper: VueWrapper<any>;

  const mountComponent = () => {
    return shallowMount(PluginInfoPanel, { global: { mocks: { t } } });
  };

  describe('panelActions', () => {
    beforeEach(() => {
      wrapper = mountComponent();
    });

    it('should be empty if no info is provided', () => {
      expect(wrapper.vm.panelActions).toStrictEqual([]);
    });

    it('should show install action if not installed and installable versions exist', () => {
      wrapper.vm.info = { installed: false, installableVersions: [{ version: '1.0.0' }] };
      wrapper.vm.infoVersion = '1.0.0';
      const actions = wrapper.vm.panelActions;

      expect(actions).toHaveLength(1);
      expect(actions[0].action).toBe('install');
    });

    it('should be empty if not installed and no installable versions exist', () => {
      wrapper.vm.info = { installed: false, installableVersions: [] };
      const actions = wrapper.vm.panelActions;

      expect(actions).toHaveLength(0);
    });

    it('should show uninstall action if installed and not builtin', () => {
      wrapper.vm.info = { installed: true, builtin: false };
      const actions = wrapper.vm.panelActions;

      expect(actions.some((action: any) => action.action === 'uninstall')).toBe(true);
    });

    it('should show upgrade action for a higher active version', () => {
      wrapper.vm.info = { installed: true, installedVersion: '1.0.0' };
      wrapper.vm.infoVersion = '1.1.0';
      const actions = wrapper.vm.panelActions;

      expect(actions.some((action: any) => action.action === 'upgrade')).toBe(true);
    });

    it('should show downgrade action for a lower active version', () => {
      wrapper.vm.info = { installed: true, installedVersion: '1.0.0' };
      wrapper.vm.infoVersion = '0.9.0';
      const actions = wrapper.vm.panelActions;

      expect(actions.some((action: any) => action.action === 'downgrade')).toBe(true);
    });

    it('should not show upgrade/downgrade if active version is same as installed', () => {
      wrapper.vm.info = { installed: true, installedVersion: '1.0.0' };
      wrapper.vm.infoVersion = '1.0.0';
      const actions = wrapper.vm.panelActions;

      expect(actions.some((action: any) => action.action === 'upgrade')).toBe(false);
      expect(actions.some((action: any) => action.action === 'downgrade')).toBe(false);
    });
  });

  describe('getVersionLabel', () => {
    beforeEach(() => {
      wrapper = mountComponent();
    });

    it('should return the version label', () => {
      wrapper.vm.info = { installed: false };
      const version = { version: '1.0.0' };
      const label = wrapper.vm.getVersionLabel(version);

      expect(label).toBe('1.0.0');
    });

    it('should append (current) for the installed version', () => {
      wrapper.vm.info = { installed: true, installedVersion: '1.0.0' };
      const version = { version: '1.0.0' };
      const label = wrapper.vm.getVersionLabel(version);

      expect(label).toBe('1.0.0 (plugins.labels.current)');
    });
  });
});
