import { shallowMount } from '@vue/test-utils';
import MachinePool from '@shell/edit/provisioning.cattle.io.cluster/tabs/MachinePool.vue';

const TRANSLATION_KEY = '%cluster.machinePool.name.unique%';

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
});
