import { mount, VueWrapper } from '@vue/test-utils';
import { defineComponent } from 'vue';
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

    expect(document.activeElement?.id).toBe('tab-tab2');

    wrapper.unmount();
    container.remove();
  });
});

describe('component: Tabbed, side tab add/remove controls', () => {
  const mountWithControls = () => mountTabs({ sideTabs: true, showTabsAddRemove: true });

  it('should render the controls as a presentational list item, not as a list nested in the tablist', async() => {
    const wrapper = await mountWithControls();
    const footer = wrapper.find('.tab-list-footer');

    expect(footer.element.tagName).toBe('LI');
    expect(footer.attributes('role')).toBe('presentation');
    expect(wrapper.find('[data-testid="tabbed-block"]').findAll('ul')).toHaveLength(0);
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
});
