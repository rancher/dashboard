import { mount, VueWrapper } from '@vue/test-utils';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';

jest.mock('@shell/components/form/ResourceTabs/composable', () => ({ useTabCountWatcher: () => ({}) }));

const mockT = (key: string) => key;

const defaultGlobalMountOptions = {
  components: { Tab },
  mocks:      {
    $router: {
      replace:      jest.fn(),
      currentRoute: { _value: { hash: '' } }
    },
    $route: { hash: '' },
    t:      mockT,
    store:  { getters: { 'i18n/t': mockT } }
  }
};

describe('component: Tabbed', () => {
  const findTabNav = (wrapper: VueWrapper<any>) => wrapper.find('[data-testid="tabbed-block"]');

  it('should display tab navigation for a single tab when hideSingleTab is false (default)', async() => {
    const wrapper = mount(Tabbed, {
      slots:  { default: { components: { Tab }, template: '<Tab name="tab1" label="Tab 1" />' } },
      global: { ...defaultGlobalMountOptions },
    });

    await wrapper.vm.$nextTick();

    expect(findTabNav(wrapper).exists()).toBe(true);
  });

  it('should display tab navigation for multiple tabs when hideSingleTab is false (default)', async() => {
    const wrapper = mount(Tabbed, {
      slots: {
        default: {
          components: { Tab },
          template:   `
            <Tab name="tab1" label="Tab 1" />
            <Tab name="tab2" label="Tab 2" />
          `,
        },
      },
      global: { ...defaultGlobalMountOptions },
    });

    await wrapper.vm.$nextTick();

    expect(findTabNav(wrapper).exists()).toBe(true);
  });

  it('should NOT display tab navigation for a single tab when hideSingleTab is true', async() => {
    const wrapper = mount(Tabbed, {
      props:  { hideSingleTab: true },
      slots:  { default: { components: { Tab }, template: '<Tab name="tab1" label="Tab 1" />' } },
      global: { ...defaultGlobalMountOptions },
    });

    await wrapper.vm.$nextTick();

    expect(findTabNav(wrapper).exists()).toBe(false);
  });

  it('should display tab navigation for multiple tabs when hideSingleTab is true', async() => {
    const wrapper = mount(Tabbed, {
      props: { hideSingleTab: true },
      slots: {
        default: {
          components: { Tab },
          template:   `
            <Tab name="tab1" label="Tab 1" />
            <Tab name="tab2" label="Tab 2" />
          `,
        },
      },
      global: { ...defaultGlobalMountOptions },
    });

    await wrapper.vm.$nextTick();

    expect(findTabNav(wrapper).exists()).toBe(true);
  });
});
