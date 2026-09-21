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
});
