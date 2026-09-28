import { mount, flushPromises } from '@vue/test-utils';
import { nextTick, toRaw } from 'vue';
import MultiResourceYaml from '@shell/components/ResourceYaml/MultiResourceYaml.vue';
import CreateRelatedResourceDrawer from '@shell/components/ResourceYaml/CreateRelatedResourceDrawer.vue';
import { RelatedResourceType } from '@shell/components/ResourceYaml/types';
import { EditableRelatedResource } from '@shell/core/types';
import { saferDump } from '@shell/utils/create-yaml';
import { _CLONE } from '@shell/config/query-params';

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
jest.mock('@components/Banner', () => ({
  Banner: {
    name: 'BannerStub', props: ['label'], template: '<div class="banner-stub">{{ label }}</div>'
  }
}));

// the store's copies of saved resources, keyed by type and id
let stored: Map<string, any>;
// the models created by `$dispatch('create', ...)`, in order
let created: any[];

/**
 * A resource model of the `cluster` store unless `$state` is given; methods are kept on the
 * prototype, as `saferDump` cannot dump functions
 *
 * `save` puts a copy with `status: saved` in `stored`, which `$getters.byId` returns
 */
const model = (data: any, methods: any = {}): any => {
  const proto: any = {
    $state:    { config: { namespace: 'cluster' } },
    canCreate: true,
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
    hasLink: () => false,
    ...methods,
  };

  return Object.assign(Object.create(proto), data);
};

