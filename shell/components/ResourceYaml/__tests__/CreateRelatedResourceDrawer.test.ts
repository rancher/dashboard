import { mount, flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import { createStore } from 'vuex';
import CreateRelatedResourceDrawer from '@shell/components/ResourceYaml/CreateRelatedResourceDrawer.vue';
import { RelatedResourceType } from '@shell/components/ResourceYaml/types';
import { createYaml } from '@shell/utils/create-yaml';

jest.mock('@shell/utils/create-yaml', () => ({
  ...jest.requireActual('@shell/utils/create-yaml'),
  createYaml: jest.fn(() => 'blank: yaml'),
}));

jest.mock('@shell/components/Drawer/Chrome.vue', () => ({
  __esModule: true,
  default:    {
    name:     'DrawerStub',
    props:    ['ariaTarget'],
    emits:    ['close'],
    template: '<div><h1 class="drawer-title"><slot name="title" /></h1><slot name="body" /><slot name="additional-actions" /></div>',
  },
}));

jest.mock('@shell/components/YamlEditor.vue', () => ({
  __esModule: true,
  default:    {
    name:     'YamlEditorStub',
    props:    ['value'],
    emits:    ['update:value'],
    template: '<div class="yaml-editor-stub">{{ value }}</div>',
  },
}));

jest.mock('@shell/components/form/LabeledSelect.vue', () => ({
  __esModule: true,
  default:    {
    name:     'LabeledSelectStub',
    props:    ['value', 'options', 'appendToBody', 'label'],
    emits:    ['update:value'],
    template: '<div />',
  },
}));

// rendered components from pkg/rancher-components resolve a different copy of vue than shell
jest.mock('@components/RcButton', () => ({
  RcButton: {
    name:     'RcButtonStub',
    props:    ['disabled'],
    emits:    ['click'],
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
  },
}));

jest.mock('@components/Banner', () => ({
  Banner: {
    name:     'BannerStub',
    props:    ['color', 'label'],
    template: '<div :class="[\'banner\', color]">{{ label }}</div>',
  },
}));

jest.mock('@shell/components/Loading.vue', () => ({
  __esModule: true,
  default:    { name: 'LoadingStub', template: '<div class="loading-stub" />' },
}));

const mockedCreateYaml = createYaml as jest.Mock;

const deferred = <T = string>() => {
  let resolveFn!: (v: T) => void;
  let rejectFn!: (e: any) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });

  return {
    promise, resolve: resolveFn, reject: rejectFn
  };
};

const SCHEMAS = [{ id: 'schema' }];

const makeType = (key: string, {
  schema = { attributes: { namespaced: true } } as any,
  sources = [] as RelatedResourceType['sources'],
  save = jest.fn(() => Promise.resolve({})) as jest.Mock,
} = {}): RelatedResourceType => ({
  key,
  type:     key.split('/')[1],
  label:    `${ key } label`,
  resource: { $getters: { schemaFor: jest.fn(() => schema), all: jest.fn(() => SCHEMAS) } },
  sources,
  save,
});

const source = (id: string, cloneYaml: () => Promise<string> = () => Promise.resolve(`cloned: ${ id }`)) => ({
  id, label: `${ id } label`, cloneYaml: jest.fn(cloneYaml)
});

