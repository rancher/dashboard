import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ResourceGraph from '@shell/components/ResourceYaml/ResourceGraph.vue';
import { ResourceGraphNode } from '@shell/components/ResourceYaml/types';

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

  it('should show a node per resource', () => {
    const wrapper = mountComponent();

    expect(wrapper.findAll('.resource-graph__node').map((n) => n.text())).toStrictEqual([
      'my-capi-cluster', 'VSphereCluster', 'ctrl', 'workers', 'cc-x7k2p'
    ]);
  });

  it('should show the number of resources', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="resource-graph-count"]').text()).toBe('5');
  });

  it('should group the nodes in the order they are given, ungrouped nodes first', () => {
    const wrapper = mountComponent();

    expect(wrapper.findAll('.resource-graph__group-label').map((l) => l.text())).toStrictEqual([
      'Infrastructure', 'Node Pools', 'Referenced'
    ]);
    expect(wrapper.findAll('.resource-graph__group')[1].findAll('.resource-graph__node').map((n) => n.text())).toStrictEqual(['VSphereCluster']);
    expect(wrapper.findAll('.resource-graph__group')[2].findAll('.resource-graph__node').map((n) => n.text())).toStrictEqual(['ctrl', 'workers']);
  });

  it('should show no heading for the ungrouped nodes', () => {
    const wrapper = mountComponent();
    const first = wrapper.findAll('.resource-graph__group')[0];

    expect(first.find('.resource-graph__group-label').exists()).toBe(false);
    expect(first.findAll('.resource-graph__node').map((n) => n.text())).toStrictEqual(['my-capi-cluster']);
  });

  it('should mark the selected node', () => {
    const wrapper = mountComponent({ selected: 'ns/workers' });
    const selected = wrapper.findAll('.resource-graph__node--selected');

    expect(selected).toHaveLength(1);
    expect(selected[0].text()).toBe('workers');
    expect(selected[0].attributes('aria-current')).toBe('true');
  });

  it('should mark no node as selected when nothing is selected', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('.resource-graph__node--selected').exists()).toBe(false);
  });

  it('should mark a read only node', () => {
    const wrapper = mountComponent();

    expect(wrapper.findAll('.resource-graph__node--read-only').map((n) => n.text())).toStrictEqual(['cc-x7k2p']);
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

  it('should not offer to create a related resource by default', () => {
    const wrapper = mountComponent();

    expect(wrapper.find('[data-testid="resource-graph-create"]').exists()).toBe(false);
  });

  it('should emit when the user asks to create a related resource', async() => {
    const wrapper = mountComponent({ canCreate: true });

    await wrapper.find('[data-testid="resource-graph-create"]').trigger('click');

    expect(wrapper.emitted('create')).toStrictEqual([[]]);
  });

  it('should show nothing but the header when there are no resources', () => {
    const wrapper = mountComponent({ nodes: [] });

    expect(wrapper.find('[data-testid="resource-graph-count"]').text()).toBe('0');
    expect(wrapper.findAll('.resource-graph__node')).toHaveLength(0);
  });
});
