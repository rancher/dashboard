import { flushPromises, mount } from '@vue/test-utils';
import { nextTick, reactive } from 'vue';
import jsyaml from 'js-yaml';
import MultiResourceYaml from '@shell/components/ResourceYaml/MultiResourceYaml.vue';
import { toEditorYaml } from '@shell/utils/related-resources/yaml';

// the real conversion, counted, to see which resources are dumped again
jest.mock('@shell/utils/related-resources/yaml', () => {
  const actual = jest.requireActual('@shell/utils/related-resources/yaml');

  return { ...actual, toEditorYaml: jest.fn(actual.toEditorYaml) };
});

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
  default: {
    name: 'YamlEditorStub', props: ['value', 'initialYamlValues', 'editorMode', 'diffContext'], emits: ['update:value'], template: '<div />'
  },
}));

// rendered components from pkg/rancher-components resolve a different copy of vue than shell
jest.mock('@components/RcButton', () => ({ RcButton: { name: 'RcButtonStub', template: '<button><slot /></button>' } }));
jest.mock('@components/Banner', () => ({ Banner: { name: 'BannerStub', template: '<div />' } }));

const mockedToEditorYaml = toEditorYaml as jest.Mock;

// methods are kept on the prototype, as `saferDump` cannot dump functions
const model = (data: any, methods: any = {}): any => Object.assign(Object.create(methods), data);

const PRIMARY_ID = 'cluster:ns/primary';

const mountComponent = (value: any, relatedResources: any[] = []) => mount(MultiResourceYaml, {
  props:  { value, relatedResources },
  global: { provide: { store: { getters: {}, commit: jest.fn() } } }
});

const graph = (wrapper: any) => wrapper.findComponent({ name: 'ResourceGraphStub' });
const editor = (wrapper: any) => wrapper.findComponent({ name: 'YamlEditorStub' });
const nodeFor = (wrapper: any, id: string) => graph(wrapper).props('nodes').find((n: any) => n.id === id);

const edit = async(wrapper: any, yaml: string) => {
  editor(wrapper).vm.$emit('update:value', yaml);
  await nextTick();
};

const save = async(wrapper: any) => {
  await wrapper.find('[data-testid="multi-yaml-save"]').trigger('click');
  await flushPromises();
};

