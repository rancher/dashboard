import { shallowMount } from '@vue/test-utils';
import MachinePool from '@shell/edit/provisioning.cattle.io.cluster/tabs/MachinePool.vue';
import { CAPI as CAPI_ANNOTATIONS } from '@shell/config/labels-annotations';

const TRANSLATION_KEY = '%cluster.machinePool.name.unique%';
const PAUSED_MIN = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_PAUSED_MIN_SIZE;
const PAUSED_MAX = CAPI_ANNOTATIONS.AUTOSCALER_MACHINE_POOL_PAUSED_MAX_SIZE;

function createPool(name: string, { remove = false } = {}) {
  return {
    id:     `pool-${ name }`,
    remove,
    create: false,
    update: true,
    pool:   {
      name,
      etcdRole:         false,
      controlPlaneRole: false,
      workerRole:       true,
      quantity:         1,
    },
    config: null,
  };
}

function mountMachinePool(currentPool: ReturnType<typeof createPool>, allPools: ReturnType<typeof createPool>[]) {
  return shallowMount(MachinePool, {
    props: {
      value:          currentPool,
      mode:           'create',
      provider:       'custom',
      idx:            0,
      machinePools:   allPools,
      poolId:         currentPool.id,
      poolCreateMode: true,
    },
    global: {
      mocks: {
        $store: {
          getters: {
            'i18n/t':                                   (key: string) => key,
            'i18n/exists':                              () => false,
            'type-map/hasCustomMachineConfigComponent': () => false,
            'type-map/importMachineConfig':             () => null,
            'features/get':                             () => false,
          },
          dispatch: jest.fn(),
        },
      },
      stubs: {
        LabeledInput:    true,
        Checkbox:        true,
        Taints:          true,
        KeyValue:        true,
        AdvancedSection: true,
        Banner:          true,
        UnitInput:       true,
      },
    },
  });
}

describe('component: MachinePool', () => {
  describe('uniquePoolName validation', () => {
    it('should return undefined when the name is empty', () => {
      const pool = createPool('');
      const wrapper = mountMachinePool(pool, [pool]);

      expect(wrapper.vm.fvExtraRules.uniquePoolName('')).toBeUndefined();
    });

    it('should return undefined when the pool name is unique', () => {
      const pool1 = createPool('pool1');
      const pool2 = createPool('pool2');
      const wrapper = mountMachinePool(pool1, [pool1, pool2]);

      expect(wrapper.vm.fvExtraRules.uniquePoolName('pool1')).toBeUndefined();
    });

    it('should return an error message when the pool name is duplicated', () => {
      const pool1 = createPool('same-name');
      const pool2 = createPool('same-name');
      const wrapper = mountMachinePool(pool1, [pool1, pool2]);

      expect(wrapper.vm.fvExtraRules.uniquePoolName('same-name')).toStrictEqual(TRANSLATION_KEY);
    });

    it('should ignore pools marked for removal', () => {
      const pool1 = createPool('same-name');
      const pool2 = createPool('same-name', { remove: true });
      const wrapper = mountMachinePool(pool1, [pool1, pool2]);

      expect(wrapper.vm.fvExtraRules.uniquePoolName('same-name')).toBeUndefined();
    });

    it.each([
      ['Pool1', 'pool1'],
      ['POOL', 'pool'],
    ])('should flag names that differ only by case as duplicates (%s vs %s)', (nameA, nameB) => {
      const pool1 = createPool(nameA);
      const pool2 = createPool(nameB);
      const wrapper = mountMachinePool(pool1, [pool1, pool2]);

      expect(wrapper.vm.fvExtraRules.uniquePoolName(nameA)).toStrictEqual(TRANSLATION_KEY);
    });
  });

  describe('isAutoscalerEnabled', () => {
    const mountWithPool = (pool: any) => {
      const value = { ...createPool('pool1'), pool };

      return mountMachinePool(value, [value]);
    };

    it.each([
      ['both bounds are set', { autoscalingMinSize: 1, autoscalingMaxSize: 4 }, true],
      ['only the min bound is set', { autoscalingMinSize: 1 }, true],
      ['only the max bound is set', { autoscalingMaxSize: 4 }, true],
      ['a bound has been cleared while editing the range', { autoscalingMinSize: 1, autoscalingMaxSize: null }, true],
      ['the pool is paused', { machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '4' } }, false],
    ])('should reflect that %s', (_label, pool, expected) => {
      expect(mountWithPool(pool).vm.isAutoscalerEnabled).toStrictEqual(expected);
    });

    it('should seed a default range when enabled on a pool that was never autoscaling', () => {
      const pool: any = { quantity: 2 };
      const wrapper = mountWithPool(pool);

      wrapper.vm.isAutoscalerEnabled = true;

      expect(pool).toStrictEqual({
        quantity: 2, autoscalingMinSize: 1, autoscalingMaxSize: 2
      });
    });

    it('should resume the stashed range when enabled on a paused pool', () => {
      const pool: any = { quantity: 3, machineDeploymentAnnotations: { [PAUSED_MIN]: '2', [PAUSED_MAX]: '5' } };
      const wrapper = mountWithPool(pool);

      wrapper.vm.isAutoscalerEnabled = true;

      expect(pool).toStrictEqual({
        quantity: 3, autoscalingMinSize: 2, autoscalingMaxSize: 5
      });
    });

    it('should drop the stash when disabled on a paused pool', () => {
      const pool: any = { quantity: 3, machineDeploymentAnnotations: { [PAUSED_MIN]: '2', [PAUSED_MAX]: '5' } };
      const wrapper = mountWithPool(pool);

      wrapper.vm.isAutoscalerEnabled = false;

      expect(pool).toStrictEqual({ quantity: 3 });
    });

    it('should drop the stash when disabled on an autoscaling pool that still carries one', () => {
      const pool: any = {
        quantity:                     3,
        autoscalingMinSize:           1,
        autoscalingMaxSize:           4,
        machineDeploymentAnnotations: {
          foo: 'bar', [PAUSED_MIN]: '2', [PAUSED_MAX]: '5'
        },
      };
      const wrapper = mountWithPool(pool);

      wrapper.vm.isAutoscalerEnabled = false;

      expect(pool).toStrictEqual({ quantity: 3, machineDeploymentAnnotations: { foo: 'bar' } });
    });
  });
});
