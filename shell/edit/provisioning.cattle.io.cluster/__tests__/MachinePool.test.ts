import fs from 'fs';
import path from 'path';
import jsyaml from 'js-yaml';
import { shallowMount } from '@vue/test-utils';
import { escapeHtml } from '@shell/utils/string';
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

/**
 * Mount with the autoscaler feature enabled, and with the advanced section rendering its slot, which is where the
 * autoscaler fields live
 */
function mountAutoscalerMachinePool(pool: any) {
  return shallowMount(MachinePool, {
    props: {
      value: {
        id: 'pool-1', pool, config: null
      },
      mode:           'edit',
      provider:       'custom',
      idx:            0,
      machinePools:   [],
      poolId:         'pool-1',
      poolCreateMode: false,
    },
    global: {
      mocks: {
        $store: {
          getters: {
            'i18n/t':                                   (key: string) => key,
            'i18n/exists':                              () => false,
            'type-map/hasCustomMachineConfigComponent': () => false,
            'type-map/importMachineConfig':             () => null,
            'features/get':                             () => true,
          },
          dispatch: jest.fn(),
        },
      },
      stubs: {
        LabeledInput:    true,
        Checkbox:        true,
        Taints:          true,
        KeyValue:        true,
        AdvancedSection: { template: '<div><slot /></div>' },
        Banner:          true,
        UnitInput:       true,
      },
    },
  });
}

/**
 * The autoscaler bounds are computed proxies, and the inputs that write them emit null when they are cleared
 */
function setBound(wrapper: any, bound: string, value: number | null) {
  wrapper.vm[bound] = value;
}

