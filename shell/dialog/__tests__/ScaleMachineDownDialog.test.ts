import { shallowMount } from '@vue/test-utils';
import ScaleMachineDownDialog from '@shell/dialog/ScaleMachineDownDialog.vue';
import { CAPI as CAPI_LABELS } from '@shell/config/labels-annotations';
import { CAPI } from '@shell/config/types';

const defaultStubs = { GenericPrompt: true };

const defaultGetters = { 'type-map/labelFor': jest.fn(() => 'Node') };

const defaultMocks = {
  $store: {
    dispatch: jest.fn(),
    getters:  defaultGetters
  },
  t: jest.fn((key) => key),
};

const defaultCluster = {
  isRke2:   true,
  machines: [],
  save:     jest.fn()
};

const createResource = (overrides: Record<string, any> = {}) => {
  const resource = {
    id:            'default/machine-1',
    cluster:       defaultCluster,
    isWorker:      true,
    poolName:      'pool1',
    pool:          { scalePool: jest.fn() },
    save:          jest.fn(),
    setAnnotation: jest.fn((key, value) => {
      resource.metadata.annotations[key] = value;
    }),
    nameDisplay: 'machine-1',
    namespace:   'default',
    schema:      'machine',
    metadata:    { annotations: {} as Record<string, string> },
    ...overrides
  };

  return resource;
};

