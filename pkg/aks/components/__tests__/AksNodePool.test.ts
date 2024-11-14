
import { mount, shallowMount } from '@vue/test-utils';
import AksNodePool from '@pkg/aks/components/AksNodePool.vue';
import { randomStr } from '@shell/utils/string';
import { _CREATE, _EDIT } from '@shell/config/query-params';

const mockedValidationMixin = {
  computed: {
    fvFormIsValid:                jest.fn(),
    type:                         jest.fn(),
    fvUnreportedValidationErrors: jest.fn(),
  },
  methods: { fvGetAndReportPathRules: jest.fn() }
};

const mockedStore = () => {
  return {
    getters: {
      'i18n/t': (text: string, v: {[key:string]: string}) => {
        return `${ text }${ Object.values(v || {}) }`;
      },
      t:                         (text: string) => text,
      currentStore:              () => 'current_store',
      'current_store/schemaFor': jest.fn(),
      'current_store/all':       jest.fn(),
      'management/schemaFor':    jest.fn(),
      'rancher/create':          () => {}
    },
    dispatch: jest.fn()
  };
};

const mockedRoute = { query: {} };

const requiredSetup = () => {
  return {
    global: {
      mixins: [mockedValidationMixin],
      mocks:  {
        $store:      mockedStore(),
        $route:      mockedRoute,
        $fetchState: {},
      }
    }
  };
};

const defaultPool = {
  orchestratorVersion: '', _validation: {}, _isNewOrUnprovisioned: true, _id: randomStr()
};

