import { flushPromises, mount, VueWrapper } from '@vue/test-utils';
import { createStore } from 'vuex';
import VerticalPanel from '@shell/components/nav/WindowManager/panels/VerticalPanel.vue';
import { Position } from '@shell/types/window-manager';
import { CENTER, LEFT, RIGHT } from '@shell/utils/position';

const tabsFor = (position: Position) => [
  {
    id: 'kubectl:local', label: 'Kubectl: local', position, showHeader: true
  },
  {
    id: 'logs:pod/ns', label: 'Logs: pod', position, showHeader: true
  },
];

let attachedWrapper: VueWrapper | undefined;

const mountPanel = (position: Position, customMutations: Record<string, (state: any, payload: any) => void> = {}, attachTo?: HTMLElement) => {
  const tabs = tabsFor(position);
  const store = createStore({
    state: {
      wm: {
        active:          { [position]: tabs[0].id },
        panelHeight:     { [position]: 100 },
        panelWidth:      { [position]: 100 },
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

  const wrapper = mount(VerticalPanel, {
    props:  { position },
    global: { plugins: [store] },
    attachTo,
  });

  if (attachTo) {
    attachedWrapper = wrapper;
  }

  return wrapper;
};

describe('component: VerticalPanel', () => {
  afterEach(() => {
    attachedWrapper?.unmount();
    attachedWrapper = undefined;
  });

  it.each<Position>([RIGHT, LEFT])('should point each tab at the tabpanel holding its body (%s)', (position) => {
    const wrapper = mountPanel(position);

    const controls = wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('aria-controls'));
    const panelIds = wrapper.findAll('[role="tabpanel"]').map((panel) => panel.attributes('id'));

    expect(controls).toHaveLength(2);
    expect(panelIds).toStrictEqual(controls);
  });

  it.each<Position>([RIGHT, LEFT])('should only contain tabs inside the tablist (%s)', (position) => {
    const wrapper = mountPanel(position);
    const tabs = tabsFor(position);

    const children = wrapper.find('[role="tablist"]').element.children;

    expect(Array.from(children).map((child) => child.getAttribute('role'))).toStrictEqual(tabs.map(() => 'tab'));
  });

  it('should render a close control for each tab', () => {
    const wrapper = mountPanel(RIGHT);

    expect(wrapper.findAll('[data-testid="wm-tab-close-button"]')).toHaveLength(tabsFor(RIGHT).length);
  });

  it('should not render focusable or interactive elements inside a tab', () => {
    const wrapper = mountPanel(RIGHT);

    const interactive = wrapper.findAll('[role="tab"]').flatMap((tab) => Array.from(tab.element.querySelectorAll('button, a[href], input, select, textarea, [tabindex], [role]')));

    expect(interactive).toStrictEqual([]);
  });

  it('should hide the close control from assistive technology', () => {
    const wrapper = mountPanel(RIGHT);

    const hidden = wrapper.findAll('[data-testid="wm-tab-close-button"]').map((closeControl) => closeControl.attributes('aria-hidden'));

    expect(hidden).toStrictEqual(tabsFor(RIGHT).map(() => 'true'));
  });

  it('should advertise the Delete shortcut on each tab', () => {
    const wrapper = mountPanel(RIGHT);

    const shortcuts = wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('aria-keyshortcuts'));

    expect(shortcuts).toStrictEqual(tabsFor(RIGHT).map(() => 'Delete'));
  });

  it.each<Position>([RIGHT, LEFT])('should close the tab when the close button is clicked (%s)', async(position) => {
    const closeTabMock = jest.fn();
    const wrapper = mountPanel(position, { 'wm/closeTab': closeTabMock });
    const tabs = tabsFor(position);

    const firstCloseButton = wrapper.findAll('[data-testid="wm-tab-close-button"]').at(0);

    await firstCloseButton?.trigger('click');

    expect(closeTabMock).toHaveBeenCalledWith(expect.anything(), { id: tabs[0].id });
  });

  it('should close the tab when Delete is pressed on it', async() => {
    const closeTabMock = jest.fn();
    const wrapper = mountPanel(RIGHT, { 'wm/closeTab': closeTabMock });

    await wrapper.findAll('[role="tab"]').at(1)?.trigger('keydown', { key: 'Delete' });

    expect(closeTabMock).toHaveBeenCalledWith(expect.anything(), { id: tabsFor(RIGHT)[1].id });
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
    const wrapper = mountPanel(RIGHT, { 'wm/closeTab': closeTabMock });

    await wrapper.findAll('[role="tab"]').at(1)?.trigger('keydown', keyboardEvent);

    expect(closeTabMock).not.toHaveBeenCalledWith(expect.anything(), expect.anything());
  });

  it('should move focus to the newly active tab after closing a tab with Delete', async() => {
    const tabs = tabsFor(RIGHT);
    const wrapper = mountPanel(RIGHT, {
      'wm/closeTab': (state: any) => {
        state.wm.active[RIGHT] = tabs[1].id;
      }
    }, document.body);
    const tabElements = wrapper.findAll('[role="tab"]');

    (tabElements[0].element as HTMLElement).focus();
    await tabElements[0].trigger('keydown', { key: 'Delete' });
    await flushPromises();

    expect(document.activeElement).toStrictEqual(tabElements[1].element);
  });
});
