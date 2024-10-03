import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { UI_PLUGINS_REPOS } from '@shell/config/uiplugins';
import AddExtensionRepos from '@shell/pages/c/_cluster/uiplugins/AddExtensionRepos.vue';
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

describe('component: AddExtensionRepos', () => {
  it('should NOT SHOW a checkbox to install official Rancher repo if NOT prime', async() => {
    jest.useFakeTimers();

    const wrapper = mount(AddExtensionRepos, {
      global: {
        ...requiredSetup(),
        stubs: { Dialog: { template: '<span><slot/></span>' } },
      }
    });

    wrapper.vm.showDialog();

    await nextTick();

    const rancherCheckbox = wrapper.findComponent('[data-testid="add-extensions-repos-modal-add-official-repo"]');
    const partnersCheckbox = wrapper.findComponent('[data-testid="add-extensions-repos-modal-add-partners-repo"]');

    expect(rancherCheckbox.exists()).toBe(false);
    expect(partnersCheckbox.exists()).toBe(true);

    wrapper.unmount();
  });

  it('should SHOW a checkbox to install official Rancher repo if IS prime', async() => {
    jest.useFakeTimers();

    const wrapper = mount(AddExtensionRepos, {
      global: {
        ...requiredSetup(),
        stubs: { Dialog: { template: '<span><slot/></span>' } },
      }
    });

    wrapper.vm.prime = true;
    wrapper.vm.showDialog();

    await nextTick();

    const rancherCheckbox = wrapper.findComponent('[data-testid="add-extensions-repos-modal-add-official-repo"]');
    const partnersCheckbox = wrapper.findComponent('[data-testid="add-extensions-repos-modal-add-partners-repo"]');

    expect(rancherCheckbox.exists()).toBe(true);
    expect(partnersCheckbox.exists()).toBe(true);

    wrapper.unmount();
  });
});