describe('component: ScaleMachineDownDialog', () => {
  const createWrapper = (propsData: { resources?: any[] } = {}, mocks = {}) => {
    const resources = propsData.resources || [createResource()];

    return shallowMount(ScaleMachineDownDialog, {
      propsData: {
        resources,
        ...propsData
      },
      global: {
        mocks: {
          ...defaultMocks,
          ...mocks
        },
        stubs:      defaultStubs,
        directives: { 'clean-html': true }
      }
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    const wrapper = createWrapper();

    expect(wrapper.exists()).toBe(true);
  });

  describe('data initialization', () => {
    it('should identify safe machines to delete (Worker)', () => {
      const wrapper = createWrapper();

      expect(wrapper.vm.safeMachinesToDelete).toHaveLength(1);
      expect(wrapper.vm.ignored).toHaveLength(0);
    });

    it('should ignore deletion if it is the last control plane', () => {
      const cluster = {
        isRke2:   true,
        machines: [{ isControlPlane: true }]
      };
      const resource = createResource({
        cluster,
        isControlPlane: true,
        isWorker:       false
      });

      const wrapper = createWrapper({ resources: [resource] });

      expect(wrapper.vm.safeMachinesToDelete).toHaveLength(0);
      expect(wrapper.vm.ignored).toHaveLength(1);
    });

    it('should allow deletion if multiple control planes exist', () => {
      const cluster = {
        isRke2:   true,
        machines: [{ isControlPlane: true }, { isControlPlane: true }]
      };
      const resource = createResource({
        cluster,
        isControlPlane: true,
        isWorker:       false
      });

      const wrapper = createWrapper({ resources: [resource] });

      expect(wrapper.vm.safeMachinesToDelete).toHaveLength(1);
      expect(wrapper.vm.ignored).toHaveLength(0);
    });
  });

  describe('fetch', () => {
    it('should fetch machine sets and update loading state', async() => {
      const wrapper = createWrapper();

      // Mock dispatch to return empty array for findAll
      (wrapper.vm as any).$store.dispatch.mockResolvedValue([]);

      await ScaleMachineDownDialog.fetch.call(wrapper.vm);

      expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith('management/findAll', expect.anything());
      expect(wrapper.vm.loading).toBe(false);
    });
  });

  describe('remove', () => {
    it('should perform RKE2 removal steps', async() => {
      const resource = createResource();
      const wrapper = createWrapper({ resources: [resource] });

      (wrapper.vm as any).$store.dispatch.mockImplementation((action: string) => {
        if (action === 'management/find') {
          return Promise.resolve(resource);
        }

        return Promise.resolve([]);
      });

      await (wrapper.vm as any).remove();

      expect(resource.setAnnotation).toHaveBeenCalledWith(CAPI_LABELS.DELETE_MACHINE, 'true');
      expect(resource.save).toHaveBeenCalledWith();
      expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith('management/find', {
        type: CAPI.MACHINE,
        id:   'default/machine-1',
        opt:  {
          force: true,
          watch: false
        }
      });
      expect(resource.pool.scalePool).toHaveBeenCalledWith(-1, false);
      expect(resource.cluster.save).toHaveBeenCalledWith();
    });

    it('should not scale down the pool if the machine is already deleted', async() => {
      const resource = createResource();
      const wrapper = createWrapper({ resources: [resource] });

      (wrapper.vm as any).$store.dispatch.mockImplementation((action: string) => {
        if (action === 'management/find') {
          return Promise.reject(Object.assign(new Error('Not found'), { _status: 404 }));
        }

        return Promise.resolve([]);
      });

      await expect((wrapper.vm as any).remove()).rejects.toThrow('promptScaleMachineDown.machineAlreadyDeleted');
      expect(resource.setAnnotation).toHaveBeenCalledWith(CAPI_LABELS.DELETE_MACHINE, 'true');
      expect(resource.save).toHaveBeenCalledWith();
      expect(resource.pool.scalePool).not.toHaveBeenCalled();
      expect(resource.cluster.save).not.toHaveBeenCalled();
    });

    it('should not scale down the pool if the machine is already deleting', async() => {
      const resource = createResource();
      const liveResource = createResource({
        metadata: {
          annotations:       { [CAPI_LABELS.DELETE_MACHINE]: 'true' },
          deletionTimestamp: '2026-08-27T00:00:00Z'
        }
      });
      const wrapper = createWrapper({ resources: [resource] });

      (wrapper.vm as any).$store.dispatch.mockImplementation((action: string) => {
        if (action === 'management/find') {
          return Promise.resolve(liveResource);
        }

        return Promise.resolve([]);
      });

      await expect((wrapper.vm as any).remove()).rejects.toThrow('promptScaleMachineDown.machineAlreadyDeleted');
      expect(resource.pool.scalePool).not.toHaveBeenCalled();
      expect(resource.cluster.save).not.toHaveBeenCalled();
    });

    it('should not scale down the pool if the delete annotation is missing after refresh', async() => {
      const resource = createResource();
      const liveResource = createResource({ metadata: { annotations: {} } });
      const wrapper = createWrapper({ resources: [resource] });

      (wrapper.vm as any).$store.dispatch.mockImplementation((action: string) => {
        if (action === 'management/find') {
          return Promise.resolve(liveResource);
        }

        return Promise.resolve([]);
      });

      await expect((wrapper.vm as any).remove()).rejects.toThrow('promptScaleMachineDown.machineDeleteAnnotationMissing');
      expect(resource.pool.scalePool).not.toHaveBeenCalled();
      expect(resource.cluster.save).not.toHaveBeenCalled();
    });

    it('should perform non-RKE2 removal steps', async() => {
      const normanAction = jest.fn();
      const resource = {
        cluster:             { isRke2: false },
        provisioningCluster: { nodes: [] },
        norman:              { doAction: normanAction },
        nameDisplay:         'node-1',
        schema:              'node'
      };

      const wrapper = createWrapper({ resources: [resource] });

      await (wrapper.vm as any).remove();

      expect(normanAction).toHaveBeenCalledWith('scaledown');
    });
  });

  describe('showScaling', () => {
    it('should return true if replicas do not match readyReplicas', async() => {
      const wrapper = createWrapper();

      await wrapper.setData({
        workerMachineSets: [{
          data: [{
            spec:   { replicas: 2 },
            status: { readyReplicas: 1 }
          }]
        }]
      });

      expect(wrapper.vm.showScaling).toBe(true);
    });

    it('should return false if replicas match readyReplicas', async() => {
      const wrapper = createWrapper();

      await wrapper.setData({
        workerMachineSets: [{
          data: [{
            spec:   { replicas: 2 },
            status: { readyReplicas: 2 }
          }]
        }]
      });

      expect(wrapper.vm.showScaling).toBe(false);
    });
  });
});
