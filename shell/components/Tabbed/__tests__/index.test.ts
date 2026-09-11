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

  describe('tablist structure', () => {
    const twoTabs = {
      components: { Tab },
      template:   `
        <Tab name="tab1" label="Tab 1" />
        <Tab name="tab2" label="Tab 2" />
      `,
    };

    it('should render the tab wrappers as presentational children of the tablist', async() => {
      const wrapper = mount(Tabbed, {
        slots:  { default: twoTabs },
        global: { ...defaultGlobalMountOptions },
      });

      await wrapper.vm.$nextTick();

      const children = Array.from(findTabNav(wrapper).element.children)
        .map((el) => `${ el.tagName.toLowerCase() }[role=${ el.getAttribute('role') }]`);

      expect(children).toStrictEqual(['li[role=presentation]', 'li[role=presentation]']);
    });

    it('should render every tab as a role="tab" inside the tablist', async() => {
      const wrapper = mount(Tabbed, {
        slots:  { default: twoTabs },
        global: { ...defaultGlobalMountOptions },
      });

      await wrapper.vm.$nextTick();

      expect(findTabNav(wrapper).findAll('[role="tab"]')).toHaveLength(2);
    });

    it('should render the add/remove footer outside of the tablist', async() => {
      const wrapper = mount(Tabbed, {
        props:  { sideTabs: true, showTabsAddRemove: true },
        slots:  { default: twoTabs },
        global: { ...defaultGlobalMountOptions },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="tab-list-add"]').exists()).toBe(true);
      expect(findTabNav(wrapper).find('[data-testid="tab-list-add"]').exists()).toBe(false);
    });

    it('should render the tab-row-extras slot outside of the tablist', async() => {
      const wrapper = mount(Tabbed, {
        slots: {
          default:          twoTabs,
          'tab-row-extras': '<div class="tablist-controls"><button type="button">Add container</button></div>',
        },
        global: { ...defaultGlobalMountOptions },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('.tablist-controls').exists()).toBe(true);
      expect(findTabNav(wrapper).find('.tablist-controls').exists()).toBe(false);
    });

    it('should render the empty side tabs placeholder outside of the tablist', async() => {
      const wrapper = mount(Tabbed, {
        props:  { sideTabs: true },
        global: { ...defaultGlobalMountOptions },
      });

      await wrapper.vm.$nextTick();

      expect(wrapper.find('.tab.disabled').exists()).toBe(true);
      expect(findTabNav(wrapper).element.children).toHaveLength(0);
    });
  });
});
