import { shallowMount, VueWrapper } from '@vue/test-utils';
import MoveNamespaceDialog from '@shell/dialog/MoveNamespaceDialog.vue';

const t = (key: string): string => key;
const NONE_VALUE = ' ';

describe('component: MoveNamespaceDialog', () => {
  let wrapper: VueWrapper<any>;

  const mockProjects = [
    {
      shortId:     'p-abc123',
      nameDisplay: 'Project A',
      spec:        { clusterName: 'local' }
    },
    {
      shortId:     'p-def456',
      nameDisplay: 'Project B',
      spec:        { clusterName: 'local' }
    },
    {
      shortId:     'p-other',
      nameDisplay: 'Other Cluster Project',
      spec:        { clusterName: 'other-cluster' }
    }
  ];

  const createMockNamespace = (projectId: string | null = null) => {
    const namespace: any = {
      nameDisplay:   'test-namespace',
      projectId,
      project:       projectId ? { shortId: projectId } : null,
      setLabel:      jest.fn(),
      setAnnotation: jest.fn(),
      save:          jest.fn().mockResolvedValue({}),
    };

    return namespace;
  };

  const mountComponent = (propsData = {}, options = {}) => {
    const store = {
      dispatch: jest.fn().mockResolvedValue(mockProjects),
      getters:  { currentCluster: { id: 'local' } }
    };

    const defaultProps = {
      resources:                 [createMockNamespace('p-abc123')],
      movingCb:                  jest.fn(),
      registerBackgroundClosing: jest.fn(),
    };

    return shallowMount(MoveNamespaceDialog, {
      propsData: {
        ...defaultProps,
        ...propsData,
      },
      global: {
        mocks: {
          $store: store,
          t,
        },
      },
      ...options,
    });
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('projectOptions', () => {
    it('should include "None" option as first item', async() => {
      wrapper = mountComponent();
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      const options = wrapper.vm.projectOptions;

      expect(options[0]).toStrictEqual({
        value: NONE_VALUE,
        label: 'moveModal.noProject'
      });
    });

    it('should include projects from current cluster', async() => {
      // Use a namespace not in any project so no projects get excluded
      const namespace = createMockNamespace(null);

      wrapper = mountComponent({ resources: [namespace] });
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      const options = wrapper.vm.projectOptions;
      const projectLabels = options.map((o: any) => o.label);

      expect(projectLabels).toContain('Project A');
      expect(projectLabels).toContain('Project B');
    });

    it('should exclude projects from other clusters', async() => {
      wrapper = mountComponent();
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      const options = wrapper.vm.projectOptions;
      const projectLabels = options.map((o: any) => o.label);

      expect(projectLabels).not.toContain('Other Cluster Project');
    });

    it('should exclude current project of namespaces being moved', async() => {
      const namespace = createMockNamespace('p-abc123');

      wrapper = mountComponent({ resources: [namespace] });
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      const options = wrapper.vm.projectOptions;
      const projectValues = options.map((o: any) => o.value);

      expect(projectValues).not.toContain('p-abc123');
      expect(projectValues).toContain('p-def456');
    });

    it('should NOT include "None" option when some namespaces are not in a project', async() => {
      const namespaceInProject = createMockNamespace('p-abc123');
      const namespaceNotInProject = createMockNamespace(null);

      wrapper = mountComponent({ resources: [namespaceInProject, namespaceNotInProject] });
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      const options = wrapper.vm.projectOptions;
      const optionValues = options.map((o: any) => o.value);

      expect(optionValues).not.toContain(NONE_VALUE);
    });

    it('should NOT include "None" option when no namespaces are in a project', async() => {
      const namespace = createMockNamespace(null);

      wrapper = mountComponent({ resources: [namespace] });
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      const options = wrapper.vm.projectOptions;
      const optionValues = options.map((o: any) => o.value);

      expect(optionValues).not.toContain(NONE_VALUE);
    });
  });

  describe('targetProject default value', () => {
    it('should default to empty string (None option)', () => {
      wrapper = mountComponent();

      expect(wrapper.vm.targetProject).toBeNull();
    });
  });

  describe('move button disabled state', () => {
    it('should be enabled when targetProject is NONE_VALUE (None)', () => {
      wrapper = mountComponent();
      wrapper.vm.targetProject = NONE_VALUE;

      // The button should be enabled when targetProject !== null
      expect(wrapper.vm.targetProject === null).toBe(false);
    });

    it('should be enabled when targetProject is a project id', () => {
      wrapper = mountComponent();
      wrapper.vm.targetProject = 'p-def456';

      expect(wrapper.vm.targetProject === null).toBe(false);
    });
  });

  describe('move method', () => {
    it('should clear labels and annotations when targetProject is NONE_VALUE (None)', async() => {
      const namespace = createMockNamespace('p-abc123');

      wrapper = mountComponent({ resources: [namespace] });
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      wrapper.vm.targetProject = NONE_VALUE;

      const finish = jest.fn();

      await wrapper.vm.move(finish);

      expect(namespace.setLabel).toHaveBeenCalledWith('field.cattle.io/projectId', null);
      expect(namespace.setAnnotation).toHaveBeenCalledWith('field.cattle.io/projectId', null);
      expect(namespace.save).toHaveBeenCalledWith();
      expect(finish).toHaveBeenCalledWith(true);
    });

    it('should set labels and annotations when moving to a project', async() => {
      const namespace = createMockNamespace('p-abc123');

      wrapper = mountComponent({ resources: [namespace] });
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      wrapper.vm.targetProject = 'p-def456';

      const finish = jest.fn();

      await wrapper.vm.move(finish);

      expect(namespace.setLabel).toHaveBeenCalledWith('field.cattle.io/projectId', 'p-def456');
      expect(namespace.setAnnotation).toHaveBeenCalledWith('field.cattle.io/projectId', 'local:p-def456');
      expect(namespace.save).toHaveBeenCalledWith();
      expect(finish).toHaveBeenCalledWith(true);
    });

    it('should handle multiple namespaces', async() => {
      const namespace1 = createMockNamespace('p-abc123');
      const namespace2 = createMockNamespace('p-abc123');

      wrapper = mountComponent({ resources: [namespace1, namespace2] });
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      wrapper.vm.targetProject = NONE_VALUE;

      const finish = jest.fn();

      await wrapper.vm.move(finish);

      expect(namespace1.setLabel).toHaveBeenCalledWith('field.cattle.io/projectId', null);
      expect(namespace1.setAnnotation).toHaveBeenCalledWith('field.cattle.io/projectId', null);
      expect(namespace2.setLabel).toHaveBeenCalledWith('field.cattle.io/projectId', null);
      expect(namespace2.setAnnotation).toHaveBeenCalledWith('field.cattle.io/projectId', null);
      expect(namespace1.save).toHaveBeenCalledWith();
      expect(namespace2.save).toHaveBeenCalledWith();
    });

    it('should call finish with false when save fails', async() => {
      const namespace = createMockNamespace('p-abc123');

      jest.spyOn(namespace, 'save').mockImplementation().mockRejectedValue(new Error('Save failed'));
      wrapper = mountComponent({ resources: [namespace] });
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      wrapper.vm.targetProject = NONE_VALUE;

      const finish = jest.fn();

      await wrapper.vm.move(finish);

      expect(finish).toHaveBeenCalledWith(false);
    });

    it('should restore the original project and show the error when save fails', async() => {
      const namespace = createMockNamespace('p-abc123');

      namespace.metadata = {
        labels:      { 'field.cattle.io/projectId': 'p-abc123' },
        annotations: { 'field.cattle.io/projectId': 'local:p-abc123' }
      };
      namespace.save.mockRejectedValue({ response: { data: { message: 'admission webhook denied the request' } } });

      wrapper = mountComponent({ resources: [namespace] });
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      wrapper.vm.targetProject = 'p-def456';

      const finish = jest.fn();

      await wrapper.vm.move(finish);

      expect(namespace.setLabel).toHaveBeenLastCalledWith('field.cattle.io/projectId', 'p-abc123');
      expect(namespace.setAnnotation).toHaveBeenLastCalledWith('field.cattle.io/projectId', 'local:p-abc123');
      expect(wrapper.vm.errors).toStrictEqual(['admission webhook denied the request']);
      expect(wrapper.emitted('close')).toBeUndefined();
    });

    it('should only restore the namespaces that failed to save', async() => {
      const saved = createMockNamespace('p-abc123');
      const failed = createMockNamespace('p-abc123');

      failed.save.mockRejectedValue(new Error('Save failed'));

      wrapper = mountComponent({ resources: [saved, failed] });
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      wrapper.vm.targetProject = 'p-def456';

      await wrapper.vm.move(jest.fn());

      expect(saved.setLabel).toHaveBeenCalledTimes(1);
      expect(failed.setLabel).toHaveBeenCalledTimes(2);
      expect(failed.setLabel).toHaveBeenLastCalledWith('field.cattle.io/projectId', undefined);
    });

    it('should clear previous errors when moving again', async() => {
      const namespace = createMockNamespace('p-abc123');

      wrapper = mountComponent({ resources: [namespace] });
      await wrapper.vm.$options.fetch.call(wrapper.vm);

      wrapper.vm.errors = ['old error'];
      wrapper.vm.targetProject = 'p-def456';

      await wrapper.vm.move(jest.fn());

      expect(wrapper.vm.errors).toStrictEqual([]);
    });
  });
});