describe('component: MultiResourceYaml', () => {
  // the server changed `metadata.labels.shared` while the user changed it in the editor
  describe('a change made in the background to the field the user changed', () => {
    let stored: Map<string, any>;
    let attempts: number;

    // the server's copy: the label changed, and a newer resourceVersion
    const live = () => ({
      type:     'cluster',
      id:       'ns/primary',
      metadata: {
        name: 'primary', namespace: 'ns', resourceVersion: '2', labels: { shared: 'server' }
      }
    });

    const userYaml = 'metadata:\n  name: primary\n  namespace: ns\n  resourceVersion: "1"\n  labels:\n    shared: user\nspec: edited\n';

    // the first save is rejected with a 409, which reloads the store's copy, as `_save` does
    const methods: any = {
      $state:       { config: { namespace: 'cluster' } },
      $rootGetters: { 'i18n/t': (key: string, { fields }: any) => `${ key }: ${ fields }` },
      $getters:     { byId: (type: string, id: string) => stored.get(`${ type }:${ id }`) },
      // `cleanForDiff` is given plain values, so they are returned as they are
      $dispatch:    jest.fn((action: string, d: any) => (action.endsWith('cleanForDiff') ? Promise.resolve(JSON.parse(JSON.stringify(d))) : Promise.resolve(model(d, methods)))),
      save:         jest.fn(function(this: any) {
        attempts++;

        if (attempts === 1) {
          stored.set(PRIMARY_ID, model(live(), methods));

          return Promise.reject({ status: 409 }); // eslint-disable-line prefer-promise-reject-errors
        }

        const copy = model({ ...this, status: 'saved' }, methods);

        stored.set(PRIMARY_ID, copy);

        return Promise.resolve(copy);
      }),
    };

    const loaded = () => model({
      type:     'cluster',
      id:       'ns/primary',
      metadata: {
        name: 'primary', namespace: 'ns', resourceVersion: '1', labels: {}
      }
    }, methods);

    // a conflicting save, from the yaml the user edited
    const conflicted = async() => {
      const wrapper = mountComponent(loaded());

      await edit(wrapper, userYaml);
      await save(wrapper);

      return wrapper;
    };

    const conflictError = 'resourceYaml.errors.saveFailed-{"kind":"cluster","name":"primary","error":"validation.conflict: metadata.labels.shared"}';

    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => {});
      stored = new Map();
      attempts = 0;
    });

    // each save first clears the errors of the previous one
    it('should show an error naming the resource and the field', async() => {
      const wrapper = await conflicted();

      expect(wrapper.emitted('error')).toStrictEqual([[[]], [[conflictError]]]);
    });

    // the conflict banner says the screen shows the current values, so it does
    it('should show the server\'s version, with the user\'s changes to other fields, in the editor', async() => {
      const wrapper = await conflicted();

      expect(jsyaml.load(editor(wrapper).props('value'))).toStrictEqual({
        metadata: {
          name: 'primary', namespace: 'ns', resourceVersion: '2', labels: { shared: 'server' }
        },
        spec: 'edited',
      });
    });

    it('should compare the yaml in the editor with the server\'s version', async() => {
      const wrapper = await conflicted();

      expect(editor(wrapper).props('initialYamlValues')).toBe(toEditorYaml(stored.get(PRIMARY_ID)));
    });

    it('should keep the resource marked as modified, as the user\'s other changes are not saved', async() => {
      const wrapper = await conflicted();

      expect(nodeFor(wrapper, PRIMARY_ID).modified).toBe(true);
    });

    // the yaml editor reads its value only when it mounts
    it('should mount the editor again to show the merged yaml', async() => {
      const wrapper = mountComponent(loaded());

      await edit(wrapper, userYaml);

      const before = editor(wrapper).vm;

      await save(wrapper);

      expect(editor(wrapper).vm).not.toBe(before);
    });

    // before, every save compared with the yaml first loaded, and conflicted again on the same field
    it('should save on the next attempt, with the server\'s version of the conflicting field', async() => {
      const wrapper = await conflicted();

      await save(wrapper);

      const saved = stored.get(PRIMARY_ID);

      expect(attempts).toBe(2);
      expect(wrapper.emitted('error')).toStrictEqual([[[]], [[conflictError]], [[]]]);
      expect(saved.spec).toBe('edited');
      expect(saved.metadata).toStrictEqual({
        name: 'primary', namespace: 'ns', resourceVersion: '2', labels: { shared: 'server' }
      });
    });

    it('should save the value the user gives the conflicting field after the conflict', async() => {
      const wrapper = await conflicted();

      await edit(wrapper, 'metadata:\n  name: primary\n  namespace: ns\n  resourceVersion: "2"\n  labels:\n    shared: user-again\nspec: edited\n');
      await save(wrapper);

      expect(stored.get(PRIMARY_ID).metadata.labels).toStrictEqual({ shared: 'user-again' });
    });
  });

  // a websocket update changes a related resource without changing what the editor compares with
  describe('the yaml of a resource changed in the background', () => {
    const versioned = (name: string, resourceVersion: string) => reactive(model({
      type:     'config',
      id:       `ns/${ name }`,
      metadata: {
        name, namespace: 'ns', resourceVersion
      },
      status: { phase: 'one' }
    }));

    // the calls made for the resource named `name`
    const dumpsOf = (name: string) => mockedToEditorYaml.mock.calls.filter(([resource]) => resource?.metadata?.name === name).length;

    it('should not make the yaml of any resource again when a field other than the resourceVersion changes', async() => {
      const a = versioned('a', '1');
      const b = versioned('b', '1');
      const wrapper = mountComponent(model({
        type: 'cluster', id: 'ns/primary', metadata: { name: 'primary', namespace: 'ns' }
      }), [{ resource: a }, { resource: b }]);

      mockedToEditorYaml.mockClear();
      a.status.phase = 'two';
      await nextTick();
      // read the modified state, which compares with the yaml of every resource
      graph(wrapper).props('nodes');

      expect(dumpsOf('a')).toBe(0);
      expect(dumpsOf('b')).toBe(0);
    });

    it('should make the yaml of only the resource whose resourceVersion changed', async() => {
      const a = versioned('a', '1');
      const b = versioned('b', '1');
      const wrapper = mountComponent(model({
        type: 'cluster', id: 'ns/primary', metadata: { name: 'primary', namespace: 'ns' }
      }), [{ resource: a }, { resource: b }]);

      // `a` is shown, so its yaml is read
      graph(wrapper).vm.$emit('select', 'config:ns/a');
      await nextTick();
      mockedToEditorYaml.mockClear();

      a.metadata.resourceVersion = '2';
      a.status.phase = 'two';
      graph(wrapper).vm.$emit('select', 'config:ns/b');
      await nextTick();
      graph(wrapper).props('nodes');

      expect(dumpsOf('a')).toBe(1);
      expect(dumpsOf('b')).toBe(0);
    });
  });
});
