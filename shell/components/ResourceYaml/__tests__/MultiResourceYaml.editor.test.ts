import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import MultiResourceYaml from '@shell/components/ResourceYaml/MultiResourceYaml.vue';
import { EditableRelatedResource } from '@shell/core/types';
import { saferDump } from '@shell/utils/create-yaml';

jest.mock('@shell/components/ResourceYaml/ResourceGraph.vue', () => ({
  __esModule: true,
  default:    {
    name: 'ResourceGraphStub', props: ['nodes', 'selected', 'canCreate'], emits: ['select', 'create'], template: '<div />'
  },
}));

jest.mock('@shell/components/YamlEditor.vue', () => ({
  __esModule:   true,
  EDITOR_MODES: {
    EDIT_CODE: 'EDIT_CODE', VIEW_CODE: 'VIEW_CODE', DIFF_CODE: 'DIFF_CODE'
  },
  default: {
    name: 'YamlEditorStub', props: ['value', 'initialYamlValues', 'editorMode', 'diffContext'], emits: ['update:value'], template: '<div />'
  },
}));

// rendered components from pkg/rancher-components resolve a different copy of vue than shell
jest.mock('@components/RcButton', () => ({ RcButton: { name: 'RcButtonStub', template: '<button><slot /></button>' } }));
jest.mock('@components/Banner', () => ({ Banner: { name: 'BannerStub', template: '<div />' } }));

// methods are kept on the prototype, as `saferDump` cannot dump functions
const model = (data: any, methods: any = {}): any => Object.assign(Object.create(methods), data);