function extraRule(wrapper: any, name: string) {
  return wrapper.vm.fvExtraRules[name];
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

  describe('autoscaler', () => {
    const autoscalerPool = (extra: any = {}) => ({
      name:             'pool1',
      etcdRole:         false,
      controlPlaneRole: false,
      workerRole:       true,
      quantity:         1,
      ...extra
    });

    it('should not be enabled for a pool with no autoscaling range', () => {
      const wrapper = mountAutoscalerMachinePool(autoscalerPool());

      expect(wrapper.vm.isAutoscalerEnabled).toBe(false);
      expect(wrapper.vm.isAutoscalerPaused).toBe(false);
    });

    it('should be enabled for a pool with an autoscaling range', () => {
      const wrapper = mountAutoscalerMachinePool(autoscalerPool({ autoscalingMinSize: 1, autoscalingMaxSize: 4 }));

      expect(wrapper.vm.isAutoscalerEnabled).toBe(true);
      expect(wrapper.vm.isAutoscalerPaused).toBe(false);
      expect(wrapper.vm.autoscalerRange).toStrictEqual({ min: 1, max: 4 });
    });

    it('should be enabled, and paused, for a pool that has been paused', () => {
      const wrapper = mountAutoscalerMachinePool(autoscalerPool({ machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '4' } }));

      expect(wrapper.vm.isAutoscalerEnabled).toBe(true);
      expect(wrapper.vm.isAutoscalerPaused).toBe(true);
      expect(wrapper.vm.autoscalerRange).toStrictEqual({ min: 1, max: 4 });
    });

    it('should show the stashed range, editable, with a banner, when the pool is paused', () => {
      const wrapper = mountAutoscalerMachinePool(autoscalerPool({ machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '4' } }));

      const min = wrapper.find('[data-testid="machine-pool-autoscaler-min-input"]');
      const max = wrapper.find('[data-testid="machine-pool-autoscaler-max-input"]');

      expect(min.attributes().value).toBe('1');
      expect(min.attributes().disabled).toBe('false');
      expect(max.attributes().value).toBe('4');
      expect(max.attributes().disabled).toBe('false');
      expect(wrapper.find('[data-testid="machine-pool-autoscaler-paused-banner"]').exists()).toBe(true);
    });

    it('should not show the paused banner when the pool is not paused', () => {
      const wrapper = mountAutoscalerMachinePool(autoscalerPool({ autoscalingMinSize: 1, autoscalingMaxSize: 4 }));

      expect(wrapper.find('[data-testid="machine-pool-autoscaler-min-input"]').attributes().value).toBe('1');
      expect(wrapper.find('[data-testid="machine-pool-autoscaler-paused-banner"]').exists()).toBe(false);
    });

    it('should write the stashed range when the range is edited while the pool is paused', () => {
      const pool = autoscalerPool({ machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '4' } });
      const wrapper = mountAutoscalerMachinePool(pool);

      wrapper.vm.autoscalerMinSize = 3;
      wrapper.vm.autoscalerMaxSize = 9;

      expect(pool.machineDeploymentAnnotations).toStrictEqual({ [PAUSED_MIN]: '3', [PAUSED_MAX]: '9' });
      expect(pool.autoscalingMinSize).toBeUndefined();
      expect(wrapper.vm.isAutoscalerPaused).toBe(true);
    });

    it('should write the live range when the range is edited while the pool is running', () => {
      const pool = autoscalerPool({ autoscalingMinSize: 1, autoscalingMaxSize: 4 });
      const wrapper = mountAutoscalerMachinePool(pool);

      wrapper.vm.autoscalerMinSize = 3;

      expect(pool.autoscalingMinSize).toBe(3);
      expect(pool.machineDeploymentAnnotations).toBeUndefined();
    });

    it('should check max against min while the pool is paused', () => {
      const wrapper = mountAutoscalerMachinePool(autoscalerPool({ machineDeploymentAnnotations: { [PAUSED_MIN]: '9', [PAUSED_MAX]: '2' } }));

      expect(wrapper.vm.fvExtraRules.isAutoscalerMaxGreaterThanMin()).toStrictEqual('%cluster.machinePool.autoscaler.validation.isAutoscalerMaxGreaterThanMin%');
    });

    it('should let the machine count be set while the pool is paused', () => {
      const wrapper = mountAutoscalerMachinePool(autoscalerPool({ quantity: 7, machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '4' } }));
      const quantity = wrapper.find('[data-testid="machine-pool-quantity-input"]');

      expect(quantity.attributes().value).toBe('7');
      expect(quantity.attributes().disabled).toBe('false');
    });

    it('should hand the machine count to the autoscaler while the pool is running', () => {
      const wrapper = mountAutoscalerMachinePool(autoscalerPool({
        quantity: 7, autoscalingMinSize: 1, autoscalingMaxSize: 4
      }));
      const quantity = wrapper.find('[data-testid="machine-pool-quantity-input"]');

      expect(quantity.attributes().value).toBe('%cluster.machinePool.autoscaler.machineCountValueOverride%');
      expect(quantity.attributes().disabled).toBe('true');
    });

    it('should write the default range, and clear any stash, when the autoscaler is enabled', () => {
      const pool = autoscalerPool({ machineDeploymentAnnotations: { [PAUSED_MIN]: '5', [PAUSED_MAX]: '9' } });
      const wrapper = mountAutoscalerMachinePool(pool);

      wrapper.vm.isAutoscalerEnabled = true;

      expect(pool.autoscalingMinSize).toBe(1);
      expect(pool.autoscalingMaxSize).toBe(2);
      expect(pool.machineDeploymentAnnotations).toBeUndefined();
      expect(wrapper.vm.isAutoscalerPaused).toBe(false);
    });

    it('should hold the section open while both bounds are empty', () => {
      const pool = autoscalerPool({ autoscalingMinSize: 5, autoscalingMaxSize: 9 });
      const wrapper = mountAutoscalerMachinePool(pool);

      setBound(wrapper, 'autoscalerMinSize', null);
      setBound(wrapper, 'autoscalerMaxSize', null);

      expect(wrapper.vm.isAutoscalerEnabled).toBe(true);
      expect(wrapper.vm.autoscalerRange).toStrictEqual({ min: undefined, max: undefined });
    });

    it('should keep a paused pool paused while both bounds are empty', () => {
      const pool = autoscalerPool({ machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '4' } });
      const wrapper = mountAutoscalerMachinePool(pool);

      setBound(wrapper, 'autoscalerMinSize', null);
      setBound(wrapper, 'autoscalerMaxSize', null);
      setBound(wrapper, 'autoscalerMinSize', 2);

      expect(wrapper.vm.isAutoscalerPaused).toBe(true);
      expect(pool.machineDeploymentAnnotations).toStrictEqual({ [PAUSED_MIN]: '2' });
      expect(pool.autoscalingMinSize).toBeUndefined();
    });

    it.each([
      ['min', 'isAutoscalerMinSizeValid'],
      ['max', 'isAutoscalerMaxSizeValid'],
    ])('should require the %s while the autoscaler section is shown', (_label, rule) => {
      const wrapper = mountAutoscalerMachinePool(autoscalerPool({ autoscalingMinSize: 5, autoscalingMaxSize: 9 }));

      expect(extraRule(wrapper, rule)()).toBeUndefined();

      setBound(wrapper, 'autoscalerMinSize', null);
      setBound(wrapper, 'autoscalerMaxSize', null);

      expect(extraRule(wrapper, rule)()).toStrictEqual('%validation.required%');
    });

    it.each([
      ['a running pool', {}],
      ['a paused pool', { paused: true }],
    ])('should reject a negative bound on %s', (_label, { paused }: any) => {
      const pool = paused ? autoscalerPool({ machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '4' } }) : autoscalerPool({ autoscalingMinSize: 1, autoscalingMaxSize: 4 });
      const wrapper = mountAutoscalerMachinePool(pool);

      setBound(wrapper, 'autoscalerMinSize', -5);

      expect(wrapper.vm.fvExtraRules.isAutoscalerMinSizeValid()).toStrictEqual('%validation.number.isPositive%');
    });

    it('should not check the bounds when the autoscaler section is hidden', () => {
      const wrapper = mountAutoscalerMachinePool(autoscalerPool());

      expect(wrapper.vm.fvExtraRules.isAutoscalerMinSizeValid()).toBeUndefined();
      expect(wrapper.vm.fvExtraRules.isAutoscalerMaxSizeValid()).toBeUndefined();
    });

    it('should show the discard hint next to the checkbox while the autoscaler is on', () => {
      const on = mountAutoscalerMachinePool(autoscalerPool({ autoscalingMinSize: 1, autoscalingMaxSize: 4 }));
      const off = mountAutoscalerMachinePool(autoscalerPool());

      expect(on.find('[data-testid="machine-pool-autoscaler-disable-hint"]').exists()).toBe(true);
      expect(off.find('[data-testid="machine-pool-autoscaler-disable-hint"]').exists()).toBe(false);
    });

    it('should warn next to the role checkboxes, where taking a role turns the autoscaler off', () => {
      const on = mountAutoscalerMachinePool(autoscalerPool({ autoscalingMinSize: 1, autoscalingMaxSize: 4 }));
      const off = mountAutoscalerMachinePool(autoscalerPool());

      expect(on.find('[data-testid="machine-pool-autoscaler-role-hint"]').exists()).toBe(true);
      expect(off.find('[data-testid="machine-pool-autoscaler-role-hint"]').exists()).toBe(false);
    });

    it.each([
      ['etcd', 'etcdRole'],
      ['control plane', 'controlPlaneRole'],
    ])('should drop both hints for a pool that already has the %s role, where neither action is possible', (_label, role) => {
      const wrapper = mountAutoscalerMachinePool(autoscalerPool({
        [role]: true, autoscalingMinSize: 1, autoscalingMaxSize: 4
      }));

      expect(wrapper.find('[data-testid="machine-pool-autoscaler-role-hint"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="machine-pool-autoscaler-disable-hint"]').exists()).toBe(false);
    });

    it.each([
      ['etcd', 'etcdRole'],
      ['control plane', 'controlPlaneRole'],
    ])('should turn the autoscaler off, and discard the stash, when the pool takes the %s role', async(_label, role) => {
      const pool = autoscalerPool({ machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '4' } });
      const wrapper = mountAutoscalerMachinePool(pool);

      // Through the component's own reference to the pool, so the watcher sees it
      (wrapper.vm.value.pool as any)[role] = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isAutoscalerEnabled).toBe(false);
      expect(wrapper.vm.isAutoscalerPaused).toBe(false);
      expect(pool.machineDeploymentAnnotations).toBeUndefined();
    });

    it('should leave no stashed range behind when the autoscaler is disabled for a paused pool', () => {
      const pool = autoscalerPool({ machineDeploymentAnnotations: { [PAUSED_MIN]: '1', [PAUSED_MAX]: '4' } });
      const wrapper = mountAutoscalerMachinePool(pool);

      wrapper.vm.isAutoscalerEnabled = false;

      expect(pool.machineDeploymentAnnotations).toBeUndefined();
      expect(wrapper.vm.isAutoscalerEnabled).toBe(false);
    });
  });
});

describe('translations: cluster.machinePool.autoscaler', () => {
  const translations = jsyaml.load(fs.readFileSync(path.resolve(__dirname, '../../../assets/translations/en-us.yaml'), 'utf8')) as any;
  const autoscaler = translations.cluster.machinePool.autoscaler;

  /**
   * `t` escapes its result unless it is asked for the raw string, and a mustache escapes again, so an apostrophe or a
   * quote in one of these lands on screen as `&amp;#39;`. Every key here is rendered through a mustache or an attribute
   * binding, so none of them may contain a character that escapes
   */
  const RENDERED_UNESCAPED = [
    'min',
    'max',
    'baseUnit',
    'disableHint',
    'roleHint',
    'pauseAriaLabel',
    'resumeAriaLabel',
    'status.running',
    'status.paused',
  ];

  it.each(RENDERED_UNESCAPED)('should render %s without an escaped character', (key) => {
    const value = key.split('.').reduce((acc, part) => acc?.[part], autoscaler);

    expect(typeof value).toBe('string');
    expect(escapeHtml(value)).toStrictEqual(value);
  });
});