describe('aks node pool component', () => {
  it.each([
    [_CREATE],
    [_EDIT],
  ])('on cluster create, or if this is a new node pool during edit, should show a disabled input for orchestratorVersion', (mode: string) => {
    const clusterVersion = '1.23.4';
    const wrapper = shallowMount(AksNodePool, {
      propsData: {
        pool: { ...defaultPool, orchestratorVersion: clusterVersion }, mode, clusterVersion
      },
      ...requiredSetup()
    });

    const versionDisplay = wrapper.getComponent('[data-testid="aks-pool-version-display"]');

    expect(versionDisplay.props().value).toBe(clusterVersion);
    expect(versionDisplay.props().disabled).toBe(true);
  });

  it('on edit, if the cluster version matches the node pool orchestrator version, show the same disabled input as on create', () => {
    const clusterVersion = '1.23.4';
    const wrapper = shallowMount(AksNodePool, {
      propsData: {
        pool: {
          ...defaultPool, orchestratorVersion: clusterVersion, _isNewOrUnprovisioned: false
        },
        clusterVersion
      },
      ...requiredSetup()

    });
    const versionDisplay = wrapper.getComponent('[data-testid="aks-pool-version-display"]');

    expect(versionDisplay.props().value).toBe(clusterVersion);
    expect(versionDisplay.props().disabled).toBe(true);
  });

  it('on edit, if the cluster is being upgraded, should show a banner informing the user that they can upgrade the node pool after the cluster upgrade succeeds', () => {
    const clusterVersion = '1.23.4';
    const originalClusterVersion = '1.20.0';
    const wrapper = shallowMount(AksNodePool, {
      propsData: {
        pool: {
          ...defaultPool, orchestratorVersion: originalClusterVersion, _isNewOrUnprovisioned: false
        },
        clusterVersion,
        originalClusterVersion,
        mode: _EDIT
      },
      ...requiredSetup()

    });
    const versionDisplay = wrapper.getComponent('[data-testid="aks-pool-version-display"]');
    const upgradeBanner = wrapper.getComponent('[data-testid="aks-pool-upgrade-banner"]');

    expect(versionDisplay.props().value).toBe(originalClusterVersion);
    expect(versionDisplay.props().disabled).toBe(true);

    expect(upgradeBanner.isVisible()).toBe(true);
  });

  it('on edit, if the cluster has been upgraded already, show a checkbox allowing the user to upgrade the node pool k8s version', () => {
    const clusterVersion = '1.23.4';
    const originalOrchestratorVersion = '1.20.0';
    const wrapper = shallowMount(AksNodePool, {
      propsData: {
        pool: {
          ...defaultPool, orchestratorVersion: originalOrchestratorVersion, _isNewOrUnprovisioned: false
        },
        clusterVersion,
        originalClusterVersion: clusterVersion,
        mode:                   _EDIT
      },
      ...requiredSetup()

    });

    const versionDisplay = wrapper.find('[data-testid="aks-pool-version-display"]');
    const upgradeBanner = wrapper.find('[data-testid="aks-pool-upgrade-banner"]');
    const upgradeCheckbox = wrapper.find('[data-testid="aks-pool-upgrade-checkbox"]');

    expect(versionDisplay.exists()).toBe(false);
    expect(upgradeBanner.exists()).toBe(false);
    expect(upgradeCheckbox.isVisible()).toBe(true);
  });

  it('when the k8s version checkbox is checked, the orchestratorVersion should be set to the clusterVersion; when it is unchecked, the orchestratorVersion should be reverted', () => {
    const clusterVersion = '1.23.4';
    const originalOrchestratorVersion = '1.20.0';
    const wrapper = shallowMount(AksNodePool, {
      propsData: {
        pool: {
          ...defaultPool, orchestratorVersion: originalOrchestratorVersion, _isNewOrUnprovisioned: false
        },
        clusterVersion,
        originalClusterVersion: clusterVersion,
        mode:                   _EDIT
      },
      ...requiredSetup()

    });

    expect(wrapper.props().pool.orchestratorVersion).toBe(originalOrchestratorVersion);
    wrapper.vm.willUpgrade = true;
    expect(wrapper.props().pool.orchestratorVersion).toBe(clusterVersion);
    wrapper.vm.willUpgrade = false;
    expect(wrapper.props().pool.orchestratorVersion).toBe(originalOrchestratorVersion);
  });

  it('the k8s version checkbox label should include the original node pool version and the new node pool version', () => {
    const clusterVersion = '1.23.4';
    const originalOrchestratorVersion = '1.20.0';
    const wrapper = mount(AksNodePool, {
      propsData: {
        pool: {
          ...defaultPool, orchestratorVersion: originalOrchestratorVersion, _isNewOrUnprovisioned: false
        },
        clusterVersion,
        originalClusterVersion: clusterVersion,
        mode:                   _EDIT
      },
      ...requiredSetup()

    });

    const upgradeCheckbox = wrapper.getComponent('[data-testid="aks-pool-upgrade-checkbox"]');

    expect(upgradeCheckbox.props().label).toContain(clusterVersion);
  });

  it('should remove taints from the pool spec when the remove button is pressed', async() => {
    const initialTaints = ['key0=val0:PreferNoSchedule', 'key1=val1:PreferNoSchedule'];
    const wrapper = mount(AksNodePool, {
      propsData: {
        pool: { ...defaultPool, nodeTaints: [...initialTaints] },

        mode: _EDIT
      },
      ...requiredSetup()

    });

    const firstTaintRow = wrapper.getComponent('[data-testid="aks-pool-taint-0"]');
    const secondTaintRow = wrapper.getComponent('[data-testid="aks-pool-taint-1"]');

    expect(secondTaintRow.exists()).toBe(true);
    firstTaintRow.vm.$emit('remove', 0);
    await wrapper.vm.$nextTick();

    // the first row should now be showing what had been the second taint, and second row should be gone
    expect(firstTaintRow.props().taint).toBe(initialTaints[1]);
    expect(secondTaintRow.exists()).toBe(false);

    // above verifies that the form is showing the right thing: also verify that the node pool spec has been updated to remove the taint
    expect(wrapper.props().pool.nodeTaints).toStrictEqual([initialTaints[1]]);
  });

  it('should add nodeLabels to the pool spec when the labels keyvalue is edited', async() => {
    const labels = { abc: 'def', efg: 'hij' };
    const newLabels = { abc: 'def' };
    const wrapper = mount(AksNodePool, {
      propsData: {
        pool: { ...defaultPool, nodeLabels: { ...labels } },

        mode: _EDIT
      },
      ...requiredSetup()

    });
    const labelInput = wrapper.getComponent('[data-testid="aks-node-labels-input"]');

    expect(labelInput.props().value).toStrictEqual(labels);

    labelInput.vm.$emit('update:value', newLabels);
    await wrapper.vm.$nextTick();

    expect(wrapper.props().pool.nodeLabels).toStrictEqual(newLabels);
  });

  it('should validate pool count using the provided count validator function', async() => {
    const countValidator = jest.fn();

    mount(AksNodePool, {
      propsData: {
        pool:            { ...defaultPool, count: -1 },
        validationRules: { count: [countValidator] }
      },
      ...requiredSetup()

    });

    expect(countValidator).toHaveBeenCalledWith(-1, false);
  });

  it.each([
    ['System', false],
    ['User', true],
  ])('should validate node pool count differently if the pool mode is User', async(mode, allowZeroCount) => {
    const countValidator = jest.fn();

    mount(AksNodePool, {
      propsData: {
        pool: {
          ...defaultPool, count: -1, mode
        },
        validationRules: { count: [countValidator] }
      },
      ...requiredSetup()

    });

    expect(countValidator).toHaveBeenCalledWith(-1, allowZeroCount);
  });
});
