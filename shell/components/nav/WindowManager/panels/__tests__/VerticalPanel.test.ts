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

const t = (key: string, args?: Record<string, string>) => `%${ key }%${ args ? JSON.stringify(args) : '' }`;

interface PanelOptions {
  mutations?: Record<string, (state: any, payload: any) => void>;
  attachTo?: HTMLElement;
  activeId?: string;
}

const mountPanel = (position: Position, { mutations = {}, attachTo, activeId }: PanelOptions = {}) => {
  const tabs = tabsFor(position);
  const store = createStore({
    state: {
      wm: {
        active:          { [position]: activeId ?? tabs[0].id },
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
      ...mutations,
    },
  });

  const wrapper = mount(VerticalPanel, {
    props:  { position },
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

  it.each<Position>([RIGHT, LEFT])('should not render focusable or interactive elements inside a tab (%s)', (position) => {
    const wrapper = mountPanel(position);

    const interactive = wrapper.findAll('[role="tab"]').flatMap((tab) => Array.from(tab.element.querySelectorAll('button, a[href], input, select, textarea, [tabindex], [role]')));

    expect(interactive).toStrictEqual([]);
  });

  it.each<Position>([RIGHT, LEFT])('should close the active tab with a native button (%s)', (position) => {
    const wrapper = mountPanel(position);

    expect(wrapper.get('[data-testid="wm-close-active-tab-button"]').element.tagName).toStrictEqual('BUTTON');
  });

  it.each<Position>([RIGHT, LEFT])('should name the close active tab button after the active tab (%s)', (position) => {
    const tabs = tabsFor(position);
    const wrapper = mountPanel(position, { activeId: tabs[1].id });

    expect(wrapper.get('[data-testid="wm-close-active-tab-button"]').attributes('aria-label')).toStrictEqual(t('wm.closeTab', { tabLabel: tabs[1].label }));
  });

  it.each<Position>([RIGHT, LEFT])('should keep the close active tab button outside the tablist (%s)', (position) => {
    const wrapper = mountPanel(position);

    expect(wrapper.get('[data-testid="wm-close-active-tab-button"]').element.closest('[role="tablist"]')).toBeNull();
  });

  it.each<Position>([RIGHT, LEFT])('should close the active tab when the close active tab button is clicked (%s)', async(position) => {
    const closeTabMock = jest.fn();
    const tabs = tabsFor(position);
    const wrapper = mountPanel(position, { mutations: { 'wm/closeTab': closeTabMock }, activeId: tabs[1].id });

    await wrapper.get('[data-testid="wm-close-active-tab-button"]').trigger('click');

    expect(closeTabMock).toHaveBeenCalledWith(expect.anything(), { id: tabs[1].id });
  });

  it.each<Position>([RIGHT, LEFT])('should close a single tab for each activation of the close active tab button (%s)', async(position) => {
    const closeTabMock = jest.fn();
    const tabs = tabsFor(position);
    const wrapper = mountPanel(position, { mutations: { 'wm/closeTab': closeTabMock }, activeId: tabs[1].id });

    await wrapper.get('[data-testid="wm-close-active-tab-button"]').trigger('click');

    expect(closeTabMock).toHaveBeenCalledTimes(1);
  });

  it.each<Position>([RIGHT, LEFT])('should move focus to the newly active tab after the close active tab button closes a tab (%s)', async(position) => {
    const tabs = tabsFor(position);
    const wrapper = mountPanel(position, {
      mutations: {
        'wm/closeTab': (state: any) => {
          state.wm.active[position] = tabs[1].id;
        }
      },
      attachTo: document.body
    });

    await wrapper.get('[data-testid="wm-close-active-tab-button"]').trigger('click');
    await flushPromises();

    expect(document.activeElement).toStrictEqual(wrapper.findAll('[role="tab"]')[1].element);
  });

  it.each<Position>([RIGHT, LEFT])('should hide the close active tab tooltip host from assistive technology (%s)', (position) => {
    const wrapper = mountPanel(position);

    expect(wrapper.get('[data-testid="wm-close-active-tab-button"] .has-clean-tooltip').attributes('aria-hidden')).toStrictEqual('true');
  });

  it.each<Position>([RIGHT, LEFT])('should not describe the close active tab button with its own name (%s)', (position) => {
    const wrapper = mountPanel(position);

    expect(wrapper.get('[data-testid="wm-close-active-tab-button"]').attributes('aria-describedby')).toBeUndefined();
  });

  it.each<Position>([RIGHT, LEFT])('should name the tablist (%s)', (position) => {
    const wrapper = mountPanel(position);

    expect(wrapper.get('[role="tablist"]').attributes('aria-label')).toStrictEqual(t('wm.tabList'));
  });

  it.each<Position>([RIGHT, LEFT])('should hide the close control from assistive technology (%s)', (position) => {
    const wrapper = mountPanel(position);

    const hidden = wrapper.findAll('[data-testid="wm-tab-close-button"]').map((closeControl) => closeControl.attributes('aria-hidden'));

    expect(hidden).toStrictEqual(tabsFor(position).map(() => 'true'));
  });

  it.each<Position>([RIGHT, LEFT])('should advertise the Delete shortcut on each tab (%s)', (position) => {
    const wrapper = mountPanel(position);

    const shortcuts = wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('aria-keyshortcuts'));

    expect(shortcuts).toStrictEqual(tabsFor(position).map(() => 'Delete'));
  });

  it.each<Position>([RIGHT, LEFT])('should close the tab when the close button is clicked (%s)', async(position) => {
    const closeTabMock = jest.fn();
    const wrapper = mountPanel(position, { mutations: { 'wm/closeTab': closeTabMock } });
    const tabs = tabsFor(position);

    const firstCloseButton = wrapper.findAll('[data-testid="wm-tab-close-button"]').at(0);

    await firstCloseButton?.trigger('click');

    expect(closeTabMock).toHaveBeenCalledWith(expect.anything(), { id: tabs[0].id });
  });

  it.each<Position>([RIGHT, LEFT])('should close the tab when Delete is pressed on it (%s)', async(position) => {
    const closeTabMock = jest.fn();
    const wrapper = mountPanel(position, { mutations: { 'wm/closeTab': closeTabMock } });

    await wrapper.findAll('[role="tab"]').at(1)?.trigger('keydown', { key: 'Delete' });

    expect(closeTabMock).toHaveBeenCalledWith(expect.anything(), { id: tabsFor(position)[1].id });
  });

  describe.each<Position>([RIGHT, LEFT])('position %s', (position) => {
    it.each([
      ['Backspace', { key: 'Backspace' }],
      ['a held Delete key repeats', { key: 'Delete', repeat: true }],
      ['Shift+Delete', { key: 'Delete', shiftKey: true }],
      ['Ctrl+Delete', { key: 'Delete', ctrlKey: true }],
      ['Alt+Delete', { key: 'Delete', altKey: true }],
      ['Meta+Delete', { key: 'Delete', metaKey: true }],
    ])('should not close the tab when %s', async(_, keyboardEvent) => {
      const closeTabMock = jest.fn();
      const wrapper = mountPanel(position, { mutations: { 'wm/closeTab': closeTabMock } });

      await wrapper.findAll('[role="tab"]').at(1)?.trigger('keydown', keyboardEvent);

      expect(closeTabMock).not.toHaveBeenCalledWith(expect.anything(), expect.anything());
    });
  });

  it.each<Position>([RIGHT, LEFT])('should move focus to the newly active tab after closing a tab with Delete (%s)', async(position) => {
    const tabs = tabsFor(position);
    const wrapper = mountPanel(position, {
      mutations: {
        'wm/closeTab': (state: any) => {
          state.wm.active[position] = tabs[1].id;
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
