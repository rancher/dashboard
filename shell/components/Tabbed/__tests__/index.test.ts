import { mount, VueWrapper } from '@vue/test-utils';
import { defineComponent } from 'vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { RcHeading } from '@components/RcHeading';

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

const OneTab = defineComponent({
  components: { Tab },
  template:   '<Tab name="tab1" label="Tab 1" />',
});

const TwoTabs = defineComponent({
  components: { Tab },
  template:   `
    <Tab name="tab1" label="Tab 1" />
    <Tab name="tab2" label="Tab 2" />
  `,
});

const ThreeTabs = defineComponent({
  components: { Tab },
  template:   `
    <Tab name="tab1" label="Tab 1" />
    <Tab name="tab2" label="Tab 2" />
    <Tab name="tab3" label="Tab 3" />
  `,
});

describe('component: Tabbed', () => {
  const findTabNav = (wrapper: VueWrapper<any>) => wrapper.find('[data-testid="tabbed-block"]');

  it('should display tab navigation for a single tab when hideSingleTab is false (default)', async() => {
    const wrapper = mount(Tabbed, {
      slots:  { default: OneTab },
      global: { ...defaultGlobalMountOptions },
    });

    await wrapper.vm.$nextTick();

    expect(findTabNav(wrapper).exists()).toBe(true);
  });

  it('should display tab navigation for multiple tabs when hideSingleTab is false (default)', async() => {
    const wrapper = mount(Tabbed, {
      slots:  { default: TwoTabs },
      global: { ...defaultGlobalMountOptions },
    });

    await wrapper.vm.$nextTick();

    expect(findTabNav(wrapper).exists()).toBe(true);
  });

  it('should NOT display tab navigation for a single tab when hideSingleTab is true', async() => {
    const wrapper = mount(Tabbed, {
      props:  { hideSingleTab: true },
      slots:  { default: OneTab },
      global: { ...defaultGlobalMountOptions },
    });

    await wrapper.vm.$nextTick();

    expect(findTabNav(wrapper).exists()).toBe(false);
  });

  it('should display tab navigation for multiple tabs when hideSingleTab is true', async() => {
    const wrapper = mount(Tabbed, {
      props:  { hideSingleTab: true },
      slots:  { default: TwoTabs },
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

const mountTabs = async(props: Record<string, unknown> = {}, attachTo?: HTMLElement): Promise<VueWrapper<any>> => {
  const wrapper = mount(Tabbed, {
    props,
    slots:  { default: ThreeTabs },
    global: { ...defaultGlobalMountOptions },
    attachTo,
  });

  // one tick for the tabs to register themselves, one for the resulting default selection
  await wrapper.vm.$nextTick();
  await wrapper.vm.$nextTick();

  return wrapper;
};

const tabsOf = (wrapper: VueWrapper<any>) => wrapper.findAll('[role="tab"]');

const selectedIndex = (wrapper: VueWrapper<any>) => tabsOf(wrapper).findIndex((tab) => tab.attributes('aria-selected') === 'true');

describe('component: Tabbed, ARIA structure', () => {
  it('should keep the tablist out of the tab sequence and declare its orientation', async() => {
    const wrapper = await mountTabs();
    const tablist = wrapper.find('[role="tablist"]');

    expect(tablist.attributes('tabindex')).toBeUndefined();
    expect(tablist.attributes('aria-orientation')).toBe('horizontal');
  });

  it('should declare a side tablist as vertical', async() => {
    const wrapper = await mountTabs({ sideTabs: true });

    expect(wrapper.find('[role="tablist"]').attributes('aria-orientation')).toBe('vertical');
  });

  it('should not render duplicate ids', async() => {
    const wrapper = await mountTabs();
    const ids = wrapper.findAll('[id]').map((el) => el.attributes('id'));

    expect(ids).toStrictEqual([...new Set(ids)]);
  });

  it('should point each tab at its own tab panel, and at nothing else', async() => {
    const wrapper = await mountTabs();
    const tabs = tabsOf(wrapper);

    expect(tabs).toHaveLength(3);

    tabs.forEach((tab) => {
      const panels = wrapper.findAll(`#${ tab.attributes('aria-controls') }`);

      expect(panels).toHaveLength(1);
      expect(panels[0].attributes('role')).toBe('tabpanel');
      expect(panels[0].attributes('aria-labelledby')).toBe(tab.attributes('id'));
    });
  });

  it('should point every tab at an external panel when one is supplied', async() => {
    const wrapper = await mountTabs({ externalPanelId: 'some-external-panel' });

    expect(tabsOf(wrapper).map((tab) => tab.attributes('aria-controls'))).toStrictEqual([
      'some-external-panel',
      'some-external-panel',
      'some-external-panel',
    ]);
  });

  it('should strip the list semantics from the tab items so the tablist only owns tabs', async() => {
    const wrapper = await mountTabs();
    const items = wrapper.findAll('[data-testid="tabbed-block"] > li');

    expect(items).toHaveLength(3);

    items.forEach((item) => {
      expect(item.attributes('role')).toBe('presentation');
    });
  });

  it('should apply a roving tabindex so only the active tab is reachable with Tab', async() => {
    const wrapper = await mountTabs();

    expect(tabsOf(wrapper).map((tab) => tab.attributes('tabindex'))).toStrictEqual(['0', '-1', '-1']);
    expect(tabsOf(wrapper).map((tab) => tab.attributes('aria-selected'))).toStrictEqual(['true', 'false', 'false']);
  });

  it('should move the roving tabindex with the selection', async() => {
    const wrapper = await mountTabs();

    wrapper.vm.select('tab3');
    await wrapper.vm.$nextTick();

    expect(tabsOf(wrapper).map((tab) => tab.attributes('tabindex'))).toStrictEqual(['-1', '-1', '0']);
    expect(tabsOf(wrapper).map((tab) => tab.attributes('aria-selected'))).toStrictEqual(['false', 'false', 'true']);
  });

  it('should make every tab panel focusable and free of aria-hidden', async() => {
    const wrapper = await mountTabs();
    const panels = wrapper.findAll('[role="tabpanel"]');

    expect(panels).toHaveLength(3);

    panels.forEach((panel) => {
      expect(panel.attributes('tabindex')).toBe('0');
      expect(panel.attributes('aria-hidden')).toBeUndefined();
    });
  });

  it('should not produce duplicate ids when two Tabbed instances share the same tab names', async() => {
    // Both instances must live in the same Vue app — useId() guarantees uniqueness within an app,
    // matching how Tabbed instances coexist in the real single-page application.
    const DoubleTabbedFixture = defineComponent({
      components: { Tabbed, Tab },
      template:   `
        <div>
          <Tabbed>
            <Tab name="tab1" label="Tab 1" />
            <Tab name="tab2" label="Tab 2" />
          </Tabbed>
          <Tabbed>
            <Tab name="tab1" label="Tab 1" />
            <Tab name="tab2" label="Tab 2" />
          </Tabbed>
        </div>
      `,
    });

    const wrapper = mount(DoubleTabbedFixture, {
      global: {
        ...defaultGlobalMountOptions,
        components: { ...defaultGlobalMountOptions.components, Tabbed },
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const ids = wrapper.findAll('[id]').map((el) => el.attributes('id') as string);

    expect(ids.length).toBeGreaterThan(0);
    expect(ids).toStrictEqual([...new Set(ids)]);
  });
});

describe('component: Tabbed, keyboard navigation', () => {
  it.each([
    ['ArrowRight', 0, 1],
    ['ArrowRight', 2, 0],
    ['ArrowLeft', 1, 0],
    ['ArrowLeft', 0, 2],
    ['ArrowDown', 0, 1],
    ['ArrowUp', 0, 2],
    ['Home', 2, 0],
    ['End', 0, 2],
  ])('should move the selection with %s from index %i to index %i', async(key, from, to) => {
    const wrapper = await mountTabs();

    wrapper.vm.select(`tab${ (from as number) + 1 }`);
    await wrapper.vm.$nextTick();

    await tabsOf(wrapper)[from as number].trigger('keydown', { key });

    expect(selectedIndex(wrapper)).toBe(to);
  });

  it.each([['Enter'], [' ']])('should activate the focused tab on %s', async(key) => {
    const wrapper = await mountTabs();

    await tabsOf(wrapper)[1].trigger('keydown', { key });

    expect(selectedIndex(wrapper)).toBe(1);
  });

  it('should move DOM focus along with the selection, so focus is never stranded on an unreachable tab', async() => {
    const container = document.createElement('div');

    document.body.appendChild(container);

    const wrapper = await mountTabs({}, container);

    await tabsOf(wrapper)[0].trigger('keydown', { key: 'ArrowRight' });
    await wrapper.vm.$nextTick();

    const expectedId = wrapper.vm.tabButtonId('tab2');

    expect(document.activeElement?.id).toBe(expectedId);

    wrapper.unmount();
    container.remove();
  });
});

describe('component: Tabbed, side tab add/remove controls', () => {
  const mountWithControls = () => mountTabs({ sideTabs: true, showTabsAddRemove: true });

  it('should render the add/remove controls outside the tablist, not nested inside it', async() => {
    const wrapper = await mountWithControls();
    const footer = wrapper.find('.tab-list-footer');

    expect(footer.element.tagName).toBe('DIV');
    expect(footer.attributes('role')).toBe('presentation');
    expect(wrapper.find('[data-testid="tabbed-block"]').find('.tab-list-footer').exists()).toBe(false);
  });

  it('should emit addTab and removeTab with the index of the active tab', async() => {
    const wrapper = await mountWithControls();

    wrapper.vm.select('tab2');
    await wrapper.vm.$nextTick();

    await wrapper.find('[data-testid="tab-list-add"]').trigger('click');
    await wrapper.find('[data-testid="tab-list-remove"]').trigger('click');

    expect(wrapper.emitted('addTab')).toStrictEqual([[1]]);
    expect(wrapper.emitted('removeTab')).toStrictEqual([[1]]);
  });

  describe('heading level', () => {
    const TabWithHeading = defineComponent({
      components: { Tab, RcHeading },
      template:   `
        <Tab name="tab1" label="Tab 1" :show-header="showHeader">
          <RcHeading size="h3">Section</RcHeading>
        </Tab>
      `,
      props: { showHeader: { type: Boolean, default: true } },
    });

    const mountTab = (showHeader: boolean) => mount(Tabbed, {
      props:  { defaultTab: 'tab1' },
      slots:  { default: `<TabWithHeading :show-header="${ showHeader }" />` },
      global: {
        ...defaultGlobalMountOptions,
        components: { ...defaultGlobalMountOptions.components, TabWithHeading },
      },
    });

    it('should title a tab with an h2, one below the page masthead', () => {
      expect(mountTab(true).find('.tab-header h2').text()).toContain('Tab 1');
    });

    it('should put the content of a titled tab one level deeper', () => {
      expect(mountTab(true).find('.tab-panel h3').exists()).toBe(true);
    });

    it('should not spend a level on a tab that renders no header', () => {
      const wrapper = mountTab(false);

      expect(wrapper.find('.tab-header').exists()).toBe(false);
      expect(wrapper.find('.tab-panel h2').exists()).toBe(true);
    });
  });
});