describe('component: MultiResourceYaml', () => {
  const primary = model({
    type: 'cluster', id: 'ns/primary', metadata: { name: 'primary', namespace: 'ns' }
  }, { typeDisplay: 'Cluster' });
  const PRIMARY_ID = 'cluster:ns/primary';

  const a = model({
    type: 'config', id: 'ns/a', metadata: { name: 'a', namespace: 'ns' }
  });
  const b = model({
    type: 'config', id: 'ns/b', metadata: { name: 'b', namespace: 'ns' }
  });

  const mountComponent = (relatedResources: EditableRelatedResource[] = [{ resource: a }, { resource: b }], value: any = primary) => mount(MultiResourceYaml, {
    props:  { value, relatedResources },
    global: { provide: { store: { getters: {}, commit: jest.fn() } } }
  });

  const graph = (wrapper: any) => wrapper.findComponent({ name: 'ResourceGraphStub' });
  const editor = (wrapper: any) => wrapper.findComponent({ name: 'YamlEditorStub' });
  const diffToggle = (wrapper: any) => wrapper.find('[data-testid="multi-yaml-diff-toggle"]');
  const nodeFor = (wrapper: any, id: string) => graph(wrapper).props('nodes').find((n: any) => n.id === id);

  const select = async(wrapper: any, id: string) => {
    graph(wrapper).vm.$emit('select', id);
    await nextTick();
  };

  const edit = async(wrapper: any, yaml: string) => {
    editor(wrapper).vm.$emit('update:value', yaml);
    await nextTick();
  };

  describe('graph nodes', () => {
    it('should show the primary resource first, with no parent and its type as the group', () => {
      const wrapper = mountComponent();

      expect(graph(wrapper).props('nodes')[0]).toStrictEqual({
        id: PRIMARY_ID, label: 'primary', group: 'Cluster', modified: false
      });
    });

    it('should use `nameDisplay`, then `metadata.name`, then `id` as the label of a node', () => {
      const wrapper = mountComponent([
        {
          resource: model({
            type: 'config', id: 'ns/x', metadata: { name: 'x' }
          }, { nameDisplay: 'X display' })
        },
        {
          resource: model({
            type: 'config', id: 'ns/y', metadata: { name: 'y' }
          })
        },
        { resource: model({ type: 'config', id: 'ns/z' }) },
      ]);

      expect(graph(wrapper).props('nodes').slice(1).map((n: any) => n.label)).toStrictEqual(['X display', 'y', 'ns/z']);
    });

    it('should use `nodeId` of the entry as the node id, falling back to the resource key, then the index', () => {
      const wrapper = mountComponent([
        { resource: a, nodeId: 'custom' },
        { resource: b },
        { resource: model({ type: 'config', metadata: { name: 'no-id' } }) },
      ]);

      expect(graph(wrapper).props('nodes').slice(1).map((n: any) => n.id)).toStrictEqual(['custom', 'config:ns/b', '2']);
    });

    it('should show a related resource without `parentId` below the primary resource', () => {
      const wrapper = mountComponent();

      expect(nodeFor(wrapper, 'config:ns/a').parentId).toBe(PRIMARY_ID);
    });

    it('should show a related resource below the node its `parentId` names', () => {
      const wrapper = mountComponent([{ resource: a }, { resource: b, parentId: 'config:ns/a' }]);

      expect(nodeFor(wrapper, 'config:ns/b').parentId).toBe('config:ns/a');
    });

    it('should use `group` of the entry as the heading, falling back to the translated `groupKey`', () => {
      const wrapper = mountComponent([
        {
          resource: a, group: 'Explicit', groupKey: 'ignored.key'
        },
        { resource: b, groupKey: 'some.key' },
      ]);

      expect(nodeFor(wrapper, 'config:ns/a').group).toBe('Explicit');
      expect(nodeFor(wrapper, 'config:ns/b').group).toBe('some.key');
    });
  });

  describe('selection', () => {
    it('should select the primary resource initially', () => {
      const wrapper = mountComponent();

      expect(graph(wrapper).props('selected')).toBe(PRIMARY_ID);
      expect(editor(wrapper).props('value')).toBe(saferDump(primary));
    });

    it('should select the node the graph emits `select` for', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');

      expect(graph(wrapper).props('selected')).toBe('config:ns/a');
      expect(wrapper.vm.editorState.selected).toBe('config:ns/a');
    });

    it('should show the yaml of the selected resource in the editor', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/b');

      expect(editor(wrapper).props('value')).toBe(saferDump(b));
    });

    it('should show no editor when nothing is selected', async() => {
      const wrapper = mountComponent();

      wrapper.vm.editorState.selected = null;
      await nextTick();

      expect(editor(wrapper).exists()).toBe(false);
    });

    it('should keep the edits made to a resource when another resource is selected, then it is selected again', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');
      await edit(wrapper, 'edited: a\n');
      await select(wrapper, 'config:ns/b');
      await select(wrapper, 'config:ns/a');

      expect(editor(wrapper).props('value')).toBe('edited: a\n');
    });

    it('should select the new primary resource when `value` changes', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');
      await wrapper.setProps({ value: model({ type: 'cluster', id: 'ns/other' }) });

      expect(graph(wrapper).props('selected')).toBe('cluster:ns/other');
    });
  });

  describe('modified', () => {
    it('should not mark a resource as modified before it is opened in the editor', () => {
      const wrapper = mountComponent();

      expect(nodeFor(wrapper, 'config:ns/a').modified).toBe(false);
      expect(wrapper.vm.editorState.yaml).not.toHaveProperty('config:ns/a');
    });

    it('should not mark a resource as modified when it is opened but not edited', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');

      expect(nodeFor(wrapper, 'config:ns/a').modified).toBe(false);
    });

    it('should mark a resource as modified when its yaml in the editor differs from the yaml it was opened with', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');
      await edit(wrapper, 'edited: a\n');

      expect(nodeFor(wrapper, 'config:ns/a').modified).toBe(true);
      expect(nodeFor(wrapper, 'config:ns/b').modified).toBe(false);
    });

    it('should clear the modified mark when the yaml in the editor is changed back to the yaml it was opened with', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');
      await edit(wrapper, 'edited: a\n');
      await edit(wrapper, saferDump(a));

      expect(nodeFor(wrapper, 'config:ns/a').modified).toBe(false);
    });
  });

  describe('diff', () => {
    it('should disable the diff toggle while the selected resource is not modified', async() => {
      const wrapper = mountComponent();

      expect(diffToggle(wrapper).element.disabled).toBe(true);

      await edit(wrapper, 'edited: primary\n');

      expect(diffToggle(wrapper).element.disabled).toBe(false);
    });

    it('should show the diff against the yaml the selected resource was opened with when toggled', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');
      await edit(wrapper, 'edited: a\n');
      await diffToggle(wrapper).trigger('click');

      expect(editor(wrapper).props('editorMode')).toBe('DIFF_CODE');
      expect(editor(wrapper).props('initialYamlValues')).toBe(saferDump(a));
      expect(editor(wrapper).props('value')).toBe('edited: a\n');
    });

    it('should label the toggle as hide diff and set `aria-pressed` while the diff is shown', async() => {
      const wrapper = mountComponent();

      expect(diffToggle(wrapper).text()).toBe('resourceYaml.buttons.diff');
      expect(diffToggle(wrapper).attributes('aria-pressed')).toBe('false');

      await edit(wrapper, 'edited: primary\n');
      await diffToggle(wrapper).trigger('click');

      expect(diffToggle(wrapper).text()).toBe('resourceYaml.buttons.hideDiff');
      expect(diffToggle(wrapper).attributes('aria-pressed')).toBe('true');
    });

    it('should leave the diff when another resource is selected', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');
      await edit(wrapper, 'edited: a\n');
      await diffToggle(wrapper).trigger('click');
      await select(wrapper, 'config:ns/b');
      await nextTick();

      expect(editor(wrapper).props('editorMode')).toBe('EDIT_CODE');
    });

    it('should leave the diff when the selected resource is no longer modified', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');
      await edit(wrapper, 'edited: a\n');
      await diffToggle(wrapper).trigger('click');
      await edit(wrapper, saferDump(a));
      await nextTick();

      expect(editor(wrapper).props('editorMode')).toBe('EDIT_CODE');
    });
  });
});
