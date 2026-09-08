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

const mountPanel = (position: Position) => {
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
});
