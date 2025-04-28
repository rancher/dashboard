import semver from 'semver';
import flushPromises from 'flush-promises';
import { shallowMount, Wrapper } from '@vue/test-utils';
import Config from '@pkg/aks/components/Config.vue';
// eslint-disable-next-line jest/no-mocks-import
import { mockVersionsSorted } from '../../util/__mocks__/aks';
import { AKSConfig, AKSNodePool } from 'types';
import { _EDIT, _CREATE } from '@shell/config/query-params';
import { nodePoolNames } from '../../util/validators';
import { defaultAksConfig, NETWORKING_AUTH_MODES } from '../CruAks.vue';

const DEFAULT_CLUSTER_CONFIG = defaultAksConfig;

const mockedStore = (versionSetting: any) => {
  return {
    getters: {
      'i18n/t':          (text: string) => text,
      t:                 (text: string) => text,
      currentStore:      () => 'current_store',
      'management/byId': () => {
        return versionSetting;
      },

    },
    dispatch: jest.fn()
  };
};

const mockedRoute = { query: {} };

const requiredSetup = (versionSetting = { value: '<=1.27.x' }) => {
  return {
    global: {
      mocks: {
        $store:      mockedStore(versionSetting),
        $route:      mockedRoute,
        $fetchState: {},
      },
      stubs: { CruResource: false, Accordion: false }
    }
  };
};

jest.mock('@pkg/aks/util/aks');

const setCredential = async(wrapper :Wrapper<any>, config = {} as any) => {
  config.azureCredentialSecret = 'foo';
  config.resourceLocation = 'eastus';

  wrapper.setProps({ config: { ...config } });
  await flushPromises();
};

