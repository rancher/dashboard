import { mount } from '@vue/test-utils';
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

const mountPanel = (customMutations: Record<string, jest.Mock> = {}) => {
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

  return mount(HorizontalPanel, {
    props:  { position: BOTTOM },
    global: { plugins: [store] },
  });
};

describe('component: HorizontalPanel', () => {
  it('should point each tab at the tabpanel holding its body', () => {
    const wrapper = mountPanel();

    const controls = wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('aria-controls'));
    const panelIds = wrapper.findAll('[role="tabpanel"]').map((panel) => panel.attributes('id'));

    expect(controls).toHaveLength(tabs.length);
    expect(panelIds).toStrictEqual(controls);
  });

  it('should render a close button with role="button" and accessible label for each tab', () => {
    const wrapper = mountPanel();

    const closeButtons = wrapper.findAll('[data-testid="wm-tab-close-button"]');

    expect(closeButtons).toHaveLength(tabs.length);
    closeButtons.forEach((button) => {
      expect(button.attributes('role')).toStrictEqual('button');
      expect(button.attributes('aria-label')).toStrictEqual('%wm.closeTab%');
      expect(button.element.tagName).toStrictEqual('BUTTON');
    });
  });

  it('should close the tab when the close button is clicked', async() => {
    const closeTabMock = jest.fn();
    const wrapper = mountPanel({ 'wm/closeTab': closeTabMock });

    const firstCloseButton = wrapper.findAll('[data-testid="wm-tab-close-button"]').at(0);

    await firstCloseButton?.trigger('click');

    expect(closeTabMock).toHaveBeenCalledWith(expect.anything(), { id: tabs[0].id });
  });

  it('should not nest a focusable element inside a tab', () => {
    const wrapper = mountPanel();

    const nested = wrapper.findAll('[role="tab"]').flatMap((tab) => tab.findAll('button, a, input, select, textarea, [tabindex]'));

    expect(nested).toHaveLength(0);
  });

  it('should render each close button as the sibling of its tab', () => {
    const wrapper = mountPanel();

    const closeButtons = wrapper.findAll('[role="tab"] + [data-testid="wm-tab-close-button"]');

    expect(closeButtons).toHaveLength(tabs.length);
  });

  it.each(['click', 'keyup.enter', 'keyup.space'])('should activate the tab on %s', async(event) => {
    const setActiveMock = jest.fn();
    const wrapper = mountPanel({ 'wm/setActive': setActiveMock });

    await wrapper.findAll('[role="tab"]').at(1)?.trigger(event);

    expect(setActiveMock).toHaveBeenCalledWith(expect.anything(), { position: BOTTOM, id: tabs[1].id });
  });

  it('should not activate the tab when its close button is clicked', async() => {
    const setActiveMock = jest.fn();
    const wrapper = mountPanel({ 'wm/setActive': setActiveMock });

    await wrapper.findAll('[data-testid="wm-tab-close-button"]').at(1)?.trigger('click');

    expect(setActiveMock).toHaveBeenCalledTimes(0);
  });

  it('should not render a button inside the tablist', () => {
    const wrapper = mountPanel();

    const buttons = wrapper.findAll('[role="tablist"] button, [role="tablist"] [role="button"]');

    expect(buttons).toHaveLength(0);
  });

  it('should own every tab from the tablist', () => {
    const wrapper = mountPanel();

    const owned = wrapper.find('[role="tablist"]').attributes('aria-owns')?.split(' ');
    const tabIds = wrapper.findAll('[role="tab"]').map((tab) => tab.attributes('id'));

    expect(owned).toStrictEqual(tabIds);
  });
});
