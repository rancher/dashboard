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

const mountPanel = () => {
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
});