describe('aks provisioning form', () => {
  it.each([
    ['<=1.26', mockVersionsSorted.filter((v: string) => semver.satisfies(v, '<=1.26'))],
    ['<=1.25', mockVersionsSorted.filter((v: string) => semver.satisfies(v, '<=1.25'))],
    ['<=1.24', mockVersionsSorted.filter((v: string) => semver.satisfies(v, '<=1.24'))]
  ])('should list only versions satisfying the ui-default-version-range setting', async(versionRange: string, expectedVersions: string[]) => {
    const mockVersionRangeSetting = { value: versionRange };
    const wrapper = shallowMount(Config, {
      propsData: {
        config: DEFAULT_CLUSTER_CONFIG, value: {}, mode: _CREATE
      },
      ...requiredSetup(mockVersionRangeSetting)
    });

    await setCredential(wrapper);

    expect(wrapper.vm.aksVersionOptions.map((opt: any) => opt.value)).toStrictEqual(expectedVersions);
  });

  it('should sort versions from latest to oldest', async() => {
    const wrapper = shallowMount(Config, {
      propsData: {
        config: DEFAULT_CLUSTER_CONFIG, value: {}, mode: _CREATE
      },
      ...requiredSetup()
    });

    await setCredential(wrapper);
    const versionDropdown = wrapper.findComponent('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    expect(versionDropdown.props().value).toBe('1.27.0');
  });

  it('should auto-select the latest kubernetes version when a region is selected during create', async() => {
    const wrapper = shallowMount(Config, {
      propsData: {
        config: DEFAULT_CLUSTER_CONFIG, value: {}, mode: _CREATE
      },
      ...requiredSetup()
    });

    await setCredential(wrapper);

    const versionDropdown = wrapper.findComponent('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    // version dropdown options are validated in another test so here we can assume they're properly sorted and filtered such that the first one is the default value
    expect(versionDropdown.props().value).toBe(versionDropdown.props().options[0].value);
  });

  it('should not auto-select the latest kubernetes version on edit', async() => {
    const config = { ...DEFAULT_CLUSTER_CONFIG, kubernetesVersion: '0.00.0' };
    const wrapper = shallowMount(Config, {
      propsData: {
        config, value: {}, mode: _EDIT
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    const versionDropdown = wrapper.findComponent('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    expect(versionDropdown.props().value).toBe('0.00.0');
  });

  it.each([['1.26.0', mockVersionsSorted.filter((v: string) => semver.gte(v, '1.26.0'))], ['1.24.0', mockVersionsSorted.filter((v: string) => semver.gte(v, '1.24.0'))],
  ])('should not allow a k8s version downgrade on edit', async(originalVersion, validVersions) => {
    const wrapper = shallowMount(Config, {
      propsData: {
        config: DEFAULT_CLUSTER_CONFIG, value: {}, mode: _EDIT
      },
      ...requiredSetup()
    });

    wrapper.setData({ originalVersion });

    await setCredential(wrapper);
    const versionDropdown = wrapper.getComponent('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.props().options.map((opt: any) => opt.value)).toStrictEqual(validVersions);
  });

  it('should select the correct networking auth mode option', async() => {
    const config = { managedIdentity: false } as any as AKSConfig;
    const wrapper = shallowMount(Config, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    expect(wrapper.vm.networkingAuthMode).toBe(NETWORKING_AUTH_MODES.SERVICE_PRINCIPAL);
    expect(wrapper.vm.config.managedIdentity).toBe(config.managedIdentity);

    // choosing Managed Identity option
    wrapper.vm.onNetworkingAuthModeChange(NETWORKING_AUTH_MODES.MANAGED_IDENTITY);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.networkingAuthMode).toBe(NETWORKING_AUTH_MODES.MANAGED_IDENTITY);
    expect(wrapper.vm.config.managedIdentity).toBe(true);
  });

  it('should prevent saving if a node pool has an invalid name', async() => {
    const nodePools = [{ name: 'abc', _validation: {} }];
    const config = {
      dnsPrefix: 'abc-123', resourceGroup: 'abc', clusterName: 'abc', nodePools
    };
    const wrapper = shallowMount(Config, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    // await wrapper.setData({ nodePools: [{ name: 'abc', _validation: {} }] });
    await wrapper.vm.fvExtraRules.poolNames();
    expect(wrapper.vm.nodePools.filter((pool: AKSNodePool) => {
      return !pool._validation._validName;
    })).toHaveLength(0);

    const newPools = [{ name: '123-abc', _validation: {} }, { name: 'abcABC', _validation: {} }, { name: 'abc', _validation: {} }];

    wrapper.setProps({ config: { ...wrapper.vm.config, nodePools: newPools } });
    await wrapper.vm.fvExtraRules.poolNames();

    expect(wrapper.vm.nodePools.filter((pool: AKSNodePool) => {
      return !pool._validation._validName;
    })).toHaveLength(2);
  });

  it('should display subnets grouped by network in the virtual network dropdown', async() => {
    const noneOption = { label: 'generic.none' };
    const config = {
      dnsPrefix: 'abc-123', resourceGroup: 'abc', clusterName: 'abc'
    };
    const wrapper = shallowMount(Config, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    const virtualNetworkSelect = wrapper.getComponent('[data-testid="aks-virtual-network-select"]');
    const networkOpts = virtualNetworkSelect.props().options;

    expect(virtualNetworkSelect.props().value).toStrictEqual(noneOption);

    expect(networkOpts).toStrictEqual([{ label: 'generic.none' }, {
      disabled: true, kind: 'group', label: 'network2'
    }, {
      key:            'network2-subnet1 (10.224.0.0/16)network2',
      label:          'network2-subnet1 (10.224.0.0/16)',
      value:          'network2-subnet1',
      virtualNetwork: {
        name: 'network2', resourceGroup: 'network2Group', subnets: [{ addressRange: '10.224.0.0/16', name: 'network2-subnet1' }, { addressRange: '10.1.0.0/24', name: 'network2-subnet2' }]
      }
    }, {
      key:            'network2-subnet2 (10.1.0.0/24)network2',
      label:          'network2-subnet2 (10.1.0.0/24)',
      value:          'network2-subnet2',
      virtualNetwork: {
        name: 'network2', resourceGroup: 'network2Group', subnets: [{ addressRange: '10.224.0.0/16', name: 'network2-subnet1' }, { addressRange: '10.1.0.0/24', name: 'network2-subnet2' }]
      }
    }, {
      disabled: true, kind: 'group', label: 'network3'
    }, {
      key:            'network3-subnet1 (10.224.0.0/16)network3',
      label:          'network3-subnet1 (10.224.0.0/16)',
      value:          'network3-subnet1',
      virtualNetwork: {
        name: 'network3', resourceGroup: 'network3Group', subnets: [{ addressRange: '10.224.0.0/16', name: 'network3-subnet1' }, { addressRange: '10.1.0.0/24', name: 'network3-subnet2' }, { addressRange: '', name: 'network3-subnet2' }]
      }
    }, {
      key:            'network3-subnet2 (10.1.0.0/24)network3',
      label:          'network3-subnet2 (10.1.0.0/24)',
      value:          'network3-subnet2',
      virtualNetwork: {
        name: 'network3', resourceGroup: 'network3Group', subnets: [{ addressRange: '10.224.0.0/16', name: 'network3-subnet1' }, { addressRange: '10.1.0.0/24', name: 'network3-subnet2' }, { addressRange: '', name: 'network3-subnet2' }]
      }
    }, {
      key:            'network3-subnet2network3',
      label:          'network3-subnet2',
      value:          'network3-subnet2',
      virtualNetwork: {
        name: 'network3', resourceGroup: 'network3Group', subnets: [{ addressRange: '10.224.0.0/16', name: 'network3-subnet1' }, { addressRange: '10.1.0.0/24', name: 'network3-subnet2' }, { addressRange: '', name: 'network3-subnet2' }]
      }
    }]);
  });

  it('should prevent saving if a node pool has taints missing keys or values', async() => {
    const nodePools = [{ name: 'abc', _validation: {} }];
    const config = {
      dnsPrefix: 'abc-123', resourceGroup: 'abc', clusterName: 'abc', nodePools
    };
    const wrapper = shallowMount(Config, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    // await wrapper.setData({ nodePools: [{ name: 'abc', _validation: {} }] });
    await wrapper.vm.fvExtraRules.poolTaints();
    expect(wrapper.vm.nodePools.filter((pool: AKSNodePool) => {
      return !pool._validation._validTaints;
    })).toHaveLength(0);

    const newPools = [{
      name: 'abc', _validation: {}, nodeTaints: ['key1:val1=PreferNoExecute']
    }, {
      name: 'def', _validation: {}, nodeTaints: ['key1:val1=PreferNoExecute', 'key2:val2=NoExecute', ':val3=PreferNoExecute']
    }, {
      name: 'ghi', _validation: {}, nodeTaints: ['key1:=NoExecute']
    }];

    wrapper.setProps({ config: { ...wrapper.vm.config, nodePools: newPools } });
    await wrapper.vm.fvExtraRules.poolTaints();

    expect(wrapper.vm.nodePools.filter((pool: AKSNodePool) => {
      return !pool._validation._validTaints;
    })).toHaveLength(2);
  });

  it.each([
    [2, {
      virtualNetwork: 'network2', virtualNetworkResourceGroup: 'network2Group', subnet: 'network2-subnet1'
    }],
    [5, {
      virtualNetwork: 'network3', virtualNetworkResourceGroup: 'network3Group', subnet: 'network3-subnet1'
    }],
    [3, {
      virtualNetwork: 'network2', virtualNetworkResourceGroup: 'network2Group', subnet: 'network2-subnet2'
    }],
  ])('should set virtualNetwork, virtualNetworkResourceGroup, and subnet when a virtual network is selected', async(optionIndex, { virtualNetwork, virtualNetworkResourceGroup, subnet }) => {
    const config = {
      dnsPrefix: 'abc-123', resourceGroup: 'abc', clusterName: 'abc'
    };
    const wrapper = shallowMount(Config, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    const virtualNetworkSelect = wrapper.getComponent('[data-testid="aks-virtual-network-select"]');
    const networkOpts = virtualNetworkSelect.props().options;

    virtualNetworkSelect.vm.$emit('selecting', networkOpts[optionIndex]);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.config.subnet).toBe(subnet);
    expect(wrapper.vm.config.virtualNetwork).toBe(virtualNetwork);
    expect(wrapper.vm.config.virtualNetworkResourceGroup).toBe(virtualNetworkResourceGroup);
  });

  it('should set config.monitoring to \'true\' and show log anaytics workspace name and log analytics workspace group inputs when the monitoring checkbox is checked', async() => {
    const config = {
      dnsPrefix: 'abc-123', resourceGroup: 'abc', clusterName: 'abc'
    };
    const wrapper = shallowMount(Config, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    let logAnalyticsWorkspaceNameInput = wrapper.findComponent('[data-testid="aks-log-analytics-workspace-name-input"]');
    let logAnalyticsWorkspaceGroupInput = wrapper.findComponent('[data-testid="aks-log-analytics-workspace-group-input"]');
    const monitoringCheckbox = wrapper.findComponent('[data-testid="aks-monitoring-checkbox"]');

    expect(monitoringCheckbox.props().value).toBe(false);
    expect(logAnalyticsWorkspaceNameInput.props().disabled).toBe(true);
    expect(logAnalyticsWorkspaceGroupInput.props().disabled).toBe(true);
    expect(wrapper.vm.config.monitoring).toBeFalsy();

    monitoringCheckbox.vm.$emit('update:value', true);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.config.monitoring).toBe(true);
    logAnalyticsWorkspaceNameInput = wrapper.findComponent('[data-testid="aks-log-analytics-workspace-name-input"]');
    logAnalyticsWorkspaceGroupInput = wrapper.findComponent('[data-testid="aks-log-analytics-workspace-group-input"]');
    expect(monitoringCheckbox.props().value).toBe(true);
    expect(logAnalyticsWorkspaceNameInput.isVisible()).toBe(true);
    expect(logAnalyticsWorkspaceGroupInput.isVisible()).toBe(true);
  });

  it('should clear virtualNetwork, virtualNetworkResourceGroup, and subnet when the \'none\' virtual network option is selected', async() => {
    const config = {
      dnsPrefix: 'abc-123', resourceGroup: 'abc', clusterName: 'abc'
    };
    const wrapper = shallowMount(Config, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    const virtualNetworkSelect = wrapper.findComponent('[data-testid="aks-virtual-network-select"]');
    const networkOpts = virtualNetworkSelect.props().options;

    virtualNetworkSelect.vm.$emit('selecting', networkOpts[2]);
    await wrapper.vm.$nextTick();

    virtualNetworkSelect.vm.$emit('selecting', networkOpts[0]);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.config.subnet).toBeNull();
    expect(wrapper.vm.config.virtualNetwork).toBeNull();
    expect(wrapper.vm.config.virtualNetworkResourceGroup).toBeNull();
  });

  it('should update all new or unprovisioned node pools\' orchestratorVersion when the cluster version is changed', async() => {
    const originalVersion = '1.20.0';
    const newVersion = '1.23.4';
    const nodePools = [{
      name: 'abc', _validation: {}, _isNewOrUnprovisioned: true, orchestratorVersion: originalVersion
    }, {
      name: 'abc', _validation: {}, _isNewOrUnprovisioned: false, orchestratorVersion: originalVersion
    }];
    const config = {
      dnsPrefix: 'abc-123', resourceGroup: 'abc', clusterName: 'abc', kubernetesVersion: originalVersion, nodePools
    };
    const wrapper = shallowMount(Config, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    wrapper.setProps({ config: { ...config, kubernetesVersion: newVersion } });
    await wrapper.vm.$nextTick();
    const pools = wrapper.vm.config.nodePools;

    pools.forEach((pool: AKSNodePool) => {
      expect(pool.orchestratorVersion).toBe(pool._isNewOrUnprovisioned ? newVersion : originalVersion);
    });
  });

  it('should clear config.logAnalyticsWorkspaceName and config.logAnalyticsWorkspaceGroup when the monitoring checkbox is unchecked', async() => {
    const config = {
      dnsPrefix: 'abc-123', resourceGroup: 'abc', clusterName: 'abc', monitoring: true, logAnalyticsWorkspaceGroup: 'abc', logAnalyticsWorkspaceName: 'def'
    };
    const wrapper = shallowMount(Config, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);

    const monitoringCheckbox = wrapper.getComponent('[data-testid="aks-monitoring-checkbox"]');

    expect(monitoringCheckbox.props().value).toBe(true);

    monitoringCheckbox.vm.$emit('update:value', false);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.config.monitoring).toBeFalsy();
    expect(wrapper.vm.config.logAnalyticsWorkspaceGroup).toBeNull();
    expect(wrapper.vm.config.logAnalyticsWorkspaceName).toBeNull();
  });

  it('should use a valid value for the default pool name', async() => {
    const wrapper = shallowMount(Config, {
      propsData: {
        config: DEFAULT_CLUSTER_CONFIG, value: {}, mode: _CREATE
      },
      ...requiredSetup()
    });

    await setCredential(wrapper);

    wrapper.vm.addPool();
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.nodePools).toHaveLength(1);
    const nodeName = wrapper.vm.nodePools[0].name;

    expect(nodePoolNames({ t: (str:string) => str })(nodeName)).toBeUndefined();
  });
});
