import { flushPromises, mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { foldMatchingLines } from '@components/RcCodeMirror';
import MultiResourceYaml from '@shell/components/ResourceYaml/MultiResourceYaml.vue';
import { RelatedResource } from '@shell/core/types';
import { toEditorYaml } from '@shell/utils/related-resources/yaml';

jest.mock('@shell/components/ResourceYaml/ResourceGraph.vue', () => ({
  __esModule: true,
  default:    {
    name: 'ResourceGraphStub', props: ['nodes', 'selected', 'saving'], emits: ['select', 'save'], template: '<div />'
  },
}));

jest.mock('@shell/components/YamlEditor.vue', () => ({
  __esModule:   true,
  EDITOR_MODES: {
    EDIT_CODE: 'EDIT_CODE', VIEW_CODE: 'VIEW_CODE', DIFF_CODE: 'DIFF_CODE'
  },
  // renders the diff mode buttons the editor is given, which YamlEditor shows above a diff
  default: {
    name:    'YamlEditorStub',
    props:   ['value', 'initialYamlValues', 'editorMode', 'diffContext'],
    emits:   ['update:value', 'onReady'],
    data:    () => ({ diffMode: 'unified' }),
    methods: {
      setDiffMode(mode: string) {
        (this as any).diffMode = mode;
      }
    },
    template: '<div><slot name="preview-buttons" :diffMode="diffMode" :setDiffMode="setDiffMode" /></div>'
  },
}));

jest.mock('@components/RcCodeMirror', () => ({
  foldAllComments:   jest.fn(),
  foldMatchingLines: jest.fn(),
  foldYamlPath:      jest.fn(),
}));

// rendered components from pkg/rancher-components resolve a different copy of vue than shell
jest.mock('@components/RcButton', () => ({ RcButton: { name: 'RcButtonStub', template: '<button><slot /></button>' } }));
jest.mock('@components/Banner', () => ({ Banner: { name: 'BannerStub', template: '<div />' } }));

// the modal asking before going back to the form, `show` records that it was opened
const mockShowCancelModal = jest.fn();

jest.mock('@shell/components/ResourceCancelModal.vue', () => ({
  __esModule: true,
  default:    {
    name:     'ResourceCancelModalStub',
    props:    ['isCancelModal', 'isForm'],
    emits:    ['confirm-cancel'],
    methods:  { show: () => mockShowCancelModal() },
    template: '<div />'
  },
}));

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

  const mountComponent = (relatedResources: RelatedResource[] = [{ resource: a }, { resource: b }], value: any = primary) => mount(MultiResourceYaml, {
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

    it('should mark the node of a read-only entry as read-only', () => {
      const wrapper = mountComponent([{ resource: a, readOnly: true }, { resource: b }]);

      expect(nodeFor(wrapper, 'config:ns/a').readOnly).toBe(true);
      expect(nodeFor(wrapper, 'config:ns/b')).not.toHaveProperty('readOnly');
    });

    it('should show the label of the resource that replaced an entry\'s resource on save', async() => {
      const replacement = model({
        type: 'config', id: 'ns/a-v2', metadata: { name: 'a-v2', namespace: 'ns' }
      });
      const wrapper = mountComponent([{ resource: a, save: () => replacement }]);

      await select(wrapper, 'config:ns/a');
      await edit(wrapper, 'edited: a\n');
      graph(wrapper).vm.$emit('save', 'config:ns/a');
      await flushPromises();

      expect(nodeFor(wrapper, 'config:ns/a').label).toBe('a-v2');
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

    // the order they are saved in, and the graph groups headings in the order the nodes first appear
    it('should list the dependencies before the dependents, keeping the order within each', () => {
      const c = model({
        type: 'config', id: 'ns/c', metadata: { name: 'c', namespace: 'ns' }
      });
      const wrapper = mountComponent([
        { resource: a, dependent: true },
        { resource: b },
        { resource: c, dependent: true },
      ]);

      expect(graph(wrapper).props('nodes').slice(1).map((n: any) => n.label)).toStrictEqual(['b', 'a', 'c']);
    });
  });

  describe('selection', () => {
    it('should select the primary resource initially', () => {
      const wrapper = mountComponent();

      expect(graph(wrapper).props('selected')).toBe(PRIMARY_ID);
      expect(editor(wrapper).props('value')).toBe(toEditorYaml(primary));
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

      expect(editor(wrapper).props('value')).toBe(toEditorYaml(b));
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

    it('should show a read-only resource in view mode', async() => {
      const wrapper = mountComponent([{ resource: a, readOnly: true }]);

      await select(wrapper, 'config:ns/a');

      expect(editor(wrapper).props('editorMode')).toBe('VIEW_CODE');
    });

    it('should show an editable resource in edit mode', async() => {
      const wrapper = mountComponent([{ resource: a, readOnly: true }, { resource: b }]);

      await select(wrapper, 'config:ns/b');

      expect(editor(wrapper).props('editorMode')).toBe('EDIT_CODE');
    });

    it.each([
      ['fold', 'an editable', false, true],
      ['keep unfolded', 'a read-only', true, false],
    ])('should %s `status` when the editor of %s resource is ready', async(_action, _label, readOnly, foldsStatus) => {
      const fold = foldMatchingLines as jest.Mock;
      const view = { state: { doc: { toString: () => 'status:\n  ready: true\n' } } };
      const wrapper = mountComponent([{ resource: a, readOnly }]);

      await select(wrapper, 'config:ns/a');
      fold.mockClear();
      editor(wrapper).vm.$emit('onReady', view);

      expect(fold.mock.calls.some(([, pattern]) => String(pattern) === String(/^status:\s*$/))).toBe(foldsStatus);
      expect(fold).toHaveBeenCalledWith(view, /managedFields/);
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
      await edit(wrapper, toEditorYaml(a));

      expect(nodeFor(wrapper, 'config:ns/a').modified).toBe(false);
    });
  });

  describe('diff', () => {
    it('should show the diff toggle only while the selected resource is modified', async() => {
      const wrapper = mountComponent();

      expect(diffToggle(wrapper).exists()).toBe(false);

      await edit(wrapper, 'edited: primary\n');

      expect(diffToggle(wrapper).exists()).toBe(true);
    });

    it('should show the diff against the yaml the selected resource was opened with when toggled', async() => {
      const wrapper = mountComponent();

      await select(wrapper, 'config:ns/a');
      await edit(wrapper, 'edited: a\n');
      await diffToggle(wrapper).trigger('click');

      expect(editor(wrapper).props('editorMode')).toBe('DIFF_CODE');
      expect(editor(wrapper).props('initialYamlValues')).toBe(toEditorYaml(a));
      expect(editor(wrapper).props('value')).toBe('edited: a\n');
    });

    it('should label the toggle as hide diff and set `aria-pressed` while the diff is shown', async() => {
      const wrapper = mountComponent();

      await edit(wrapper, 'edited: primary\n');

      expect(diffToggle(wrapper).text()).toBe('resourceYaml.buttons.diff');
      expect(diffToggle(wrapper).attributes('aria-pressed')).toBe('false');

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
      await edit(wrapper, toEditorYaml(a));
      await nextTick();

      expect(editor(wrapper).props('editorMode')).toBe('EDIT_CODE');
    });

    it('should show the full diff, with no lines of context left out', () => {
      const wrapper = mountComponent();

      expect(editor(wrapper).props('diffContext')).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should switch the diff between unified and split from the diff mode buttons', async() => {
      const wrapper = mountComponent();
      const buttons = () => wrapper.findAll('[data-testid="multi-yaml-diff-mode"] button');
      const pressed = () => buttons().map((button) => button.attributes('aria-pressed'));

      await edit(wrapper, 'edited: primary\n');
      await diffToggle(wrapper).trigger('click');

      expect(buttons().map((button) => button.text())).toStrictEqual(['generic.unified', 'generic.split']);
      expect(pressed()).toStrictEqual(['true', 'false']);

      await buttons()[1].trigger('click');

      expect(editor(wrapper).vm.diffMode).toBe('split');
      expect(pressed()).toStrictEqual(['false', 'true']);

      await buttons()[0].trigger('click');

      expect(editor(wrapper).vm.diffMode).toBe('unified');
      expect(pressed()).toStrictEqual(['true', 'false']);
    });
  });

  const mountWith = (props: any) => mount(MultiResourceYaml, {
    props: {
      value: primary, relatedResources: [{ resource: a }], ...props
    },
    global: { provide: { store: { getters: {}, commit: jest.fn() } } }
  });

  // edit as yaml from a form gives the yaml of the form's edits, and the yaml from before them
  describe('yaml from the parent', () => {
    const fromForm = 'metadata:\n  name: primary\n  namespace: ns\nspec: from-form\n';
    const beforeForm = 'metadata:\n  name: primary\n  namespace: ns\n';

    it('should show the yaml the parent made for the primary resource', () => {
      const wrapper = mountWith({ yaml: fromForm });

      expect(editor(wrapper).props('value')).toBe(fromForm);
    });

    it('should show the yaml made from `value` when the parent gives none', () => {
      const wrapper = mountWith({});

      expect(editor(wrapper).props('value')).toBe(toEditorYaml(primary));
    });

    it('should mark the primary resource modified when the parent\'s yaml differs from the yaml to compare it with', () => {
      const wrapper = mountWith({ yaml: fromForm, initialYamlForDiff: beforeForm });

      expect(nodeFor(wrapper, PRIMARY_ID).modified).toBe(true);
      expect((wrapper.find('[data-testid="multi-yaml-save"]').element as HTMLButtonElement).disabled).toBe(false);
    });

    it('should compare the primary resource with the yaml from before the form\'s edits in the diff', async() => {
      const wrapper = mountWith({ yaml: fromForm, initialYamlForDiff: beforeForm });

      await diffToggle(wrapper).trigger('click');

      expect(editor(wrapper).props('initialYamlValues')).toBe(beforeForm);
    });

    it('should not mark the primary resource modified when the form made no edits', () => {
      const wrapper = mountWith({ yaml: beforeForm, initialYamlForDiff: beforeForm });

      expect(nodeFor(wrapper, PRIMARY_ID).modified).toBe(false);
    });

    it('should compare the primary resource with the parent\'s yaml when there is no yaml to compare it with', () => {
      const wrapper = mountWith({ yaml: fromForm });

      expect(nodeFor(wrapper, PRIMARY_ID).modified).toBe(false);
    });

    // a save hook of a related resource reads the primary resource's yaml from the editor state
    it('should give the primary resource its yaml in the editor state while another resource is shown', async() => {
      const wrapper = mountWith({ yaml: fromForm, initialYamlForDiff: beforeForm });

      await select(wrapper, 'config:ns/a');

      expect(wrapper.vm.editorState.yaml[PRIMARY_ID]).toBe(fromForm);
    });
  });

  describe('edit as form', () => {
    const toggle = (wrapper: any) => wrapper.find('[data-testid="multi-yaml-view-toggle"]');
    const modal = (wrapper: any) => wrapper.findComponent({ name: 'ResourceCancelModalStub' });

    beforeEach(() => {
      mockShowCancelModal.mockClear();
    });

    it('should not offer to go back to a form when the yaml is not shown in place of one', () => {
      const wrapper = mountWith({});

      expect(toggle(wrapper).exists()).toBe(false);
      expect(modal(wrapper).exists()).toBe(false);
    });

    it('should show Edit as Form, then Edit as YAML pressed, when the yaml is shown in place of a form', () => {
      const wrapper = mountWith({ showEditAsForm: true });
      const buttons = toggle(wrapper).findAll('button');

      expect(buttons.map((button: any) => button.text())).toStrictEqual(['resourceYaml.buttons.editAsForm', 'resourceYaml.buttons.editAsYaml']);
      expect(buttons.map((button: any) => button.attributes('aria-pressed'))).toStrictEqual(['false', 'true']);
    });

    // the yaml edits are lost when the form is shown
    it('should ask before going back to the form, without going back yet', async() => {
      const wrapper = mountWith({ showEditAsForm: true });

      await wrapper.find('[data-testid="multi-yaml-edit-as-form"]').trigger('click');

      expect(mockShowCancelModal).toHaveBeenCalledWith();
      expect(wrapper.emitted('edit-as-form')).toBeUndefined();
    });

    it('should ask with the modal for going back to a form from yaml', () => {
      const wrapper = mountWith({ showEditAsForm: true });

      expect(modal(wrapper).props()).toStrictEqual({ isCancelModal: false, isForm: false });
    });

    it('should emit `edit-as-form` once the user confirms', async() => {
      const wrapper = mountWith({ showEditAsForm: true });

      await wrapper.find('[data-testid="multi-yaml-edit-as-form"]').trigger('click');
      modal(wrapper).vm.$emit('confirm-cancel', false);

      expect(wrapper.emitted('edit-as-form')).toStrictEqual([[]]);
    });

    it('should do nothing from Edit as YAML, as the yaml is already shown', async() => {
      const wrapper = mountWith({ showEditAsForm: true });

      await wrapper.find('[data-testid="multi-yaml-edit-as-yaml"]').trigger('click');

      expect(mockShowCancelModal).toHaveBeenCalledTimes(0);
      expect(wrapper.emitted('edit-as-form')).toBeUndefined();
    });
  });

  // aria-valuemin and aria-valuemax describe the range the css allows the graph, not 0 to 100
  describe('resize separator', () => {
    const separator = (wrapper: any) => wrapper.find('[data-testid="multi-yaml-resize"]');

    it('should report the limits of the graph width as a percentage of the container, measured once mounted', async() => {
      const rect = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
        width: 1000, left: 0, top: 0, right: 1000, bottom: 0, height: 0, x: 0, y: 0, toJSON: () => ({})
      }));
      const wrapper = mountWith({});

      await nextTick();

      expect(separator(wrapper).attributes('aria-valuemin')).toBe('20');
      expect(separator(wrapper).attributes('aria-valuemax')).toBe('60');
      expect(separator(wrapper).attributes('aria-valuenow')).toBe('25');

      rect.mockRestore();
    });

    it('should give the css the same limits it reports', () => {
      const style = mountWith({}).find('.multi-yaml-container').attributes('style');

      expect(style).toContain('--split-min: 200px');
      expect(style).toContain('--split-max: 60%');
    });
  });
});
