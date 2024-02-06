import { mount } from '@vue/test-utils';
import {
  UI_PLUGINS_REPO_URL,
  UI_PLUGINS_PARTNERS_REPO_URL,
} from '@shell/config/uiplugins';
import AddExtensionRepos from '@shell/pages/c/_cluster/uiplugins/AddExtensionRepos.vue';
const mockedStore = () => {
  return {
    getters: {
      'i18n/t':               (text: string) => text,
      'i18n/exists':          (text: string) => text,
      t:                      (text: string) => text,
      'management/schemaFor': () => true,
      'management/findAll':   () => [
        { urlDisplay: UI_PLUGINS_REPO_URL },
        { urlDisplay: UI_PLUGINS_PARTNERS_REPO_URL },
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

describe('component: AddExtensionRepos', () => {
  it('should NOT SHOW a checkbox to install official Rancher repo if NOT prime', async() => {
    jest.useFakeTimers();

    const wrapper = mount(AddExtensionRepos, {
      ...requiredSetup(),
      // since vue-js-modal uses transitions, we need disable
      // the default behaviour of transition-stubbing that vue-test-utils has...
      stubs: { transition: false }
    });

    wrapper.vm.showDialog();

    // these couple of nextTick + advanceTimersByTime are needed for
    // the dialog content to be rendered!
    await wrapper.vm.$nextTick();

    jest.advanceTimersByTime(1);

    await wrapper.vm.$nextTick();

    jest.advanceTimersByTime(1);

    const rancherCheckbox = wrapper.find('[data-testid="add-extensions-repos-modal-add-official-repo"]');
    const partnersCheckbox = wrapper.find('[data-testid="add-extensions-repos-modal-add-partners-repo"]');

    expect(rancherCheckbox.exists()).toBe(false);
    expect(partnersCheckbox.exists()).toBe(true);

    jest.clearAllTimers();
    wrapper.destroy();
  });

  it('should SHOW a checkbox to install official Rancher repo if IS prime', async() => {
    jest.useFakeTimers();

    const wrapper = mount(AddExtensionRepos, {
      ...requiredSetup(),
      // since vue-js-modal uses transitions, we need disable
      // the default behaviour of transition-stubbing that vue-test-utils has...
      stubs: { transition: false }
    });

    wrapper.vm.prime = true;
    wrapper.vm.showDialog();

    // these couple of nextTick + advanceTimersByTime are needed for
    // the dialog content to be rendered!
    await wrapper.vm.$nextTick();

    jest.advanceTimersByTime(1);

    await wrapper.vm.$nextTick();

    jest.advanceTimersByTime(1);

    const rancherCheckbox = wrapper.find('[data-testid="add-extensions-repos-modal-add-official-repo"]');
    const partnersCheckbox = wrapper.find('[data-testid="add-extensions-repos-modal-add-partners-repo"]');

    expect(rancherCheckbox.exists()).toBe(true);
    expect(partnersCheckbox.exists()).toBe(true);

    jest.clearAllTimers();
    wrapper.destroy();
  });
});
