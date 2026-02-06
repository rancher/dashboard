import { mount } from '@vue/test-utils';
import ConfigTab from '@shell/components/Drawer/ResourceDetailDrawer/ConfigTab.vue';
import { createStore } from 'vuex';
import { defineComponent, markRaw } from 'vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { _VIEW } from '@shell/config/query-params';

const DynamicComponent = defineComponent({
  template: '<div>DynamicComponent</div>',
  props:    {
    value:         { type: Object, required: true },
    mode:          { type: String, required: true },
    initialValue:  { type: Object, required: true },
    useTabbedHash: { type: Boolean, required: true }
  }
});

describe('component: ResourceDetailDrawer/ConfigTab', () => {
  const resource = { resource: 'RESOURCE' };
  const global = {
    provide: {
      addTab: jest.fn(), removeTab: jest.fn(), sideTabs: false, store: createStore({})
    },
    directives: { 'clean-tooltip': jest.fn() }

  };

  it('should render container with config-tab class and correct label and name', async() => {
    const wrapper = mount(ConfigTab, {
      props: { resource, component: markRaw(DynamicComponent) },
      global
    });

    const component = wrapper.getComponent(Tab);

    expect(wrapper.classes().includes('config-tab')).toBeTruthy();
    expect(component.props('label')).toStrictEqual('component.drawer.resourceDetailDrawer.configTab.title');
    expect(component.props('name')).toStrictEqual('config-tab');
  });

  it('should render a dynamic component within DrawerCard and pass the correct props', () => {
    const wrapper = mount(ConfigTab, {
      props: { resource, component: markRaw(DynamicComponent) },
      global
    });

    const component = wrapper.findComponent(DynamicComponent);

    expect(component.props('value')).toStrictEqual(resource);
    expect(component.props('mode')).toStrictEqual(_VIEW);
    expect(component.props('initialValue')).toStrictEqual(resource);
    expect(component.props('useTabbedHash')).toStrictEqual(false);
  });
});
