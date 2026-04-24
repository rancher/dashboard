import { shallowMount, VueWrapper } from '@vue/test-utils';
import UninstallExistingExtensionDialog from '@shell/dialog/UninstallExistingExtensionDialog.vue';

const t = (key: string): string => key;

describe('component: UninstallExistingExtensionDialog', () => {
  let wrapper: VueWrapper<any>;

  const mountComponent = (propsData = {}) => {
    const store = { dispatch: jest.fn().mockResolvedValue([]) };

    const defaultProps = {
      installedPlugin: {
        id: 'test-plugin', name: 'test-plugin', label: 'Test Plugin'
      },
      updateStatus: jest.fn(),
      closed:       jest.fn(),
    };

    return shallowMount(UninstallExistingExtensionDialog, {
      propsData: {
        ...defaultProps,
        ...propsData,
      },
      global: {
        mocks: {
          $store:  store,
          $router: { go: jest.fn() },
          t,
        },
      }
    });
  };

  describe('rendering', () => {
    it('should render the dialog title', () => {
      wrapper = mountComponent();

      const title = wrapper.find('h4');

      expect(title.text()).toBe('plugins.install.alreadyInstalledTitle');
    });

    it('should render the dialog prompt', () => {
      wrapper = mountComponent();

      const prompt = wrapper.find('.dialog-info p');

      expect(prompt.text()).toBe('plugins.install.alreadyInstalledPrompt');
    });

    it('should render cancel button', () => {
      wrapper = mountComponent();

      const cancelBtn = wrapper.find('[data-testid="uninstall-existing-ext-modal-cancel-btn"]');

      expect(cancelBtn.exists()).toBe(true);
    });

    it('should render uninstall button', () => {
      wrapper = mountComponent();

      const uninstallBtn = wrapper.find('[data-testid="uninstall-existing-ext-modal-uninstall-btn"]');

      expect(uninstallBtn.exists()).toBe(true);
    });
  });

  describe('closeDialog', () => {
    it('should call closed callback and emit close event when cancel is clicked', async() => {
      const closedFn = jest.fn();

      wrapper = mountComponent({ closed: closedFn });

      const cancelBtn = wrapper.find('[data-testid="uninstall-existing-ext-modal-cancel-btn"]');

      await cancelBtn.trigger('click');

      expect(closedFn).toHaveBeenCalledWith(false);
      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });

  describe('uninstall', () => {
    it('should call updateStatus with uninstall action', async() => {
      const updateStatusFn = jest.fn();
      const installedPlugin = {
        id: 'test-plugin', name: 'test-plugin', label: 'Test Plugin'
      };

      wrapper = mountComponent({ installedPlugin, updateStatus: updateStatusFn });

      await wrapper.vm.uninstall();

      expect(updateStatusFn).toHaveBeenCalledWith('test-plugin', 'uninstall');
    });

    it('should remove developer plugin CR if isDeveloper is true', async() => {
      const removeFn = jest.fn().mockResolvedValue(undefined);
      const installedPlugin = {
        id:       'test-plugin',
        name:     'test-plugin',
        label:    'Test Plugin',
        uiplugin: { isDeveloper: true, remove: removeFn }
      };

      wrapper = mountComponent({ installedPlugin });

      await wrapper.vm.uninstall();

      expect(removeFn).toHaveBeenCalledWith();
    });
  });
});
