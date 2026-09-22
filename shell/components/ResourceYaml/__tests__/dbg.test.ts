import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ResourceGraph from '@shell/components/ResourceYaml/ResourceGraph.vue';

it('dbg', () => {
  const wrapper = mount(ResourceGraph, {
    props:  { nodes: [{ id: 'a', label: 'A' }, { id: 'b', label: 'B', parentId: 'a' }] },
    global: { provide: { store: createStore({}) } }
  });

  const vm = wrapper.vm as any;

  console.log('byId', [...vm.nodesById.keys()]); // eslint-disable-line no-console
  console.log('byParent', [...vm.nodesByParentId.keys()]); // eslint-disable-line no-console
  console.log('below undefined', vm.nodesByParentId.get(undefined)); // eslint-disable-line no-console
  console.log('groupsBelow', JSON.stringify(vm.groupsBelow(undefined))); // eslint-disable-line no-console
});
