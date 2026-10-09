import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ResourceGraphGroups from '@shell/components/ResourceYaml/ResourceGraphGroups.vue';
import { ResourceGraphGroup, ResourceGraphTreeNode } from '@shell/components/ResourceYaml/types';

// rendered components from pkg/rancher-components resolve a different copy of vue than shell
jest.mock('@components/RcButton', () => ({ RcButton: { name: 'RcButtonStub', template: '<button><slot /></button>' } }));
jest.mock('@components/Pill', () => ({ RcStatusBadge: { name: 'RcStatusBadgeStub', template: '<div><slot /></div>' } }));

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
      expect(topGroups(wrapper).map((g) => g.findAll('.resource-graph-node-label').map((n) => n.text()))).toStrictEqual([
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
    // a narrow graph cuts the label off with an ellipsis
    it('should show the full label of each node as a tooltip on the label', () => {
      const tooltips: { [label: string]: any } = {};
      const wrapper = mount(ResourceGraphGroups, {
        props:  { groups: [{ label: '', nodes: [node('ns/a', { label: 'a-very-long-resource-name' })] }] },
        global: {
          provide:    { store: createStore({}) },
          directives: {
            'clean-tooltip': {
              mounted(el: HTMLElement, binding: any) {
                tooltips[el.className] = binding.value;
              }
            }
          }
        }
      });

      expect(wrapper.find('.resource-graph-node-label').text()).toBe('a-very-long-resource-name');
      expect(tooltips['resource-graph-node-label']).toBe('a-very-long-resource-name');
    });

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
      expect(selected[0].find('[data-testid="resource-graph-node-infra"]').attributes('aria-current')).toBe('true');
    });

    it('should set no `aria-current` on a node that is not selected', () => {
      const wrapper = mountComponent({ selected: 'infra' });

      expect(wrapper.find('[data-testid="resource-graph-node-workers"]').attributes('aria-current')).toBeUndefined();
    });

    it('should mark a node with `readOnly` as read only', () => {
      const wrapper = mountComponent();

      expect(wrapper.findAll('.resource-graph-node--read-only').map((n) => n.text())).toStrictEqual(['ctrl']);
    });

    it('should show the modified badge only for a node with `modified`', () => {
      const wrapper = mountComponent();
      const indicators = wrapper.findAll('.resource-graph-node-modified');

      expect(indicators).toHaveLength(1);
      expect(indicators[0].attributes('data-testid')).toBe('resource-graph-modified-workers');
      expect(indicators[0].text()).toBe('resourceYaml.resourceGraph.modified');
    });

    it('should emit `select` with the id of the node that is clicked', async() => {
      const wrapper = mountComponent();

      await wrapper.find('[data-testid="resource-graph-node-ctrl"]').trigger('click');

      expect(wrapper.emitted('select')).toStrictEqual([['ctrl']]);
    });

    it('should emit `select` with the id of the node when its modified badge is clicked', async() => {
      const wrapper = mountComponent();

      await wrapper.find('[data-testid="resource-graph-modified-workers"]').trigger('click');

      expect(wrapper.emitted('select')).toStrictEqual([['workers']]);
    });
  });

  describe('save button', () => {
    const saveButton = (wrapper: ReturnType<typeof mountComponent>, id: string) => wrapper.find(`[data-testid="resource-graph-save-${ id }"]`);

    it('should show a save button for a node with `modified` that is not read-only', () => {
      const wrapper = mountComponent();

      expect(saveButton(wrapper, 'workers').exists()).toBe(true);
    });

    it('should show no save button for a node without `modified`', () => {
      const wrapper = mountComponent();

      expect(saveButton(wrapper, 'infra').exists()).toBe(false);
    });

    it('should show no save button for a read-only node with `modified`', () => {
      const wrapper = mountComponent({ groups: [{ label: '', nodes: [node('referenced', { readOnly: true, modified: true })] }] });

      expect(saveButton(wrapper, 'referenced').exists()).toBe(false);
    });

    it('should label the save button with the label of the node for assistive technology', () => {
      const wrapper = mountComponent({ groups: [{ label: '', nodes: [node('ns/workers', { label: 'workers', modified: true })] }] });

      expect(saveButton(wrapper, 'ns/workers').attributes('aria-label')).toBe('resourceYaml.resourceGraph.saveResource-{"name":"workers"}');
    });

    it('should emit `save` with the id of the node when its save button is clicked', async() => {
      const wrapper = mountComponent();

      await saveButton(wrapper, 'workers').trigger('click');

      expect(wrapper.emitted('save')).toStrictEqual([['workers']]);
      expect(wrapper.emitted('select')).toBeUndefined();
    });

    it.each([
      [true, true],
      [false, false],
    ])('should set `disabled` of every save button to %p while `saving` is %p', (disabled, saving) => {
      const wrapper = mountComponent({
        saving,
        groups: [{ label: '', nodes: [node('a', { modified: true }), node('b', { modified: true })] }],
      });

      expect(['a', 'b'].map((id) => (saveButton(wrapper, id).element as HTMLButtonElement).disabled)).toStrictEqual([disabled, disabled]);
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

    it('should pass `selected` and `saving` to the nested groups', () => {
      const wrapper = mountComponent({
        groups: nested, selected: 'grandchild', saving: true
      });

      expect(wrapper.findAllComponents(ResourceGraphGroups).map((c) => [c.props('selected'), c.props('saving')])).toStrictEqual([
        ['grandchild', true],
        ['grandchild', true],
      ]);
    });

    it('should re-emit `select` and `save` from the nested groups', async() => {
      const wrapper = mountComponent({ groups: nested });
      const [children] = wrapper.findAllComponents(ResourceGraphGroups);

      children.vm.$emit('select', 'child');
      children.vm.$emit('save', 'child');

      expect(wrapper.emitted('select')).toStrictEqual([['child']]);
      expect(wrapper.emitted('save')).toStrictEqual([['child']]);
    });
  });
});
