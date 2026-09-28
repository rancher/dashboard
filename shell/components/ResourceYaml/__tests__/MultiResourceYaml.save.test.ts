import { mount, flushPromises } from '@vue/test-utils';
import { nextTick, toRaw } from 'vue';
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

// the store's copies of saved resources, keyed by type and id
let stored: Map<string, any>;
// the models created by `$dispatch('create', ...)`, in order
let created: any[];

/**
 * A resource model; methods are kept on the prototype, as `saferDump` cannot dump functions
 *
 * `save` puts a copy with `status: saved` in `stored`, which `$getters.byId` returns
 */
const model = (data: any, methods: any = {}): any => {
  const proto: any = {
    $getters:  { byId: (type: string, id: string) => stored.get(`${ type }:${ id }`) },
    $dispatch: jest.fn((_action: string, d: any) => {
      const neu = model(d, methods);

      created.push(neu);

      return Promise.resolve(neu);
    }),
    save: jest.fn(function(this: any) {
      const copy = model({ ...this, status: 'saved' }, methods);

      stored.set(`${ this.type }:${ this.id }`, copy);

      return Promise.resolve(copy);
    }),
    ...methods,
  };

  return Object.assign(Object.create(proto), data);
};

describe('component: MultiResourceYaml', () => {
  let primary: any;
  let a: any;
  let b: any;
  const PRIMARY_ID = 'cluster:ns/primary';
  const A_ID = 'config:ns/a';

  beforeEach(() => {
    stored = new Map();
    created = [];
    primary = model({
      type: 'cluster', id: 'ns/primary', metadata: { name: 'primary', namespace: 'ns' }
    });
    a = model({
      type: 'config', id: 'ns/a', metadata: { name: 'a', namespace: 'ns' }
    });
    b = model({
      type: 'config', id: 'ns/b', metadata: { name: 'b', namespace: 'ns' }
    });
  });

  const mountComponent = (relatedResources: EditableRelatedResource[] = [{ resource: a }], value: any = primary) => mount(MultiResourceYaml, {
    props:  { value, relatedResources },
    global: { provide: { store: { getters: {}, commit: jest.fn() } } }
  });

  const graph = (wrapper: any) => wrapper.findComponent({ name: 'ResourceGraphStub' });
  const editor = (wrapper: any) => wrapper.findComponent({ name: 'YamlEditorStub' });
  const saveButton = (wrapper: any) => wrapper.find('[data-testid="multi-yaml-save"]');
  const nodeFor = (wrapper: any, id: string) => graph(wrapper).props('nodes').find((n: any) => n.id === id);

  const select = async(wrapper: any, id: string) => {
    graph(wrapper).vm.$emit('select', id);
    await nextTick();
  };

  const edit = async(wrapper: any, yaml: string) => {
    editor(wrapper).vm.$emit('update:value', yaml);
    await nextTick();
  };

  const save = async(wrapper: any) => {
    await saveButton(wrapper).trigger('click');
    await flushPromises();
  };

  const editedA = 'type: config\nid: ns/a\nmetadata:\n  name: a\n  namespace: ns\nspec: edited\n';

  describe('save button', () => {
    it('should be disabled while the selected resource is not modified', async() => {
      const wrapper = mountComponent();

      await select(wrapper, A_ID);

      expect(saveButton(wrapper).element.disabled).toBe(true);

      await edit(wrapper, editedA);

      expect(saveButton(wrapper).element.disabled).toBe(false);
    });

    it('should be disabled while the save is in progress', async() => {
      const wrapper = mountComponent([{ resource: a, save: () => new Promise(() => {}) }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await saveButton(wrapper).trigger('click');

      expect(saveButton(wrapper).element.disabled).toBe(true);
    });
  });

  describe('saving the primary resource', () => {
    const editedPrimary = 'type: cluster\nid: ns/primary\nmetadata:\n  name: primary\n  namespace: ns\nspec: edited\n';

    it('should create a model from the edited yaml in the store of the primary resource and call its `save`', async() => {
      const wrapper = mountComponent();

      await edit(wrapper, editedPrimary);
      await save(wrapper);

      expect(primary.$dispatch).toHaveBeenCalledWith('create', {
        type: 'cluster', id: 'ns/primary', metadata: { name: 'primary', namespace: 'ns' }, spec: 'edited'
      });
      expect(created[0].save).toHaveBeenCalledWith();
    });

    it('should use the store\'s copy of the saved resource as the primary resource', async() => {
      const wrapper = mountComponent();

      await edit(wrapper, editedPrimary);
      await save(wrapper);

      expect(editor(wrapper).props('value')).toBe(saferDump(stored.get(PRIMARY_ID)));
      expect(editor(wrapper).props('value')).toContain('status: saved');
    });

    it('should use the saved primary resource as the baseline, so the primary resource is no longer modified', async() => {
      const wrapper = mountComponent();

      await edit(wrapper, editedPrimary);

      expect(nodeFor(wrapper, PRIMARY_ID).modified).toBe(true);

      await save(wrapper);

      expect(nodeFor(wrapper, PRIMARY_ID).modified).toBe(false);
      expect(editor(wrapper).props('initialYamlValues')).toBe(saferDump(stored.get(PRIMARY_ID)));
    });

    it('should pass the saved primary resource as `primaryResource` in the context of banners, hooks and saves', async() => {
      const banner = jest.fn(() => null);
      const entrySave = jest.fn(({ resource }) => resource);
      const beforeSaveHook = jest.fn();
      const wrapper = mountComponent([{
        resource: a, banner, save: entrySave, beforeSaveHook
      }]);

      await edit(wrapper, editedPrimary);
      await save(wrapper);
      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      const savedPrimary = stored.get(PRIMARY_ID);

      expect(toRaw((banner.mock.calls as any[]).at(-1)[0].primaryResource)).toBe(savedPrimary);
      expect(toRaw(beforeSaveHook.mock.calls[0][0].primaryResource)).toBe(savedPrimary);
      expect(toRaw(entrySave.mock.calls[0][0].primaryResource)).toBe(savedPrimary);
    });
  });

  describe('saving a related resource', () => {
    it('should call `beforeSaveHook`, then `save`, then `afterSaveHook`, each with the context of the resource', async() => {
      // the yaml is read when each is called, as `editorState` is reseeded once the save is done
      const calls: [string, any, string][] = [];
      const record = (name: string, ctx: any) => calls.push([name, ctx, ctx.editorState.yaml[ctx.nodeId]]);
      const wrapper = mountComponent([{
        resource:       a,
        beforeSaveHook: (ctx) => {
          record('before', ctx);
        },
        save: (ctx) => {
          record('save', ctx);

          return ctx.resource;
        },
        afterSaveHook: (ctx) => {
          record('after', ctx);
        },
      }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(calls.map(([name]) => name)).toStrictEqual(['before', 'save', 'after']);
      calls.forEach(([, ctx, yaml]) => {
        expect(toRaw(ctx.resource)).toBe(a);
        expect(ctx.nodeId).toBe(A_ID);
        expect(ctx.primaryNodeId).toBe(PRIMARY_ID);
        expect(yaml).toBe(editedA);
      });
    });

    it('should call `save` of the entry in place of the save of the model when the entry defines one', async() => {
      const entrySave = jest.fn(({ resource }) => resource);
      const wrapper = mountComponent([{ resource: a, save: entrySave }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(entrySave).toHaveBeenCalledTimes(1);
      expect(a.$dispatch).not.toHaveBeenCalled();
    });

    it('should save the edited yaml as a model of the store of the resource when the entry defines no `save`', async() => {
      const wrapper = mountComponent();

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(a.$dispatch).toHaveBeenCalledWith('create', {
        type: 'config', id: 'ns/a', metadata: { name: 'a', namespace: 'ns' }, spec: 'edited'
      });
      expect(created[0].save).toHaveBeenCalledWith();
    });

    it('should not call `save` or `afterSaveHook` when `beforeSaveHook` rejects', async() => {
      const entrySave = jest.fn();
      const afterSaveHook = jest.fn();
      const wrapper = mountComponent([{
        resource: a, beforeSaveHook: () => Promise.reject(new Error('before failed')), save: entrySave, afterSaveHook
      }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(entrySave).not.toHaveBeenCalled();
      expect(afterSaveHook).not.toHaveBeenCalled();
    });

    it('should not call `afterSaveHook` when `save` rejects', async() => {
      const afterSaveHook = jest.fn();
      const wrapper = mountComponent([{
        resource: a, save: () => Promise.reject(new Error('save failed')), afterSaveHook
      }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(afterSaveHook).not.toHaveBeenCalled();
    });
  });

  describe('after a save', () => {
    it('should clear the modified mark of the saved resource', async() => {
      const wrapper = mountComponent([{ resource: a, save: ({ resource }) => resource }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);

      expect(nodeFor(wrapper, A_ID).modified).toBe(true);

      await save(wrapper);

      expect(nodeFor(wrapper, A_ID).modified).toBe(false);
      expect(wrapper.vm.editorState.yaml[A_ID]).toBe(saferDump(a));
    });

    it('should remount the editor so it shows the saved yaml', async() => {
      const wrapper = mountComponent();

      await edit(wrapper, 'type: cluster\nid: ns/primary\nspec: edited\n');

      const before = editor(wrapper).vm;

      await save(wrapper);

      expect(editor(wrapper).vm).not.toBe(before);
      expect(editor(wrapper).props('value')).toBe(saferDump(stored.get(PRIMARY_ID)));
    });

    it('should show a resource that the save returned with a different key in place of the resource it replaced', async() => {
      const replacement = model({
        type: 'config', id: 'ns/a-replacement', metadata: { name: 'a-replacement', namespace: 'ns' }
      });
      const wrapper = mountComponent([{ resource: a, save: () => replacement }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(nodeFor(wrapper, A_ID).label).toBe('a-replacement');
      expect(editor(wrapper).props('value')).toBe(saferDump(replacement));
    });

    it('should keep the node id, the selection and the children of a replaced resource', async() => {
      const replacement = model({ type: 'config', id: 'ns/a-replacement' });
      const wrapper = mountComponent([
        { resource: a, save: () => replacement },
        { resource: b, parentId: A_ID },
      ]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(graph(wrapper).props('nodes').map((n: any) => n.id)).toStrictEqual([PRIMARY_ID, A_ID, 'config:ns/b']);
      expect(graph(wrapper).props('selected')).toBe(A_ID);
      expect(nodeFor(wrapper, 'config:ns/b').parentId).toBe(A_ID);
    });

    it('should forget replaced resources when `relatedResources` changes', async() => {
      const replacement = model({ type: 'config', id: 'ns/a-replacement' });
      const entrySave = () => replacement;
      const wrapper = mountComponent([{ resource: a, save: entrySave }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);
      await wrapper.setProps({ relatedResources: [{ resource: a, save: entrySave }] });

      expect(nodeFor(wrapper, A_ID).label).toBe('a');
    });

    it('should keep the yaml that a save wrote to `editorState.yaml` for another resource, and mark that resource as modified', async() => {
      const wrapper = mountComponent([{
        resource: a,
        save:     ({ resource, editorState, primaryNodeId }) => {
          editorState.yaml[primaryNodeId] = 'written: by save\n';

          return resource;
        }
      }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(wrapper.vm.editorState.yaml[PRIMARY_ID]).toBe('written: by save\n');
      expect(nodeFor(wrapper, PRIMARY_ID).modified).toBe(true);
    });

    it('should use the yaml that the other resource was loaded with as its baseline, so its diff shows only what the save wrote', async() => {
      const wrapper = mountComponent([{
        resource: a,
        save:     ({ resource, editorState, primaryNodeId }) => {
          editorState.yaml[primaryNodeId] = 'written: by save\n';

          return resource;
        }
      }]);

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);
      await select(wrapper, PRIMARY_ID);

      expect(editor(wrapper).props('initialYamlValues')).toBe(saferDump(primary));
      expect(editor(wrapper).props('value')).toBe('written: by save\n');
    });
  });

  describe('errors', () => {
    const failing = () => [{ resource: a, save: () => Promise.reject(new Error('save failed')) }];

    it('should emit `error` with the errors of a rejected save', async() => {
      const wrapper = mountComponent(failing());

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(wrapper.emitted('error')).toStrictEqual([[[new Error('save failed')]]]);
    });

    it('should keep the edited yaml and the modified mark when the save rejects', async() => {
      const wrapper = mountComponent(failing());

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(editor(wrapper).props('value')).toBe(editedA);
      expect(nodeFor(wrapper, A_ID).modified).toBe(true);
    });

    it('should enable the save button again after the save rejects', async() => {
      const wrapper = mountComponent(failing());

      await select(wrapper, A_ID);
      await edit(wrapper, editedA);
      await save(wrapper);

      expect(saveButton(wrapper).element.disabled).toBe(false);
    });
  });
});
