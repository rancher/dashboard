import { shallowMount } from '@vue/test-utils';
import ResourceYaml from '@shell/components/ResourceYaml/index.vue';
import { _VIEW } from '@shell/config/query-params';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';

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
        $router: { applyQuery: jest.fn(), replace: jest.fn() },
        $route:  { query: {} },
        $store:  {
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
      const related = { type: 'service' };
      const wrapper = mountComponent({
        type:                          'pod',
        fetchEditableRelatedResources: () => Promise.resolve([related])
      });

      await wrapper.vm.loadEditableRelatedResources();

      expect(wrapper.vm.editableRelatedResources).toStrictEqual([related]);
      expect(wrapper.vm.needsMultiEdit).toBe(true);
    });

    it('should allow extensions to resolve their additions asynchronously', async() => {
      const fromModel = { type: 'service' };
      const fromExtension = { type: 'secret' };

      mockedEnhancements.mockReturnValue([{ editableRelatedResources: (_resource: any, res: any[]) => Promise.resolve([...res, fromExtension]) }]);

      const wrapper = mountComponent({
        type:                          'pod',
        fetchEditableRelatedResources: () => Promise.resolve([fromModel])
      });

      await wrapper.vm.loadEditableRelatedResources();

      expect(wrapper.vm.editableRelatedResources).toStrictEqual([fromModel, fromExtension]);
    });

    it('should apply extensions in order, each seeing the previous result', async() => {
      mockedEnhancements.mockReturnValue([
        { editableRelatedResources: (_resource: any, res: any[]) => [...res, 'a'] },
        { editableRelatedResources: async(_resource: any, res: any[]) => [...res, 'b'] },
      ]);

      const wrapper = mountComponent({ type: 'pod' });

      await wrapper.vm.loadEditableRelatedResources();

      expect(wrapper.vm.editableRelatedResources).toStrictEqual(['a', 'b']);
    });

    it.each([
      ['a non-function', { editableRelatedResources: 'nope' }],
      ['a non-array result', { editableRelatedResources: () => 'nope' }],
      ['an async non-array result', { editableRelatedResources: () => Promise.resolve(undefined) }],
    ])('should ignore an extension providing %s', async(_label, extension) => {
      const fromModel = { type: 'service' };

      mockedEnhancements.mockReturnValue([extension]);

      const wrapper = mountComponent({
        type:                          'pod',
        fetchEditableRelatedResources: () => Promise.resolve([fromModel])
      });

      await wrapper.vm.loadEditableRelatedResources();

      expect(wrapper.vm.editableRelatedResources).toStrictEqual([fromModel]);
    });

    it('should not apply extensions when the older dashboard has no extension config support', async() => {
      mockedEnhancements.mockReturnValue([{ editableRelatedResources: (_resource: any, res: any[]) => [...res, 'a'] }]);

      const wrapper = mountComponent({ type: 'pod' }, { withExtensionSupport: false });

      await wrapper.vm.loadEditableRelatedResources();

      expect(wrapper.vm.editableRelatedResources).toStrictEqual([]);
      expect(mockedEnhancements).toHaveBeenCalledTimes(0);
    });

    it('should not let a slow load for a previous resource overwrite the current resource result', async() => {
      let resolveSlow: (res: any[]) => void = () => {};
      const slow = {
        type:                          'pod',
        fetchEditableRelatedResources: () => new Promise<any[]>((resolve) => {
          resolveSlow = resolve;
        })
      };
      const wrapper = mountComponent(slow);

      const pending = wrapper.vm.loadEditableRelatedResources();

      await wrapper.setProps({ value: { type: 'pod' } });

      resolveSlow(['stale']);
      await pending;

      expect(wrapper.vm.editableRelatedResources).toStrictEqual([]);
    });
  });
});
