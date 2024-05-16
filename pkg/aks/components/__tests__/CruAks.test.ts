import semver from 'semver';
import flushPromises from 'flush-promises';
import { shallowMount, Wrapper } from '@vue/test-utils';
import CruAks from '@pkg/aks/components/CruAks.vue';
// eslint-disable-next-line jest/no-mocks-import
import { mockRegions, mockVersionsSorted } from '@pkg/aks/util/__mocks__/aks';

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
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    const form = wrapper.find('[data-testid="cruaks-form"]');

    expect(form.exists()).toBe(false);
  });

  it('should show the form when a credential is selected', async() => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    const formSelector = '[data-testid="cruaks-form"]';

    expect(wrapper.find(formSelector).exists()).toBe(false);

    await setCredential(wrapper);
    expect(wrapper.find(formSelector).exists()).toBe(true);
  });

  it('should auto-select a region when a credential is selected', async() => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: 'create' },
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
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup(mockVersionRangeSetting)
    });

    await setCredential(wrapper);
    const versionDropdown = wrapper.find('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    expect(versionDropdown.props().options.map((opt: any) => opt.value)).toStrictEqual(expectedVersions);
  });

  it('should sort versions from latest to oldest', async() => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    await setCredential(wrapper);
    const versionDropdown = wrapper.find('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    expect(versionDropdown.props().value).toBe('1.27.0');
  });

  it('should auto-select a kubernetes version when a region is selected', async() => {
    const wrapper = shallowMount(CruAks, {
      propsData: { value: {}, mode: 'create' },
      ...requiredSetup()
    });

    await setCredential(wrapper);

    const versionDropdown = wrapper.find('[data-testid="cruaks-kubernetesversion"]');

    expect(versionDropdown.exists()).toBe(true);
    // version dropdown options are validated in another test so here we can assume they're properly sorted and filtered such that the first one is the default value
    expect(versionDropdown.props().value).toBe(versionDropdown.props().options[0].value);
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
    expect(wrapper.vm.nodePools.filter((pool) => {
      return !pool._validation._validName;
    })).toHaveLength(0);

    await wrapper.setData({ nodePools: [{ name: '123-abc', _validation: {} }, { name: 'abcABC', _validation: {} }, { name: 'abc', _validation: {} }] });
    await wrapper.vm.fvExtraRules.poolNames();

    expect(wrapper.vm.nodePools.filter((pool) => {
      return !pool._validation._validName;
    })).toHaveLength(2);
  });
});
