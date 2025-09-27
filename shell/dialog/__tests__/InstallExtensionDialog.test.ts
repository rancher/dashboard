import { shallowMount, VueWrapper } from '@vue/test-utils';
import InstallExtensionDialog from '@shell/dialog/InstallExtensionDialog.vue';

jest.mock('@shell/config/uiplugins', () => ({
  ...jest.requireActual('@shell/config/uiplugins'),
  isChartVersionHigher: jest.fn((v1: string, v2: string) => v1 > v2),
}));

const t = (key: string): string => key;

describe('component: InstallExtensionDialog', () => {
  let wrapper: VueWrapper<any>;

  const mountComponent = (propsData = {}) => {
    const store = { dispatch: () => Promise.resolve() };

    const defaultProps = {
      plugin:       { installableVersions: [] },
      action:       'install',
      updateStatus: jest.fn(),
      closed:       jest.fn(),
    };

    return shallowMount(InstallExtensionDialog, {
      propsData: {
        ...defaultProps,
        ...propsData,
      },
      global: {
        mocks: {
          $store: store,
          t,
        },
      }
    });
  };

  describe('fetch', () => {
    it('should set currentVersion if plugin is installed', async() => {
      wrapper = mountComponent({ plugin: { installed: true, installedVersion: '1.0.0' } });
      await wrapper.vm.$options.fetch.call(wrapper.vm);
      expect(wrapper.vm.currentVersion).toBe('1.0.0');
    });

    it('should set version from initialVersion if provided', async() => {
      wrapper = mountComponent({ initialVersion: '1.2.3', plugin: { installed: false } });
      await wrapper.vm.$options.fetch.call(wrapper.vm);
      expect(wrapper.vm.version).toBe('1.2.3');
    });

    it('should set version to latest for upgrade action', async() => {
      const plugin = { installableVersions: [{ version: '1.1.0' }, { version: '1.0.0' }] };

      wrapper = mountComponent({ plugin, action: 'upgrade' });
      await wrapper.vm.$options.fetch.call(wrapper.vm);
      expect(wrapper.vm.version).toBe('1.1.0');
    });

    it('should set version to next oldest for downgrade action', async() => {
      const plugin = {
        installed:           true,
        installedVersion:    '1.1.0',
        installableVersions: [{ version: '1.1.0' }, { version: '1.0.0' }]
      };

      wrapper = mountComponent({ plugin, action: 'downgrade' });
      await wrapper.vm.$options.fetch.call(wrapper.vm);
      expect(wrapper.vm.version).toBe('1.0.0');
    });
  });

  describe('versionOptions', () => {
    it('should include and disable the current version', () => {
      const plugin = {
        installableVersions: [
          { version: '1.1.0' },
          { version: '1.0.0' },
        ]
      };

      wrapper = mountComponent({ plugin });
      wrapper.vm.currentVersion = '1.0.0';

      const options = wrapper.vm.versionOptions;
      const currentOption = options.find((o: any) => o.value === '1.0.0');

      expect(currentOption).toBeDefined();
      expect(currentOption.disabled).toBe(true);
      expect(currentOption.label).toContain('(plugins.labels.current)');
    });
  });

  describe('buttonMode', () => {
    beforeEach(() => {
      wrapper = mountComponent({ action: 'upgrade' });
      wrapper.vm.currentVersion = '1.0.0';
    });

    it('should be "upgrade" if selected version is higher', async() => {
      wrapper.vm.version = '1.1.0';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.buttonMode).toBe('upgrade');
    });

    it('should be "downgrade" if selected version is lower', async() => {
      wrapper.vm.version = '0.9.0';
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.buttonMode).toBe('downgrade');
    });
  });
});
