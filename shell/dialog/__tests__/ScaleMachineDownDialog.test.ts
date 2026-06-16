import { shallowMount } from '@vue/test-utils';
import ScaleMachineDownDialog from '@shell/dialog/ScaleMachineDownDialog.vue';
import { CAPI as CAPI_LABELS } from '@shell/config/labels-annotations';

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

const defaultResource = {
  cluster:       defaultCluster,
  isWorker:      true,
  poolName:      'pool1',
  pool:          { scalePool: jest.fn() },
  save:          jest.fn(),
  setAnnotation: jest.fn(),
  nameDisplay:   'machine-1',
  namespace:     'default',
  schema:        'machine'
};

describe('component: ScaleMachineDownDialog', () => {
  const createWrapper = (propsData = {}, mocks = {}) => {
    return shallowMount(ScaleMachineDownDialog, {
      propsData: {
        resources: [defaultResource],
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
      const resource = {
        ...defaultResource,
        cluster,
        isControlPlane: true,
        isWorker:       false
      };

      const wrapper = createWrapper({ resources: [resource] });

      expect(wrapper.vm.safeMachinesToDelete).toHaveLength(0);
      expect(wrapper.vm.ignored).toHaveLength(1);
    });

    it('should allow deletion if multiple control planes exist', () => {
      const cluster = {
        isRke2:   true,
        machines: [{ isControlPlane: true }, { isControlPlane: true }]
      };
      const resource = {
        ...defaultResource,
        cluster,
        isControlPlane: true,
        isWorker:       false
      };

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
      const wrapper = createWrapper();
      const resource = (wrapper.vm as any).resources[0];

      await (wrapper.vm as any).remove();

      expect(resource.setAnnotation).toHaveBeenCalledWith(CAPI_LABELS.DELETE_MACHINE, 'true');
      expect(resource.save).toHaveBeenCalledWith();
      expect(resource.pool.scalePool).toHaveBeenCalledWith(-1, false);
      expect(resource.cluster.save).toHaveBeenCalledWith();
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
