import { mount } from '@vue/test-utils';
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

const mountPanel = (position: Position, customMutations: Record<string, jest.Mock> = {}) => {
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

  return mount(VerticalPanel, {
    props:  { position },
    global: { plugins: [store] },
  });
};

describe('component: VerticalPanel', () => {
  it.each<Position>([RIGHT, LEFT])('should point each tab at the tabpanel holding its body (%s)', (position) => {
    const wrapper = mountPanel(position);

    const controls = wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('aria-controls'));
    const panelIds = wrapper.findAll('[role="tabpanel"]').map((panel) => panel.attributes('id'));

    expect(controls).toHaveLength(2);
    expect(panelIds).toStrictEqual(controls);
  });

  it.each<Position>([RIGHT, LEFT])('should render a close button with role="button" and accessible label for each tab (%s)', (position) => {
    const wrapper = mountPanel(position);
    const tabs = tabsFor(position);

    const closeButtons = wrapper.findAll('[data-testid="wm-tab-close-button"]');

    expect(closeButtons).toHaveLength(tabs.length);
    closeButtons.forEach((button) => {
      expect(button.attributes('role')).toStrictEqual('button');
      expect(button.attributes('aria-label')).toStrictEqual('%wm.closeTab%');
      expect(button.element.tagName).toStrictEqual('BUTTON');
    });
  });

  it.each<Position>([RIGHT, LEFT])('should close the tab when the close button is clicked (%s)', async(position) => {
    const closeTabMock = jest.fn();
    const wrapper = mountPanel(position, { 'wm/closeTab': closeTabMock });
    const tabs = tabsFor(position);

    const firstCloseButton = wrapper.findAll('[data-testid="wm-tab-close-button"]').at(0);

    await firstCloseButton?.trigger('click');

    expect(closeTabMock).toHaveBeenCalledWith(expect.anything(), { id: tabs[0].id });
  });

  it.each<Position>([RIGHT, LEFT])('should not nest a focusable element inside a tab (%s)', (position) => {
    const wrapper = mountPanel(position);

    const nested = wrapper.findAll('[role="tab"]').flatMap((tab) => tab.findAll('button, a, input, select, textarea, [tabindex]'));

    expect(nested).toHaveLength(0);
  });

  it.each<Position>([RIGHT, LEFT])('should render each close button as the sibling of its tab (%s)', (position) => {
    const wrapper = mountPanel(position);

    const closeButtons = wrapper.findAll('[role="tab"] + [data-testid="wm-tab-close-button"]');

    expect(closeButtons).toHaveLength(tabsFor(position).length);
  });

  it.each<[Position, string]>([
    [RIGHT, 'click'],
    [RIGHT, 'keyup.enter'],
    [RIGHT, 'keyup.space'],
    [LEFT, 'click'],
    [LEFT, 'keyup.enter'],
    [LEFT, 'keyup.space'],
  ])('should activate the tab (%s) on %s', async(position, event) => {
    const setActiveMock = jest.fn();
    const wrapper = mountPanel(position, { 'wm/setActive': setActiveMock });

    await wrapper.findAll('[role="tab"]').at(1)?.trigger(event);

    expect(setActiveMock).toHaveBeenCalledWith(expect.anything(), { position, id: tabsFor(position)[1].id });
  });

  it.each<Position>([RIGHT, LEFT])('should not activate the tab when its close button is clicked (%s)', async(position) => {
    const setActiveMock = jest.fn();
    const wrapper = mountPanel(position, { 'wm/setActive': setActiveMock });

    await wrapper.findAll('[data-testid="wm-tab-close-button"]').at(1)?.trigger('click');

    expect(setActiveMock).toHaveBeenCalledTimes(0);
  });
});
