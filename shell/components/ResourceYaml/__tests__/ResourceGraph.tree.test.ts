import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ResourceGraph from '@shell/components/ResourceYaml/ResourceGraph.vue';
import ResourceGraphGroups from '@shell/components/ResourceYaml/ResourceGraphGroups.vue';
import { ResourceGraphGroup, ResourceGraphNode } from '@shell/components/ResourceYaml/types';

// rendered components from pkg/rancher-components resolve a different copy of vue than shell
jest.mock('@components/RcButton', () => ({ RcButton: { name: 'RcButtonStub', template: '<button><slot /></button>' } }));
jest.mock('@components/Pill', () => ({
  RcStatusBadge:  { name: 'RcStatusBadgeStub', template: '<div><slot /></div>' },
  RcCounterBadge: {
    name: 'RcCounterBadgeStub', props: ['count'], template: '<div>{{ count }}</div>'
  },
}));
jest.mock('@components/RcIcon', () => ({ RcIcon: { name: 'RcIconStub', template: '<i />' } }));

describe('component: ResourceGraph', () => {
  const mountComponent = (nodes: ResourceGraphNode[]) => mount(ResourceGraph, {
    props:  { nodes },
    global: { provide: { store: createStore({}) } }
  });

  // the ids of the nodes in the tree, each followed by the ids of the nodes nested below it
  const treeOf = (groups: ResourceGraphGroup[]): any[] => groups.flatMap((g) => g.nodes.map((n) => (n.groups.length ? [n.id, treeOf(n.groups)] : n.id)));

  // the top-level nodes are shown above the sections, without the nodes below them
  const topLevelGroups = (wrapper: ReturnType<typeof mountComponent>): ResourceGraphGroup[] => wrapper.findComponent(ResourceGraphGroups).props('groups');

  // the nodes below the top-level nodes, each carrying the nodes nested below it
  const relatedGroups = (wrapper: ReturnType<typeof mountComponent>): ResourceGraphGroup[] => wrapper.find('[data-testid="resource-graph-related"]').findComponent(ResourceGraphGroups).props('groups');

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

      expect(treeOf(topLevelGroups(wrapper))).toStrictEqual(['a']);
      expect(treeOf(relatedGroups(wrapper))).toStrictEqual([['b', [['c', ['d']]]]]);
      // the top-level groups, the related section, then the groups nested below `b` and `c`
      expect(wrapper.findAllComponents(ResourceGraphGroups).map((g) => g.props('depth'))).toStrictEqual([0, 0, 1, 2]);
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

      expect(treeOf(topLevelGroups(wrapper))).toStrictEqual(['a']);
      expect(treeOf(relatedGroups(wrapper))).toStrictEqual(['b']);
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

    it('should show nodes whose parents lead back around to them at the top level', () => {
      const wrapper = mountComponent([
        {
          id: 'a', label: 'a', parentId: 'b'
        },
        {
          id: 'b', label: 'b', parentId: 'a'
        },
      ]);

      expect(treeOf(topLevelGroups(wrapper))).toStrictEqual(['a', 'b']);
    });

    it('should keep only the first of the nodes sharing an id', () => {
      const wrapper = mountComponent([{ id: 'a', label: 'first' }, { id: 'a', label: 'second' }]);

      expect(topLevelGroups(wrapper).flatMap((g) => g.nodes.map((n) => n.label))).toStrictEqual(['first']);
    });

    describe('read-only nodes', () => {
      // read-only nodes sharing a parent and a group with nodes that are not read-only
      const nodes: ResourceGraphNode[] = [
        { id: 'top', label: 'top' },
        {
          id: 'parent', label: 'parent', parentId: 'top'
        },
        {
          id: 'r1', label: 'r1', group: 'G', parentId: 'parent', readOnly: true
        },
        {
          id: 'x', label: 'x', group: 'G', parentId: 'parent'
        },
        {
          id: 'r2', label: 'r2', group: 'G', parentId: 'parent', readOnly: true
        },
        {
          id: 'y', label: 'y', group: 'G', parentId: 'parent'
        },
      ];

      const groupsBelowParent = (wrapper: ReturnType<typeof mountComponent>) => relatedGroups(wrapper)[0].nodes[0].groups;
      const readOnlyGroups = (wrapper: ReturnType<typeof mountComponent>): ResourceGraphGroup[] => wrapper.find('[data-testid="resource-graph-referenced"]').findComponent(ResourceGraphGroups).props('groups');

      it('should leave the read-only nodes out of the groups below their parent', () => {
        const wrapper = mountComponent(nodes);

        expect(groupsBelowParent(wrapper).map((g) => ({ label: g.label, ids: g.nodes.map((n) => n.id) }))).toStrictEqual([
          { label: 'G', ids: ['x', 'y'] },
        ]);
      });

      it('should show the read-only nodes in the read-only section, each keeping their order', async() => {
        const wrapper = mountComponent(nodes);

        await wrapper.find('[data-testid="resource-graph-referenced"] [data-testid="resource-graph-section-toggle"]').trigger('click');

        expect(readOnlyGroups(wrapper).map((g) => ({ label: g.label, ids: g.nodes.map((n) => n.id) }))).toStrictEqual([
          { label: 'G', ids: ['r1', 'r2'] },
        ]);
      });
    });
  });
});
