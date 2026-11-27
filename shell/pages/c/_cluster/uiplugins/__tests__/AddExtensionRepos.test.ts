import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { UI_PLUGINS_REPOS } from '@shell/config/uiplugins';
import AddExtensionReposDialog from '@shell/dialog/AddExtensionReposDialog.vue';
import AsyncButton from '@shell/components/AsyncButton.vue';
const mockedStore = () => {
  return {
    getters: {
      'i18n/t':               (text: string) => text,
      'i18n/exists':          (text: string) => text,
      t:                      (text: string) => text,
      'management/schemaFor': () => true,
      'management/findAll':   () => [
        { urlDisplay: UI_PLUGINS_REPOS.OFFICIAL.URL },
        { urlDisplay: UI_PLUGINS_REPOS.PARTNERS.URL },
      ]
    }
  };
};

const requiredSetup = () => {
  return {
    mocks: {
      $store:      mockedStore(),
      $fetchState: {},
    }
  };
};

describe('component: AddExtensionReposDialog', () => {
  it('should NOT SHOW a checkbox to install official Rancher repo if NOT prime', async() => {
    jest.useFakeTimers();

    const wrapper = mount(AddExtensionReposDialog, {
      global: {
        ...requiredSetup(),
        stubs: { Dialog: { template: '<span><slot/></span>' } },
      }
    });

    await nextTick();

    const rancherCheckbox = wrapper.findComponent('[data-testid="add-extensions-repos-modal-add-official-repo"]');
    const partnersCheckbox = wrapper.findComponent('[data-testid="add-extensions-repos-modal-add-partners-repo"]');

    expect(rancherCheckbox.exists()).toBe(false);
    expect(partnersCheckbox.exists()).toBe(true);

    wrapper.unmount();
  });

  it('should SHOW a checkbox to install official Rancher repo if IS prime', async() => {
    jest.useFakeTimers();

    const wrapper = mount(AddExtensionReposDialog, {
      global: {
        ...requiredSetup(),
        stubs: { Dialog: { template: '<span><slot/></span>' } },
      }
    });

    wrapper.vm.prime = true;

    await nextTick();

    const rancherCheckbox = wrapper.findComponent('[data-testid="add-extensions-repos-modal-add-official-repo"]');
    const partnersCheckbox = wrapper.findComponent('[data-testid="add-extensions-repos-modal-add-partners-repo"]');

    expect(rancherCheckbox.exists()).toBe(true);
    expect(partnersCheckbox.exists()).toBe(true);

    wrapper.unmount();
  });

  it.each([true, false])('should set the Add button disabled to match the dialog fetch pending state (%p)', (pending) => {
    const wrapper = mount(AddExtensionReposDialog, {
      global: {
        mocks: {
          $store:      mockedStore(),
          $fetchState: { pending },
        },
      }
    });

    expect(wrapper.findComponent(AsyncButton).props('disabled')).toStrictEqual(pending);

    wrapper.unmount();
  });

  it('should NOT close when Add is clicked while the dialog is still loading', async() => {
    const wrapper = mount(AddExtensionReposDialog, {
      global: {
        mocks: {
          $store:      mockedStore(),
          $fetchState: { pending: true },
        },
      }
    });

    await wrapper.findComponent(AsyncButton).trigger('click');

    expect(wrapper.emitted('close')).toBeUndefined();

    wrapper.unmount();
  });

  describe('reporting the download', () => {
    // `reportDownloads` starts a detached async chain; let its microtasks drain before asserting.
    // Microtasks rather than a timer, because earlier tests in this file leave fake timers on.
    const flush = async() => {
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
      }
    };

    const mountWith = (dispatch: jest.Mock) => {
      const store = mockedStore() as any;

      // The tracking that `reportDownloads` kicks off reads the repo back out of the store. Hand
      // it an already indexed one so it settles immediately instead of polling past the test.
      store.getters['management/byId'] = () => ({ status: { indexConfigMapName: 'cm' } });
      store.dispatch = dispatch;

      return mount(AddExtensionReposDialog, {
        global: {
          mocks: { $store: store, $fetchState: {} },
          stubs: { Dialog: { template: '<span><slot/></span>' } },
        }
      });
    };

    it('should announce nothing up front', async() => {
      // The Extensions page reports what is downloading in its own banner, so a toast here would
      // only say it twice
      const dispatch = jest.fn(() => Promise.resolve());
      const wrapper = mountWith(dispatch);

      wrapper.vm.reportDownloads(['partner-extensions']);
      await flush();

      expect(dispatch).not.toHaveBeenCalledWith('growl/info', expect.anything(), expect.anything());

      wrapper.unmount();
    });

    it('should follow each added repository in the notification centre', async() => {
      const dispatch = jest.fn(() => Promise.resolve());
      const wrapper = mountWith(dispatch);

      wrapper.vm.reportDownloads(['rancher-ui-plugins', 'partner-extensions']);
      await flush();

      const tasks = dispatch.mock.calls
        .filter((c: any) => c[0] === 'notifications/add')
        .map((c: any) => c[1].id);

      expect(tasks).toStrictEqual([
        'extension-repo-download-rancher-ui-plugins',
        'extension-repo-download-partner-extensions'
      ]);

      wrapper.unmount();
    });

    it('should say nothing when no repository was actually added', async() => {
      const dispatch = jest.fn(() => Promise.resolve());
      const wrapper = mountWith(dispatch);

      wrapper.vm.reportDownloads([]);
      await flush();

      expect(dispatch).not.toHaveBeenCalledWith('growl/info', expect.anything(), expect.anything());
      expect(dispatch).not.toHaveBeenCalledWith('notifications/add', expect.anything());

      wrapper.unmount();
    });
  });
});
