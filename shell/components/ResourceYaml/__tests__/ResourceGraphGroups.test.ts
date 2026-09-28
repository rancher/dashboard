import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ResourceGraphGroups from '@shell/components/ResourceYaml/ResourceGraphGroups.vue';
import { ResourceGraphGroup, ResourceGraphTreeNode } from '@shell/components/ResourceYaml/types';

const node = (id: string, extra: Partial<ResourceGraphTreeNode> = {}): ResourceGraphTreeNode => ({
  id, label: id, groups: [], ...extra
});

describe('component: ResourceGraphGroups', () => {
  const groups: ResourceGraphGroup[] = [
    { label: '', nodes: [node('primary')] },
    { label: 'Infrastructure', nodes: [node('infra')] },
    { label: 'Node Pools', nodes: [node('ctrl', { readOnly: true }), node('workers', { modified: true })] },
  ];

  const mountComponent = (props: any = {}) => mount(ResourceGraphGroups, {
    props:  { groups, ...props },
    global: { provide: { store: createStore({}) } }
  });

  const topGroups = (wrapper: ReturnType<typeof mountComponent>) => wrapper.findAll(':scope > .resource-graph-group');

  describe('groups', () => {
    it('should show one group per entry of `groups`, in the order given', () => {
      const wrapper = mountComponent();

      expect(topGroups(wrapper)).toHaveLength(3);
      expect(topGroups(wrapper).map((g) => g.findAll('.resource-graph-node').map((n) => n.text()))).toStrictEqual([
        ['primary'], ['infra'], ['ctrl', 'workers']
      ]);
    });

    it('should show the label of a group as its heading', () => {
      const wrapper = mountComponent();

      expect(wrapper.findAll('.resource-graph-group-label').map((l) => l.text())).toStrictEqual(['Infrastructure', 'Node Pools']);
    });

    it('should show no heading for a group with an empty label', () => {
      const wrapper = mountComponent();

      expect(topGroups(wrapper)[0].find('.resource-graph-group-label').exists()).toBe(false);
    });

    it('should show the nodes of each group in the order given', () => {
      const wrapper = mountComponent({ groups: [{ label: 'G', nodes: [node('b'), node('a'), node('c')] }] });

      expect(wrapper.findAll('.resource-graph-node').map((n) => n.text())).toStrictEqual(['b', 'a', 'c']);
    });
  });

  describe('nodes', () => {
    it('should show the label of each node', () => {
      const wrapper = mountComponent({ groups: [{ label: '', nodes: [node('ns/a', { label: 'A label' })] }] });

      expect(wrapper.find('.resource-graph-node-label').text()).toBe('A label');
    });

    it('should set the `data-testid` of each node from its id', () => {
      const wrapper = mountComponent();

      expect(wrapper.find('[data-testid="resource-graph-node-workers"]').exists()).toBe(true);
    });

    it('should mark only the node whose id matches `selected` as selected, with `aria-current="true"`', () => {
      const wrapper = mountComponent({ selected: 'infra' });
      const selected = wrapper.findAll('.resource-graph-node--selected');

      expect(selected).toHaveLength(1);
      expect(selected[0].text()).toBe('infra');
      expect(selected[0].attributes('aria-current')).toBe('true');
    });

    it('should set no `aria-current` on a node that is not selected', () => {
      const wrapper = mountComponent({ selected: 'infra' });

      expect(wrapper.find('[data-testid="resource-graph-node-workers"]').attributes('aria-current')).toBeUndefined();
    });

    it('should mark a node with `readOnly` as read only', () => {
      const wrapper = mountComponent();

      expect(wrapper.findAll('.resource-graph-node--read-only').map((n) => n.text())).toStrictEqual(['ctrl']);
    });

    it('should show the modified indicator, with its aria label, only for a node with `modified`', () => {
      const wrapper = mountComponent();
      const indicators = wrapper.findAll('.resource-graph-node-modified');

      expect(indicators).toHaveLength(1);
      expect(indicators[0].attributes('data-testid')).toBe('resource-graph-modified-workers');
      expect(indicators[0].attributes('aria-label')).toBe('resourceYaml.resourceGraph.modified');
    });

    it('should emit `select` with the id of the node that is clicked', async() => {
      const wrapper = mountComponent();

      await wrapper.find('[data-testid="resource-graph-node-ctrl"]').trigger('click');

      expect(wrapper.emitted('select')).toStrictEqual([['ctrl']]);
    });
  });

  describe('nesting', () => {
    const nested: ResourceGraphGroup[] = [{
      label: '',
      nodes: [node('parent', {
        groups: [{
          label: 'Children',
          nodes: [node('child', { groups: [{ label: 'Grandchildren', nodes: [node('grandchild')] }] })]
        }]
      })]
    }];

    it('should render no nested groups for a node with empty `groups`', () => {
      const wrapper = mountComponent();

      expect(wrapper.find('.resource-graph-groups--nested').exists()).toBe(false);
    });

    it('should render the groups of a node nested below it, with `depth` one more than its own', () => {
      const wrapper = mountComponent({ groups: nested });
      // the root wrapper is not among the components it finds
      const children = wrapper.findAllComponents(ResourceGraphGroups);

      expect(children.map((c) => c.props('depth'))).toStrictEqual([1, 2]);
      expect(children[0].find('.resource-graph-group-label').text()).toBe('Children');
      expect(children[1].find('.resource-graph-node').text()).toBe('grandchild');
    });

    it('should set the `--depth` custom property from `depth`, 0 by default', () => {
      const wrapper = mountComponent({ groups: nested });
      const elements = wrapper.findAll('.resource-graph-groups');

      expect(elements.map((e) => (e.element as HTMLElement).style.getPropertyValue('--depth'))).toStrictEqual(['0', '1', '2']);
    });
  });
});
