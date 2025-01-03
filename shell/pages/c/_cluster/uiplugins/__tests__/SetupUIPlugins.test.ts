import { nextTick } from 'vue';
import { mount } from '@vue/test-utils';

import SetupUIPlugins from '@shell/pages/c/_cluster/uiplugins/SetupUIPlugins.vue';

const mockedStore = () => {
  return {
    getters: {
      'i18n/t':               (text: string) => text,
      'i18n/exists':          (text: string) => text,
      t:                      (text: string) => text,
      'management/schemaFor': jest.fn().mockResolvedValue(true)
    }
  };
};

const requiredSetup = () => {
  return {
    global: {
      mocks: {
        $store:  mockedStore(),
        $router: { push: jest.fn() }
      }
    }
  };
};

describe('setupUIPlugins.vue', () => {
  it('should show the features button when hasFeatureFlag is false and schema exists', async() => {
    const wrapper = mount(SetupUIPlugins, {
      ...requiredSetup(),
      props: { hasFeatureFlag: false }
    });

    await nextTick();
    expect(wrapper.vm.$data.showFeaturesButton).toBe(true);

    const button = wrapper.find('[data-testid="extension-feature-button"]');

    expect(button.exists()).toBe(true);
  });

  it('should not show the features button when hasFeatureFlag is true', async() => {
    const wrapper = mount(SetupUIPlugins, {
      ...requiredSetup(),
      props: { hasFeatureFlag: true }
    });

    await nextTick();
    const button = wrapper.find('[data-testid="extension-feature-button"]');

    expect(button.exists()).toBe(false);
  });

  it('should render the button and handle click event', async() => {
    const wrapper = mount(SetupUIPlugins, {
      ...requiredSetup(),
      props: { hasFeatureFlag: false }
    });

    await nextTick();
    const button = wrapper.find('[data-testid="extension-feature-button"]');

    expect(button.exists()).toBe(true);

    await button.trigger('click');

    expect(wrapper.vm.$router.push).toHaveBeenCalledWith({
      path:   '/c/local/settings/management.cattle.io.feature',
      params: {
        product:  'settings',
        resource: 'management.cattle.io.feature',
        cluster:  'local',
      }
    });
  });
});
