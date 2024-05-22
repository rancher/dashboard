import semver from 'semver';
import flushPromises from 'flush-promises';
import { shallowMount, Wrapper } from '@vue/test-utils';
import CruAks from '@pkg/aks/components/CruAks.vue';
// eslint-disable-next-line jest/no-mocks-import
import { mockRegions, mockVersionsSorted } from '@pkg/aks/util/__mocks__/aks';
import { AKSNodePool } from 'types';
import { _EDIT, _CREATE } from '@shell/config/query-params';

const mockedValidationMixin = {
  computed: {
    fvFormIsValid:                jest.fn(),
    type:                         jest.fn(),
    fvUnreportedValidationErrors: jest.fn(),
  },
  methods: { fvGetAndReportPathRules: jest.fn() }
};

const mockedStore = (versionSetting: any) => {
  return {
    getters: {
      'i18n/t':                  (text: string) => text,
      t:                         (text: string) => text,
      currentStore:              () => 'current_store',
      'current_store/schemaFor': jest.fn(),
      'current_store/all':       jest.fn(),
      'management/byId':         () => {
        return versionSetting;
      },
      'management/schemaFor': jest.fn(),
      'rancher/create':       () => {}
    },
    dispatch: jest.fn()
  };
};

const mockedRoute = { query: {} };

const requiredSetup = (versionSetting = { value: '<=1.27.x' }) => {
  return {
    mixins: [mockedValidationMixin],
    mocks:  {
      $store:      mockedStore(versionSetting),
      $route:      mockedRoute,
      $fetchState: {},
    }
  };
};

jest.mock('@pkg/aks/util/aks');

const setCredential = async(wrapper :Wrapper<any>, config = {} as any) => {
  config.azureCredentialSecret = 'foo';
  wrapper.setData({ config });
  await flushPromises();
};

