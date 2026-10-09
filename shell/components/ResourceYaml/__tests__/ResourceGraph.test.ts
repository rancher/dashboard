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
  const nodes: ResourceGraphNode[] = [
    {
      id: 'ns/my-capi-cluster', label: 'my-capi-cluster', modified: true
    },
    {
      id: 'ns/vsphere-cluster', label: 'VSphereCluster', group: 'Infrastructure'
    },
    {
      id: 'ns/ctrl', label: 'ctrl', group: 'Node Pools'
    },
    {
      id: 'ns/workers', label: 'workers', group: 'Node Pools'
    },
    {
      id: 'ns/cc', label: 'cc-x7k2p', group: 'Referenced', readOnly: true
    },
  ];

  const mountComponent = (props: any = {}) => mount(ResourceGraph, {
    props:  { nodes, ...props },
    global: { provide: { store: createStore({}) } }
  });

  const related = (wrapper: ReturnType<typeof mountComponent>) => wrapper.find('[data-testid="resource-graph-related"]');
  const referenced = (wrapper: ReturnType<typeof mountComponent>) => wrapper.find('[data-testid="resource-graph-referenced"]');
  const toggle = (section: ReturnType<typeof related>) => section.find('[data-testid="resource-graph-section-toggle"]');
  const labelsIn = (section: ReturnType<typeof related>) => section.findAll('.resource-graph-node-label').map((l) => l.text());

  it('should show a node per resource, the read-only ones once the read-only section is expanded', async() => {
    const wrapper = mountComponent();

    await toggle(referenced(wrapper)).trigger('click');

    expect(wrapper.findAll('.resource-graph-node-label').map((n) => n.text())).toStrictEqual([
      'my-capi-cluster', 'VSphereCluster', 'ctrl', 'workers', 'cc-x7k2p'
    ]);
  });

  it('should show the number of resources', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="resource-graph-count"]').text()).toBe('5');
  });

  it('should group the nodes in the order they are given, ungrouped nodes first', () => {
    const wrapper = mountComponent();

    expect(wrapper.findAll('.resource-graph-group-label').map((l) => l.text())).toStrictEqual([
      'Infrastructure', 'Node Pools'
    ]);
    expect(wrapper.findAll('.resource-graph-group')[1].findAll('.resource-graph-node').map((n) => n.text())).toStrictEqual(['VSphereCluster']);
    expect(wrapper.findAll('.resource-graph-group')[2].findAll('.resource-graph-node').map((n) => n.text())).toStrictEqual(['ctrl', 'workers']);
  });

  it('should show no heading for the ungrouped nodes', () => {
    const wrapper = mountComponent();
    const first = wrapper.findAll('.resource-graph-group')[0];

    expect(first.find('.resource-graph-group-label').exists()).toBe(false);
    expect(first.findAll('.resource-graph-node-label').map((n) => n.text())).toStrictEqual(['my-capi-cluster']);
  });

  it('should mark the selected node', () => {
    const wrapper = mountComponent({ selected: 'ns/workers' });
    const selected = wrapper.findAll('.resource-graph-node--selected');

    expect(selected).toHaveLength(1);
    expect(selected[0].text()).toBe('workers');
    expect(selected[0].find('[data-testid="resource-graph-node-ns/workers"]').attributes('aria-current')).toBe('true');
  });

  it('should mark no node as selected when nothing is selected', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('.resource-graph-node--selected').exists()).toBe(false);
  });

  it('should mark a read only node', async() => {
    const wrapper = mountComponent();

    await toggle(referenced(wrapper)).trigger('click');

    expect(wrapper.findAll('.resource-graph-node--read-only').map((n) => n.text())).toStrictEqual(['cc-x7k2p']);
  });

  it('should show a read-only node without a parent in the read-only section, not at the top level', async() => {
    const wrapper = mountComponent();

    await toggle(referenced(wrapper)).trigger('click');

    expect(labelsIn(referenced(wrapper))).toStrictEqual(['cc-x7k2p']);
  });

  it('should show an indicator only for a modified node', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="resource-graph-modified-ns/my-capi-cluster"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="resource-graph-modified-ns/workers"]').exists()).toBe(false);
  });

  it('should emit the id of the node the user picks', async() => {
    const wrapper = mountComponent();

    await wrapper.find('[data-testid="resource-graph-node-ns/workers"]').trigger('click');

    expect(wrapper.emitted('select')).toStrictEqual([['ns/workers']]);
  });

  it('should show nothing but the header when there are no resources', () => {
    const wrapper = mountComponent({ nodes: [] });

    expect(wrapper.find('[data-testid="resource-graph-count"]').text()).toBe('0');
    expect(wrapper.findAll('.resource-graph-node')).toHaveLength(0);
  });

  it('should emit `save` with the id of the node whose save button is clicked', async() => {
    const wrapper = mountComponent();

    await wrapper.find('[data-testid="resource-graph-save-ns/my-capi-cluster"]').trigger('click');

    expect(wrapper.emitted('save')).toStrictEqual([['ns/my-capi-cluster']]);
  });

  describe('sections', () => {
    // a primary resource, a dependency with one of its own, and a read-only resource with one of its own
    const tree: ResourceGraphNode[] = [
      {
        id: 'primary', label: 'primary', group: 'Cluster'
      },
      {
        id: 'infra', label: 'infra', group: 'Infrastructure', parentId: 'primary'
      },
      {
        id: 'template', label: 'template', group: 'Templates', parentId: 'infra'
      },
      {
        id: 'capi', label: 'capi', group: 'CAPI Cluster', parentId: 'primary', readOnly: true
      },
      {
        id: 'machine', label: 'machine', group: 'Machines', parentId: 'capi', readOnly: true
      },
    ];

    // the ids of the nodes in the groups, each followed by the ids of the nodes nested below it
    const treeOf = (groups: ResourceGraphGroup[]): any[] => groups.flatMap((g) => g.nodes.map((n) => (n.groups.length ? [n.id, treeOf(n.groups)] : n.id)));

    it('should show only the top-level nodes above the sections, without the nodes found below them', () => {
      const wrapper = mountComponent({ nodes: tree });

      expect(treeOf(wrapper.findComponent(ResourceGraphGroups).props('groups'))).toStrictEqual(['primary']);
    });

    it('should show the nodes below the top-level nodes in the related section', () => {
      const wrapper = mountComponent({ nodes: tree });

      expect(treeOf(related(wrapper).findComponent(ResourceGraphGroups).props('groups'))).toStrictEqual([['infra', ['template']]]);
    });

    it('should show no related section when no node is below a top-level node', () => {
      const wrapper = mountComponent({ nodes: [tree[0]] });

      expect(related(wrapper).exists()).toBe(false);
    });

    it('should expand the related section by default', () => {
      const wrapper = mountComponent({ nodes: tree });

      expect(toggle(related(wrapper)).attributes('aria-expanded')).toBe('true');
      expect(labelsIn(related(wrapper))).toStrictEqual(['infra', 'template']);
    });

    it('should show every read-only node in the read-only section, wherever it was found, with nothing nested below it', async() => {
      const wrapper = mountComponent({ nodes: tree });

      await toggle(referenced(wrapper)).trigger('click');

      expect(treeOf(referenced(wrapper).findComponent(ResourceGraphGroups).props('groups'))).toStrictEqual(['capi', 'machine']);
      expect(labelsIn(related(wrapper))).toStrictEqual(['infra', 'template']);
    });

    it('should show a read-only node found below an editable one in the read-only section, not below its parent', async() => {
      const wrapper = mountComponent({
        nodes: [...tree, {
          id: 'class', label: 'class', group: 'Classes', parentId: 'infra', readOnly: true
        }]
      });

      await toggle(referenced(wrapper)).trigger('click');

      expect(treeOf(related(wrapper).findComponent(ResourceGraphGroups).props('groups'))).toStrictEqual([['infra', ['template']]]);
      expect(labelsIn(referenced(wrapper))).toStrictEqual(['capi', 'machine', 'class']);
    });

    it('should show a node found below a read-only node below the nearest parent that is not read-only', () => {
      const wrapper = mountComponent({
        nodes: [...tree, {
          id: 'bootstrap', label: 'bootstrap', group: 'Secrets', parentId: 'machine'
        }]
      });

      expect(treeOf(related(wrapper).findComponent(ResourceGraphGroups).props('groups'))).toStrictEqual([['infra', ['template']], 'bootstrap']);
    });

    it('should show no referenced section when no node is read-only', () => {
      const wrapper = mountComponent({ nodes: tree.filter((node) => !node.readOnly) });

      expect(referenced(wrapper).exists()).toBe(false);
    });

    it('should collapse the referenced section by default', () => {
      const wrapper = mountComponent({ nodes: tree });

      expect(toggle(referenced(wrapper)).attributes('aria-expanded')).toBe('false');
      expect(labelsIn(referenced(wrapper))).toStrictEqual([]);
    });

    it('should group the read-only nodes by `group` alone', async() => {
      const wrapper = mountComponent({ nodes: tree });

      await toggle(referenced(wrapper)).trigger('click');

      expect(referenced(wrapper).findComponent(ResourceGraphGroups).props('groups')).toStrictEqual([
        { label: 'CAPI Cluster', nodes: [{ ...tree[3], groups: [] }] },
        { label: 'Machines', nodes: [{ ...tree[4], groups: [] }] },
      ]);
    });

    it('should count every node, including those in collapsed sections', () => {
      const wrapper = mountComponent({ nodes: tree });

      expect(wrapper.find('[data-testid="resource-graph-count"]').text()).toBe('5');
    });

    it('should pass `saving` to the groups of every section', async() => {
      const wrapper = mountComponent({ nodes: tree, saving: true });

      await toggle(referenced(wrapper)).trigger('click');

      const groups = wrapper.findAllComponents(ResourceGraphGroups);

      expect(groups.length).toBeGreaterThan(2);
      expect(groups.map((g) => g.props('saving'))).toStrictEqual(groups.map(() => true));
    });

    it.each([
      ['related', related],
      ['referenced', referenced],
    ])('should re-emit `select` and `save` from the groups of the %s section', async(_label, section) => {
      const wrapper = mountComponent({ nodes: tree });

      await toggle(referenced(wrapper)).trigger('click');

      const groups = section(wrapper).findComponent(ResourceGraphGroups);

      groups.vm.$emit('select', 'from-section');
      groups.vm.$emit('save', 'from-section');

      expect(wrapper.emitted('select')).toStrictEqual([['from-section']]);
      expect(wrapper.emitted('save')).toStrictEqual([['from-section']]);
    });
  });
});
