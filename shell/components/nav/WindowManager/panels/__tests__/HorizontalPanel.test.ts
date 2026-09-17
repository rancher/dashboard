import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { createStore } from 'vuex';
import HorizontalPanel from '@shell/components/nav/WindowManager/panels/HorizontalPanel.vue';
import { BOTTOM, CENTER } from '@shell/utils/position';

const tabs = [
  {
    id: 'kubectl:local', label: 'Kubectl: local', position: BOTTOM, showHeader: true
  },
  {
    id: 'logs:pod/ns', label: 'Logs: pod', position: BOTTOM, showHeader: true
  },
];

let attachedWrapper: VueWrapper | undefined;

const mountPanel = (customMutations: Record<string, (state: any, payload: any) => void> = {}, attachTo?: HTMLElement) => {
  const store = createStore({
    state: {
      wm: {
        active:          { [BOTTOM]: tabs[0].id },
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
      ...customMutations,
    },
  });

  const wrapper = mount(HorizontalPanel, {
    props:  { position: BOTTOM },
    global: { plugins: [store] },
    attachTo,
  });

  if (attachTo) {
    attachedWrapper = wrapper;
  }

  return wrapper;
};

describe('component: HorizontalPanel', () => {
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

    expect([...children].map((child) => child.getAttribute('role'))).toStrictEqual(tabs.map(() => 'tab'));
  });

  it('should render a close control for each tab', () => {
    const wrapper = mountPanel();

    expect(wrapper.findAll('[data-testid="wm-tab-close-button"]')).toHaveLength(tabs.length);
  });

  it('should not render focusable or interactive elements inside a tab', () => {
    const wrapper = mountPanel();

    const interactive = wrapper.findAll('[role="tab"]').flatMap((tab) => [...tab.element.querySelectorAll('button, a[href], input, select, textarea, [tabindex], [role]')]);

    expect(interactive).toStrictEqual([]);
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
    const wrapper = mountPanel({ 'wm/closeTab': closeTabMock });

    const firstCloseButton = wrapper.findAll('[data-testid="wm-tab-close-button"]').at(0);

    await firstCloseButton?.trigger('click');

    expect(closeTabMock).toHaveBeenCalledWith(expect.anything(), { id: tabs[0].id });
  });

  it('should close the tab when Delete is pressed on it', async() => {
    const closeTabMock = jest.fn();
    const wrapper = mountPanel({ 'wm/closeTab': closeTabMock });

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
    const wrapper = mountPanel({ 'wm/closeTab': closeTabMock });

    await wrapper.findAll('[role="tab"]').at(1)?.trigger('keydown', keyboardEvent);

    expect(closeTabMock).not.toHaveBeenCalledWith(expect.anything(), expect.anything());
  });

  it('should move focus to the newly active tab after closing a tab with Delete', async() => {
    const wrapper = mountPanel({
      'wm/closeTab': (state: any) => {
        state.wm.active[BOTTOM] = tabs[1].id;
      }
    }, document.body);
    const tabElements = wrapper.findAll('[role="tab"]');

    (tabElements[0].element as HTMLElement).focus();
    await tabElements[0].trigger('keydown', { key: 'Delete' });
    await flushPromises();

    expect(document.activeElement).toStrictEqual(tabElements[1].element);
  });
});
