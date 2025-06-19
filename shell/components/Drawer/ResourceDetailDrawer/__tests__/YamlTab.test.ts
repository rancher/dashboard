import { mount } from '@vue/test-utils';
import YamlTab from '@shell/components/Drawer/ResourceDetailDrawer/YamlTab.vue';
import { createStore } from 'vuex';

import Tab from '@shell/components/Tabbed/Tab.vue';
import { _VIEW } from '@shell/config/query-params';
import ResourceYaml from '@shell/components/ResourceYaml.vue';
import { nextTick } from 'vue';

jest.mock('@shell/components/ResourceYaml.vue', () => ({
  template: `<div>ResourceYaml</div>`,
  props:    {
    value: {
      type:     Object,
      required: true
    },
    yaml: {
      type:     String,
      required: true
    },
    mode: {
      type:     String,
      required: true
    },
  },
  methods: { refresh: jest.fn() }
}));

describe('component: ResourceDetailDrawer/ConfigTab', () => {
  const resource = { resource: 'RESOURCE' };
  const yaml = 'YAML';
  const global = {
    provide: {
      addTab: jest.fn(), removeTab: jest.fn(), sideTabs: false, store: createStore({})
    },
    directives: { 'clean-tooltip': jest.fn() }

  };

  it('should render container with yaml-tab class and correct label and name', async() => {
    const wrapper = mount(YamlTab, {
      props: { resource, yaml },
      global
    });

    const component = wrapper.getComponent(Tab);

    expect(wrapper.classes().includes('yaml-tab')).toBeTruthy();
    expect(component.props('label')).toStrictEqual('component.drawer.resourceDetailDrawer.yamlTab.title');
    expect(component.props('name')).toStrictEqual('yaml-tab');
  });

  it('should render a ResourceYaml component and pass the correct props', () => {
    const wrapper = mount(YamlTab, {
      props: { resource, yaml },
      global
    });

    const component = wrapper.getComponent(ResourceYaml);

    expect(component.props('value')).toStrictEqual(resource);
    expect(component.props('mode')).toStrictEqual(_VIEW);
    expect(component.props('yaml')).toStrictEqual(yaml);
  });

  it('should refresh yaml editor when tab is activated', async() => {
    const wrapper = mount(YamlTab, {
      props: { resource, yaml },
      global
    });

    const tabComponent = wrapper.getComponent(Tab);

    expect(ResourceYaml.methods?.refresh).toHaveBeenCalledTimes(0);
    tabComponent.vm.$emit('active');
    await nextTick();

    expect(ResourceYaml.methods?.refresh).toHaveBeenCalledTimes(1);
  });
});
