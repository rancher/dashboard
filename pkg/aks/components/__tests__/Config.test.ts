import semver from 'semver';
import flushPromises from 'flush-promises';
import { shallowMount, VueWrapper } from '@vue/test-utils';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import * as aksUtil from '@pkg/aks/util/aks';
// eslint-disable-next-line jest/no-mocks-import
import { mockVersionsSorted } from '@pkg/aks/util/__mocks__/aks';
import { AKSConfig, AKSNodePool } from '@pkg/aks/types';
import { _EDIT, _CREATE } from '@shell/config/query-params';
import { nodePoolNames } from '@pkg/aks/util/validators';
import Config from '@pkg/aks/components/Config.vue';
import { defaultAksConfig, NETWORKING_AUTH_MODES } from '@pkg/aks/components/CruAks.vue';

const DEFAULT_CLUSTER_CONFIG = defaultAksConfig;

// LabeledSelect declares `options` as a bare `Array`, so reads come back as `unknown[]`.
// These tests only ever inspect the standard option fields.
type SelectOption = {
  label?: string;
  value?: string;
  disabled?: boolean;
};

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

const setCredential = async(wrapper: VueWrapper<any>, config = {} as any) => {
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
      props: {
        config: DEFAULT_CLUSTER_CONFIG, value: {}, mode: _CREATE
      },
      ...requiredSetup(mockVersionRangeSetting)
    });

    await setCredential(wrapper);

    expect(wrapper.vm.aksVersionOptions.map((opt: any) => opt.value)).toStrictEqual(expectedVersions);
  });

  it('should sort versions from latest to oldest', async() => {
    const wrapper = shallowMount(Config, {
      props: {
        config: DEFAULT_CLUSTER_CONFIG, value: {}, mode: _CREATE
      },
      ...requiredSetup()
    });

    await setCredential(wrapper);
    const versionDropdown = wrapper.findComponent<typeof LabeledSelect>('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    expect(versionDropdown.props().value).toBe('1.27.0');
  });

  it('should auto-select the latest kubernetes version when a region is selected during create', async() => {
    const wrapper = shallowMount(Config, {
      props: {
        config: DEFAULT_CLUSTER_CONFIG, value: {}, mode: _CREATE
      },
      ...requiredSetup()
    });

    await setCredential(wrapper);

    const versionDropdown = wrapper.findComponent<typeof LabeledSelect>('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    // version dropdown options are validated in another test so here we can assume they're properly sorted and filtered such that the first one is the default value
    expect(versionDropdown.props().value).toBe((versionDropdown.props().options as SelectOption[])[0].value);
  });

  it('should not auto-select the latest kubernetes version on edit', async() => {
    const config = { ...DEFAULT_CLUSTER_CONFIG, kubernetesVersion: '0.00.0' };
    const wrapper = shallowMount(Config, {
      props: {
        config, value: {}, mode: _EDIT
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    const versionDropdown = wrapper.findComponent<typeof LabeledSelect>('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    expect(versionDropdown.props().value).toBe('0.00.0');
  });

  it.each([[
    '1.26.0',
    mockVersionsSorted.filter((v: string) => semver.lt(v, '1.28.0') && semver.gte(v, '1.26.0'))
  ],
  ['1.25.0',
    mockVersionsSorted.filter((v: string) => semver.lt(v, '1.27.0') && semver.gte(v, '1.25.0'))
  ],
  ])('should only allow upgrading one minor version at a time', async(originalVersion, validVersions) => {
    const wrapper = shallowMount(Config, {
      props: {
        config: DEFAULT_CLUSTER_CONFIG, value: {}, mode: _EDIT
      },
      ...requiredSetup({ value: '>=1.23.x' })
    });

    wrapper.setData({ originalVersion });

    await setCredential(wrapper);
    const versionDropdown = wrapper.getComponent<typeof LabeledSelect>('[data-testid="cruaks-kubernetesversion"]');
    const enabledOptions = (versionDropdown.props().options as SelectOption[]).reduce((enabledOpts: (string | undefined)[], opt) => {
      if (!opt.disabled) {
        enabledOpts.push(opt.value);
      }

      return enabledOpts;
    }, []);

    expect(enabledOptions).toStrictEqual(validVersions);
  });

  it.each([['1.26.0', mockVersionsSorted.filter((v: string) => semver.gte(v, '1.26.0'))], ['1.24.0', mockVersionsSorted.filter((v: string) => semver.gte(v, '1.24.0'))],
  ])('should not allow a k8s version downgrade on edit', async(originalVersion, validVersions) => {
    const wrapper = shallowMount(Config, {
      props: {
        config: DEFAULT_CLUSTER_CONFIG, value: {}, mode: _EDIT
      },
      ...requiredSetup()
    });

    wrapper.setData({ originalVersion });

    await setCredential(wrapper);
    const versionDropdown = wrapper.getComponent<typeof LabeledSelect>('[data-testid="cruaks-kubernetesversion"]');

    expect((versionDropdown.props().options as SelectOption[]).map((opt) => opt.value)).toStrictEqual(validVersions);
  });

  it('should select the correct networking auth mode option', async() => {
    const config = { managedIdentity: false } as any as AKSConfig;
    const wrapper = shallowMount(Config, {
      props: {
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
      props: {
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
      props: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    const virtualNetworkSelect = wrapper.getComponent<typeof LabeledSelect>('[data-testid="aks-virtual-network-select"]');
    const networkOpts = virtualNetworkSelect.props().options as SelectOption[];

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
      props: {
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
      props: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    const virtualNetworkSelect = wrapper.getComponent<typeof LabeledSelect>('[data-testid="aks-virtual-network-select"]');
    const networkOpts = virtualNetworkSelect.props().options as SelectOption[];

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
      props: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    let logAnalyticsWorkspaceNameInput = wrapper.findComponent<typeof LabeledInput>('[data-testid="aks-log-analytics-workspace-name-input"]');
    let logAnalyticsWorkspaceGroupInput = wrapper.findComponent<typeof LabeledInput>('[data-testid="aks-log-analytics-workspace-group-input"]');
    const monitoringCheckbox = wrapper.findComponent<typeof Checkbox>('[data-testid="aks-monitoring-checkbox"]');

    expect(monitoringCheckbox.props().value).toBe(false);
    expect(logAnalyticsWorkspaceNameInput.props().disabled).toBe(true);
    expect(logAnalyticsWorkspaceGroupInput.props().disabled).toBe(true);
    expect(wrapper.vm.config.monitoring).toBeFalsy();

    monitoringCheckbox.vm.$emit('update:value', true);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.config.monitoring).toBe(true);
    logAnalyticsWorkspaceNameInput = wrapper.findComponent<typeof LabeledInput>('[data-testid="aks-log-analytics-workspace-name-input"]');
    logAnalyticsWorkspaceGroupInput = wrapper.findComponent<typeof LabeledInput>('[data-testid="aks-log-analytics-workspace-group-input"]');
    expect(monitoringCheckbox.props().value).toBe(true);
    expect(logAnalyticsWorkspaceNameInput.isVisible()).toBe(true);
    expect(logAnalyticsWorkspaceGroupInput.isVisible()).toBe(true);
  });

  it('should clear virtualNetwork, virtualNetworkResourceGroup, and subnet when the \'none\' virtual network option is selected', async() => {
    const config = {
      dnsPrefix: 'abc-123', resourceGroup: 'abc', clusterName: 'abc'
    };
    const wrapper = shallowMount(Config, {
      props: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    const virtualNetworkSelect = wrapper.findComponent<typeof LabeledSelect>('[data-testid="aks-virtual-network-select"]');
    const networkOpts = virtualNetworkSelect.props().options as SelectOption[];

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
      props: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    wrapper.setProps({ config: { ...config, kubernetesVersion: newVersion } });
    await wrapper.vm.$nextTick();
    const pools = wrapper.vm.config.nodePools || [];

    expect(pools).toHaveLength(nodePools.length);

    pools.forEach((pool: AKSNodePool) => {
      expect(pool.orchestratorVersion).toBe(pool._isNewOrUnprovisioned ? newVersion : originalVersion);
    });
  });

  it('should clear config.logAnalyticsWorkspaceName and config.logAnalyticsWorkspaceGroup when the monitoring checkbox is unchecked', async() => {
    const config = {
      dnsPrefix: 'abc-123', resourceGroup: 'abc', clusterName: 'abc', monitoring: true, logAnalyticsWorkspaceGroup: 'abc', logAnalyticsWorkspaceName: 'def'
    };
    const wrapper = shallowMount(Config, {
      props: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);

    const monitoringCheckbox = wrapper.getComponent<typeof Checkbox>('[data-testid="aks-monitoring-checkbox"]');

    expect(monitoringCheckbox.props().value).toBe(true);

    monitoringCheckbox.vm.$emit('update:value', false);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.config.monitoring).toBeFalsy();
    expect(wrapper.vm.config.logAnalyticsWorkspaceGroup).toBeNull();
    expect(wrapper.vm.config.logAnalyticsWorkspaceName).toBeNull();
  });

  it('should use a valid value for the default pool name', async() => {
    const wrapper = shallowMount(Config, {
      props: {
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

  it('should set the network plugin to azure when user defined routing is selected', async() => {
    const config = {
      dnsPrefix: 'abc-123', resourceGroup: 'abc', clusterName: 'abc'
    };
    const wrapper = shallowMount(Config, {
      props: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    const outboundTypeSelect = wrapper.findComponent<typeof LabeledSelect>('[data-testid="aks-outbound-type-select"]');
    const outboundTypeOpts = outboundTypeSelect.props().options as SelectOption[];

    outboundTypeSelect.vm.$emit('update:value', outboundTypeOpts[1].value);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.config.networkPlugin).toBe('azure');
    const networkPluginSelect = wrapper.findComponent<typeof LabeledSelect>('[data-testid="aks-network-plugin-select"]');

    const kubeOption = (networkPluginSelect.props().options as SelectOption[]).find((opt) => opt.value === 'kubenet');

    expect(kubeOption?.disabled).toBeTruthy();
  });

  it('should make virtual network required when user defined routing is selected', async() => {
    const config = {
      dnsPrefix: 'abc-123', resourceGroup: 'abc', clusterName: 'abc'
    };
    const wrapper = shallowMount(Config, {
      props: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    const outboundTypeSelect = wrapper.findComponent<typeof LabeledSelect>('[data-testid="aks-outbound-type-select"]');
    const outboundTypeOpts = outboundTypeSelect.props().options as SelectOption[];

    outboundTypeSelect.vm.$emit('update:value', outboundTypeOpts[1].value);
    await wrapper.vm.$nextTick();

    const virtualNetworkSelect = wrapper.findComponent<typeof LabeledSelect>('[data-testid="aks-virtual-network-select"]');

    expect(virtualNetworkSelect.props().required).toBe(true);
  });

  describe('kubernetes version and region changes', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should update the selected kubernetes version to a new default when the region changes and the previous selection is no longer available and the user has not touched it', async() => {
      const wrapper = shallowMount(Config, {
        props: {
          config: DEFAULT_CLUSTER_CONFIG, value: {}, mode: _CREATE
        },
        ...requiredSetup()
      });

      await setCredential(wrapper);
      expect(wrapper.vm.config.kubernetesVersion).toBe('1.27.0');

      jest.spyOn(aksUtil, 'getAKSKubernetesVersions').mockResolvedValueOnce(['1.20.0']);

      wrapper.setProps({ config: { ...wrapper.vm.config, resourceLocation: 'westus' } });
      await flushPromises();

      expect(wrapper.vm.config.kubernetesVersion).toBe('1.20.0');
    });

    it('should leave the selected kubernetes version untouched and show a validation error when the region changes and the user-selected version is no longer available', async() => {
      const wrapper = shallowMount(Config, {
        props: {
          config: DEFAULT_CLUSTER_CONFIG, value: {}, mode: _CREATE
        },
        ...requiredSetup()
      });

      await setCredential(wrapper);

      // simulate the user manually selecting a version, which marks the field as touched
      wrapper.setProps({ config: { ...wrapper.vm.config, kubernetesVersion: '1.26.5' } });
      await flushPromises();
      expect(wrapper.vm.touchedVersion).toBe(true);

      jest.spyOn(aksUtil, 'getAKSKubernetesVersions').mockResolvedValueOnce(['1.20.0']);

      wrapper.setProps({ config: { ...wrapper.vm.config, resourceLocation: 'westus' } });
      await flushPromises();

      expect(wrapper.vm.config.kubernetesVersion).toBe('1.26.5');
      expect(wrapper.vm.fvExtraRules.k8sVersionAvailable()).toBe('aks.kubernetesVersion.notAvailableInRegion');
    });

    it('should refetch AKS versions when the credential changes even if the region stays the same', async() => {
      const getVersionsSpy = jest.spyOn(aksUtil, 'getAKSKubernetesVersions');
      const wrapper = shallowMount(Config, {
        props: {
          config: DEFAULT_CLUSTER_CONFIG, value: {}, mode: _CREATE
        },
        ...requiredSetup()
      });

      await setCredential(wrapper);
      const callsAfterInitialLoad = getVersionsSpy.mock.calls.length;

      wrapper.setProps({ config: { ...wrapper.vm.config, azureCredentialSecret: 'a-different-credential' } });
      await flushPromises();

      expect(getVersionsSpy.mock.calls.length).toBeGreaterThan(callsAfterInitialLoad);
    });

    it('should update the selected kubernetes version to a new default when the credential changes (region unchanged) and the previous selection is no longer available and the user has not touched it', async() => {
      const config = { ...DEFAULT_CLUSTER_CONFIG };
      const wrapper = shallowMount(Config, {
        props: {
          config, value: {}, mode: _EDIT
        },
        ...requiredSetup()
      });

      await setCredential(wrapper, config);
      expect(wrapper.vm.config.kubernetesVersion).toBe('1.27.0');

      jest.spyOn(aksUtil, 'getAKSKubernetesVersions').mockResolvedValueOnce(['1.20.0']);

      wrapper.setProps({ config: { ...wrapper.vm.config, azureCredentialSecret: 'a-different-credential' } });
      await flushPromises();

      expect(wrapper.vm.config.kubernetesVersion).toBe('1.20.0');
    });
  });
});