describe('aks provisioning form', () => {
  it('should hide the form if no credential has been selected', () => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: _CREATE },
      ...requiredSetup()
    });

    const form = wrapper.find('[data-testid="cruaks-form"]');

    expect(form.exists()).toBe(false);
  });

  it('should show the form when a credential is selected', async() => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: _CREATE },
      ...requiredSetup()
    });

    const formSelector = '[data-testid="cruaks-form"]';

    expect(wrapper.find(formSelector).exists()).toBe(false);

    await setCredential(wrapper);
    expect(wrapper.find(formSelector).exists()).toBe(true);
  });

  it('should auto-select a region when a credential is selected', async() => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: _CREATE },
      ...requiredSetup()
    });

    await setCredential(wrapper);
    const regionDropdown = wrapper.find('[data-testid="cruaks-resourcelocation"]');

    expect(regionDropdown.exists()).toBe(true);
    expect(regionDropdown.props().value).toBe(mockRegions[0].name);
  });

  it.each([
    ['<=1.26', mockVersionsSorted.filter((v: string) => semver.satisfies(v, '<=1.26'))],
    ['<=1.25', mockVersionsSorted.filter((v: string) => semver.satisfies(v, '<=1.25'))],
    ['<=1.24', mockVersionsSorted.filter((v: string) => semver.satisfies(v, '<=1.24'))]
  ])('should list only versions satisfying the ui-default-version-range setting', async(versionRange: string, expectedVersions: string[]) => {
    const mockVersionRangeSetting = { value: versionRange };
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: _CREATE },
      ...requiredSetup(mockVersionRangeSetting)
    });

    await setCredential(wrapper);
    const versionDropdown = wrapper.find('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    expect(versionDropdown.props().options.map((opt: any) => opt.value)).toStrictEqual(expectedVersions);
  });

  it('should sort versions from latest to oldest', async() => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: _CREATE },
      ...requiredSetup()
    });

    await setCredential(wrapper);
    const versionDropdown = wrapper.find('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    expect(versionDropdown.props().value).toBe('1.27.0');
  });

  it('should auto-select the latest kubernetes version when a region is selected during create', async() => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: _CREATE },
      ...requiredSetup()
    });

    await setCredential(wrapper);

    const versionDropdown = wrapper.find('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    // version dropdown options are validated in another test so here we can assume they're properly sorted and filtered such that the first one is the default value
    expect(versionDropdown.props().value).toBe(versionDropdown.props().options[0].value);
  });

  it('should not auto-select the latest kubernetes version on edit', async() => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: _EDIT },
      ...requiredSetup()
    });

    wrapper.setData({ config: { kubernetesVersion: '0.00.0' } });

    await setCredential(wrapper);

    const versionDropdown = wrapper.find('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    expect(versionDropdown.props().value).toBe('0.00.0');
  });

  it.each([['1.26.0', mockVersionsSorted.filter((v: string) => semver.gte(v, '1.26.0'))], ['1.24.0', mockVersionsSorted.filter((v: string) => semver.gte(v, '1.24.0'))],
  ])('should not allow a k8s version downgrade on edit', async(originalVersion, validVersions) => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: 'edit' },
      ...requiredSetup()
    });

    wrapper.setData({ originalVersion });

    await setCredential(wrapper);
    const versionDropdown = wrapper.find('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.props().options.map((opt: any) => opt.value)).toStrictEqual(validVersions);
    await wrapper.destroy();
  });

  it.each([[{ privateCluster: false }, false], [{ privateCluster: true }, true]])('should show privateDnsZone, userAssignedIdentity, managedIdentity only when privateCluster is true', async(config, visibility) => {
    const wrapper = shallowMount(CruAks, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);

    const privateDnsZone = wrapper.find('[data-testid="cruaks-privateDnsZone"]');
    const userAssignedIdentity = wrapper.find('[data-testid="cruaks-userAssignedIdentity"]');
    const managedIdentity = wrapper.find('[data-testid="cruaks-managedIdentity"]');

    expect(privateDnsZone.exists()).toBe(visibility);
    expect(userAssignedIdentity.exists()).toBe(visibility);
    expect(managedIdentity.exists()).toBe(visibility);
  });

  it('should clear privateDnsZone, userAssignedIdentity, and managedIdentity when privateCluster is set to false', async() => {
    const config = {
      privateDnsZone: 'abc', userAssignedIdentity: 'def', managedIdentity: true
    };
    const wrapper = shallowMount(CruAks, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);

    expect(wrapper.vm.config.privateDnsZone).toBeDefined();
    expect(wrapper.vm.config.userAssignedIdentity).toBeDefined();
    expect(wrapper.vm.config.managedIdentity).toBeDefined();

    await wrapper.setData({ config: { ...config, privateCluster: false } });

    expect(wrapper.vm.config.privateDnsZone).toBeUndefined();
    expect(wrapper.vm.config.userAssignedIdentity).toBeUndefined();
    expect(wrapper.vm.config.managedIdentity).toBeUndefined();
  });

  it('should prevent saving if a node pool has an invalid name', async() => {
    const config = {
      dnsPrefix: 'abc-123', resourceGroup: 'abc', clusterName: 'abc'
    };
    const wrapper = shallowMount(CruAks, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    await wrapper.setData({ nodePools: [{ name: 'abc', _validation: {} }] });
    await wrapper.vm.fvExtraRules.poolNames();
    expect(wrapper.vm.nodePools.filter((pool: AKSNodePool) => {
      return !pool._validation._validName;
    })).toHaveLength(0);

    await wrapper.setData({ nodePools: [{ name: '123-abc', _validation: {} }, { name: 'abcABC', _validation: {} }, { name: 'abc', _validation: {} }] });
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
    const wrapper = shallowMount(CruAks, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    const virtualNetworkSelect = wrapper.find('[data-testid="aks-virtual-network-select"]');
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
    const config = {
      dnsPrefix: 'abc-123', resourceGroup: 'abc', clusterName: 'abc'
    };
    const wrapper = shallowMount(CruAks, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    await wrapper.setData({ nodePools: [{ name: 'abc', _validation: {} }] });
    await wrapper.vm.fvExtraRules.poolTaints();
    expect(wrapper.vm.nodePools.filter((pool: AKSNodePool) => {
      return !pool._validation._validTaints;
    })).toHaveLength(0);

    await wrapper.setData({
      nodePools: [{
        name: 'abc', _validation: {}, nodeTaints: ['key1:val1=PreferNoExecute']
      }, {
        name: 'def', _validation: {}, nodeTaints: ['key1:val1=PreferNoExecute', 'key2:val2=NoExecute', ':val3=PreferNoExecute']
      }, {
        name: 'ghi', _validation: {}, nodeTaints: ['key1:=NoExecute']
      }]
    });
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
    const wrapper = shallowMount(CruAks, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    const virtualNetworkSelect = wrapper.find('[data-testid="aks-virtual-network-select"]');
    const networkOpts = virtualNetworkSelect.props().options;

    virtualNetworkSelect.vm.$emit('selecting', networkOpts[optionIndex]);
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.config.subnet).toBe(subnet);
    expect(wrapper.vm.config.virtualNetwork).toBe(virtualNetwork);
    expect(wrapper.vm.config.virtualNetworkResourceGroup).toBe(virtualNetworkResourceGroup);
  });

  it('should clear virtualNetwork, virtualNetworkResourceGroup, and subnet when the \'none\' virtual network option is selected', async() => {
    const config = {
      dnsPrefix: 'abc-123', resourceGroup: 'abc', clusterName: 'abc'
    };
    const wrapper = shallowMount(CruAks, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);
    const virtualNetworkSelect = wrapper.find('[data-testid="aks-virtual-network-select"]');
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

    const wrapper = shallowMount(CruAks, {
      propsData: {
        value: {}, mode: 'edit', config
      },
      ...requiredSetup()
    });

    await setCredential(wrapper, config);

    wrapper.setData({ config: { ...config, kubernetesVersion: newVersion } });
    await wrapper.vm.$nextTick();
    const pools = wrapper.vm.nodePools;

    pools.forEach((pool: AKSNodePool) => {
      expect(pool.orchestratorVersion).toBe(pool._isNewOrUnprovisioned ? newVersion : originalVersion);
    });
  });
});