describe('component: MultiResourceYaml', () => {
  let primary: any;
  let a: any;
  let b: any;
  let commit: jest.Mock;
  const PRIMARY_ID = 'cluster:ns/primary';

  const NEW_YAML = 'id: ns/c\nmetadata:\n  name: c\n  namespace: ns\nspec: new\n';
  const NEW_DATA = {
    id: 'ns/c', metadata: { name: 'c', namespace: 'ns' }, spec: 'new'
  };

  beforeEach(() => {
    stored = new Map();
    created = [];
    commit = jest.fn();
    primary = model({
      type: 'cluster', id: 'ns/primary', metadata: { name: 'primary', namespace: 'ns' }
    });
    a = model({
      type: 'config', id: 'ns/a', metadata: { name: 'a', namespace: 'ns' }
    }, { typeDisplay: 'Config' });
    b = model({
      type: 'config', id: 'ns/b', metadata: { name: 'b', namespace: 'ns' }
    }, { typeDisplay: 'Config' });
  });

  const mountComponent = (relatedResources: EditableRelatedResource[], value: any = primary) => mount(MultiResourceYaml, {
    props:  { value, relatedResources },
    global: { provide: { store: { getters: {}, commit } } }
  });

  const graph = (wrapper: any) => wrapper.findComponent({ name: 'ResourceGraphStub' });
  const editor = (wrapper: any) => wrapper.findComponent({ name: 'YamlEditorStub' });
  const nodeFor = (wrapper: any, id: string) => graph(wrapper).props('nodes').find((n: any) => n.id === id);

  // the payload of the most recent `slideInPanel/open`, after the graph asks to create a resource
  const openDrawer = async(wrapper: any) => {
    graph(wrapper).vm.$emit('create');
    await nextTick();

    const [type, payload] = commit.mock.calls.filter(([t]) => t === 'slideInPanel/open').at(-1);

    expect(type).toBe('slideInPanel/open');

    return payload;
  };

  const drawerTypes = async(wrapper: any): Promise<RelatedResourceType[]> => (await openDrawer(wrapper)).componentProps.types;

  const select = async(wrapper: any, id: string) => {
    graph(wrapper).vm.$emit('select', id);
    await nextTick();
  };

  const saveNew = async(wrapper: any, yaml = NEW_YAML) => {
    const [type] = await drawerTypes(wrapper);
    const result = await type.save(yaml);

    await flushPromises();

    return result;
  };

  describe('related resource types', () => {
    it('should list each type of the related resources once', async() => {
      const secret = model({ type: 'secret', id: 'ns/s' });
      const wrapper = mountComponent([{ resource: a }, { resource: b }, { resource: secret }]);

      expect((await drawerTypes(wrapper)).map((t) => t.key)).toStrictEqual(['cluster/config', 'cluster/secret']);
    });

    it('should not list the type of the primary resource', async() => {
      const otherCluster = model({ type: 'cluster', id: 'ns/other' });
      const wrapper = mountComponent([{ resource: otherCluster }, { resource: a }]);

      expect((await drawerTypes(wrapper)).map((t) => t.type)).toStrictEqual(['config']);
    });

    it('should list types of the same name from different stores separately', async() => {
      const clusterSecret = model({ type: 'secret', id: 'ns/s' });
      const managementSecret = model({ type: 'secret', id: 'ns/s' }, { $state: { config: { namespace: 'management' } } });
      const wrapper = mountComponent([{ resource: clusterSecret }, { resource: managementSecret, nodeId: 'management-secret' }]);

      expect((await drawerTypes(wrapper)).map((t) => t.key)).toStrictEqual(['cluster/secret', 'management/secret']);
    });

    it('should skip a related resource without `type`', async() => {
      const untyped = model({ id: 'ns/untyped' });
      const wrapper = mountComponent([{ resource: untyped }, { resource: a }]);

      expect((await drawerTypes(wrapper)).map((t) => t.type)).toStrictEqual(['config']);
    });

    it('should use `typeDisplay` of the first resource of a type as its label, falling back to the type', async() => {
      const secret = model({ type: 'secret', id: 'ns/s' });
      const wrapper = mountComponent([{ resource: a }, { resource: secret }]);

      expect((await drawerTypes(wrapper)).map((t) => t.label)).toStrictEqual(['Config', 'secret']);
    });

    it('should give the drawer only the types whose resource has `canCreate`', async() => {
      const secret = model({ type: 'secret', id: 'ns/s' }, { canCreate: false });
      const wrapper = mountComponent([{ resource: a }, { resource: secret }]);

      expect((await drawerTypes(wrapper)).map((t) => t.type)).toStrictEqual(['config']);
    });
  });

  describe('create button', () => {
    it('should set `canCreate` of the graph when at least one type can be created', () => {
      const secret = model({ type: 'secret', id: 'ns/s' }, { canCreate: false });
      const wrapper = mountComponent([{ resource: a }, { resource: secret }]);

      expect(graph(wrapper).props('canCreate')).toBe(true);
    });

    it('should not set `canCreate` of the graph when no type can be created', () => {
      const secret = model({ type: 'secret', id: 'ns/s' }, { canCreate: false });
      const wrapper = mountComponent([{ resource: secret }]);

      expect(graph(wrapper).props('canCreate')).toBe(false);
    });
  });

  describe('create drawer', () => {
    it('should open CreateRelatedResourceDrawer in the slide in panel when the graph emits `create`', async() => {
      const wrapper = mountComponent([{ resource: a }]);

      const payload = await openDrawer(wrapper);

      expect(payload.component).toBe(CreateRelatedResourceDrawer);
    });

    it('should give the drawer the types that can be created and the namespace of the primary resource', async() => {
      const wrapper = mountComponent([{ resource: a }]);

      const { componentProps } = await openDrawer(wrapper);

      expect(componentProps.types.map((t: RelatedResourceType) => t.key)).toStrictEqual(['cluster/config']);
      expect(componentProps.namespace).toBe('ns');
    });

    it('should open the drawer wide and full height, closing on a change of route name, params or query', async() => {
      const wrapper = mountComponent([{ resource: a }]);

      const { componentProps } = await openDrawer(wrapper);

      expect(componentProps.width).toBe('wide');
      expect(componentProps.height).toBe('full');
      expect(componentProps.closeOnRouteChange).toStrictEqual(['name', 'params', 'query']);
    });

    it('should return focus to the create button when the drawer closes', async() => {
      const wrapper = mountComponent([{ resource: a }]);

      const { componentProps } = await openDrawer(wrapper);

      expect(componentProps.returnFocusSelector).toBe('[data-testid="resource-graph-create"]');
    });

    it('should close the slide in panel when the drawer emits `close`', async() => {
      const wrapper = mountComponent([{ resource: a }]);

      const { componentProps } = await openDrawer(wrapper);

      componentProps.onClose();

      expect(commit).toHaveBeenLastCalledWith('slideInPanel/close');
    });
  });

  describe('clone sources', () => {
    it('should list each related resource of a type as a source, with its node id and label', async() => {
      const wrapper = mountComponent([{ resource: a }, { resource: b, nodeId: 'custom-b' }]);

      const [type] = await drawerTypes(wrapper);

      expect(type.sources.map(({ id, label }) => ({ id, label }))).toStrictEqual([
        { id: 'config:ns/a', label: 'a' },
        { id: 'custom-b', label: 'b' },
      ]);
    });

    it('should call `clone` of the entry with the context of the resource when the entry defines one', async() => {
      const clone = jest.fn(() => 'cloned: by entry\n');
      const wrapper = mountComponent([{ resource: a, clone }]);

      const [type] = await drawerTypes(wrapper);
      const yaml = await type.sources[0].cloneYaml();

      expect(yaml).toBe('cloned: by entry\n');
      expect(clone).toHaveBeenCalledTimes(1);

      const [[ctx]] = clone.mock.calls as any[];

      expect(toRaw(ctx.resource)).toBe(a);
      expect(ctx.nodeId).toBe('config:ns/a');
      expect(ctx.primaryNodeId).toBe(PRIMARY_ID);
    });

    it('should fetch the yaml from the `view` link of the resource, then clean it with `cleanForDownload` and with `cleanYaml` in clone mode', async() => {
      const followLink = jest.fn(() => Promise.resolve({ data: 'from: view link\n' }));
      const cleanForDownload = jest.fn(() => Promise.resolve('cleaned: for download\n'));
      const cleanYaml = jest.fn(() => 'cleaned: for clone\n');
      const resource = model({ type: 'config', id: 'ns/a' }, {
        hasLink: (name: string) => name === 'view', followLink, cleanForDownload, cleanYaml
      });
      const wrapper = mountComponent([{ resource }]);

      const [type] = await drawerTypes(wrapper);
      const yaml = await type.sources[0].cloneYaml();

      expect(followLink).toHaveBeenCalledWith('view', { headers: { accept: 'application/yaml' } });
      expect(cleanForDownload).toHaveBeenCalledWith('from: view link\n', { editing: true });
      expect(cleanYaml).toHaveBeenCalledWith('cleaned: for download\n', _CLONE);
      expect(yaml).toBe('cleaned: for clone\n');
    });

    it('should dump the resource as yaml when it has no `view` link', async() => {
      const cleanForDownload = jest.fn((yaml: string) => Promise.resolve(yaml));
      const resource = model({ type: 'config', id: 'ns/a' }, { cleanForDownload, cleanYaml: (yaml: string) => yaml });
      const wrapper = mountComponent([{ resource }]);

      const [type] = await drawerTypes(wrapper);

      await type.sources[0].cloneYaml();

      expect(cleanForDownload).toHaveBeenCalledWith(saferDump(resource), { editing: true });
    });

    it('should resolve to an empty string when `cleanYaml` returns nothing', async() => {
      const resource = model({ type: 'config', id: 'ns/a' }, { cleanForDownload: (yaml: string) => Promise.resolve(yaml), cleanYaml: () => undefined });
      const wrapper = mountComponent([{ resource }]);

      const [type] = await drawerTypes(wrapper);

      expect(await type.sources[0].cloneYaml()).toBe('');
    });
  });

  describe('saving a new resource', () => {
    it('should add `type` of the existing resource to the yaml before creating the model', async() => {
      const wrapper = mountComponent([{ resource: a }]);

      await saveNew(wrapper);

      expect(a.$dispatch).toHaveBeenCalledWith('create', { ...NEW_DATA, type: 'config' });
    });

    it('should create the new model in the store of the existing resource', async() => {
      const wrapper = mountComponent([{ resource: a }]);

      await saveNew(wrapper);

      expect(a.$dispatch).toHaveBeenCalledWith('create', { ...NEW_DATA, type: 'config' });
      expect(primary.$dispatch).not.toHaveBeenCalled();
    });

    it('should set `isNew` in the context, with the new model as `resource` and `new` as `nodeId`', async() => {
      const save = jest.fn(({ resource }) => resource);
      const wrapper = mountComponent([{ resource: a, save }]);

      await saveNew(wrapper);

      const [[ctx]] = save.mock.calls as any[];

      expect(ctx.isNew).toBe(true);
      expect(ctx.nodeId).toBe('new');
      expect(ctx.resource).toBe(created[0]);
    });

    it('should set the new yaml in `initialYaml` of the context under `new`, alongside the baselines of the other resources', async() => {
      const save = jest.fn(({ resource }) => resource);
      const wrapper = mountComponent([{ resource: a, save }]);

      await saveNew(wrapper);

      const [[ctx]] = save.mock.calls as any[];

      expect(ctx.initialYaml).toStrictEqual({
        [PRIMARY_ID]:  saferDump(primary),
        'config:ns/a': saferDump(a),
        new:           saferDump({ ...NEW_DATA, type: 'config' }),
      });
    });

    it('should call `beforeSaveHook`, `save` and `afterSaveHook` of the first entry of the type', async() => {
      const first = {
        beforeSaveHook: jest.fn(), save: jest.fn(({ resource }) => resource), afterSaveHook: jest.fn()
      };
      const second = {
        beforeSaveHook: jest.fn(), save: jest.fn(({ resource }) => resource), afterSaveHook: jest.fn()
      };
      const wrapper = mountComponent([{ resource: a, ...first }, { resource: b, ...second }]);

      await saveNew(wrapper);

      expect(first.beforeSaveHook).toHaveBeenCalledTimes(1);
      expect(first.save).toHaveBeenCalledTimes(1);
      expect(first.afterSaveHook).toHaveBeenCalledTimes(1);
      expect(second.beforeSaveHook).not.toHaveBeenCalled();
      expect(second.save).not.toHaveBeenCalled();
      expect(second.afterSaveHook).not.toHaveBeenCalled();
    });

    it('should save the new model with its own `save` when the entry defines no `save`', async() => {
      const wrapper = mountComponent([{ resource: a }]);

      await saveNew(wrapper);

      // the first model is the new resource, the second the one `saveClassified` creates from its yaml
      expect(created[1].save).toHaveBeenCalledWith();
      expect(stored.get('config:ns/c')).toBeDefined();
    });

    it('should resolve to the store\'s copy of the saved resource', async() => {
      const wrapper = mountComponent([{ resource: a }]);

      expect(await saveNew(wrapper)).toBe(stored.get('config:ns/c'));
    });

    it('should reject, and add no node to the graph, when the save rejects', async() => {
      const wrapper = mountComponent([{ resource: a, save: () => Promise.reject(new Error('save failed')) }]);
      const [type] = await drawerTypes(wrapper);

      await expect(type.save(NEW_YAML)).rejects.toThrow('save failed');
      await flushPromises();

      expect(graph(wrapper).props('nodes').map((n: any) => n.id)).toStrictEqual([PRIMARY_ID, 'config:ns/a']);
    });

    it('should keep the yaml that the save wrote for the primary resource, and mark the primary resource as modified', async() => {
      const wrapper = mountComponent([{
        resource: a,
        save:     ({ resource, editorState, primaryNodeId }) => {
          editorState.yaml[primaryNodeId] = 'written: by save\n';

          return resource;
        }
      }]);

      await saveNew(wrapper);

      expect(wrapper.vm.editorState.yaml[PRIMARY_ID]).toBe('written: by save\n');
      expect(nodeFor(wrapper, PRIMARY_ID).modified).toBe(true);
    });
  });

  describe('created resources', () => {
    it('should show a created resource in the graph, in the group and below the parent of the entry that saved it', async() => {
      const infra = model({ type: 'infra', id: 'ns/infra' }, { canCreate: false });
      const wrapper = mountComponent([{ resource: infra }, {
        resource: a, group: 'Pools', parentId: 'infra:ns/infra'
      }]);

      await saveNew(wrapper);

      expect(nodeFor(wrapper, 'config:ns/c')).toStrictEqual({
        id: 'config:ns/c', parentId: 'infra:ns/infra', label: 'c', group: 'Pools', modified: false
      });
    });

    it('should give a created resource the banner, hooks, `save` and `clone` of the entry that saved it', async() => {
      const entry = {
        resource:       a,
        banner:         () => ({ label: 'Entry banner' }),
        beforeSaveHook: jest.fn(),
        save:           jest.fn(({ resource }) => {
          const copy = model({ ...resource, status: 'saved' });

          stored.set(`${ resource.type }:${ resource.id }`, copy);

          return copy;
        }),
        afterSaveHook: jest.fn(),
        clone:         jest.fn(() => 'cloned: by entry\n'),
      };
      const wrapper = mountComponent([entry]);

      await saveNew(wrapper);
      await select(wrapper, 'config:ns/c');

      expect(wrapper.find('.banner-stub').text()).toBe('Entry banner');

      const [type] = await drawerTypes(wrapper);
      const source = type.sources.find((s) => s.id === 'config:ns/c') as any;

      await source.cloneYaml();

      expect(toRaw((entry.clone.mock.calls as any[]).at(-1)[0].resource)).toBe(stored.get('config:ns/c'));

      editor(wrapper).vm.$emit('update:value', 'spec: edited\n');
      await nextTick();
      await wrapper.find('[data-testid="multi-yaml-save"]').trigger('click');
      await flushPromises();

      expect(entry.beforeSaveHook).toHaveBeenCalledTimes(2);
      expect(entry.save).toHaveBeenCalledTimes(2);
      expect(entry.afterSaveHook).toHaveBeenCalledTimes(2);
    });

    it('should use the key of the created resource as its node id', async() => {
      const wrapper = mountComponent([{ resource: a }]);

      await saveNew(wrapper);

      expect(graph(wrapper).props('nodes').map((n: any) => n.id)).toStrictEqual([PRIMARY_ID, 'config:ns/a', 'config:ns/c']);
    });

    it('should select and save a created resource as any other related resource', async() => {
      const save = jest.fn(({ resource }) => resource);
      const wrapper = mountComponent([{ resource: a, save }]);

      await saveNew(wrapper);
      await select(wrapper, 'config:ns/c');

      expect(editor(wrapper).props('value')).toBe(saferDump(created[0]));

      editor(wrapper).vm.$emit('update:value', 'spec: edited\n');
      await nextTick();
      await wrapper.find('[data-testid="multi-yaml-save"]').trigger('click');
      await flushPromises();

      const [ctx] = (save.mock.calls as any[]).at(-1);

      expect(ctx.nodeId).toBe('config:ns/c');
      expect(ctx.isNew).toBeUndefined();
      expect(toRaw(ctx.resource)).toBe(created[0]);
    });

    it('should offer a created resource as a clone source', async() => {
      const wrapper = mountComponent([{ resource: a }]);

      await saveNew(wrapper);

      const [type] = await drawerTypes(wrapper);

      expect(type.sources.map((s) => s.id)).toStrictEqual(['config:ns/a', 'config:ns/c']);
    });

    it('should not show a created resource twice once `relatedResources` includes it', async() => {
      const wrapper = mountComponent([{ resource: a }]);
      const saved = await saveNew(wrapper);

      await wrapper.setProps({ relatedResources: [{ resource: a }, { resource: saved }] });

      expect(graph(wrapper).props('nodes').map((n: any) => n.id)).toStrictEqual([PRIMARY_ID, 'config:ns/a', 'config:ns/c']);
    });

    it('should forget created resources when `value` changes', async() => {
      const wrapper = mountComponent([{ resource: a }]);

      await saveNew(wrapper);
      await wrapper.setProps({ value: model({ type: 'cluster', id: 'ns/other' }) });

      expect(graph(wrapper).props('nodes').map((n: any) => n.id)).toStrictEqual(['cluster:ns/other', 'config:ns/a']);
    });
  });
});
