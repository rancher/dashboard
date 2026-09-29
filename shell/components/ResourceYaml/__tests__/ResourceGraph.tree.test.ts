import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ResourceGraph from '@shell/components/ResourceYaml/ResourceGraph.vue';
import ResourceGraphGroups from '@shell/components/ResourceYaml/ResourceGraphGroups.vue';
import { ResourceGraphGroup, ResourceGraphNode } from '@shell/components/ResourceYaml/types';

describe.skip('component: ResourceGraph', () => {
  const mountComponent = (nodes: ResourceGraphNode[]) => mount(ResourceGraph, {
    props:  { nodes },
    global: { provide: { store: createStore({}) } }
  });

  // the ids of the nodes in the tree, each followed by the ids of the nodes nested below it
  const treeOf = (groups: ResourceGraphGroup[]): any[] => groups.flatMap((g) => g.nodes.map((n) => (n.groups.length ? [n.id, treeOf(n.groups)] : n.id)));

  const topLevelGroups = (wrapper: ReturnType<typeof mountComponent>): ResourceGraphGroup[] => wrapper.findComponent(ResourceGraphGroups).props('groups');

  describe('tree', () => {
    it('should show a node without `parentId` at the top level', () => {
      const wrapper = mountComponent([{ id: 'a', label: 'a' }, { id: 'b', label: 'b' }]);

      expect(treeOf(topLevelGroups(wrapper))).toStrictEqual(['a', 'b']);
    });

    it('should show nodes nested more than two levels deep', () => {
      const wrapper = mountComponent([
        { id: 'a', label: 'a' },
        {
          id: 'b', label: 'b', parentId: 'a'
        },
        {
          id: 'c', label: 'c', parentId: 'b'
        },
        {
          id: 'd', label: 'd', parentId: 'c'
        },
      ]);

      expect(treeOf(topLevelGroups(wrapper))).toStrictEqual([['a', [['b', [['c', ['d']]]]]]]);
      expect(wrapper.findAllComponents(ResourceGraphGroups).map((g) => g.props('depth'))).toStrictEqual([0, 1, 2, 3]);
    });

    it('should nest a node below its parent when an ancestor of the parent points at a node that is not in the graph', () => {
      const wrapper = mountComponent([
        {
          id: 'a', label: 'a', parentId: 'missing'
        },
        {
          id: 'b', label: 'b', parentId: 'a'
        },
      ]);

      expect(treeOf(topLevelGroups(wrapper))).toStrictEqual([['a', ['b']]]);
    });

    it('should show a node at the top level when its `parentId` is its own id', () => {
      const wrapper = mountComponent([
        { id: 'a', label: 'a' },
        {
          id: 'b', label: 'b', parentId: 'b'
        },
      ]);

      expect(treeOf(topLevelGroups(wrapper))).toStrictEqual(['a', 'b']);
    });
  });
});