describe('component: CreateRelatedResourceDrawer', () => {
  const mountComponent = (types: RelatedResourceType[], props: any = {}) => mount(CreateRelatedResourceDrawer, {
    props:  { types, ...props },
    global: { provide: { store: createStore({ getters: { defaultNamespace: () => 'default-ns' } }) } }
  });

  const typeSelect = (wrapper: any) => wrapper.findComponent('[data-testid="create-related-resource-type"]');
  const sourceSelect = (wrapper: any) => wrapper.findComponent('[data-testid="create-related-resource-source"]');
  const yamlEditor = (wrapper: any) => wrapper.findComponent('[data-testid="create-related-resource-yaml"]');
  const saveButton = (wrapper: any) => wrapper.find('[data-testid="create-related-resource-save"]');

  const selectType = async(wrapper: any, key: string) => {
    typeSelect(wrapper).vm.$emit('update:value', key);
    await flushPromises();
  };

  const selectSource = async(wrapper: any, id: string) => {
    sourceSelect(wrapper).vm.$emit('update:value', id);
    await flushPromises();
  };

  beforeEach(() => {
    mockedCreateYaml.mockReset();
    mockedCreateYaml.mockReturnValue('blank: yaml');
  });

  describe('drawer', () => {
    it('should show the create related resource title', () => {
      const wrapper = mountComponent([]);

      expect(wrapper.find('.drawer-title').text()).toBe('resourceYaml.resourceGraph.create');
    });

    it('should emit `close` when the drawer emits `close`', () => {
      const wrapper = mountComponent([]);

      wrapper.findComponent({ name: 'DrawerStub' }).vm.$emit('close');

      expect(wrapper.emitted('close')).toStrictEqual([[]]);
    });
  });

  describe('resource type select', () => {
    it('should offer one option per entry of `types`, with its `key` as the value and its `label` as the label', () => {
      const wrapper = mountComponent([makeType('cluster/a'), makeType('management/b')]);

      expect(typeSelect(wrapper).props('options')).toStrictEqual([
        { value: 'cluster/a', label: 'cluster/a label' },
        { value: 'management/b', label: 'management/b label' },
      ]);
    });

    it('should select no type initially', () => {
      const wrapper = mountComponent([makeType('cluster/a')]);

      expect(typeSelect(wrapper).props('value')).toBeUndefined();
    });

    it('should show neither the clone from select nor the yaml editor before a type is selected', () => {
      const wrapper = mountComponent([makeType('cluster/a')]);

      expect(sourceSelect(wrapper).exists()).toBe(false);
      expect(yamlEditor(wrapper).exists()).toBe(false);
    });

    it('should not append its menu to the body, as the full height drawer is shown above menus appended to the body', () => {
      const wrapper = mountComponent([makeType('cluster/a')]);

      expect(typeSelect(wrapper).props('appendToBody')).toBe(false);
    });
  });

  describe('clone from select', () => {
    it('should show the clone from select once a type is selected', async() => {
      const wrapper = mountComponent([makeType('cluster/a')]);

      await selectType(wrapper, 'cluster/a');

      expect(sourceSelect(wrapper).exists()).toBe(true);
    });

    it('should list the blank option first, then one option per source of the selected type', async() => {
      const wrapper = mountComponent([makeType('cluster/a', { sources: [source('x'), source('y')] })]);

      await selectType(wrapper, 'cluster/a');

      expect(sourceSelect(wrapper).props('options')).toStrictEqual([
        { value: '', label: 'resourceYaml.createRelatedResource.blank' },
        { value: 'x', label: 'x label' },
        { value: 'y', label: 'y label' },
      ]);
    });

    it('should list only the sources of the selected type', async() => {
      const wrapper = mountComponent([
        makeType('cluster/a', { sources: [source('x')] }),
        makeType('cluster/b', { sources: [source('y')] }),
      ]);

      await selectType(wrapper, 'cluster/b');

      expect(sourceSelect(wrapper).props('options').map((o: any) => o.value)).toStrictEqual(['', 'y']);
    });

    it('should select the blank option when a type is selected', async() => {
      const wrapper = mountComponent([makeType('cluster/a', { sources: [source('x')] })]);

      await selectType(wrapper, 'cluster/a');

      expect(sourceSelect(wrapper).props('value')).toBe('');
    });

    it('should reset to the blank option when a different type is selected', async() => {
      const wrapper = mountComponent([
        makeType('cluster/a', { sources: [source('x')] }),
        makeType('cluster/b', { sources: [source('y')] }),
      ]);

      await selectType(wrapper, 'cluster/a');
      await selectSource(wrapper, 'x');
      await selectType(wrapper, 'cluster/b');

      expect(sourceSelect(wrapper).props('value')).toBe('');
    });

    it('should not append its menu to the body, as the full height drawer is shown above menus appended to the body', async() => {
      const wrapper = mountComponent([makeType('cluster/a')]);

      await selectType(wrapper, 'cluster/a');

      expect(sourceSelect(wrapper).props('appendToBody')).toBe(false);
    });
  });

  describe('blank yaml', () => {
    it('should pass the schemas of the store of the type and the selected type to `createYaml`', async() => {
      const type = makeType('cluster/a', { schema: {} });
      const wrapper = mountComponent([type]);

      await selectType(wrapper, 'cluster/a');

      expect(type.resource.$getters.all).toHaveBeenCalledWith('schema');
      expect(mockedCreateYaml).toHaveBeenCalledWith(SCHEMAS, 'a', { type: 'a' });
    });

    it('should set `metadata.namespace` from the `namespace` prop for a namespaced type', async() => {
      const wrapper = mountComponent([makeType('cluster/a')], { namespace: 'my-ns' });

      await selectType(wrapper, 'cluster/a');

      expect(mockedCreateYaml).toHaveBeenCalledWith(SCHEMAS, 'a', { type: 'a', metadata: { namespace: 'my-ns' } });
    });

    it('should use the `defaultNamespace` getter for a namespaced type when no `namespace` prop is given', async() => {
      const wrapper = mountComponent([makeType('cluster/a')]);

      await selectType(wrapper, 'cluster/a');

      expect(mockedCreateYaml).toHaveBeenCalledWith(SCHEMAS, 'a', { type: 'a', metadata: { namespace: 'default-ns' } });
    });

    it('should not set `metadata` for a type that is not namespaced', async() => {
      const wrapper = mountComponent([makeType('cluster/a', { schema: { attributes: { namespaced: false } } })], { namespace: 'my-ns' });

      await selectType(wrapper, 'cluster/a');

      expect(mockedCreateYaml).toHaveBeenCalledWith(SCHEMAS, 'a', { type: 'a' });
    });

    it('should call `fetchResourceFields` of the schema before `createYaml` when the schema has it', async() => {
      const order: string[] = [];
      const fetchResourceFields = jest.fn(() => {
        order.push('fetchResourceFields');

        return Promise.resolve();
      });

      mockedCreateYaml.mockImplementation(() => {
        order.push('createYaml');

        return 'blank: yaml';
      });

      const wrapper = mountComponent([makeType('cluster/a', { schema: { fetchResourceFields } })]);

      await selectType(wrapper, 'cluster/a');

      expect(order).toStrictEqual(['fetchResourceFields', 'createYaml']);
    });

    it('should create the yaml when the schema has no `fetchResourceFields`', async() => {
      const wrapper = mountComponent([makeType('cluster/a', { schema: {} })]);

      await selectType(wrapper, 'cluster/a');

      expect(mockedCreateYaml).toHaveBeenCalledWith(SCHEMAS, 'a', { type: 'a' });
    });

    it('should create the yaml when `schemaFor` returns nothing for the type', async() => {
      const wrapper = mountComponent([makeType('cluster/a', { schema: null })]);

      await selectType(wrapper, 'cluster/a');

      expect(mockedCreateYaml).toHaveBeenCalledWith(SCHEMAS, 'a', { type: 'a' });
    });

    it('should show the created yaml in the yaml editor', async() => {
      const wrapper = mountComponent([makeType('cluster/a')]);

      await selectType(wrapper, 'cluster/a');

      expect(yamlEditor(wrapper).props('value')).toBe('blank: yaml');
    });
  });

  describe('cloned yaml', () => {
    it('should call `cloneYaml` of the selected source and show its result in the yaml editor', async() => {
      const x = source('x');
      const wrapper = mountComponent([makeType('cluster/a', { sources: [x] })]);

      await selectType(wrapper, 'cluster/a');
      await selectSource(wrapper, 'x');

      expect(x.cloneYaml).toHaveBeenCalledWith();
      expect(yamlEditor(wrapper).props('value')).toBe('cloned: x');
    });

    it('should not call `createYaml` when a source is selected', async() => {
      const wrapper = mountComponent([makeType('cluster/a', { sources: [source('x')] })]);

      await selectType(wrapper, 'cluster/a');
      mockedCreateYaml.mockClear();
      await selectSource(wrapper, 'x');

      expect(mockedCreateYaml).not.toHaveBeenCalled();
    });

    it('should create the blank yaml again when the blank option is selected after a source', async() => {
      const wrapper = mountComponent([makeType('cluster/a', { sources: [source('x')] })]);

      await selectType(wrapper, 'cluster/a');
      await selectSource(wrapper, 'x');
      await selectSource(wrapper, '');

      expect(mockedCreateYaml).toHaveBeenCalledTimes(2);
      expect(yamlEditor(wrapper).props('value')).toBe('blank: yaml');
    });
  });

  describe('loading', () => {
    it('should show the loading indicator in place of the yaml editor while the yaml is loading', async() => {
      const load = deferred();
      const wrapper = mountComponent([makeType('cluster/a', { sources: [source('x', () => load.promise)] })]);

      await selectType(wrapper, 'cluster/a');
      await selectSource(wrapper, 'x');

      expect(wrapper.find('.loading-stub').exists()).toBe(true);
      expect(yamlEditor(wrapper).exists()).toBe(false);

      load.resolve('loaded: yaml');
      await flushPromises();

      expect(wrapper.find('.loading-stub').exists()).toBe(false);
      expect(yamlEditor(wrapper).props('value')).toBe('loaded: yaml');
    });

    it('should show the yaml of the most recent selection when the load of an earlier selection resolves after it', async() => {
      const first = deferred();
      const second = deferred();
      const wrapper = mountComponent([makeType('cluster/a', { sources: [source('x', () => first.promise), source('y', () => second.promise)] })]);

      await selectType(wrapper, 'cluster/a');
      await selectSource(wrapper, 'x');
      await selectSource(wrapper, 'y');

      second.resolve('second: yaml');
      await flushPromises();
      first.resolve('first: yaml');
      await flushPromises();

      expect(yamlEditor(wrapper).props('value')).toBe('second: yaml');
    });

    it('should not show the error of an earlier selection when its load rejects after a later selection', async() => {
      const first = deferred();
      const second = deferred();
      const wrapper = mountComponent([makeType('cluster/a', { sources: [source('x', () => first.promise), source('y', () => second.promise)] })]);

      await selectType(wrapper, 'cluster/a');
      await selectSource(wrapper, 'x');
      await selectSource(wrapper, 'y');

      second.resolve('second: yaml');
      await flushPromises();
      first.reject(new Error('first failed'));
      await flushPromises();

      expect(wrapper.text()).not.toContain('first failed');
      expect(yamlEditor(wrapper).props('value')).toBe('second: yaml');
    });

    it('should keep the loading indicator until the load of the most recent selection settles', async() => {
      const first = deferred();
      const second = deferred();
      const wrapper = mountComponent([makeType('cluster/a', { sources: [source('x', () => first.promise), source('y', () => second.promise)] })]);

      await selectType(wrapper, 'cluster/a');
      await selectSource(wrapper, 'x');
      await selectSource(wrapper, 'y');

      first.resolve('first: yaml');
      await flushPromises();

      expect(wrapper.find('.loading-stub').exists()).toBe(true);

      second.resolve('second: yaml');
      await flushPromises();

      expect(wrapper.find('.loading-stub').exists()).toBe(false);
    });

    it('should show the stringified error in an error banner, in place of the yaml editor, when the load rejects', async() => {
      const wrapper = mountComponent([makeType('cluster/a', { sources: [source('x', () => Promise.reject(new Error('load failed')))] })]);

      await selectType(wrapper, 'cluster/a');
      await selectSource(wrapper, 'x');

      expect(wrapper.find('.banner.error').text()).toContain('load failed');
      expect(yamlEditor(wrapper).exists()).toBe(false);
    });

    it('should clear the load error when another type or source is selected', async() => {
      const wrapper = mountComponent([makeType('cluster/a', { sources: [source('x', () => Promise.reject(new Error('load failed')))] })]);

      await selectType(wrapper, 'cluster/a');
      await selectSource(wrapper, 'x');
      await selectSource(wrapper, '');

      expect(wrapper.find('.banner.error').exists()).toBe(false);
      expect(yamlEditor(wrapper).props('value')).toBe('blank: yaml');
    });

    it('should remount the yaml editor when the type or the source changes', async() => {
      const wrapper = mountComponent([makeType('cluster/a', { sources: [source('x', () => Promise.resolve('blank: yaml'))] })]);

      await selectType(wrapper, 'cluster/a');

      const before = yamlEditor(wrapper).vm;

      await selectSource(wrapper, 'x');

      expect(yamlEditor(wrapper).vm).not.toBe(before);
    });
  });

  describe('save button', () => {
    it('should be disabled before a type is selected', () => {
      const wrapper = mountComponent([makeType('cluster/a')]);

      expect(saveButton(wrapper).element.disabled).toBe(true);
    });

    it('should be disabled while the yaml is loading', async() => {
      const load = deferred();
      const wrapper = mountComponent([makeType('cluster/a', { sources: [source('x', () => load.promise)] })]);

      await selectType(wrapper, 'cluster/a');
      await selectSource(wrapper, 'x');

      expect(saveButton(wrapper).element.disabled).toBe(true);
    });

    it('should be disabled when the yaml is empty', async() => {
      const wrapper = mountComponent([makeType('cluster/a', { sources: [source('x', () => Promise.resolve(''))] })]);

      await selectType(wrapper, 'cluster/a');
      await selectSource(wrapper, 'x');

      expect(saveButton(wrapper).element.disabled).toBe(true);
    });

    it('should be disabled while the save is in progress', async() => {
      const save = deferred<any>();
      const wrapper = mountComponent([makeType('cluster/a', { save: jest.fn(() => save.promise) })]);

      await selectType(wrapper, 'cluster/a');
      await saveButton(wrapper).trigger('click');

      expect(saveButton(wrapper).element.disabled).toBe(true);

      save.resolve({});
      await flushPromises();
    });

    it('should be enabled once a type is selected and its yaml has loaded', async() => {
      const wrapper = mountComponent([makeType('cluster/a')]);

      await selectType(wrapper, 'cluster/a');

      expect(saveButton(wrapper).element.disabled).toBe(false);
    });
  });

  describe('save', () => {
    it('should call `save` of the selected type with the yaml in the editor, including edits made in the editor', async() => {
      const type = makeType('cluster/a');
      const wrapper = mountComponent([type]);

      await selectType(wrapper, 'cluster/a');
      yamlEditor(wrapper).vm.$emit('update:value', 'edited: yaml');
      await nextTick();
      await saveButton(wrapper).trigger('click');

      expect(type.save).toHaveBeenCalledWith('edited: yaml');
    });

    it('should emit `close` when the save resolves', async() => {
      const wrapper = mountComponent([makeType('cluster/a')]);

      await selectType(wrapper, 'cluster/a');
      await saveButton(wrapper).trigger('click');
      await flushPromises();

      expect(wrapper.emitted('close')).toStrictEqual([[]]);
    });

    it('should not emit `close` when the save rejects', async() => {
      const wrapper = mountComponent([makeType('cluster/a', { save: jest.fn(() => Promise.reject(new Error('save failed'))) })]);

      await selectType(wrapper, 'cluster/a');
      await saveButton(wrapper).trigger('click');
      await flushPromises();

      expect(wrapper.emitted('close')).toBeUndefined();
    });

    it('should show the stringified error above the yaml editor when the save rejects', async() => {
      const wrapper = mountComponent([makeType('cluster/a', { save: jest.fn(() => Promise.reject(new Error('save failed'))) })]);

      await selectType(wrapper, 'cluster/a');
      await saveButton(wrapper).trigger('click');
      await flushPromises();

      expect(wrapper.find('[data-testid="create-related-resource-save-error"]').text()).toContain('save failed');
      expect(yamlEditor(wrapper).exists()).toBe(true);
    });

    it('should keep the yaml in the editor when the save rejects', async() => {
      const wrapper = mountComponent([makeType('cluster/a', { save: jest.fn(() => Promise.reject(new Error('save failed'))) })]);

      await selectType(wrapper, 'cluster/a');
      yamlEditor(wrapper).vm.$emit('update:value', 'edited: yaml');
      await nextTick();
      await saveButton(wrapper).trigger('click');
      await flushPromises();

      expect(yamlEditor(wrapper).props('value')).toBe('edited: yaml');
    });

    it('should clear the save error when the save is started again', async() => {
      const save = jest.fn()
        .mockImplementationOnce(() => Promise.reject(new Error('save failed')))
        .mockImplementationOnce(() => new Promise(() => {}));
      const wrapper = mountComponent([makeType('cluster/a', { save })]);

      await selectType(wrapper, 'cluster/a');
      await saveButton(wrapper).trigger('click');
      await flushPromises();
      await saveButton(wrapper).trigger('click');

      expect(wrapper.find('[data-testid="create-related-resource-save-error"]').exists()).toBe(false);
    });

    it('should clear the save error when another type or source is selected', async() => {
      const wrapper = mountComponent([makeType('cluster/a', { sources: [source('x')], save: jest.fn(() => Promise.reject(new Error('save failed'))) })]);

      await selectType(wrapper, 'cluster/a');
      await saveButton(wrapper).trigger('click');
      await flushPromises();
      await selectSource(wrapper, 'x');

      expect(wrapper.find('[data-testid="create-related-resource-save-error"]').exists()).toBe(false);
    });
  });
});
