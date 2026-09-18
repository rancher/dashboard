import { nextTick } from 'vue';
import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { createStore } from 'vuex';
import HorizontalPanel from '@shell/components/nav/WindowManager/panels/HorizontalPanel.vue';
import { BOTTOM, CENTER } from '@shell/utils/position';
import { mockResizeObserver, rect, stubTabBarRects } from './utils/tab-bar';

const tabs = [
  {
    id: 'kubectl:local', label: 'Kubectl: local', position: BOTTOM, showHeader: true
  },
  {
    id: 'logs:pod/ns', label: 'Logs: pod', position: BOTTOM, showHeader: true
  },
];

let attachedWrapper: VueWrapper | undefined;
const t = (key: string, args?: Record<string, string>) => `%${ key }%${ args ? JSON.stringify(args) : '' }`;

interface PanelOptions {
  mutations?: Record<string, (state: any, payload: any) => void>;
  attachTo?: HTMLElement;
  activeId?: string;
}

const mountPanel = ({ mutations = {}, attachTo, activeId = tabs[0].id }: PanelOptions = {}) => {
  const store = createStore({
    state: {
      wm: {
        active:          { [BOTTOM]: activeId },
        panelHeight:     { [BOTTOM]: 100 },
        panelWidth:      { [BOTTOM]: 100 },
        userPin:         CENTER,
        lockedPositions: [],
      }
    },
    getters:   { 'wm/tabs': () => tabs },
    mutations: {
      'wm/setActive':      jest.fn(),
      'wm/setPanelHeight': jest.fn(),
      'wm/setPanelWidth':  jest.fn(),
      'wm/closeTab':       jest.fn(),
      ...mutations,
    },
  });

  const wrapper = mount(HorizontalPanel, {
    props:  { position: BOTTOM },
    global: {
      plugins: [store],
      mocks:   { t },
    },
    attachTo,
  });

  if (attachTo) {
    attachedWrapper = wrapper;
  }

  return wrapper;
};

