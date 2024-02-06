import { mount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex';
import {
  UI_PLUGINS_REPO_URL,
  UI_PLUGINS_PARTNERS_REPO_URL,
} from '@shell/config/uiplugins';
import SetupUIPlugins from '@shell/pages/c/_cluster/uiplugins/SetupUIPlugins.vue';

describe('component: SetupUIPlugins', () => {
  const localVue = createLocalVue();

  localVue.use(Vuex);

  it('should NOT SHOW a checkbox to install official Rancher repo if NOT prime', async() => {
    const store = new Vuex.Store({
      modules: {
        catalog: {
          namespaced: true,
          getters:    {
            repos: () => [
              { urlDisplay: UI_PLUGINS_REPO_URL },
              { urlDisplay: UI_PLUGINS_PARTNERS_REPO_URL },
            ],
            repo:      () => {},
            rawCharts: () => [],
          }
        }
      },
      getters: {
        'i18n/t':               () => jest.fn(),
        'i18n/exists':          () => jest.fn(),
        t:                      () => jest.fn(),
        'management/schemaFor': () => true,
        'management/findAll':   () => [],
        'management/find':      () => {}
      }
    });

    jest.useFakeTimers();

    const wrapper = mount(SetupUIPlugins, {
      store,
      localVue,
      // since vue-js-modal uses transitions, we need disable
      // the default behaviour of transition-stubbing that vue-test-utils has...
      stubs: { transition: false }
    });

    wrapper.vm.enable();

    // these couple of nextTick + advanceTimersByTime are needed for
    // the dialog content to be rendered!
    await wrapper.vm.$nextTick();

    jest.advanceTimersByTime(1);

    await wrapper.vm.$nextTick();

    jest.advanceTimersByTime(1);

    const rancherCheckbox = wrapper.find('[data-testid="extension-enable-operator-official-repo"]');
    const partnersCheckbox = wrapper.find('[data-testid="extension-enable-operator-partners-repo"]');

    expect(rancherCheckbox.exists()).toBe(false);
    expect(partnersCheckbox.exists()).toBe(true);

    jest.clearAllTimers();
    wrapper.destroy();
  });

  it('should SHOW a checkbox to install official Rancher repo if IS prime', async() => {
    const store = new Vuex.Store({
      modules: {
        catalog: {
          namespaced: true,
          getters:    {
            repos: () => [
              { urlDisplay: UI_PLUGINS_REPO_URL },
              { urlDisplay: UI_PLUGINS_PARTNERS_REPO_URL },
            ],
            repo:      () => {},
            rawCharts: () => [],
          }
        }
      },
      getters: {
        'i18n/t':               () => jest.fn(),
        'i18n/exists':          () => jest.fn(),
        t:                      () => jest.fn(),
        'management/schemaFor': () => true,
        'management/findAll':   () => [],
        'management/find':      () => {}
      }
    });

    jest.useFakeTimers();

    const wrapper = mount(SetupUIPlugins, {
      store,
      localVue,
      // since vue-js-modal uses transitions, we need disable
      // the default behaviour of transition-stubbing that vue-test-utils has...
      stubs: { transition: false }
    });

    wrapper.vm.prime = true;
    wrapper.vm.enable();

    // these couple of nextTick + advanceTimersByTime are needed for
    // the dialog content to be rendered!
    await wrapper.vm.$nextTick();

    jest.advanceTimersByTime(1);

    await wrapper.vm.$nextTick();

    jest.advanceTimersByTime(1);

    const rancherCheckbox = wrapper.find('[data-testid="extension-enable-operator-official-repo"]');
    const partnersCheckbox = wrapper.find('[data-testid="extension-enable-operator-partners-repo"]');

    expect(rancherCheckbox.exists()).toBe(true);
    expect(partnersCheckbox.exists()).toBe(true);

    jest.clearAllTimers();
    wrapper.destroy();
  });
});
