import { shallowMount } from '@vue/test-utils';
import ResourceYaml from '@shell/components/ResourceYaml/index.vue';
import { _VIEW } from '@shell/config/query-params';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import { EditableRelatedResource } from '@shell/core/types';

jest.mock('@shell/core/plugin-helpers', () => ({ getApplicableExtensionEnhancements: jest.fn(() => []) }));

const mockedEnhancements = getApplicableExtensionEnhancements as jest.Mock;

describe('component: ResourceYaml', () => {
  const mountComponent = (value: any, { withExtensionSupport = true } = {}) => shallowMount(ResourceYaml, {
    props: {
      mode: _VIEW,
      yaml: 'YAML',
      value
    },
    global: {
      mocks: {
        $router:     { applyQuery: jest.fn(), replace: jest.fn() },
        $route:      { query: {} },
        $fetchState: { pending: false },
        $store:      {
          getters:    { currentStore: () => 'cluster', 'cluster/schemaFor': () => ({}) },
          $extension: withExtensionSupport ? { getUIConfig: jest.fn(() => []) } : undefined
        }
      },
      stubs: { YamlEditor: true }
    }
  });

  beforeEach(() => {
    mockedEnhancements.mockReset();
    mockedEnhancements.mockReturnValue([]);
  });

  describe('editableRelatedResources', () => {
    it('should be empty when the model provides no related resources', async() => {
      const wrapper = mountComponent({ type: 'pod' });

      await wrapper.vm.loadEditableRelatedResources();

      expect(wrapper.vm.editableRelatedResources).toStrictEqual([]);
      expect(wrapper.vm.needsMultiEdit).toBe(false);
    });

    it('should resolve the async list from the model', async() => {
      const related = { resource: { type: 'service' } };
      const wrapper = mountComponent({
        type:                          'pod',
        fetchEditableRelatedResources: () => Promise.resolve([related])
      });

      await wrapper.vm.loadEditableRelatedResources();

      expect(wrapper.vm.editableRelatedResources).toStrictEqual([related]);
      expect(wrapper.vm.needsMultiEdit).toBe(true);
    });

    it('should keep the configuration supplied with each related resource', async() => {
      const beforeSaveHook = jest.fn();
      const afterSaveHook = jest.fn();
      const save = jest.fn();
      const entry: EditableRelatedResource = {
        resource: { type: 'service' }, beforeSaveHook, afterSaveHook, save
      };

      const wrapper = mountComponent({
        type:                          'pod',
        fetchEditableRelatedResources: () => Promise.resolve([entry])
      });

      await wrapper.vm.loadEditableRelatedResources();

      const [resolved] = wrapper.vm.editableRelatedResources;

      expect(resolved.beforeSaveHook).toBe(beforeSaveHook);
      expect(resolved.afterSaveHook).toBe(afterSaveHook);
      expect(resolved.save).toBe(save);
    });

    it('should allow extensions to resolve their additions asynchronously', async() => {
      const fromModel = { resource: { type: 'service' } };
      const fromExtension = { resource: { type: 'secret' } };

      mockedEnhancements.mockReturnValue([{ fetchExtensionEditableRelatedResources: (_resource: any, res: EditableRelatedResource[]) => Promise.resolve([...res, fromExtension]) }]);

      const wrapper = mountComponent({
        type:                          'pod',
        fetchEditableRelatedResources: () => Promise.resolve([fromModel])
      });

      await wrapper.vm.loadEditableRelatedResources();

      expect(wrapper.vm.editableRelatedResources).toStrictEqual([fromModel, fromExtension]);
    });

    it('should apply extensions in order, each seeing the previous result', async() => {
      const a = { resource: { type: 'a' } };
      const b = { resource: { type: 'b' } };

      mockedEnhancements.mockReturnValue([
        { fetchExtensionEditableRelatedResources: (_resource: any, res: EditableRelatedResource[]) => [...res, a] },
        { fetchExtensionEditableRelatedResources: async(_resource: any, res: EditableRelatedResource[]) => [...res, b] },
      ]);

      const wrapper = mountComponent({ type: 'pod' });

      await wrapper.vm.loadEditableRelatedResources();

      expect(wrapper.vm.editableRelatedResources).toStrictEqual([a, b]);
    });

    it.each([
      ['a non-function', { fetchExtensionEditableRelatedResources: 'nope' }],
      ['a non-array result', { fetchExtensionEditableRelatedResources: () => 'nope' }],
      ['an async non-array result', { fetchExtensionEditableRelatedResources: () => Promise.resolve(undefined) }],
    ])('should ignore an extension providing %s', async(_label, extension) => {
      const fromModel = { resource: { type: 'service' } };

      mockedEnhancements.mockReturnValue([extension]);

      const wrapper = mountComponent({
        type:                          'pod',
        fetchEditableRelatedResources: () => Promise.resolve([fromModel])
      });

      await wrapper.vm.loadEditableRelatedResources();

      expect(wrapper.vm.editableRelatedResources).toStrictEqual([fromModel]);
    });

    it.each([
      ['no resource', { beforeSaveHook: () => {} }],
      ['a falsy resource', { resource: null }],
      ['a bare resource', { type: 'service' }],
      ['a non-function beforeSaveHook', { resource: { type: 'service' }, beforeSaveHook: 'nope' }],
      ['a non-function afterSaveHook', { resource: { type: 'service' }, afterSaveHook: 'nope' }],
      ['a non-function save', { resource: { type: 'service' }, save: 'nope' }],
      ['a non-function banner', { resource: { type: 'service' }, banner: 'nope' }],
    ])('should drop an entry with %s', async(_label, entry) => {
      const valid = { resource: { type: 'secret' } };

      jest.spyOn(console, 'warn').mockImplementation(() => {});

      const wrapper = mountComponent({
        type:                          'pod',
        fetchEditableRelatedResources: () => Promise.resolve([entry, valid])
      });

      await wrapper.vm.loadEditableRelatedResources();

      expect(wrapper.vm.editableRelatedResources).toStrictEqual([valid]);
    });

    describe('tree expansion', () => {
      it('should fetch and append the related resources of each related resource', async() => {
        const grandchild = { resource: { id: 'ns/grandchild', type: 'secret' } };
        const child: EditableRelatedResource = {
          resource: {
            id:                            'ns/child',
            type:                          'service',
            fetchEditableRelatedResources: () => Promise.resolve([grandchild]),
          }
        };

        const wrapper = mountComponent({
          type:                          'pod',
          fetchEditableRelatedResources: () => Promise.resolve([child])
        });

        await wrapper.vm.loadEditableRelatedResources();

        expect(wrapper.vm.editableRelatedResources).toStrictEqual([child, grandchild]);
      });

      it('should not add the same resource (by id) more than once', async() => {
        const shared: EditableRelatedResource = { resource: { id: 'ns/shared', type: 'service' } };
        const childA: EditableRelatedResource = {
          resource: {
            id:                            'ns/a',
            type:                          'pod',
            fetchEditableRelatedResources: () => Promise.resolve([shared]),
          }
        };
        const childB: EditableRelatedResource = {
          resource: {
            id:                            'ns/b',
            type:                          'pod',
            fetchEditableRelatedResources: () => Promise.resolve([shared]),
          }
        };

        const wrapper = mountComponent({
          type:                          'pod',
          fetchEditableRelatedResources: () => Promise.resolve([childA, childB])
        });

        await wrapper.vm.loadEditableRelatedResources();

        expect(wrapper.vm.editableRelatedResources).toStrictEqual([childA, childB, shared]);
      });

      it('should not loop on a circular reference', async() => {
        const resourceB: any = { id: 'ns/b', type: 'service' };
        const entryB: EditableRelatedResource = { resource: resourceB };
        const resourceA: any = {
          id:                            'ns/a',
          type:                          'pod',
          fetchEditableRelatedResources: () => Promise.resolve([entryB]),
        };

        // B → A creates the cycle
        resourceB.fetchEditableRelatedResources = () => Promise.resolve([{ resource: resourceA }]);

        const wrapper = mountComponent({
          type:                          'pod',
          fetchEditableRelatedResources: () => Promise.resolve([{ resource: resourceA }])
        });

        await wrapper.vm.loadEditableRelatedResources();

        // A and B, but not a third entry from the cycle
        expect(wrapper.vm.editableRelatedResources).toHaveLength(2);
      });

      it('should preserve the groupKey from transitively fetched entries', async() => {
        const grandchild: EditableRelatedResource = {
          resource: { id: 'ns/gc', type: 'secret' },
          groupKey: 'some.group.key',
        };
        const child: EditableRelatedResource = {
          resource: {
            id:                            'ns/child',
            type:                          'service',
            fetchEditableRelatedResources: () => Promise.resolve([grandchild]),
          }
        };

        const wrapper = mountComponent({
          type:                          'pod',
          fetchEditableRelatedResources: () => Promise.resolve([child])
        });

        await wrapper.vm.loadEditableRelatedResources();

        expect(wrapper.vm.editableRelatedResources[1].groupKey).toBe('some.group.key');
      });
    });

    it('should not apply extensions when the older dashboard has no extension config support', async() => {
      mockedEnhancements.mockReturnValue([{ fetchExtensionEditableRelatedResources: (_resource: any, res: EditableRelatedResource[]) => [...res, { resource: { type: 'a' } }] }]);

      const wrapper = mountComponent({ type: 'pod' }, { withExtensionSupport: false });

      await wrapper.vm.loadEditableRelatedResources();

      expect(wrapper.vm.editableRelatedResources).toStrictEqual([]);
      expect(mockedEnhancements).toHaveBeenCalledTimes(0);
    });

    it('should not let a slow load for a previous resource overwrite the current resource result', async() => {
      let resolveSlow: (res: EditableRelatedResource[]) => void = () => {};
      const slow = {
        type:                          'pod',
        fetchEditableRelatedResources: () => new Promise<EditableRelatedResource[]>((resolve) => {
          resolveSlow = resolve;
        })
      };
      const wrapper = mountComponent(slow);

      const pending = wrapper.vm.loadEditableRelatedResources();

      await wrapper.setProps({ value: { type: 'pod' } });

      resolveSlow([{ resource: { type: 'stale' } }]);
      await pending;

      expect(wrapper.vm.editableRelatedResources).toStrictEqual([]);
    });
  });
});