describe('component: HorizontalPanel', () => {
  let resizeObserver: ReturnType<typeof mockResizeObserver>;

  beforeEach(() => {
    resizeObserver = mockResizeObserver();
  });

  afterEach(() => {
    attachedWrapper?.unmount();
    attachedWrapper = undefined;
  });

  it('should point each tab at the tabpanel holding its body', () => {
    const wrapper = mountPanel();

    const controls = wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('aria-controls'));
    const panelIds = wrapper.findAll('[role="tabpanel"]').map((panel) => panel.attributes('id'));

    expect(controls).toHaveLength(tabs.length);
    expect(panelIds).toStrictEqual(controls);
  });

  it('should only contain tabs inside the tablist', () => {
    const wrapper = mountPanel();

    const children = wrapper.find('[role="tablist"]').element.children;

    expect(Array.from(children).map((child) => child.getAttribute('role'))).toStrictEqual(tabs.map(() => 'tab'));
  });

  it('should not render focusable or interactive elements inside a tab', () => {
    const wrapper = mountPanel();

    const interactive = wrapper.findAll('[role="tab"]').flatMap((tab) => Array.from(tab.element.querySelectorAll('button, a[href], input, select, textarea, [tabindex], [role]')));

    expect(interactive).toStrictEqual([]);
  });

  it('should close the active tab with a native button', () => {
    const wrapper = mountPanel();

    expect(wrapper.get('[data-testid="wm-close-active-tab-button"]').element.tagName).toStrictEqual('BUTTON');
  });

  it('should name the close active tab button after the active tab', () => {
    const wrapper = mountPanel({ activeId: tabs[1].id });

    expect(wrapper.get('[data-testid="wm-close-active-tab-button"]').attributes('aria-label')).toStrictEqual(t('wm.closeTab', { tabLabel: tabs[1].label }));
  });

  it('should keep the close active tab button outside the tablist', () => {
    const wrapper = mountPanel();

    expect(wrapper.get('[data-testid="wm-close-active-tab-button"]').element.closest('[role="tablist"]')).toBeNull();
  });

  it('should close the active tab when the close active tab button is clicked', async() => {
    const closeTabMock = jest.fn();
    const wrapper = mountPanel({ mutations: { 'wm/closeTab': closeTabMock }, activeId: tabs[1].id });

    await wrapper.get('[data-testid="wm-close-active-tab-button"]').trigger('click');

    expect(closeTabMock).toHaveBeenCalledWith(expect.anything(), { id: tabs[1].id });
  });

  it('should close a single tab for each activation of the close active tab button', async() => {
    const closeTabMock = jest.fn();
    const wrapper = mountPanel({ mutations: { 'wm/closeTab': closeTabMock }, activeId: tabs[1].id });

    await wrapper.get('[data-testid="wm-close-active-tab-button"]').trigger('click');

    expect(closeTabMock).toHaveBeenCalledTimes(1);
  });

  it('should move focus to the newly active tab after the close active tab button closes a tab', async() => {
    const wrapper = mountPanel({
      mutations: {
        'wm/closeTab': (state: any) => {
          state.wm.active[BOTTOM] = tabs[1].id;
        }
      },
      attachTo: document.body
    });

    await wrapper.get('[data-testid="wm-close-active-tab-button"]').trigger('click');
    await flushPromises();

    expect(document.activeElement).toStrictEqual(wrapper.findAll('[role="tab"]')[1].element);
  });

  it('should hide the close active tab button until it is focused', () => {
    const wrapper = mountPanel();

    expect(wrapper.get('[data-testid="wm-close-active-tab-button"]').classes()).toContain('sr-only');
  });

  it('should place the close active tab button over the active tab close icon while it is focused', async() => {
    const wrapper = mountPanel();
    const button = wrapper.get('[data-testid="wm-close-active-tab-button"]');

    stubTabBarRects(wrapper, {
      bar: rect(100, 800), list: rect(100, 400), tab: rect(150, 80), closer: rect(180, 14, 7, 14)
    });

    await button.trigger('focus');

    expect(button.attributes('style')).toStrictEqual('left: 79px; top: 6px; width: 14px; height: 14px; min-height: 14px;');
  });

  it('should fall back to the end of the tab list when the active tab clips its own close icon', async() => {
    const wrapper = mountPanel();
    const button = wrapper.get('[data-testid="wm-close-active-tab-button"]');

    stubTabBarRects(wrapper, {
      bar: rect(100, 800), list: rect(100, 400), tab: rect(170, 20), closer: rect(180, 14, 7, 14)
    });

    await button.trigger('focus');

    expect(button.attributes('style')).toStrictEqual('left: 370px; top: -1px; width: 29px; height: 29px; min-height: 29px;');
  });

  it('should mark the close active tab button as detached while it sits at the end of the tab list', async() => {
    const wrapper = mountPanel();
    const button = wrapper.get('[data-testid="wm-close-active-tab-button"]');

    stubTabBarRects(wrapper, {
      bar: rect(100, 800), list: rect(100, 400), tab: rect(170, 20), closer: rect(180, 14, 7, 14)
    });

    await button.trigger('focus');

    expect(button.classes()).toContain('close-active-tab-detached');
  });

  it('should fall back to the end of the tab list when the active tab close icon is outside the tab list', async() => {
    const wrapper = mountPanel();
    const button = wrapper.get('[data-testid="wm-close-active-tab-button"]');

    stubTabBarRects(wrapper, {
      bar: rect(100, 800), list: rect(100, 400), tab: rect(520, 80), closer: rect(560, 14, 7, 14)
    });

    await button.trigger('focus');

    expect(button.attributes('style')).toStrictEqual('left: 370px; top: -1px; width: 29px; height: 29px; min-height: 29px;');
  });

  it('should measure the close active tab button again when the tab bar reflows', async() => {
    const wrapper = mountPanel();
    const button = wrapper.get('[data-testid="wm-close-active-tab-button"]');
    const stubs = stubTabBarRects(wrapper, {
      bar: rect(100, 800), list: rect(100, 400), tab: rect(150, 80), closer: rect(180, 14, 7, 14)
    });

    await button.trigger('focus');
    stubs.closerElement.getBoundingClientRect = () => rect(200, 14, 7, 14);
    window.dispatchEvent(new Event('resize'));
    await nextTick();

    expect(button.attributes('style')).toStrictEqual('left: 99px; top: 6px; width: 14px; height: 14px; min-height: 14px;');
  });

  it('should observe the tab bar and the tab list while the close active tab button is focused', async() => {
    const wrapper = mountPanel();
    const stubs = stubTabBarRects(wrapper, {
      bar: rect(100, 800), list: rect(100, 400), tab: rect(150, 80), closer: rect(180, 14, 7, 14)
    });

    await wrapper.get('[data-testid="wm-close-active-tab-button"]').trigger('focus');

    expect(resizeObserver.observed).toStrictEqual([stubs.barElement, stubs.listElement]);
  });

  it('should measure the close active tab button again when the observer reports a resize', async() => {
    const wrapper = mountPanel();
    const button = wrapper.get('[data-testid="wm-close-active-tab-button"]');
    const stubs = stubTabBarRects(wrapper, {
      bar: rect(100, 800), list: rect(100, 400), tab: rect(150, 80), closer: rect(180, 14, 7, 14)
    });

    await button.trigger('focus');
    stubs.closerElement.getBoundingClientRect = () => rect(200, 14, 7, 14);
    resizeObserver.notify();
    await nextTick();

    expect(button.attributes('style')).toStrictEqual('left: 99px; top: 6px; width: 14px; height: 14px; min-height: 14px;');
  });

  it('should stop observing the previous elements when the close active tab button is focused twice', async() => {
    const wrapper = mountPanel();
    const button = wrapper.get('[data-testid="wm-close-active-tab-button"]');

    stubTabBarRects(wrapper, {
      bar: rect(100, 800), list: rect(100, 400), tab: rect(150, 80), closer: rect(180, 14, 7, 14)
    });

    await button.trigger('focus');
    await button.trigger('focus');

    expect(resizeObserver.disconnect).toHaveBeenCalledTimes(1);
  });

  it('should stop observing when the close active tab button loses focus', async() => {
    const wrapper = mountPanel();
    const button = wrapper.get('[data-testid="wm-close-active-tab-button"]');

    stubTabBarRects(wrapper, {
      bar: rect(100, 800), list: rect(100, 400), tab: rect(150, 80), closer: rect(180, 14, 7, 14)
    });

    await button.trigger('focus');
    await button.trigger('blur');

    expect(resizeObserver.disconnect).toHaveBeenCalledTimes(1);
  });

  it('should stop observing when the panel unmounts while the close active tab button is focused', async() => {
    const wrapper = mountPanel();

    stubTabBarRects(wrapper, {
      bar: rect(100, 800), list: rect(100, 400), tab: rect(150, 80), closer: rect(180, 14, 7, 14)
    });

    await wrapper.get('[data-testid="wm-close-active-tab-button"]').trigger('focus');
    wrapper.unmount();

    expect(resizeObserver.disconnect).toHaveBeenCalledTimes(1);
  });

  it('should stop measuring the close active tab button once it loses focus', async() => {
    const wrapper = mountPanel();
    const button = wrapper.get('[data-testid="wm-close-active-tab-button"]');
    const stubs = stubTabBarRects(wrapper, {
      bar: rect(100, 800), list: rect(100, 400), tab: rect(150, 80), closer: rect(180, 14, 7, 14)
    });

    await button.trigger('focus');
    await button.trigger('blur');
    stubs.closerElement.getBoundingClientRect = () => rect(300, 14, 7, 14);
    window.dispatchEvent(new Event('resize'));
    await nextTick();

    expect(button.attributes('style')).toStrictEqual('');
  });

  it('should keep the hidden close active tab button in the accessibility tree', () => {
    const wrapper = mountPanel();

    expect(wrapper.get('[data-testid="wm-close-active-tab-button"]').attributes('aria-hidden')).toBeUndefined();
  });

  it('should not describe the close active tab button with its own name', () => {
    const wrapper = mountPanel();

    expect(wrapper.get('[data-testid="wm-close-active-tab-button"]').attributes('aria-describedby')).toBeUndefined();
  });

  it('should name the tablist', () => {
    const wrapper = mountPanel();

    expect(wrapper.get('[role="tablist"]').attributes('aria-label')).toStrictEqual(t('wm.tabList'));
  });

  it('should hide the close control from assistive technology', () => {
    const wrapper = mountPanel();

    const hidden = wrapper.findAll('[data-testid="wm-tab-close-button"]').map((closeControl) => closeControl.attributes('aria-hidden'));

    expect(hidden).toStrictEqual(tabs.map(() => 'true'));
  });

  it('should advertise the Delete shortcut on each tab', () => {
    const wrapper = mountPanel();

    const shortcuts = wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('aria-keyshortcuts'));

    expect(shortcuts).toStrictEqual(tabs.map(() => 'Delete'));
  });

  it('should close the tab when the close button is clicked', async() => {
    const closeTabMock = jest.fn();
    const wrapper = mountPanel({ mutations: { 'wm/closeTab': closeTabMock } });

    const firstCloseButton = wrapper.findAll('[data-testid="wm-tab-close-button"]').at(0);

    await firstCloseButton?.trigger('click');

    expect(closeTabMock).toHaveBeenCalledWith(expect.anything(), { id: tabs[0].id });
  });

  it('should close the tab when Delete is pressed on it', async() => {
    const closeTabMock = jest.fn();
    const wrapper = mountPanel({ mutations: { 'wm/closeTab': closeTabMock } });

    await wrapper.findAll('[role="tab"]').at(1)?.trigger('keydown', { key: 'Delete' });

    expect(closeTabMock).toHaveBeenCalledWith(expect.anything(), { id: tabs[1].id });
  });

  it.each([
    ['Backspace', { key: 'Backspace' }],
    ['a held Delete key repeats', { key: 'Delete', repeat: true }],
    ['Shift+Delete', { key: 'Delete', shiftKey: true }],
    ['Ctrl+Delete', { key: 'Delete', ctrlKey: true }],
    ['Alt+Delete', { key: 'Delete', altKey: true }],
    ['Meta+Delete', { key: 'Delete', metaKey: true }],
  ])('should not close the tab when %s', async(_, keyboardEvent) => {
    const closeTabMock = jest.fn();
    const wrapper = mountPanel({ mutations: { 'wm/closeTab': closeTabMock } });

    await wrapper.findAll('[role="tab"]').at(1)?.trigger('keydown', keyboardEvent);

    expect(closeTabMock).not.toHaveBeenCalledWith(expect.anything(), expect.anything());
  });

  it('should move focus to the newly active tab after closing a tab with Delete', async() => {
    const wrapper = mountPanel({
      mutations: {
        'wm/closeTab': (state: any) => {
          state.wm.active[BOTTOM] = tabs[1].id;
        }
      },
      attachTo: document.body
    });
    const tabElements = wrapper.findAll('[role="tab"]');

    (tabElements[0].element as HTMLElement).focus();
    await tabElements[0].trigger('keydown', { key: 'Delete' });
    await flushPromises();

    expect(document.activeElement).toStrictEqual(tabElements[1].element);
  });
});
